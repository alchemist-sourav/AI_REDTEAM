from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.schemas.risk_scoring import RiskScoreResponse


EvaluationVerdict = Literal[
    "pass",
    "fail",
    "inconclusive",
]

RiskLevel = Literal[
    "low",
    "medium",
    "high",
    "critical",
]


class EvaluationResponse(BaseModel):
    id: int
    execution_result_id: int
    verdict: EvaluationVerdict
    risk_level: RiskLevel
    explanation: str
    matched_indicators: list[str]
    evaluated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EvaluationBatchResponse(BaseModel):
    batch_id: str
    total_execution_results: int
    evaluated: int
    already_evaluated: int
    results: list[EvaluationResponse]