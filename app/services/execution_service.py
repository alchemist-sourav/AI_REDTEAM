
from uuid import uuid4

from groq import (
    APIConnectionError,
    APIStatusError,
    RateLimitError,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.execution import ExecutionResult
from app.models.target import Target
from app.models.attack_test_case import AttackTestCase
from app.services.groq_service import GroqService


class ExecutionService:

    def __init__(self):
        self.groq_service = GroqService()

    async def execute_batch(
        self,
        db: AsyncSession,
        target: Target,
        test_cases: list[AttackTestCase],
        created_by_user_id: int,
    ) -> dict:

        batch_id = str(uuid4())
        results = []

        for test_case in test_cases:
            try:
                response = await self.groq_service.generate(
                    model=target.model_id,
                    prompt=test_case.prompt,
                )

                usage = response["usage"]

                execution = ExecutionResult(
                    batch_id=batch_id,
                    target_id=target.id,
                    test_case_id=test_case.id,
                    created_by_user_id=created_by_user_id,
                    status="success",
                    model_response=response["response"],
                    prompt_tokens=usage["prompt_tokens"],
                    completion_tokens=usage["completion_tokens"],
                    total_tokens=usage["total_tokens"],
                )

            except RuntimeError:
                execution = self._failed_result(
                    batch_id,
                    target,
                    test_case,
                    created_by_user_id,
                    "Groq API is not configured.",
                )

            except RateLimitError:
                execution = self._failed_result(
                    batch_id,
                    target,
                    test_case,
                    created_by_user_id,
                    "Groq rate limit exceeded.",
                )

            except APIConnectionError:
                execution = self._failed_result(
                    batch_id,
                    target,
                    test_case,
                    created_by_user_id,
                    "Could not connect to the Groq provider.",
                )

            except APIStatusError:
                execution = self._failed_result(
                    batch_id,
                    target,
                    test_case,
                    created_by_user_id,
                    "Groq provider returned an error.",
                )

            db.add(execution)
            results.append(execution)

        await db.commit()

        for execution in results:
            await db.refresh(execution)

        successful = sum(
            result.status == "success" for result in results
        )

        return {
            "batch_id": batch_id,
            "target_id": target.id,
            "provider": target.provider,
            "model": target.model_id,
            "total_test_cases": len(results),
            "successful": successful,
            "failed": len(results) - successful,
            "results": results,
        }

    @staticmethod
    def _failed_result(
        batch_id: str,
        target: Target,
        test_case: AttackTestCase,
        created_by_user_id: int,
        message: str,
    ) -> ExecutionResult:

        return ExecutionResult(
            batch_id=batch_id,
            target_id=target.id,
            test_case_id=test_case.id,
            created_by_user_id=created_by_user_id,
            status="failed",
            error_message=message,
        )
