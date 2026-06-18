import os
import json
import time
import logging
import asyncio
from supabase import create_client, Client
from app.core.config import settings, dotenv_path

logger = logging.getLogger(__name__)

class MissingDBCredentialsError(ValueError):
    pass

class DatabaseExecutionError(RuntimeError):
    pass

class DBAgent:
    def __init__(self):
        self._client = None

    @property
    def client(self) -> Client:
        import os
        from dotenv import load_dotenv
        from app.core.config import dotenv_path
        load_dotenv(dotenv_path, override=True)

        supabase_url = os.getenv("SUPABASE_URL", settings.SUPABASE_URL)
        supabase_key = os.getenv("SUPABASE_KEY", settings.SUPABASE_KEY)

        if (
            not supabase_url
            or supabase_url.strip() == ""
            or not supabase_key
            or supabase_key.strip() == ""
        ):
            raise MissingDBCredentialsError("Supabase credentials (SUPABASE_URL and SUPABASE_KEY) are not configured in the environment.")
        
        if (
            self._client is None 
            or getattr(self, "_last_url", None) != supabase_url 
            or getattr(self, "_last_key", None) != supabase_key
        ):
            self._client = create_client(supabase_url, supabase_key)
            self._last_url = supabase_url
            self._last_key = supabase_key
            
        return self._client

    async def save_analysis(
        self,
        document_id: str,
        user_id: str,
        filename: str,
        summary: dict,
        risks: list,
        clauses: dict,
        metadata: dict,
        inconsistency_score: float = 0.0,
        inconsistencies: list = None
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
            "inconsistency_score": inconsistency_score,
            "inconsistencies": inconsistencies or [],
            "status": "completed",
            "notes": "",
            "review_status": "pending",
            "lawyer_notes": "",
            "collaboration_messages": []
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

    # --- Notes Methods ---

    async def save_note(self, document_id: str, user_id: str, content: str) -> dict:
        """Creates a new note for a document."""
        supabase_client = self.client
        data = {
            "document_id": document_id,
            "user_id": user_id,
            "content": content
        }
        def _execute():
            return supabase_client.table("notes").insert(data).execute()
        
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(None, _execute)
        return response.data[0] if response.data else {}

    async def get_notes(self, document_id: str, user_id: str = None) -> list:
        """Fetches notes for a specific document, optionally filtered by user_id."""
        supabase_client = self.client
        def _execute():
            query = supabase_client.table("notes").select("*").eq("document_id", document_id)
            if user_id:
                query = query.eq("user_id", user_id)
            return query.order("created_at", desc=True).execute()
        
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(None, _execute)
        return response.data or []

    async def update_note(self, note_id: int, user_id: str, content: str) -> dict:
        """Updates an existing note."""
        supabase_client = self.client
        def _execute():
            return supabase_client.table("notes").update({
                "content": content,
                "updated_at": "now()"
            }).eq("id", note_id).eq("user_id", user_id).execute()
        
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(None, _execute)
        return response.data[0] if response.data else {}

    async def delete_note(self, note_id: int, user_id: str) -> bool:
        """Deletes a note."""
        supabase_client = self.client
        def _execute():
            return supabase_client.table("notes").delete().eq("id", note_id).eq("user_id", user_id).execute()
        
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, _execute)
        return True

    async def list_all_notes(self, user_id: str) -> list:
        """Lists all notes for a user across all documents, joining with analyses to get the filename."""
        supabase_client = self.client
        def _execute():
            # In Supabase JS, this would be select("*, analyses(filename)"), but in Python, the syntax is similar
            return supabase_client.table("notes").select("*, analyses(filename)").eq("user_id", user_id).order("created_at", desc=True).execute()
        
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(None, _execute)
        return response.data or []

    async def get_notes_count_map(self, user_id: str = None) -> dict:
        """Returns a mapping of document_id -> notes_count for a user."""
        supabase_client = self.client
        def _execute():
            query = supabase_client.table("notes").select("document_id")
            if user_id:
                query = query.eq("user_id", user_id)
            return query.execute()
        
        try:
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(None, _execute)
            counts = {}
            for item in (response.data or []):
                doc_id = item["document_id"]
                counts[doc_id] = counts.get(doc_id, 0) + 1
            return counts
        except Exception:
            return {}

    # --- Messaging Methods ---

    async def send_message(self, document_id: str, sender_id: str, sender_role: str, sender_name: str, content: str) -> dict:
        """Sends a message in the document's collaboration thread."""
        supabase_client = self.client
        data = {
            "document_id": document_id,
            "sender_id": sender_id,
            "sender_role": sender_role,
            "sender_name": sender_name,
            "content": content
        }
        def _execute():
            return supabase_client.table("messages").insert(data).execute()
        
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(None, _execute)
        return response.data[0] if response.data else {}

    async def get_messages(self, document_id: str) -> list:
        """Fetches messages for a document in chronological order."""
        supabase_client = self.client
        def _execute():
            return supabase_client.table("messages").select("*").eq("document_id", document_id).order("created_at", desc=False).execute()
        
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(None, _execute)
        return response.data or []

    # --- Document Sharing Methods ---

    async def share_document(self, document_id: str, lawyer_id: str, client_email: str) -> dict:
        """Shares a document with a client using their email."""
        supabase_client = self.client
        
        def _find_client():
            return supabase_client.table("profiles").select("id").eq("email", client_email).execute()
            
        loop = asyncio.get_running_loop()
        client_res = await loop.run_in_executor(None, _find_client)
        if not client_res.data:
            raise ValueError(f"No user found with email {client_email}. The client must register first.")
            
        client_id = client_res.data[0]["id"]
        
        data = {
            "document_id": document_id,
            "lawyer_id": lawyer_id,
            "client_id": client_id
        }
        
        def _execute_share():
            return supabase_client.table("shared_documents").insert(data).execute()
            
        response = await loop.run_in_executor(None, _execute_share)
        return response.data[0] if response.data else {}

    async def list_shared_analyses(self, client_id: str) -> list:
        """Lists all document analyses shared with a specific client."""
        supabase_client = self.client
        
        def _execute():
            # Query shared documents and join the analyses details
            return supabase_client.table("shared_documents").select("*, analyses(*)").eq("client_id", client_id).execute()
            
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(None, _execute)
        
        shared = []
        for item in (response.data or []):
            if item.get("analyses"):
                analysis = item["analyses"]
                # Include the lawyer profile details if needed or just the analysis
                shared.append(analysis)
        return shared

