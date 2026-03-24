"""State models for resume parsing workflow.

This module defines the state management classes used in the resume parsing
graph. It includes input state for initial parameters and
graph state for tracking processing status.
"""

from pydantic import Field

from common.state_model import BaseState, BaseStateConfig
from resume_parser.schema import ResumeParseResult


class InputState(BaseStateConfig):
    """Input state for resume parsing workflow.

    This class defines the initial input parameters required for processing
    a resume file, including the file path or URL to the resume document.
    """

    resume_file_path: str = Field(
        description="The path to the resume file.",
        # 토스 이력서
        # default="https://iapopjvufcxutgpztxng.supabase.co/storage/v1/object/public/resumes/1764323968873_____.pdf",
        # 산이 이력서. 링크 확인용
        default="https://iapopjvufcxutgpztxng.supabase.co/storage/v1/object/public/resumes/1764324884785_______________________________.pdf",
    )

    applied_position: str = Field(
        description="The position the candidate is applying for.",
        default="백엔드 개발자",
    )

    experience_names_to_analyze: list[str] = Field(
        description="List of experience names to analyze from the resume. LLM should analyze experience in this list.",
        default_factory=list,
    )


class GraphState(InputState, BaseState):
    """Graph state for resume parsing workflow.

    This class extends InputState with additional fields needed during
    the processing workflow, including the parsed resume data and
    error handling information.
    """

    resume_parse_result: ResumeParseResult | None = Field(
        None, description="The parsed resume."
    )
