
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.analytics import AnalyticsDashboardResponse
from app.services.analytics_service import AnalyticsService


router = APIRouter(
    prefix="/analytics",
    tags=["Dashboard Analytics"],
)


@router.get(
    "/dashboard",
    response_model=AnalyticsDashboardResponse,
    dependencies=[Depends(get_current_user)],
)
async def get_dashboard_analytics(
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService()

    try:
        return await service.generate_dashboard(db)

    except Exception as exc:
        # Log the actual exception in production.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to generate dashboard analytics.",
        ) from exc
