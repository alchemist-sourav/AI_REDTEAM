
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.target import Target
from app.models.attack_test_case import AttackTestCase
from app.models.execution import ExecutionResult
from app.schemas.execution import (
    ExecutionRequest,
    ExecutionBatchResponse,
    ExecutionResultResponse,
)
from app.services.execution_service import ExecutionService


router = APIRouter(
    prefix="/executions",
    tags=["Attack Executions"],
)


# Admin and Analyst: Execute attack batches
@router.post(
    "/",
    response_model=ExecutionBatchResponse,
    status_code=status.HTTP_201_CREATED,
)
async def execute_attacks(
    request: ExecutionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "analyst")),
):
    # 1. Retrieve target
    target_result = await db.execute(
        select(Target).where(Target.id == request.target_id)
    )

    target = target_result.scalar_one_or_none()

    if target is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target not found.",
        )

    if not target.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target is inactive.",
        )

    if target.provider.lower() != "groq":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This provider is not supported yet.",
        )

    # 2. Retrieve requested test cases
    cases_result = await db.execute(
        select(AttackTestCase).where(
            AttackTestCase.id.in_(request.test_case_ids)
        )
    )

    cases = {
        case.id: case
        for case in cases_result.scalars().all()
    }

    # 3. Verify every requested test case exists
    missing_ids = [
        case_id
        for case_id in request.test_case_ids
        if case_id not in cases
    ]

    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "message": "Some attack test cases were not found.",
                "missing_ids": missing_ids,
            },
        )

    # 4. Reject inactive test cases
    inactive_ids = [
        case_id
        for case_id in request.test_case_ids
        if not cases[case_id].is_active
    ]

    if inactive_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Some attack test cases are inactive.",
                "inactive_ids": inactive_ids,
            },
        )

    # Preserve the order supplied by the request
    ordered_cases = [
        cases[case_id]
        for case_id in request.test_case_ids
    ]

    # 5. Execute attack batch with ownership
    service = ExecutionService()

    try:
        result = await service.execute_batch(
            db=db,
            target=target,
            test_cases=ordered_cases,
            created_by_user_id=current_user.id,
        )
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Execution batch could not be saved.",
        )

    return result


# All authenticated users: View execution batches
# Admin sees all batches; Analyst and Viewer see only their own.
@router.get(
    "/{batch_id}",
    response_model=list[ExecutionResultResponse],
)
async def get_execution_batch(
    batch_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(ExecutionResult).where(
        ExecutionResult.batch_id == batch_id
    )

    if current_user.role != "admin":
        query = query.where(
            ExecutionResult.created_by_user_id == current_user.id
        )

    result = await db.execute(
        query.order_by(ExecutionResult.id.asc())
    )

    executions = result.scalars().all()

    if not executions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution batch not found.",
        )

    return executions
