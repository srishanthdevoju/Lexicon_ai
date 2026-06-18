import os
import uuid
import json
import time
import logging
from collections import defaultdict
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Depends, Security
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

# Import custom modules
from app.core.config import settings
from app.services.pdf_parser import PDFParser
from app.services.llm_client import LLMClient
from app.agents.summary_agent import SummaryAgent
from app.agents.risk_agent import RiskAgent
from app.agents.clause_agent import ClauseAgent
from app.agents.db_agent import DBAgent, MissingDBCredentialsError
from app.services.report_generator import generate_report
from app.models.schemas import FinalAnalysisResponse, AnalyzeTextRequest, LLMResponse


# ---------------------------------------------------------------------------
# Application Lifespan (startup / shutdown hooks)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Runs on application startup and shutdown."""
    logger.info("🚀  Lexicon AI Backend v2.1.0 starting up...")
    logger.info(f"   LLM Model  : {settings.OPENAI_MODEL}")
    logger.info(f"   Base URL   : {settings.OPENAI_BASE_URL or 'default (OpenAI)'}")
    logger.info(f"   Supabase   : {'configured' if settings.SUPABASE_URL else 'disabled (local storage mode)'}")
    yield
    logger.info("Lexicon AI Backend shutting down.")


app = FastAPI(
    title="Lexicon AI Backend API",
    description="AI-powered legal document analysis, risk scoring, and contract intelligence.",
    version="2.1.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS Middleware
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# In-Memory Rate Limiter (100 requests / minute per IP)
# ---------------------------------------------------------------------------
class InMemoryRateLimiter:
    """Simple sliding-window rate limiter with automatic stale-entry cleanup."""

    def __init__(self, requests_limit: int, window_seconds: int):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.requests: dict[str, list[float]] = defaultdict(list)
        self._last_cleanup = time.time()

    def is_allowed(self, ip: str) -> bool:
        now = time.time()
        # Periodic cleanup of stale IPs every 5 minutes to prevent memory leak
        if now - self._last_cleanup > 300:
            self._cleanup_stale(now)
        # Slide window
        self.requests[ip] = [t for t in self.requests[ip] if now - t < self.window_seconds]
        if len(self.requests[ip]) >= self.requests_limit:
            return False
        self.requests[ip].append(now)
        return True

    def _cleanup_stale(self, now: float):
        """Remove entries for IPs that have no recent requests."""
        stale_keys = [
            ip for ip, timestamps in self.requests.items()
            if not timestamps or now - timestamps[-1] > self.window_seconds * 2
        ]
        for key in stale_keys:
            del self.requests[key]
        self._last_cleanup = now


rate_limiter = InMemoryRateLimiter(requests_limit=100, window_seconds=60)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    path = request.url.path
    # Exclude docs and health endpoints from rate limiting
    if path.startswith("/docs") or path.startswith("/openapi.json") or path in ("/", "/health"):
        return await call_next(request)

    client_ip = request.client.host if request.client else "127.0.0.1"
    if not rate_limiter.is_allowed(client_ip):
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please try again later."}
        )
    return await call_next(request)


# ---------------------------------------------------------------------------
# File System Setup
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(BASE_DIR)
UPLOADS_DIR = os.path.join(BACKEND_ROOT, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# API Key Authentication (optional — only enforced if API_KEY env var is set)
# ---------------------------------------------------------------------------
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)


def verify_api_key(api_key: str = Security(api_key_header)):
    """Validates the request API Key if API_KEY is defined in the environment."""
    env_api_key = os.getenv("API_KEY")
    if env_api_key:
        if not api_key or api_key != env_api_key:
            raise HTTPException(status_code=403, detail="Invalid or missing API Key.")
    return api_key


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    document_id: str
    question: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[str] = []


# ---------------------------------------------------------------------------
# Health & Root Endpoints
# ---------------------------------------------------------------------------
@app.get("/", tags=["System"])
def read_root():
    return {"message": "Lexicon AI Backend API is running!", "version": "2.1.0"}


@app.get("/health", tags=["System"])
def health():
    """Health check endpoint to monitor API status."""
    return {"status": "healthy", "model": settings.OPENAI_MODEL}


# ---------------------------------------------------------------------------
# Core Analysis Pipeline
# ---------------------------------------------------------------------------
def get_user_info(request: Request):
    user_id = request.headers.get("x-user-id", "default_user")
    user_role = request.headers.get("x-user-role", "lawyer")
    return {"user_id": user_id, "role": user_role}


async def run_analysis_pipeline(document_id: str, filename: str, text: str, user_id: str = "default_user") -> FinalAnalysisResponse:
    """Executes the core LLM analysis and agent-structure pipeline."""

    # 1. Run LLM Analysis
    llm_client = LLMClient()
    try:
        llm_response: LLMResponse = await llm_client.analyze_document(text)
    except Exception as e:
        logger.error(f"LLM analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"LLM analysis failed: {str(e)}")

    # 2. Run Agents
    summary_agent = SummaryAgent()
    risk_agent = RiskAgent()
    clause_agent = ClauseAgent()

    final_summary = summary_agent.process(llm_response.summary)
    final_risks = risk_agent.process(llm_response.risks)
    final_clauses = clause_agent.process(llm_response.clauses)

    # Inconsistency
    inconsistency_score = 0.0
    if llm_response.inconsistencies:
        severity_map = {"High": 3, "Medium": 2, "Low": 1}
        total_weight = sum(severity_map.get(inc.severity, 2) for inc in llm_response.inconsistencies)
        max_possible = len(llm_response.inconsistencies) * 3
        inconsistency_score = round((total_weight / max_possible) * 10, 2) if max_possible > 0 else 0.0

    # 3. Build Final Response
    response = FinalAnalysisResponse(
        document_id=document_id,
        summary=final_summary,
        risks=final_risks,
        clauses=final_clauses,
        metadata=llm_response.metadata,
        inconsistency_score=inconsistency_score,
        inconsistencies=llm_response.inconsistencies
    )
    # Ensure text is saved in metadata
    response.metadata.document_text = text

    # 4. Persist locally
    txt_path = os.path.join(UPLOADS_DIR, f"{document_id}.txt")
    json_path = os.path.join(UPLOADS_DIR, f"{document_id}.json")

    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(text)

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(response.model_dump(), f, indent=2)

    # 5. Save to Supabase (graceful fallback)
    try:
        db_agent = DBAgent()
        await db_agent.save_analysis(
            document_id=document_id,
            user_id=user_id,
            filename=filename,
            summary=response.summary.model_dump(),
            risks=[r.model_dump() for r in response.risks],
            clauses=response.clauses.model_dump(),
            metadata=response.metadata.model_dump(),
            inconsistency_score=response.inconsistency_score,
            inconsistencies=[i.model_dump() for i in response.inconsistencies]
        )
        logger.info(f"✅ Analysis {document_id} persisted to Supabase.")
    except MissingDBCredentialsError:
        logger.warning("Supabase credentials missing — using local cache only.")
    except Exception as e:
        logger.error(f"Supabase persistence failed: {str(e)}", exc_info=True)

    return response


# ---------------------------------------------------------------------------
# Document Upload & Analysis Endpoints
# ---------------------------------------------------------------------------
@app.post("/upload", response_model=FinalAnalysisResponse, dependencies=[Depends(verify_api_key)], tags=["Analysis"])
async def upload_pdf(file: UploadFile = File(...), request: Request = None):
    """Uploads a PDF, extracts text, runs analysis, and returns structured data."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    user_info = get_user_info(request) if request else {"user_id": "default_user", "role": "lawyer"}

    try:
        file_bytes = await file.read()
        # 50 MB file-size validation
        if len(file_bytes) > 50 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 50 MB.")

        extracted_text = PDFParser.extract_text(file_bytes)
        if not extracted_text or not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No text found in PDF.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to parse PDF: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")

    document_id = str(uuid.uuid4())
    logger.info(f"📄 Processing '{file.filename}' → {document_id}")

    return await run_analysis_pipeline(document_id, file.filename, extracted_text, user_id=user_info["user_id"])


@app.post("/upload-batch", dependencies=[Depends(verify_api_key)], tags=["Analysis"])
async def upload_batch(files: list[UploadFile] = File(...), request: Request = None):
    """Uploads multiple PDFs, extracts text, runs analysis for each, and returns a list of results."""
    user_info = get_user_info(request) if request else {"user_id": "default_user", "role": "lawyer"}
    results = []
    
    for file in files:
        if not file.filename or not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"File {file.filename} is not a PDF.")
        
        try:
            file_bytes = await file.read()
            if len(file_bytes) > 50 * 1024 * 1024:
                raise HTTPException(status_code=413, detail=f"File {file.filename} is too large. Max is 50 MB.")
            
            extracted_text = PDFParser.extract_text(file_bytes)
            if not extracted_text or not extracted_text.strip():
                raise HTTPException(status_code=400, detail=f"No text found in PDF {file.filename}.")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to parse PDF {file.filename}: {str(e)}", exc_info=True)
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF {file.filename}: {str(e)}")
            
        document_id = str(uuid.uuid4())
        logger.info(f"📄 Processing Batch Item '{file.filename}' → {document_id}")
        
        res = await run_analysis_pipeline(document_id, file.filename, extracted_text, user_id=user_info["user_id"])
        results.append(res)
        
    return results


@app.post("/analyze", response_model=FinalAnalysisResponse, dependencies=[Depends(verify_api_key)], tags=["Analysis"])
async def analyze_text(req: AnalyzeTextRequest, request: Request):
    """Analyzes raw contract text and returns structured data."""
    if not req.content or not req.content.strip():
        raise HTTPException(status_code=400, detail="Document content cannot be empty.")

    user_info = get_user_info(request)
    document_id = str(uuid.uuid4())
    logger.info(f"📝 Processing pasted text → {document_id}")

    return await run_analysis_pipeline(document_id, "Pasted_Contract.txt", req.content, user_id=user_info["user_id"])


# ---------------------------------------------------------------------------
# Retrieval Endpoints
# ---------------------------------------------------------------------------
async def ensure_local_files(document_id: str) -> bool:
    """
    Checks if the local .json and .txt files exist for a document_id.
    If missing, attempts to retrieve the analysis from Supabase and reconstruct them.
    Returns True if files exist or were successfully recreated, False otherwise.
    """
    json_path = os.path.join(UPLOADS_DIR, f"{document_id}.json")
    txt_path = os.path.join(UPLOADS_DIR, f"{document_id}.txt")

    if os.path.exists(json_path) and os.path.exists(txt_path):
        return True

    # Try fetching from Supabase
    try:
        db_agent = DBAgent()
        analysis_data = await db_agent.get_analysis(document_id)
        if not analysis_data:
            logger.warning(f"Document {document_id} not found in Supabase.")
            return False

        metadata = analysis_data.get("metadata", {})
        document_text = metadata.get("document_text", "")

        # Write to txt file if missing
        if not os.path.exists(txt_path) and document_text:
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write(document_text)

        # Write to json file if missing
        if not os.path.exists(json_path):
            response_dict = {
                "document_id": document_id,
                "summary": analysis_data.get("summary", {}),
                "risks": analysis_data.get("risks", []),
                "clauses": analysis_data.get("clauses", {}),
                "metadata": metadata,
                "inconsistency_score": float(analysis_data.get("inconsistency_score", 0.0) or 0.0),
                "inconsistencies": analysis_data.get("inconsistencies", [])
            }
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(response_dict, f, indent=2)

        return True
    except MissingDBCredentialsError:
        logger.warning("Supabase credentials missing, cannot recreate local files.")
        return False
    except Exception as e:
        logger.error(f"Failed to restore local files for document {document_id}: {str(e)}", exc_info=True)
        return False


@app.get("/analyses/{document_id}", response_model=FinalAnalysisResponse, dependencies=[Depends(verify_api_key)], tags=["Retrieval"])
async def get_analysis(document_id: str):
    """Retrieves cached analysis by document ID."""
    await ensure_local_files(document_id)
    json_path = os.path.join(UPLOADS_DIR, f"{document_id}.json")
    if not os.path.exists(json_path):
        raise HTTPException(status_code=404, detail="Analysis session not found.")

    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return FinalAnalysisResponse.model_validate(data)
    except Exception as e:
        logger.error(f"Failed to load analysis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to load analysis results.")


@app.get("/analyses/{document_id}/text", dependencies=[Depends(verify_api_key)], tags=["Retrieval"])
async def get_analysis_text(document_id: str):
    """Retrieves the raw extracted text of the document."""
    await ensure_local_files(document_id)
    txt_path = os.path.join(UPLOADS_DIR, f"{document_id}.txt")
    if not os.path.exists(txt_path):
        raise HTTPException(status_code=404, detail="Document text not found.")
    try:
        with open(txt_path, "r", encoding="utf-8") as f:
            text = f.read()
        return {"text": text}
    except Exception as e:
        logger.error(f"Failed to read text file: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to load document text.")


# ---------------------------------------------------------------------------
# Inconsistency / Comparison Endpoint
# ---------------------------------------------------------------------------
class CompareRequest(BaseModel):
    document_ids: list[str]

@app.post("/compare", dependencies=[Depends(verify_api_key)], tags=["Analysis"])
async def compare_documents(req: CompareRequest):
    """Compares multiple documents to detect cross-document inconsistencies and contradictions."""
    if len(req.document_ids) < 2:
        raise HTTPException(status_code=400, detail="At least two documents must be selected for comparison.")

    doc_data = []
    for doc_id in req.document_ids:
        await ensure_local_files(doc_id)
        txt_path = os.path.join(UPLOADS_DIR, f"{doc_id}.txt")
        json_path = os.path.join(UPLOADS_DIR, f"{doc_id}.json")
        if not os.path.exists(txt_path) or not os.path.exists(json_path):
            raise HTTPException(status_code=404, detail=f"Document {doc_id} not found.")
        
        with open(txt_path, "r", encoding="utf-8") as f:
            text = f.read()
        with open(json_path, "r", encoding="utf-8") as f:
            meta = json.load(f).get("metadata", {})
            filename = meta.get("document_type", "Document") + f" ({doc_id[:8]})"
            
        doc_data.append({"filename": filename, "text": text})

    llm_client = LLMClient()
    comparison_text = ""
    for idx, doc in enumerate(doc_data):
        comparison_text += f"\n--- DOCUMENT {idx+1}: {doc['filename']} ---\n{doc['text']}\n"

    system_prompt = (
        "You are an expert legal counsel. You need to analyze the legal documents provided below "
        "and identify any conflicts, contradictions, or inconsistencies between them. Examples of conflicts "
        "include mismatched liability limits, differing payment terms, conflicting dispute resolution jurisdictions, "
        "or contradictory effective dates/termination clauses. Return a JSON object with this exact structure:\n\n"
        "{\n"
        '  "inconsistency_score": float,  # A score from 0.0 (perfectly consistent) to 10.0 (severe conflicts)\n'
        '  "inconsistencies": [\n'
        "    {\n"
        '      "title": "Title of conflict",\n'
        '      "description": "Details about the conflict, explaining what conflicts in Doc A vs Doc B",\n'
        '      "severity": "High" | "Medium" | "Low",\n'
        '      "affected_sections": ["Doc 1 Section 4", "Doc 2 Section 12"]\n'
        "    }\n"
        '  ]\n'
        "}"
    )

    try:
        raw_content = await llm_client.generate_response(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Here are the legal documents to compare:\n{comparison_text}"},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        comparison_results = json.loads(raw_content)
        return comparison_results
    except Exception as e:
        logger.error(f"Cross-document comparison failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")


# ---------------------------------------------------------------------------
# AI Chat Endpoint
# ---------------------------------------------------------------------------
@app.post("/chat", response_model=ChatResponse, dependencies=[Depends(verify_api_key)], tags=["AI Chat"])
async def chat_with_doc(req: ChatRequest):
    """Queries the document text with a natural-language question using AI."""
    await ensure_local_files(req.document_id)
    txt_path = os.path.join(UPLOADS_DIR, f"{req.document_id}.txt")
    if not os.path.exists(txt_path):
        raise HTTPException(status_code=404, detail="Document text not found.")

    try:
        with open(txt_path, "r", encoding="utf-8") as f:
            document_text = f.read()
    except Exception as e:
        logger.error(f"Failed to read contract text: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to load document text.")

    llm_client = LLMClient()
    system_prompt = (
        "You are an expert AI legal assistant. You are helping a user analyze a legal contract.\n"
        "Below is the full text of the legal contract:\n\n"
        f"--- START CONTRACT ---\n{document_text}\n--- END CONTRACT ---\n\n"
        "Answer the user's question accurately using only the contract text when possible. "
        "If the information is not in the contract, explain that it cannot be found in the document. "
        "Be clear, professional, and highlight specific section numbers or references if they exist."
    )

    try:
        answer = await llm_client.generate_response(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.question},
            ],
            temperature=0.2,
        )
        return ChatResponse(answer=answer, sources=[])
    except Exception as e:
        logger.error(f"LLM chat query failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to query document: {str(e)}")


# ---------------------------------------------------------------------------
# Notes Endpoints
# ---------------------------------------------------------------------------
from app.models.schemas import NoteCreate, NoteUpdate, NoteResponse

@app.get("/notes/{document_id}", dependencies=[Depends(verify_api_key)], tags=["Notes"])
async def get_notes(document_id: str, request: Request):
    user_info = get_user_info(request)
    db_agent = DBAgent()
    try:
        return await db_agent.get_notes(document_id, user_id=user_info["user_id"])
    except Exception as e:
        logger.error(f"Failed to get notes: {str(e)}")
        return []

@app.post("/notes/{document_id}", dependencies=[Depends(verify_api_key)], tags=["Notes"])
async def create_note(document_id: str, req: NoteCreate, request: Request):
    user_info = get_user_info(request)
    db_agent = DBAgent()
    try:
        return await db_agent.save_note(document_id, user_info["user_id"], req.content)
    except Exception as e:
        logger.error(f"Failed to save note: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save note: {str(e)}")

@app.put("/notes/{note_id}", dependencies=[Depends(verify_api_key)], tags=["Notes"])
async def update_note(note_id: int, req: NoteUpdate, request: Request):
    user_info = get_user_info(request)
    db_agent = DBAgent()
    try:
        return await db_agent.update_note(note_id, user_info["user_id"], req.content)
    except Exception as e:
        logger.error(f"Failed to update note: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update note: {str(e)}")

@app.delete("/notes/{note_id}", dependencies=[Depends(verify_api_key)], tags=["Notes"])
async def delete_note(note_id: int, request: Request):
    user_info = get_user_info(request)
    db_agent = DBAgent()
    try:
        await db_agent.delete_note(note_id, user_info["user_id"])
        return {"success": True}
    except Exception as e:
        logger.error(f"Failed to delete note: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete note: {str(e)}")

@app.get("/notes", dependencies=[Depends(verify_api_key)], tags=["Notes"])
async def list_all_notes(request: Request):
    user_info = get_user_info(request)
    db_agent = DBAgent()
    try:
        return await db_agent.list_all_notes(user_info["user_id"])
    except Exception as e:
        logger.error(f"Failed to list all notes: {str(e)}")
        return []


# ---------------------------------------------------------------------------
# Collaboration & Sharing Endpoints
# ---------------------------------------------------------------------------
from app.models.schemas import MessageCreate, MessageResponse, ShareRequest

@app.post("/messages/{document_id}", dependencies=[Depends(verify_api_key)], tags=["Collaboration"])
async def send_message(document_id: str, req: MessageCreate, request: Request):
    user_info = get_user_info(request)
    db_agent = DBAgent()
    try:
        return await db_agent.send_message(
            document_id=document_id,
            sender_id=user_info["user_id"],
            sender_role=user_info["role"],
            sender_name=req.sender_name,
            content=req.content
        )
    except Exception as e:
        logger.error(f"Failed to send message: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")

@app.get("/messages/{document_id}", dependencies=[Depends(verify_api_key)], tags=["Collaboration"])
async def get_messages(document_id: str):
    db_agent = DBAgent()
    try:
        return await db_agent.get_messages(document_id)
    except Exception as e:
        logger.error(f"Failed to get messages: {str(e)}")
        return []

@app.post("/share/{document_id}", dependencies=[Depends(verify_api_key)], tags=["Collaboration"])
async def share_document(document_id: str, req: ShareRequest, request: Request):
    user_info = get_user_info(request)
    if user_info["role"] != "lawyer":
        raise HTTPException(status_code=403, detail="Only lawyers can share documents.")
    db_agent = DBAgent()
    try:
        shared = await db_agent.share_document(
            document_id=document_id,
            lawyer_id=user_info["user_id"],
            client_email=req.client_email
        )
        return {"success": True, "shared": shared}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to share document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to share document: {str(e)}")


# ---------------------------------------------------------------------------
# List All Analyses (for Dashboard / History / Library)
# ---------------------------------------------------------------------------
@app.get("/analyses", dependencies=[Depends(verify_api_key)], tags=["Retrieval"])
async def list_analyses(user_id: str = None, limit: int = 50, request: Request = None):
    """Lists all completed analyses, optionally filtered by user_id. Clients see only shared documents."""
    user_info = get_user_info(request) if request else {"user_id": None, "role": "lawyer"}
    
    # Try Supabase first
    try:
        db_agent = DBAgent()
        if user_info["role"] == "client":
            analyses = await db_agent.list_shared_analyses(client_id=user_info["user_id"])
        else:
            analyses = await db_agent.list_analyses(user_id=user_id or user_info["user_id"], limit=limit)
        
        # Include notes count for each analysis
        notes_counts = await db_agent.get_notes_count_map(user_info["user_id"])
        for a in analyses:
            a["notes_count"] = notes_counts.get(a["document_id"], 0)
            
        return {"analyses": analyses, "total": len(analyses)}
    except MissingDBCredentialsError:
        logger.warning("Supabase not configured — falling back to local file scan.")
    except Exception as e:
        logger.error(f"Failed to list analyses from Supabase: {str(e)}", exc_info=True)

    # Fallback: scan local uploads directory for JSON files
    analyses = []
    if os.path.exists(UPLOADS_DIR):
        for fname in os.listdir(UPLOADS_DIR):
            if fname.endswith(".json"):
                doc_id = fname.replace(".json", "")
                json_path = os.path.join(UPLOADS_DIR, fname)
                try:
                    with open(json_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    analyses.append({
                        "document_id": doc_id,
                        "filename": data.get("metadata", {}).get("document_type", "Unknown") + ".pdf",
                        "document_type": data.get("metadata", {}).get("document_type", "Unknown"),
                        "risk_score": 0,
                        "status": "completed",
                        "created_at": None,
                        "notes_count": 0
                    })
                except Exception:
                    pass
    return {"analyses": analyses, "total": len(analyses)}


# ---------------------------------------------------------------------------
# PDF Report Generation
# ---------------------------------------------------------------------------
@app.get("/report/{document_id}", dependencies=[Depends(verify_api_key)], tags=["Reports"])
def get_pdf_report(document_id: str):
    """Generates and returns the PDF audit report for a completed analysis."""
    json_path = os.path.join(UPLOADS_DIR, f"{document_id}.json")
    if not os.path.exists(json_path):
        raise HTTPException(status_code=404, detail="Analysis results not found.")

    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        summary = data.get("summary", {})
        risks = data.get("risks", [])
        clauses = data.get("clauses", {})
        metadata = data.get("metadata", {})

        pdf_path = generate_report(document_id, summary, risks, clauses, metadata)

        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=f"lexicon_analysis_{document_id}.pdf",
        )
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")
