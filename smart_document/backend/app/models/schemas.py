from pydantic import BaseModel, Field
from typing import List, Literal, Optional

# --- LLM JSON Schema Models (Input to Agents) ---

class LLMSummary(BaseModel):
    main_summary: str = Field(description="A comprehensive summary of the legal document.")
    key_points: List[str] = Field(default_factory=list, description="List of key points extracted from the document.")

class LLMRisk(BaseModel):
    title: str = Field(description="Name or category of the risk.")
    description: str = Field(description="Detailed explanation of the risk.")
    severity: str = Field(description="Severity level of the risk (High, Medium, Low).")

class LLMClause(BaseModel):
    title: str = Field(description="Title of the clause.")
    content: str = Field(description="Exact content or context of the clause.")
    type: str = Field(description="Type of the clause (e.g. Standard, Non-Standard).")

class LLMMetadata(BaseModel):
    document_type: str = Field(description="The type of the legal document (e.g. NDA, MSA, Lease Agreement).")
    parties: List[str] = Field(default_factory=list, description="Parties involved in the contract.")
    effective_date: str = Field(description="Effective date of the document.")
    document_text: Optional[str] = Field(default=None, description="The full extracted text of the document.")

# --- Inconsistency Detection Models ---

class InconsistencyItem(BaseModel):
    title: str = Field(description="Brief title of the inconsistency.")
    description: str = Field(description="Detailed explanation of the inconsistency found.")
    severity: str = Field(default="Medium", description="Severity: High, Medium, or Low.")
    affected_sections: List[str] = Field(default_factory=list, description="Document sections affected.")


class LLMResponse(BaseModel):
    """The raw structured response expected from the LLM."""
    summary: LLMSummary
    risks: List[LLMRisk] = Field(default_factory=list)
    clauses: List[LLMClause] = Field(default_factory=list)
    metadata: LLMMetadata
    inconsistencies: List[InconsistencyItem] = Field(default_factory=list)


# --- Final Structured Response Models (Output from Agents / API Response) ---

class FinalSummary(BaseModel):
    main_summary: str
    tldr: str
    key_points: List[str]

class FinalRisk(BaseModel):
    title: str
    description: str
    severity: str
    severity_weight: int  # High -> 3, Medium -> 2, Low -> 1
    is_critical: bool     # True if severity is High (weight == 3)

class FinalClauses(BaseModel):
    standard_clauses: List[LLMClause]
    non_standard_clauses: List[LLMClause]


class FinalAnalysisResponse(BaseModel):
    document_id: str
    summary: FinalSummary
    risks: List[FinalRisk]
    clauses: FinalClauses
    metadata: LLMMetadata
    inconsistency_score: float = Field(default=0.0, description="Inconsistency score 0-10.")
    inconsistencies: List[InconsistencyItem] = Field(default_factory=list)


# --- API Request Models ---

class AnalyzeTextRequest(BaseModel):
    input_type: Literal["text"]
    content: str


# --- Notes Models ---

class NoteCreate(BaseModel):
    content: str

class NoteUpdate(BaseModel):
    content: str

class NoteResponse(BaseModel):
    id: int
    document_id: str
    user_id: str
    content: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# --- Messaging Models ---

class MessageCreate(BaseModel):
    content: str
    sender_role: str = "lawyer"
    sender_name: str = "Unknown"

class MessageResponse(BaseModel):
    id: int
    document_id: str
    sender_id: str
    sender_role: str
    sender_name: str
    content: str
    created_at: Optional[str] = None


# --- Share Models ---

class ShareRequest(BaseModel):
    client_email: str

