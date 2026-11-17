from typing import Literal

from pydantic import BaseModel, ConfigDict


RiskLevel = Literal[
    "low",
    "medium",
    "high",
    "critical",
]


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

    model_config = ConfigDict(from_attributes=True)