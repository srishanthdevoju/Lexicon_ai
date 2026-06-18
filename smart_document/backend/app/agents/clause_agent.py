import logging
from typing import List
from app.models.schemas import LLMClause, FinalClauses

logger = logging.getLogger(__name__)

class ClauseAgent:
    def process(self, clauses: List[LLMClause]) -> FinalClauses:
        """
        Groups legal clauses into standard_clauses and non_standard_clauses.
        """
        logger.info("Grouping clauses into standard and non-standard sets...")
        
        standard_clauses = []
        non_standard_clauses = []
        
        for clause in clauses:
            clause_type = (clause.type or "Standard").strip().lower()
            if "non-standard" in clause_type or "non_standard" in clause_type or clause_type == "nonstandard":
                non_standard_clauses.append(clause)
            else:
                standard_clauses.append(clause)
                
        return FinalClauses(
            standard_clauses=standard_clauses,
            non_standard_clauses=non_standard_clauses
        )
