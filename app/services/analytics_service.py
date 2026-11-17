from collections import defaultdict

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.target import Target
from app.models.attack_test_case import AttackTestCase
from app.models.execution import ExecutionResult
from app.models.evaluation import Evaluation
from app.models.user import User

from app.schemas.analytics import (
    AnalyticsOverview,
    CategoryBreakdown,
    TargetPerformance,
    RiskTrendPoint,
    AnalyticsDashboardResponse,
)


def _verdict(evaluation: Evaluation) -> str | None:
    """Return the normalised verdict string, or None."""
    if evaluation.verdict is None:
        return None
    return str(evaluation.verdict).lower()


class AnalyticsService:

    async def generate_dashboard(
        self,
        db: AsyncSession,
        current_user: User | None = None,
    ) -> AnalyticsDashboardResponse:

        # 1. Targets and test cases are always shared resources.
        target_result = await db.execute(select(Target))
        targets = target_result.scalars().all()

        test_case_result = await db.execute(select(AttackTestCase))
        test_cases = test_case_result.scalars().all()

        # 2. Apply ownership filter for non-admin users.
        if current_user is not None and current_user.role != "admin":
            exec_query = select(ExecutionResult).where(
                ExecutionResult.created_by_user_id == current_user.id
            ).order_by(ExecutionResult.executed_at.asc())
        else:
            exec_query = select(ExecutionResult).order_by(
                ExecutionResult.executed_at.asc()
            )

        execution_result = await db.execute(exec_query)
        executions = execution_result.scalars().all()

        # 3. Evaluations filtered by user-owned executions.
        if current_user is not None and current_user.role != "admin":
            eval_result = await db.execute(
                select(Evaluation).where(
                    Evaluation.execution_result_id.in_(
                        select(ExecutionResult.id).where(
                            ExecutionResult.created_by_user_id == current_user.id
                        )
                    )
                )
            )
        else:
            eval_result = await db.execute(select(Evaluation))

        evaluations = eval_result.scalars().all()

        # Build a quick lookup: execution_id -> evaluation
        eval_by_exec: dict[int, Evaluation] = {
            e.execution_result_id: e for e in evaluations
        }

        # 4. Overview statistics.
        # Verdict strings from EvaluationVerdict: "pass", "fail", "inconclusive"
        total_targets = len(targets)
        total_test_cases = len(test_cases)
        total_executions = len(executions)
        total_evaluations = len(evaluations)

        passed = sum(1 for e in evaluations if _verdict(e) == "pass")
        failed = sum(1 for e in evaluations if _verdict(e) == "fail")
        inconclusive = sum(1 for e in evaluations if _verdict(e) == "inconclusive")
        unevaluated = total_executions - total_evaluations

        evaluation_coverage = (
            round(total_evaluations / total_executions * 100, 2)
            if total_executions > 0
            else 0.0
        )
        conclusive_coverage = (
            round((passed + failed) / total_executions * 100, 2)
            if total_executions > 0
            else 0.0
        )

        overview = AnalyticsOverview(
            total_targets=total_targets,
            total_test_cases=total_test_cases,
            total_executions=total_executions,
            total_evaluations=total_evaluations,
            unevaluated=unevaluated,
            passed=passed,
            failed=failed,
            inconclusive=inconclusive,
            evaluation_coverage=evaluation_coverage,
            conclusive_coverage=conclusive_coverage,
        )

        # 5. Category breakdown — based on test cases linked to executions.
        tc_map: dict[int, AttackTestCase] = {tc.id: tc for tc in test_cases}

        category_map: dict[str, CategoryBreakdown] = {}
        for exec_obj in executions:
            tc = tc_map.get(exec_obj.test_case_id)
            cat = tc.category if tc else "unknown"
            if cat not in category_map:
                category_map[cat] = CategoryBreakdown(
                    category=cat,
                    total_tests=0,
                    evaluated=0,
                    passed=0,
                    failed=0,
                    inconclusive=0,
                )
            cd = category_map[cat]
            cd.total_tests += 1
            ev = eval_by_exec.get(exec_obj.id)
            if ev is not None:
                cd.evaluated += 1
                v = _verdict(ev)
                if v == "pass":
                    cd.passed += 1
                elif v == "fail":
                    cd.failed += 1
                elif v == "inconclusive":
                    cd.inconclusive += 1

        category_breakdown = list(category_map.values())

        # 6. Target performance.
        target_map_obj: dict[int, Target] = {t.id: t for t in targets}
        target_perf: dict[int, TargetPerformance] = {}

        for exec_obj in executions:
            tid = exec_obj.target_id
            if tid not in target_perf:
                t = target_map_obj.get(tid)
                target_perf[tid] = TargetPerformance(
                    target_id=tid,
                    target_name=t.name if t else f"target_{tid}",
                    provider=t.provider if t else "",
                    model_id=t.model_id if t else "",
                    total_executions=0,
                    evaluated=0,
                    passed=0,
                    failed=0,
                    inconclusive=0,
                    evaluation_coverage=0.0,
                    failure_rate=0.0,
                )
            tp = target_perf[tid]
            tp.total_executions += 1
            ev = eval_by_exec.get(exec_obj.id)
            if ev is not None:
                tp.evaluated += 1
                v = _verdict(ev)
                if v == "pass":
                    tp.passed += 1
                elif v == "fail":
                    tp.failed += 1
                elif v == "inconclusive":
                    tp.inconclusive += 1

        target_performance = list(target_perf.values())
        for tp in target_performance:
            if tp.total_executions > 0:
                tp.evaluation_coverage = round(
                    tp.evaluated / tp.total_executions * 100, 2
                )
                tp.failure_rate = round(
                    tp.failed / tp.total_executions * 100, 2
                )

        # 7. Risk trends by month.
        month_map: dict[str, RiskTrendPoint] = {}
        for exec_obj in executions:
            if exec_obj.executed_at is None:
                continue
            key = exec_obj.executed_at.strftime("%Y-%m")
            if key not in month_map:
                month_map[key] = RiskTrendPoint(
                    date=key,
                    total_executions=0,
                    evaluated=0,
                    passed=0,
                    failed=0,
                    inconclusive=0,
                )
            mp = month_map[key]
            mp.total_executions += 1
            ev = eval_by_exec.get(exec_obj.id)
            if ev is not None:
                mp.evaluated += 1
                v = _verdict(ev)
                if v == "pass":
                    mp.passed += 1
                elif v == "fail":
                    mp.failed += 1
                elif v == "inconclusive":
                    mp.inconclusive += 1

        risk_trends = list(month_map.values())

        return AnalyticsDashboardResponse(
            overview=overview,
            category_breakdown=category_breakdown,
            target_performance=target_performance,
            risk_trends=risk_trends,
        )
