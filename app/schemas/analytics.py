
from pydantic import BaseModel


class AnalyticsOverview(BaseModel):
    total_targets: int
    total_test_cases: int
    total_executions: int
    total_evaluations: int
    unevaluated: int

    passed: int
    failed: int
    inconclusive: int

    evaluation_coverage: float
    conclusive_coverage: float


class CategoryBreakdown(BaseModel):
    category: str
    total_tests: int
    evaluated: int
    passed: int
    failed: int
    inconclusive: int


class TargetPerformance(BaseModel):
    target_id: int
    target_name: str
    provider: str
    model_id: str

    total_executions: int
    evaluated: int
    passed: int
    failed: int
    inconclusive: int

    evaluation_coverage: float
    failure_rate: float


class RiskTrendPoint(BaseModel):
    date: str
    total_executions: int
    evaluated: int
    passed: int
    failed: int
    inconclusive: int


class AnalyticsDashboardResponse(BaseModel):
    overview: AnalyticsOverview
    category_breakdown: list[CategoryBreakdown]
    target_performance: list[TargetPerformance]
    risk_trends: list[RiskTrendPoint]
