import os
import json
import asyncio
import logging
from openai import AsyncOpenAI
from app.core.config import settings, dotenv_path
from app.models.schemas import LLMResponse, LLMSummary, LLMRisk, LLMClause, LLMMetadata, InconsistencyItem

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
    """OpenAI-compatible LLM client with retry logic, structured JSON parsing, and API key rotation."""

    MAX_RETRIES = 3
    RETRY_BACKOFF_BASE = 2  # seconds

    def __init__(self):
        # Dynamically reload dotenv on each initialization to reflect .env changes instantly
        from dotenv import load_dotenv
        load_dotenv(dotenv_path, override=True)

        api_key_raw = os.getenv("OPENAI_API_KEY", settings.OPENAI_API_KEY)
        self.api_keys = [k.strip() for k in api_key_raw.split(",") if k.strip()]
        self.model = os.getenv("OPENAI_MODEL", settings.OPENAI_MODEL)
        self.base_url = os.getenv("OPENAI_BASE_URL", settings.OPENAI_BASE_URL)
        self._client = None

    @property
    def client(self) -> AsyncOpenAI:
        """Fallback client property returning client for the first configured key."""
        if not self.api_keys:
            raise MissingAPIKeyError("OpenAI/Groq API Key is missing or not configured in the environment.")
        if self._client is None:
            client_kwargs = {"api_key": self.api_keys[0]}
            if self.base_url and self.base_url.strip():
                client_kwargs["base_url"] = self.base_url.strip()
            self._client = AsyncOpenAI(**client_kwargs)
        return self._client

    async def generate_response(
        self,
        messages: list,
        response_format: dict = None,
        temperature: float = 0.2,
        seed: int = None
    ) -> str:
        """
        Creates chat completions with retry, key rotation on 429, and robust error handling.
        """
        # Dynamically reload dotenv
        from dotenv import load_dotenv
        load_dotenv(dotenv_path, override=True)

        api_key_raw = os.getenv("OPENAI_API_KEY", settings.OPENAI_API_KEY)
        api_keys = [k.strip() for k in api_key_raw.split(",") if k.strip()]

        if not api_keys:
            raise MissingAPIKeyError("OpenAI/Groq API Key is missing or not configured in the environment.")

        last_error = None
        for attempt in range(1, self.MAX_RETRIES + 1):
            key_index = (attempt - 1) % len(api_keys)
            api_key = api_keys[key_index]
            logger.info(f"LLM request attempt {attempt}/{self.MAX_RETRIES} using key index {key_index} → model={self.model}")

            try:
                client_kwargs = {"api_key": api_key}
                if self.base_url and self.base_url.strip():
                    client_kwargs["base_url"] = self.base_url.strip()
                openai_client = AsyncOpenAI(**client_kwargs)

                kwargs = {
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                }
                if response_format:
                    kwargs["response_format"] = response_format
                if seed is not None:
                    kwargs["seed"] = seed

                response = await openai_client.chat.completions.create(**kwargs)
                raw_content = response.choices[0].message.content
                if not raw_content:
                    raise LLMExecutionError("OpenAI/Groq returned an empty response.")
                return raw_content

            except Exception as e:
                last_error = e
                err_msg = str(e).lower()
                is_rate_limit = "429" in err_msg or "rate limit" in err_msg or "rate_limit" in err_msg

                if is_rate_limit and len(api_keys) > 1:
                    logger.warning(
                        f"Rate limit hit with key index {key_index}. Trying next key on next attempt..."
                    )

                if attempt < self.MAX_RETRIES:
                    wait_time = 1 if (is_rate_limit and len(api_keys) > 1) else (self.RETRY_BACKOFF_BASE ** attempt)
                    logger.warning(
                        f"LLM request failed (attempt {attempt}): {str(e)} — retrying in {wait_time}s..."
                    )
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"LLM request failed after {self.MAX_RETRIES} attempts: {str(e)}", exc_info=True)

        raise LLMExecutionError(f"OpenAI/Groq API call failed after {self.MAX_RETRIES} retries: {str(last_error)}")

    async def analyze_document(self, document_text: str) -> LLMResponse:
        """
        Calls OpenAI/Groq ChatCompletion in JSON mode to parse the document text.
        """
        # Smart truncation for large documents to stay within free-tier TPM rate limits (e.g. 6,000 tokens)
        max_chars = 14000
        if len(document_text) > max_chars:
            logger.warning(f"⚠️ Document text length ({len(document_text)} chars) exceeds safe threshold ({max_chars} chars) for TPM limits. Truncating document...")
            document_text = (
                document_text[:10000]
                + "\n\n... [TRUNCATED MIDDLE CONTENT TO STAY WITHIN API RATE LIMITS] ...\n\n"
                + document_text[-4000:]
            )

        system_prompt = self._build_system_prompt()
        user_prompt = f"Here is the legal document to analyze:\n\n{document_text}"

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        raw_content = await self.generate_response(
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0,
            seed=42
        )
        return self._parse_response(raw_content)

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
            '      "severity": "High" | "Medium" | "Low",\n'
            '      "mitigation": "Recommended actionable wording change, remediation, or action item to reduce/fix this risk.",\n'
            '      "impact": "Potential negative business, operational, or legal consequence if this risk materializes."\n'
            "    }\n"
            "  ],\n"
            '  "clauses": [\n'
            "    {\n"
            '      "title": "Clause title (e.g. Indemnification)",\n'
            '      "content": "Full text or specific context of the clause as present in document",\n'
            '      "type": "Standard" | "Non-Standard"\n'
            "    }\n"
            "  ],\n"
            '  "inconsistencies": [\n'
            "    {\n"
            '      "title": "Inconsistency title (e.g. Conflicting Payment Terms)",\n'
            '      "content": "Description of the conflict, contradiction, or discrepancy",\n'
            '      "severity": "High" | "Medium" | "Low",\n'
            '      "affected_sections": ["Section 4.1", "Section 10.3"]\n'
            "    }\n"
            "  ],\n"
            '  "metadata": {\n'
            '    "document_type": "e.g. Non-Disclosure Agreement, Master Services Agreement, Lease",\n'
            '    "parties": ["Party A", "Party B"],\n'
            '    "effective_date": "YYYY-MM-DD or Unknown"\n'
            "  }\n"
            "}\n\n"
            "Guidelines:\n"
            "1. Extract all significant risks and categorize their severity as 'High', 'Medium', or 'Low'. For each risk, explicitly outline a concrete contract change or mitigation, and explain the potential legal/business impact.\n"
            "2. Extract key clauses and identify if they are 'Standard' or 'Non-Standard' "
            "(i.e. unusual, highly restrictive, or asymmetric terms).\n"
            "3. Identify internal inconsistencies or contradictions (e.g. Section 2 says net 30, but Section 5 says net 60; or different liability caps in different clauses). If none are found, return an empty array.\n"
            "4. Ensure the output is strictly valid JSON. Do not include any markdown codeblocks "
            "or conversational text around the JSON."
        )

    @staticmethod
    def _apply_fallback_defaults(data: dict) -> LLMResponse:
        """Construct a valid LLMResponse by applying defaults to missing or malformed keys."""
        summary_dict = data.get("summary", {}) if isinstance(data.get("summary"), dict) else {}
        risks_list = data.get("risks", []) if isinstance(data.get("risks"), list) else []
        clauses_list = data.get("clauses", []) if isinstance(data.get("clauses"), list) else []
        inconsistencies_list = data.get("inconsistencies", []) if isinstance(data.get("inconsistencies"), list) else []
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
                    mitigation=str(risk.get("mitigation", "No mitigation wording proposed.")),
                    impact=str(risk.get("impact", "Unspecified legal impact."))
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

        # Inconsistencies
        processed_inconsistencies = []
        for inc in inconsistencies_list:
            if isinstance(inc, dict):
                processed_inconsistencies.append(InconsistencyItem(
                    title=str(inc.get("title", inc.get("title", "Unspecified Inconsistency"))),
                    description=str(inc.get("description", inc.get("content", "No description provided."))),
                    severity=str(inc.get("severity", "Medium")),
                    affected_sections=list(inc.get("affected_sections", []))
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
            inconsistencies=processed_inconsistencies,
            metadata=LLMMetadata(
                document_type=document_type,
                parties=parties,
                effective_date=effective_date,
            ),
        )
