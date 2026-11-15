
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, ConfigDict


Severity = Literal["low", "medium", "high", "critical"]


class AttackTestCaseCreate(BaseModel):
    name: str = Field(min_length=3, max_length=150)
    category: str = Field(min_length=2, max_length=50)
    description: str | None = None
    prompt: str = Field(min_length=1)
    severity: Severity = "medium"
    expected_behavior: str = Field(min_length=1)
    is_active: bool = True


class AttackTestCaseUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=150)
    category: str | None = Field(default=None, min_length=2, max_length=50)
    description: str | None = None
    prompt: str | None = Field(default=None, min_length=1)
    severity: Severity | None = None
    expected_behavior: str | None = Field(default=None, min_length=1)
    is_active: bool | None = None


class AttackTestCaseResponse(BaseModel):
    id: int
    name: str
    category: str
    description: str | None
    prompt: str
    severity: str
    expected_behavior: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
