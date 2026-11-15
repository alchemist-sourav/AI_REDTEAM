
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict, field_validator


ExecutionStatus = Literal["success", "failed"]


class ExecutionRequest(BaseModel):
    target_id: int = Field(gt=0)

    test_case_ids: list[int] = Field(
        min_length=1,
        max_length=20,
    )

    @field_validator("test_case_ids")
    @classmethod
    def validate_unique_test_cases(cls, values):
        if len(values) != len(set(values)):
            raise ValueError("Duplicate test-case IDs are not allowed.")
        return values


class ExecutionResultResponse(BaseModel):
    id: int
    batch_id: str
    target_id: int
    test_case_id: int
    status: ExecutionStatus
    model_response: str | None
    prompt_tokens: int | None
    completion_tokens: int | None
    total_tokens: int | None
    error_message: str | None
    executed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExecutionBatchResponse(BaseModel):
    batch_id: str
    target_id: int
    provider: str
    model: str
    total_test_cases: int
    successful: int
    failed: int
    results: list[ExecutionResultResponse]
