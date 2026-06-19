import json
import asyncio
import logging
from openai import AsyncOpenAI
from app.core.config import settings
from app.models.schemas import LLMResponse, LLMSummary, LLMRisk, LLMClause, LLMMetadata

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Custom Exceptions
# ---------------------------------------------------------------------------

class MissingAPIKeyError(ValueError):
    pass


class LLMExecutionError(RuntimeError):
    pass


# ---------------------------------------------------------------------------
# LLM Client with retry support
# ---------------------------------------------------------------------------

class LLMClient:
    """OpenAI-compatible LLM client with retry logic and structured JSON parsing."""

    MAX_RETRIES = 3
    RETRY_BACKOFF_BASE = 2  # seconds

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
        self._client = None

    @property
    def client(self) -> AsyncOpenAI:
        if not self.api_key or self.api_key.strip() == "":
            raise MissingAPIKeyError("OpenAI API Key is missing or not configured in the environment.")
        if self._client is None:
            client_kwargs = {"api_key": self.api_key}
            if settings.OPENAI_BASE_URL and settings.OPENAI_BASE_URL.strip():
                client_kwargs["base_url"] = settings.OPENAI_BASE_URL.strip()
            self._client = AsyncOpenAI(**client_kwargs)
        return self._client

    async def analyze_document(self, document_text: str) -> LLMResponse:
        """
        Calls OpenAI ChatCompletion in JSON mode to parse the document text.
        Includes retry logic with exponential backoff for transient failures.
        """
        try:
            openai_client = self.client
        except MissingAPIKeyError:
            raise

        system_prompt = self._build_system_prompt()
        user_prompt = f"Here is the legal document to analyze:\n\n{document_text}"

        last_error = None
        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                logger.info(f"LLM request attempt {attempt}/{self.MAX_RETRIES} → model={self.model}")
                response = await openai_client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.1,
                )

                raw_content = response.choices[0].message.content
                if not raw_content:
                    raise LLMExecutionError("OpenAI returned an empty response.")

                return self._parse_response(raw_content)

            except (MissingAPIKeyError, LLMExecutionError):
                raise
            except Exception as e:
                last_error = e
                if attempt < self.MAX_RETRIES:
                    wait_time = self.RETRY_BACKOFF_BASE ** attempt
                    logger.warning(
                        f"LLM request failed (attempt {attempt}): {str(e)} — retrying in {wait_time}s..."
                    )
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"LLM request failed after {self.MAX_RETRIES} attempts: {str(e)}", exc_info=True)

        raise LLMExecutionError(f"OpenAI API call failed after {self.MAX_RETRIES} retries: {str(last_error)}")

    def _parse_response(self, raw_content: str) -> LLMResponse:
        """Parse and validate the raw JSON response from the LLM."""
        try:
            parsed_data = json.loads(raw_content)
        except Exception as e:
            logger.error(f"Failed to parse LLM response as JSON: {str(e)}\nRaw: {raw_content[:500]}")
            raise LLMExecutionError(f"LLM returned invalid JSON format: {str(e)}")

        try:
            return LLMResponse.model_validate(parsed_data)
        except Exception as ve:
            logger.warning(f"Pydantic validation failed, applying fallback defaults: {str(ve)}")
            return self._apply_fallback_defaults(parsed_data)

    @staticmethod
    def _build_system_prompt() -> str:
        """Constructs the mega-prompt for legal document analysis."""
        return (
            "You are an expert legal document analyzer. You must analyze the legal document text provided "
            "and return a JSON object that strictly adheres to the following structure:\n\n"
            "{\n"
            '  "summary": {\n'
            '    "main_summary": "A comprehensive description of what this agreement is, its main purpose, etc.",\n'
            '    "key_points": ["point 1", "point 2"]\n'
            "  },\n"
            '  "risks": [\n'
            "    {\n"
            '      "title": "Short risk name",\n'
            '      "description": "Detailed explanation of the risk to the parties.",\n'
            '      "severity": "High" | "Medium" | "Low"\n'
            "    }\n"
            "  ],\n"
            '  "clauses": [\n'
            "    {\n"
            '      "title": "Clause title (e.g. Indemnification)",\n'
            '      "content": "Full text or specific context of the clause as present in document",\n'
            '      "type": "Standard" | "Non-Standard"\n'
            "    }\n"
            "  ],\n"
            '  "metadata": {\n'
            '    "document_type": "e.g. Non-Disclosure Agreement, Master Services Agreement, Lease",\n'
            '    "parties": ["Party A", "Party B"],\n'
            '    "effective_date": "YYYY-MM-DD or Unknown"\n'
            "  }\n"
            "}\n\n"
            "Guidelines:\n"
            "1. Extract all significant risks and categorize their severity as 'High', 'Medium', or 'Low'.\n"
            "2. Extract key clauses and identify if they are 'Standard' or 'Non-Standard' "
            "(i.e. unusual, highly restrictive, or asymmetric terms).\n"
            "3. Ensure the output is strictly valid JSON. Do not include any markdown codeblocks "
            "or conversational text around the JSON."
        )

    @staticmethod
    def _apply_fallback_defaults(data: dict) -> LLMResponse:
        """Construct a valid LLMResponse by applying defaults to missing or malformed keys."""
        summary_dict = data.get("summary", {}) if isinstance(data.get("summary"), dict) else {}
        risks_list = data.get("risks", []) if isinstance(data.get("risks"), list) else []
        clauses_list = data.get("clauses", []) if isinstance(data.get("clauses"), list) else []
        metadata_dict = data.get("metadata", {}) if isinstance(data.get("metadata"), dict) else {}

        # Summary
        main_summary = summary_dict.get("main_summary", "Summary could not be fully parsed from document content.")
        key_points = summary_dict.get("key_points", [])
        if not isinstance(key_points, list):
            key_points = []
        key_points = [str(kp) for kp in key_points if kp]

        # Risks
        processed_risks = []
        for risk in risks_list:
            if isinstance(risk, dict):
                processed_risks.append(LLMRisk(
                    title=str(risk.get("title", "Unspecified Risk")),
                    description=str(risk.get("description", "No description provided.")),
                    severity=str(risk.get("severity", "Low")),
                ))

        # Clauses
        processed_clauses = []
        for clause in clauses_list:
            if isinstance(clause, dict):
                processed_clauses.append(LLMClause(
                    title=str(clause.get("title", "Unspecified Clause")),
                    content=str(clause.get("content", "")),
                    type=str(clause.get("type", "Standard")),
                ))

        # Metadata
        document_type = metadata_dict.get("document_type", "Unknown Document Type")
        parties = metadata_dict.get("parties", [])
        if not isinstance(parties, list):
            parties = []
        parties = [str(p) for p in parties if p]
        effective_date = metadata_dict.get("effective_date", "Unknown Effective Date")

        return LLMResponse(
            summary=LLMSummary(main_summary=main_summary, key_points=key_points),
            risks=processed_risks,
            clauses=processed_clauses,
            metadata=LLMMetadata(
                document_type=document_type,
                parties=parties,
                effective_date=effective_date,
            ),
        )
