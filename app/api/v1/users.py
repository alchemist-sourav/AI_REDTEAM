
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_roles, get_current_user
from app.core.security import hash_password
from app.models.user import User
from app.schemas.auth import (
    UserManagementCreate,
    UserResponse,
    UserRoleUpdate,
    UserStatusUpdate,
)

router = APIRouter(
    prefix="/users",
    tags=["User Management"],
    dependencies=[Depends(require_roles("admin"))],
)


async def count_active_admins(db: AsyncSession) -> int:
    result = await db.execute(
        select(func.count())
        .select_from(User)
        .where(
            User.role == "admin",
            User.is_active.is_(True),
        )
    )
    return result.scalar_one()


@router.post("/", response_model=UserResponse, status_code=201)
async def create_user(
    user_data: UserManagementCreate,
    db: AsyncSession = Depends(get_db),
):
    email = user_data.email.strip().lower()

    result = await db.execute(
        select(User).where(User.email == email)
    )

    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="A user with this email already exists",
        )

    user = User(
        email=email,
        password_hash=hash_password(user_data.password),
        role=user_data.role,
        is_active=True,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


@router.get("/", response_model=list[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).order_by(User.id)
    )

    return result.scalars().all()


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.id == user_id)
    )

    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.patch("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: int,
    data: UserRoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )
    # Prevent an administrator from demoting themselves.
    if user.id == current_user.id and data.role != "admin":
        raise HTTPException(
            status_code=400,
            detail="You cannot demote your own administrator account",
        )
    # Prevent demotion of the last active administrator.
    if (
        user.role == "admin"
        and user.is_active
        and data.role != "admin"
        and await count_active_admins(db) <= 1
    ):
        raise HTTPException(
            status_code=400,
            detail="Cannot demote the last active administrator",
        )
    user.role = data.role
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    user_id: int,
    data: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(User).where(User.id == user_id)
    )

    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # Prevent an administrator from deactivating themselves.
    if user.id == current_user.id and not data.is_active:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account",
        )

    # Prevent deactivation of the last active administrator.
    if (
        user.is_active
        and not data.is_active
        and user.role == "admin"
        and await count_active_admins(db) <= 1
    ):
        raise HTTPException(
            status_code=400,
            detail="Cannot deactivate the last active administrator",
        )

    user.is_active = data.is_active

    await db.commit()
    await db.refresh(user)

    return user

