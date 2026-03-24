"""Base state models for LangGraph state management."""

from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field


# 1. model_config로 상태의 '규칙'을 정의 (RECOMMENDED)
# 외부 시스템(DB, Frontend)과 camelCase로 소통하기 위한 설정
def to_camel(string: str) -> str:
    """Convert snake_case string to camelCase."""
    return "".join(
        word.capitalize() if i != 0 else word
        for i, word in enumerate(string.split("_"))
    )


class BaseStateConfig(BaseModel):
    """Base configuration for state models with camelCase alias support."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,  # Ensure serialization uses camelCase aliases
    )


# ErrorCodeType이 외부에서 Literal type을 주입 받기를 원함.
ErrorCodeType = TypeVar("ErrorCodeType")


class ErrorState(BaseModel, Generic[ErrorCodeType]):
    """State model for handling errors with code and message."""

    error_code: ErrorCodeType = Field(description="The code of the error.", default="")  # type: ignore[assignment]
    error_message: str = Field(description="The message of the error.", default="")


class BaseState(ErrorState[str]):
    """Base state model with error handling and retry count."""

    retry_count: int = Field(
        description="The number of times the parsing node has been retried.", default=0
    )
