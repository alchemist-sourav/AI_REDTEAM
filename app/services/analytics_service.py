
from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.target import Target
from app.models.attack_test_case import AttackTestCase
from app.models.execution import ExecutionResult
from app.models.evaluation import Evaluation

from app.schemas.analytics import (
    AnalyticsOverview,
    CategoryBreakdown,
    TargetPerformance,
    RiskTrendPoint,
    AnalyticsDashboardResponse,
)


class AnalyticsService:

    async def generate_dashboard(
        self,
        db: AsyncSession,
    ) -> AnalyticsDashboardResponse:

        # 1. Retrieve existing database records
        target_result = await db.execute(select(Target))
        targets = target_result.scalars().all()

        test_case_result = await db.execute(select(AttackTestCase))
        test_cases = test_case_result.scalars().all()

        execution_result = await db.execute(
            select(ExecutionResult).order_by(
                ExecutionResult.executed_at.asc()
            )
        )
        executions = execution_result.scalars().all()

        evaluation_result = await db.execute(select(Evaluation))
        evaluations = evaluation_result.scalars().all()

        # 2. Create lookup dictionaries
        test_cases_by_id = {
            test_case.id: test_case
            for test_case in test_cases
        }

        targets_by_id = {
            target.id: target
            for target in targets
        }

        evaluations_by_execution = {
            evaluation.execution_result_id: evaluation
            for evaluation in evaluations
        }

        # 3. Calculate overview statistics
        total_executions = len(executions)
        total_evaluations = len(evaluations)

        passed = sum(
            1 for evaluation in evaluations
            if evaluation.verdict == "pass"
        )

        failed = sum(
            1 for evaluation in evaluations
            if evaluation.verdict == "fail"
        )

        inconclusive = sum(
            1 for evaluation in evaluations
            if evaluation.verdict == "inconclusive"
        )

        conclusive = passed + failed

        evaluation_coverage = (
            round(total_evaluations / total_executions * 100, 2)
            if total_executions else 0.0
        )

        conclusive_coverage = (
            round(conclusive / total_executions * 100, 2)
            if total_executions else 0.0
        )

        overview = AnalyticsOverview(
            total_targets=len(targets),
            total_test_cases=len(test_cases),
            total_executions=total_executions,
            total_evaluations=total_evaluations,
            unevaluated=max(0, total_executions - total_evaluations),
            passed=passed,
            failed=failed,
            inconclusive=inconclusive,
            evaluation_coverage=evaluation_coverage,
            conclusive_coverage=conclusive_coverage,
        )

        # 4. Group execution results by attack category
        category_stats = defaultdict(
            lambda: {
                "total_tests": 0,
                "evaluated": 0,
                "passed": 0,
                "failed": 0,
                "inconclusive": 0,
            }
        )

        for execution in executions:
            test_case = test_cases_by_id.get(execution.test_case_id)

            category = (
                test_case.category
                if test_case
                else "unknown"
            )

            stats = category_stats[category]
            stats["total_tests"] += 1

            evaluation = evaluations_by_execution.get(execution.id)

            if evaluation:
                stats["evaluated"] += 1

                if evaluation.verdict == "pass":
                    stats["passed"] += 1
                elif evaluation.verdict == "fail":
                    stats["failed"] += 1
                elif evaluation.verdict == "inconclusive":
                    stats["inconclusive"] += 1

        category_breakdown = [
            CategoryBreakdown(
                category=category,
                **stats,
            )
            for category, stats in sorted(category_stats.items())
        ]

        # 5. Calculate performance per target
        target_stats = defaultdict(
            lambda: {
                "total_executions": 0,
                "evaluated": 0,
                "passed": 0,
                "failed": 0,
                "inconclusive": 0,
            }
        )

        for execution in executions:
            stats = target_stats[execution.target_id]
            stats["total_executions"] += 1

            evaluation = evaluations_by_execution.get(execution.id)

            if evaluation:
                stats["evaluated"] += 1

                if evaluation.verdict == "pass":
                    stats["passed"] += 1
                elif evaluation.verdict == "fail":
                    stats["failed"] += 1
                elif evaluation.verdict == "inconclusive":
                    stats["inconclusive"] += 1

        target_performance = []

        for target_id, stats in sorted(target_stats.items()):
            target = targets_by_id.get(target_id)

            if target is None:
                continue

            evaluated = stats["evaluated"]
            total = stats["total_executions"]

            target_performance.append(
                TargetPerformance(
                    target_id=target.id,
                    target_name=target.name,
                    provider=target.provider,
                    model_id=target.model_id,
                    **stats,
                    evaluation_coverage=(
                        round(evaluated / total * 100, 2)
                        if total else 0.0
                    ),
                    failure_rate=(
                        round(stats["failed"] / evaluated * 100, 2)
                        if evaluated else 0.0
                    ),
                )
            )

        # 6. Calculate daily execution trends
        daily_stats = defaultdict(
            lambda: {
                "total_executions": 0,
                "evaluated": 0,
                "passed": 0,
                "failed": 0,
                "inconclusive": 0,
            }
        )

        for execution in executions:
            date_key = execution.executed_at.date().isoformat()
            stats = daily_stats[date_key]

            stats["total_executions"] += 1

            evaluation = evaluations_by_execution.get(execution.id)

            if evaluation:
                stats["evaluated"] += 1

                if evaluation.verdict == "pass":
                    stats["passed"] += 1
                elif evaluation.verdict == "fail":
                    stats["failed"] += 1
                elif evaluation.verdict == "inconclusive":
                    stats["inconclusive"] += 1

        risk_trends = [
            RiskTrendPoint(
                date=date,
                **stats,
            )
            for date, stats in sorted(daily_stats.items())
        ]

        # 7. Return the complete dashboard response
        return AnalyticsDashboardResponse(
            overview=overview,
            category_breakdown=category_breakdown,
            target_performance=target_performance,
            risk_trends=risk_trends,
        )
