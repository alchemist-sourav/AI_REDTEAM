
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TargetCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    provider: str = Field(min_length=2, max_length=50)
    model_id: str = Field(min_length=2, max_length=150)
    description: str | None = None


class TargetResponse(BaseModel):
    id: int
    name: str
    provider: str
    model_id: str
    description: str | None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
