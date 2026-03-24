"""State definition for the job description parsing graph."""

from typing import Union
from urllib.parse import urlparse

from pydantic import Field, HttpUrl, field_validator

from common.state_model import BaseState, BaseStateConfig


class InputState(BaseStateConfig):
    """Schema for incoming JSON requests."""

    url: Union[HttpUrl, str] = Field(
        description="The URL of the job description to parse.",
        default="https://toss.im/career/job-detail?job_id=4071103003",
    )
    company_name: str = Field(description="The name of the company.", default="토스")
    job_title: str = Field(description="The role of the job.", default="Data engineer")

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: Union[HttpUrl, str]) -> str:
        """Validate URL format and convert HttpUrl to string."""
        if isinstance(v, HttpUrl):
            return str(v)

        # Manual validation for string URLs
        if not v or not v.strip():
            raise ValueError("URL cannot be empty")

        try:
            parsed = urlparse(str(v).strip())
            if not all([parsed.scheme, parsed.netloc]):
                raise ValueError("Invalid URL format: missing scheme or netloc")

            if parsed.scheme not in ["http", "https"]:
                raise ValueError(
                    f"Invalid URL scheme: {parsed.scheme}. Only http and https are allowed"
                )

            return str(v).strip()
        except Exception as e:
            raise ValueError(f"Invalid URL format: {str(e)}")


class GraphState(InputState, BaseState):
    """Represents the state of the graph.

    Note: URL validation is handled by InputSchema.model_validate() before GraphState creation.
    """

    # Fields populated by the validation node
    is_accessible: bool = Field(
        description="Whether the URL is accessible.",
        default=True,  # TODO: url_validation 적용 시 False로 roll back
    )
    is_developer_job: bool = Field(
        description="Whether the URL is a developer job posting.",
        default=True,  # TODO: url_validation 적용 시 False로 roll back
    )

    # Fields populated by the parsing node
    job_description: str = Field(
        description="The description of the job.",
        default="The company name and job title don't seem to be related to the job posting information you entered. Please check again.",
    )

    # Error fields
    error_code: str = Field(description="The code of the error.", default="")
    error_message: str = Field(description="The message of the error.", default="")

    # Retry counter for the parsing node
    parse_retry_count: int = Field(
        description="The number of times the parsing node has been retried.", default=0
    )
