from pydantic import BaseModel, Field
from typing import List, Literal

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

class LLMResponse(BaseModel):
    """The raw structured response expected from the LLM."""
    summary: LLMSummary
    risks: List[LLMRisk] = Field(default_factory=list)
    clauses: List[LLMClause] = Field(default_factory=list)
    metadata: LLMMetadata


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


# --- API Request Models ---

class AnalyzeTextRequest(BaseModel):
    input_type: Literal["text"]
    content: str
