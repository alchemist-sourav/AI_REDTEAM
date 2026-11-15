
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from groq import APIConnectionError, APIStatusError, RateLimitError

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.target import Target
from app.schemas.llm import LLMTestRequest, LLMTestResponse
from app.services.groq_service import GroqService


router = APIRouter(
    prefix="/llm",
    tags=["LLM Testing"],
)


# Admin and Analyst: Test LLM inference
@router.post(
    "/test",
    response_model=LLMTestResponse,
    dependencies=[Depends(require_roles("admin", "analyst"))],
)
async def test_llm(
    request: LLMTestRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Target).where(Target.id == request.target_id)
    )

    target = result.scalar_one_or_none()

    if target is None:
        raise HTTPException(
            status_code=404,
            detail="Target not found.",
        )

    if not target.is_active:
        raise HTTPException(
            status_code=400,
            detail="This target is inactive.",
        )

    if target.provider.lower() != "groq":
        raise HTTPException(
            status_code=400,
            detail="This provider is not supported yet.",
        )

    service = GroqService()

    try:
        result = await service.generate(
            model=target.model_id,
            prompt=request.prompt,
        )

    except RuntimeError:
        raise HTTPException(
            status_code=503,
            detail="Groq API is not configured.",
        )

    except RateLimitError:
        raise HTTPException(
            status_code=429,
            detail="Groq rate limit exceeded.",
        )

    except (APIConnectionError, APIStatusError):
        raise HTTPException(
            status_code=502,
            detail="Groq provider request failed.",
        )

    return LLMTestResponse(
        target_id=target.id,
        provider=target.provider,
        model=target.model_id,
        response=result["response"],
        usage=result["usage"],
    )
