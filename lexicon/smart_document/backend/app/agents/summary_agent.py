import logging
from app.models.schemas import LLMSummary, FinalSummary

logger = logging.getLogger(__name__)

class SummaryAgent:
    def process(self, summary_data: LLMSummary) -> FinalSummary:
        """
        Validates summary content and generates a concise TLDR programmatically.
        """
        logger.info("Processing summary content...")
        
        main_summary = summary_data.main_summary.strip() if summary_data.main_summary else ""
        if not main_summary:
            main_summary = "No summary was provided or could be extracted."
            
        key_points = [
            kp.strip() for kp in summary_data.key_points if kp and kp.strip()
        ]

        # Programmatic TLDR generation
        # Extract the first sentence of the main_summary.
        sentences = [s.strip() for s in main_summary.split(".") if s.strip()]
        if sentences:
            tldr = sentences[0]
            if not tldr.endswith("."):
                tldr += "."
        else:
            tldr = "No summary available."

        return FinalSummary(
            main_summary=main_summary,
            tldr=tldr,
            key_points=key_points
        )
