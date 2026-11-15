
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.target import Target
from app.schemas.target import TargetCreate, TargetResponse

router = APIRouter(prefix="/targets", tags=["Targets"])


# Admin and Analyst: Create targets
@router.post(
    "/",
    response_model=TargetResponse,
    status_code=201,
    dependencies=[Depends(require_roles("admin", "analyst"))],
)
async def create_target(
    target_data: TargetCreate,
    db: AsyncSession = Depends(get_db),
):
    target = Target(**target_data.model_dump())

    db.add(target)

    try:
        await db.commit()
        await db.refresh(target)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This provider and model combination already exists.",
        )

    return target


# All authenticated roles: View targets
@router.get(
    "/",
    response_model=list[TargetResponse],
    dependencies=[Depends(get_current_user)],
)
async def get_targets(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Target).order_by(Target.created_at.desc())
    )

    return result.scalars().all()


# All authenticated roles: View individual target
@router.get(
    "/{target_id}",
    response_model=TargetResponse,
    dependencies=[Depends(get_current_user)],
)
async def get_target(
    target_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Target).where(Target.id == target_id)
    )

    target = result.scalar_one_or_none()

    if target is None:
        raise HTTPException(
            status_code=404,
            detail="Target not found",
        )

    return target
