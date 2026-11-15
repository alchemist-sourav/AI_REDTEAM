
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.execution import ExecutionResult
from app.models.attack_test_case import AttackTestCase
from app.models.evaluation import Evaluation

from app.schemas.evaluation import (
    EvaluationResponse,
    EvaluationBatchResponse,
    RiskScoreResponse,
)

from app.services.evaluation_service import EvaluationService
from app.services.risk_scoring import RiskScoringService


router = APIRouter(
    prefix="/evaluations",
    tags=["Safety Evaluations"],
)


# Admin and Analyst: Evaluate an individual execution
@router.post(
    "/{execution_result_id}",
    response_model=EvaluationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def evaluate_execution(
    execution_result_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "analyst")),
):
    # 1. Retrieve execution result
    query = select(ExecutionResult).where(
        ExecutionResult.id == execution_result_id
    )

    if current_user.role != "admin":
        query = query.where(
            ExecutionResult.created_by_user_id == current_user.id
        )

    result = await db.execute(query)

    execution = result.scalar_one_or_none()

    if execution is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution result not found.",
        )

    # 2. Check whether it has already been evaluated
    existing_result = await db.execute(
        select(Evaluation).where(
            Evaluation.execution_result_id == execution_result_id
        )
    )

    existing_evaluation = existing_result.scalar_one_or_none()

    if existing_evaluation is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This execution result has already been evaluated.",
        )

    # 3. Retrieve the associated attack test case
    case_result = await db.execute(
        select(AttackTestCase).where(
            AttackTestCase.id == execution.test_case_id
        )
    )

    test_case = case_result.scalar_one_or_none()

    if test_case is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated attack test case not found.",
        )

    # 4. Evaluate the response
    service = EvaluationService()

    evaluation_data = await service.evaluate(
        execution=execution,
        test_case=test_case,
    )

    # 5. Save evaluation
    evaluation = Evaluation(
        execution_result_id=execution.id,
        **evaluation_data,
    )

    db.add(evaluation)
    await db.commit()
    await db.refresh(evaluation)

    return evaluation


# All authenticated users: View an evaluation
# Admin sees all evaluations; Analyst and Viewer see only their own.
@router.get(
    "/{execution_result_id}",
    response_model=EvaluationResponse,
)
async def get_evaluation(
    execution_result_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(Evaluation)
        .join(
            ExecutionResult,
            Evaluation.execution_result_id == ExecutionResult.id,
        )
        .where(
            Evaluation.execution_result_id == execution_result_id
        )
    )

    if current_user.role != "admin":
        query = query.where(
            ExecutionResult.created_by_user_id == current_user.id
        )

    result = await db.execute(query)

    evaluation = result.scalar_one_or_none()

    if evaluation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation not found.",
        )

    return evaluation


# Admin and Analyst: Evaluate an entire batch
@router.post(
    "/batch/{batch_id}",
    response_model=EvaluationBatchResponse,
    status_code=status.HTTP_201_CREATED,
)
async def evaluate_batch(
    batch_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "analyst")),
):
    # 1. Retrieve all execution results in this batch
    query = select(ExecutionResult).where(
        ExecutionResult.batch_id == batch_id
    )

    if current_user.role != "admin":
        query = query.where(
            ExecutionResult.created_by_user_id == current_user.id
        )

    execution_result = await db.execute(
        query.order_by(ExecutionResult.id.asc())
    )

    executions = execution_result.scalars().all()

    if not executions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution batch not found.",
        )

    # 2. Find evaluations that already exist
    execution_ids = [execution.id for execution in executions]

    existing_result = await db.execute(
        select(Evaluation).where(
            Evaluation.execution_result_id.in_(execution_ids)
        )
    )

    existing_evaluations = existing_result.scalars().all()

    evaluation_map = {
        evaluation.execution_result_id: evaluation
        for evaluation in existing_evaluations
    }

    # 3. Retrieve associated attack test cases
    test_case_ids = {
        execution.test_case_id
        for execution in executions
    }

    case_result = await db.execute(
        select(AttackTestCase).where(
            AttackTestCase.id.in_(test_case_ids)
        )
    )

    test_cases = {
        case.id: case
        for case in case_result.scalars().all()
    }

    # 4. Evaluate results that have not been evaluated yet
    service = EvaluationService()

    evaluated_count = 0
    already_evaluated_count = 0
    response_results = []

    try:
        for execution in executions:

            # Reuse an existing evaluation
            if execution.id in evaluation_map:
                already_evaluated_count += 1
                response_results.append(
                    evaluation_map[execution.id]
                )
                continue

            test_case = test_cases.get(execution.test_case_id)

            if test_case is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=(
                        f"Attack test case {execution.test_case_id} "
                        "not found."
                    ),
                )

            evaluation_data = await service.evaluate(
                execution=execution,
                test_case=test_case,
            )

            evaluation = Evaluation(
                execution_result_id=execution.id,
                **evaluation_data,
            )

            db.add(evaluation)
            response_results.append(evaluation)
            evaluated_count += 1

        # 5. Save all new evaluations together
        await db.commit()

        # Refresh newly created records
        for evaluation in response_results:
            if evaluation.id is None:
                await db.refresh(evaluation)

        return EvaluationBatchResponse(
            batch_id=batch_id,
            total_execution_results=len(executions),
            evaluated=evaluated_count,
            already_evaluated=already_evaluated_count,
            results=response_results,
        )

    except HTTPException:
        await db.rollback()
        raise

    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Batch evaluation failed.",
        )


# All authenticated users: View batch risk score
# Admin sees all batches; Analyst and Viewer see only their own.
@router.get(
    "/batch/{batch_id}/risk",
    response_model=RiskScoreResponse,
)
async def get_batch_risk_score(
    batch_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Retrieve execution results for this batch
    query = select(ExecutionResult).where(
        ExecutionResult.batch_id == batch_id
    )

    if current_user.role != "admin":
        query = query.where(
            ExecutionResult.created_by_user_id == current_user.id
        )

    execution_result = await db.execute(query)

    executions = execution_result.scalars().all()

    if not executions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution batch not found.",
        )

    # 2. Collect execution IDs
    execution_ids = [execution.id for execution in executions]

    # 3. Retrieve evaluations associated with these executions
    evaluation_result = await db.execute(
        select(Evaluation).where(
            Evaluation.execution_result_id.in_(execution_ids)
        )
    )

    evaluations = evaluation_result.scalars().all()

    # 4. Calculate risk score
    service = RiskScoringService()
    risk_data = service.calculate(evaluations)

    total_executions = len(executions)
    total_evaluations = len(evaluations)
    scored = risk_data["scored_evaluations"]

    # 5. Calculate coverage
    evaluation_coverage = round(
        (total_evaluations / total_executions) * 100, 2
    )

    conclusive_coverage = round(
        (scored / total_executions) * 100, 2
    )

    # 6. Return complete risk report
    return RiskScoreResponse(
        batch_id=batch_id,
        total_execution_results=total_executions,
        total_evaluations=total_evaluations,
        unevaluated=total_executions - total_evaluations,
        passed=risk_data["passed"],
        failed=risk_data["failed"],
        inconclusive=risk_data["inconclusive"],
        scored_evaluations=scored,
        evaluation_coverage=evaluation_coverage,
        conclusive_coverage=conclusive_coverage,
        overall_score=risk_data["overall_score"],
        risk_classification=risk_data["risk_classification"],
        severity_distribution=risk_data["severity_distribution"],
    )
