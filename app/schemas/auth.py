
from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(
        min_length=12,
        max_length=128,
    )

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Password cannot be empty or whitespace-only")
        return value

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserManagementCreate(UserCreate):
    role: str = Field(default="viewer", pattern="^(admin|analyst|viewer)$")


class UserRoleUpdate(BaseModel):
    role: str = Field(pattern="^(admin|analyst|viewer)$")


class UserStatusUpdate(BaseModel):
    is_active: bool
