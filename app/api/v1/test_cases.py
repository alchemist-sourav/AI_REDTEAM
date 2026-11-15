
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.attack_test_case import AttackTestCase
from app.schemas.attack_test_case import (
    AttackTestCaseCreate,
    AttackTestCaseUpdate,
    AttackTestCaseResponse,
)

router = APIRouter(
    prefix="/test-cases",
    tags=["Attack Test Cases"],
)


# Admin and Analyst: Create test cases
@router.post(
    "/",
    response_model=AttackTestCaseResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("admin", "analyst"))],
)
async def create_test_case(
    data: AttackTestCaseCreate,
    db: AsyncSession = Depends(get_db),
):
    test_case = AttackTestCase(**data.model_dump())

    db.add(test_case)
    await db.commit()
    await db.refresh(test_case)

    return test_case


# All authenticated users: List test cases
@router.get(
    "/",
    response_model=list[AttackTestCaseResponse],
    dependencies=[Depends(get_current_user)],
)
async def get_test_cases(
    category: str | None = Query(default=None),
    severity: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    query = select(AttackTestCase)

    if category:
        query = query.where(
            AttackTestCase.category.ilike(category)
        )

    if severity:
        query = query.where(
            AttackTestCase.severity == severity.lower()
        )

    query = query.order_by(AttackTestCase.created_at.desc())

    result = await db.execute(query)

    return result.scalars().all()


# All authenticated users: View individual test cases
@router.get(
    "/{test_case_id}",
    response_model=AttackTestCaseResponse,
    dependencies=[Depends(get_current_user)],
)
async def get_test_case(
    test_case_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AttackTestCase).where(
            AttackTestCase.id == test_case_id
        )
    )

    test_case = result.scalar_one_or_none()

    if test_case is None:
        raise HTTPException(
            status_code=404,
            detail="Attack test case not found.",
        )

    return test_case


# Admin and Analyst: Update test cases
@router.patch(
    "/{test_case_id}",
    response_model=AttackTestCaseResponse,
    dependencies=[Depends(require_roles("admin", "analyst"))],
)
async def update_test_case(
    test_case_id: int,
    data: AttackTestCaseUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AttackTestCase).where(
            AttackTestCase.id == test_case_id
        )
    )

    test_case = result.scalar_one_or_none()

    if test_case is None:
        raise HTTPException(
            status_code=404,
            detail="Attack test case not found.",
        )

    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(test_case, field, value)

    await db.commit()
    await db.refresh(test_case)

    return test_case


# Admin and Analyst: Delete test cases
@router.delete(
    "/{test_case_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles("admin", "analyst"))],
)
async def delete_test_case(
    test_case_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AttackTestCase).where(
            AttackTestCase.id == test_case_id
        )
    )

    test_case = result.scalar_one_or_none()

    if test_case is None:
        raise HTTPException(
            status_code=404,
            detail="Attack test case not found.",
        )

    await db.delete(test_case)
    await db.commit()
