import logging
import asyncio
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

class MissingDBCredentialsError(ValueError):
    pass

class DatabaseExecutionError(RuntimeError):
    pass

class DBAgent:
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_KEY
        self._client = None

    @property
    def client(self) -> Client:
        if (
            not self.supabase_url
            or self.supabase_url.strip() == ""
            or not self.supabase_key
            or self.supabase_key.strip() == ""
        ):
            raise MissingDBCredentialsError("Supabase credentials (SUPABASE_URL and SUPABASE_KEY) are not configured in the environment.")
        if self._client is None:
            self._client = create_client(self.supabase_url, self.supabase_key)
        return self._client

    async def save_analysis(
        self,
        document_id: str,
        user_id: str,
        filename: str,
        summary: dict,
        risks: list,
        clauses: dict,
        metadata: dict
    ) -> dict:
        """
        Inserts document analysis results into the Supabase 'analyses' table.
        Runs the synchronous database operations in an executor to avoid blocking the event loop.
        """
        try:
            supabase_client = self.client
        except MissingDBCredentialsError as e:
            raise e

        # Calculate a simple risk score from severity weights
        risk_score = 0.0
        if risks:
            total_weight = sum(r.get("severity_weight", 1) for r in risks)
            max_possible = len(risks) * 3  # max weight is 3 (High)
            risk_score = round((total_weight / max_possible) * 10, 2) if max_possible > 0 else 0.0

        # Extract document_type from metadata
        document_type = metadata.get("document_type", "Unknown")

        data = {
            "document_id": document_id,
            "user_id": user_id,
            "filename": filename,
            "document_type": document_type,
            "summary": summary,
            "risks": risks,
            "clauses": clauses,
            "metadata": metadata,
            "risk_score": risk_score,
            "status": "completed"
        }

        def _execute_insert():
            return supabase_client.table("analyses").insert(data).execute()

        try:
            logger.info(f"Saving analysis for document ID {document_id} to table 'analyses'")
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(None, _execute_insert)
            return response.data
        except Exception as e:
            logger.error(f"Failed to insert analysis records into Supabase: {str(e)}", exc_info=True)
            raise DatabaseExecutionError(f"Database insertion failed: {str(e)}")

    async def list_analyses(self, user_id: str = None, limit: int = 50) -> list:
        """
        Lists recent analyses from Supabase, optionally filtered by user_id.
        Returns a list of analysis summary records.
        """
        try:
            supabase_client = self.client
        except MissingDBCredentialsError:
            raise

        def _execute_query():
            query = supabase_client.table("analyses").select(
                "document_id, filename, document_type, risk_score, status, created_at, user_id"
            ).order("created_at", desc=True).limit(limit)

            if user_id:
                query = query.eq("user_id", user_id)

            return query.execute()

        try:
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(None, _execute_query)
            return response.data or []
        except Exception as e:
            logger.error(f"Failed to list analyses from Supabase: {str(e)}", exc_info=True)
            raise DatabaseExecutionError(f"Database query failed: {str(e)}")

    async def get_analysis(self, document_id: str) -> dict:
        """
        Fetches a single analysis record from Supabase by document_id.
        """
        try:
            supabase_client = self.client
        except MissingDBCredentialsError:
            raise

        def _execute_query():
            return supabase_client.table("analyses").select("*").eq(
                "document_id", document_id
            ).single().execute()

        try:
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(None, _execute_query)
            return response.data
        except Exception as e:
            logger.error(f"Failed to get analysis {document_id}: {str(e)}", exc_info=True)
            raise DatabaseExecutionError(f"Database query failed: {str(e)}")
