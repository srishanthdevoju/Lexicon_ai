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
    mitigation: Optional[str] = Field(default="", description="Suggested change or mitigation strategy for this risk.")
    impact: Optional[str] = Field(default="", description="Potential business or legal consequence of this risk.")

class LLMClause(BaseModel):
    title: str = Field(description="Title of the clause.")
    content: str = Field(description="Exact content or context of the clause.")
    type: str = Field(description="Type of the clause (e.g. Standard, Non-Standard).")

class LLMMetadata(BaseModel):
    document_type: str = Field(description="The type of the legal document (e.g. NDA, MSA, Lease Agreement).")
    parties: List[str] = Field(default_factory=list, description="Parties involved in the contract.")
    effective_date: str = Field(description="Effective date of the document.")
    document_text: Optional[str] = Field(default=None, description="The full extracted text of the document.")
    group_id: Optional[str] = Field(default=None, description="Linked document group ID.")
    linked_docs: Optional[List[dict]] = Field(default_factory=list, description="Other documents in the linked group.")
    cross_contradictions: Optional[dict] = Field(default=None, description="Batch cross-document contradictions report.")

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
    mitigation: Optional[str] = ""
    impact: Optional[str] = ""

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
    document_id: Optional[str] = None

class NoteUpdate(BaseModel):
    content: str

class NoteResponse(BaseModel):
    id: int
    document_id: Optional[str] = None
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


# --- Lawyer Models ---

class LawyerResponse(BaseModel):
    id: str
    name: str
    email: str
    specialty: str
    phone: Optional[str] = None
    available_slots: Optional[str] = None
    created_at: Optional[str] = None


# --- Appointment Models ---

class AppointmentCreate(BaseModel):
    lawyer_id: Optional[str] = None  # None = auto-assign to any available lawyer
    client_id: Optional[str] = None
    title: str
    description: Optional[str] = ""
    appointment_date: str  # YYYY-MM-DD
    appointment_time: str  # HH:MM
    share_phone_with_lawyer: Optional[bool] = False

class AppointmentUpdate(BaseModel):
    status: str

class AppointmentResponse(BaseModel):
    id: int
    client_id: str
    lawyer_id: str
    title: str
    description: Optional[str] = ""
    appointment_date: str
    appointment_time: str
    status: str
    meeting_link: Optional[str] = None
    share_phone_with_lawyer: Optional[bool] = False
    client_phone: Optional[str] = None
    lawyer_phone: Optional[str] = None
    created_at: Optional[str] = None
    client_name: Optional[str] = None
    lawyer_name: Optional[str] = None


# --- Direct Messaging Models ---

class DirectMessageCreate(BaseModel):
    content: str

class DirectMessageResponse(BaseModel):
    id: int
    sender_id: str
    receiver_id: str
    sender_name: str
    sender_role: str
    content: str
    created_at: Optional[str] = None


# --- Contact Models ---

class ContactResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    specialty: Optional[str] = None

