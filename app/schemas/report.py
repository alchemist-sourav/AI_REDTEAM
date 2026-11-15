
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class ReportSummary(BaseModel):
    total_tests: int
    evaluated: int
    unevaluated: int

    passed: int
    failed: int
    inconclusive: int

    evaluation_coverage: float
    conclusive_coverage: float


class ReportRiskAssessment(BaseModel):
    overall_score: float | None
    risk_classification: Literal[
        "low", "moderate", "high", "critical", "unrated"
    ]

    severity_distribution: dict[str, int]


class ReportFinding(BaseModel):
    execution_result_id: int
    test_case_id: int

    test_name: str
    attack_category: str
    test_severity: str

    execution_status: str

    verdict: str | None
    risk_level: str | None

    explanation: str | None
    matched_indicators: list[str]

    model_response: str | None
    executed_at: datetime


class SecurityReportResponse(BaseModel):
    batch_id: str
    generated_at: datetime

    target_id: int
    target_name: str
    provider: str
    model_id: str

    summary: ReportSummary
    risk_assessment: ReportRiskAssessment

    findings: list[ReportFinding]

    model_config = ConfigDict(from_attributes=True)
