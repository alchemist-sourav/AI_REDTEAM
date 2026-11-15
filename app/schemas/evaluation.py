from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


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

from typing import Literal
from pydantic import BaseModel


class RiskScoreResponse(BaseModel):
    batch_id: str

    total_execution_results: int
    total_evaluations: int
    unevaluated: int

    passed: int
    failed: int
    inconclusive: int
    scored_evaluations: int

    evaluation_coverage: float
    conclusive_coverage: float

    overall_score: float | None
    risk_classification: Literal[
        "low", "moderate", "high", "critical", "unrated"
    ]

    severity_distribution: dict[str, int]