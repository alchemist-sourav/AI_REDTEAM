
from pydantic import BaseModel, Field


class LLMTestRequest(BaseModel):
    target_id: int = Field(gt=0)
    prompt: str = Field(min_length=1, max_length=10000)


class TokenUsage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class LLMTestResponse(BaseModel):
    target_id: int
    provider: str
    model: str
    response: str
    usage: TokenUsage

