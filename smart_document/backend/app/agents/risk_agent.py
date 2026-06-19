import logging
from typing import List
from app.models.schemas import LLMRisk, FinalRisk

logger = logging.getLogger(__name__)

class RiskAgent:
    def process(self, risks: List[LLMRisk]) -> List[FinalRisk]:
        """
        Processes risks by mapping severity to weights, setting criticality,
        and sorting descending by severity weight.
        """
        logger.info("Processing risk assessments...")
        
        severity_map = {
            "high": 3,
            "medium": 2,
            "low": 1
        }
        
        final_risks = []
        for risk in risks:
            sev_str = (risk.severity or "Low").strip().lower()
            weight = severity_map.get(sev_str, 1)  # Default to 1 (Low) if unknown
            is_critical = (weight == 3)
            
            final_risks.append(FinalRisk(
                title=risk.title,
                description=risk.description,
                severity=risk.severity,
                severity_weight=weight,
                is_critical=is_critical,
                mitigation=risk.mitigation,
                impact=risk.impact
            ))
            
        # Sort descending by severity weight
        final_risks.sort(key=lambda x: x.severity_weight, reverse=True)
        return final_risks
