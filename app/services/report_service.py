
from datetime import datetime, timezone

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.execution import ExecutionResult
from app.models.evaluation import Evaluation
from app.models.attack_test_case import AttackTestCase
from app.models.user import User
from app.models.target import Target

from app.schemas.report import (
    SecurityReportResponse,
    ReportSummary,
    ReportRiskAssessment,
    ReportFinding,
)

from app.services.risk_scoring import RiskScoringService


class ReportService:

    async def generate_report(
        self,
        batch_id: str,
        db: AsyncSession,
        current_user: User | None = None,
    ) -> SecurityReportResponse:

        # 1. Retrieve executions for the batch
        # Apply ownership filter for non-admin users
        filters = [ExecutionResult.batch_id == batch_id]
        if current_user is not None and current_user.role != "admin":
            filters.append(ExecutionResult.created_by_user_id == current_user.id)

        execution_result = await db.execute(
            select(ExecutionResult).where(
                and_(*filters)
            )
        )

        executions = execution_result.scalars().all()

        if not executions:
            raise LookupError("Execution batch not found.")

        # 2. Retrieve target information
        target_ids = {execution.target_id for execution in executions}

        if len(target_ids) != 1:
            raise ValueError(
                "A report batch must belong to exactly one target."
            )

        target_result = await db.execute(
            select(Target).where(
                Target.id == next(iter(target_ids))
            )
        )

        target = target_result.scalar_one_or_none()

        if target is None:
            raise LookupError("Target not found.")

        # 3. Retrieve attack test cases
        test_case_ids = {
            execution.test_case_id for execution in executions
        }

        test_case_result = await db.execute(
            select(AttackTestCase).where(
                AttackTestCase.id.in_(test_case_ids)
            )
        )

        test_cases = {
            test_case.id: test_case
            for test_case in test_case_result.scalars().all()
        }

        # 4. Retrieve evaluations
        execution_ids = [
            execution.id for execution in executions
        ]

        evaluation_result = await db.execute(
            select(Evaluation).where(
                Evaluation.execution_result_id.in_(execution_ids)
            )
        )

        evaluations = evaluation_result.scalars().all()

        evaluations_by_execution = {
            evaluation.execution_result_id: evaluation
            for evaluation in evaluations
        }

        # 5. Calculate risk statistics
        risk_service = RiskScoringService()
        risk_data = risk_service.calculate(evaluations)

        total_executions = len(executions)
        total_evaluations = len(evaluations)
        scored = risk_data["scored_evaluations"]

        evaluation_coverage = round(
            total_evaluations / total_executions * 100, 2
        )

        conclusive_coverage = round(
            scored / total_executions * 100, 2
        )

        # 6. Build individual findings
        findings = []

        for execution in executions:

            test_case = test_cases.get(execution.test_case_id)
            evaluation = evaluations_by_execution.get(execution.id)

            if test_case is None:
                raise LookupError(
                    f"Test case {execution.test_case_id} not found."
                )

            findings.append(
                ReportFinding(
                    execution_result_id=execution.id,
                    test_case_id=test_case.id,
                    test_name=test_case.name,
                    attack_category=test_case.category,
                    test_severity=test_case.severity,
                    execution_status=execution.status,
                    verdict=(
                        evaluation.verdict if evaluation else None
                    ),
                    risk_level=(
                        evaluation.risk_level if evaluation else None
                    ),
                    explanation=(
                        evaluation.explanation if evaluation else None
                    ),
                    matched_indicators=(
                        evaluation.matched_indicators
                        if evaluation else []
                    ),
                    model_response=execution.model_response,
                    executed_at=execution.executed_at,
                )
            )

        # 7. Construct final security report
        return SecurityReportResponse(
            batch_id=batch_id,
            generated_at=datetime.now(timezone.utc),

            target_id=target.id,
            target_name=target.name,
            provider=target.provider,
            model_id=target.model_id,

            summary=ReportSummary(
                total_tests=total_executions,
                evaluated=total_evaluations,
                unevaluated=total_executions - total_evaluations,
                passed=risk_data["passed"],
                failed=risk_data["failed"],
                inconclusive=risk_data["inconclusive"],
                evaluation_coverage=evaluation_coverage,
                conclusive_coverage=conclusive_coverage,
            ),

            risk_assessment=ReportRiskAssessment(
                overall_score=risk_data["overall_score"],
                risk_classification=risk_data["risk_classification"],
                severity_distribution=risk_data["severity_distribution"],
            ),

            findings=findings,
        )
