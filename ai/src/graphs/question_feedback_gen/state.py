from typing import List

from pydantic import Field

from common.schemas.project import (
    Architecture,
    ExperienceType,
    KeyAchievement,
    ProjectType,
)
from common.schemas.question import Question
from common.state_model import BaseState, BaseStateConfig
from question_feedback_gen.schema import Feedback, StructuredGuideAnswer


class BaseExperience(BaseStateConfig):
    position: List[str] = Field(
        default=[],
        description="List of roles performed (e.g., 'Backend Engineer', 'Tech Lead'). Focus on functional roles.",
    )
    tech_stack: List[str] = Field(
        default=[],
        description="List of specific technologies used in this experience. Include versions if mentioned (e.g., 'Java 17', 'Spring Boot 3').",
    )
    architecture: Architecture | None = Field(
        default=None,
        description="Details about the system architecture designed or managed during this experience.",
    )
    key_achievement: KeyAchievement = Field(
        description="The key achievement of the experience.",
    )


class CareerExperienceBase(BaseExperience):
    company: str = Field(description="The company name.")
    company_description: str | None = Field(
        default=None, description="The company description."
    )
    job_level: str | None = Field(default=None, description="The job level.")


class ProjectExperienceBase(BaseExperience):
    project_name: str = Field(description="The project name.")
    project_description: str | None = Field(
        default=None, description="The project description."
    )
    project_type: ProjectType = Field(description="The project type.")
    team_composition: str | None = Field(
        default=None, description="The team composition."
    )


class InputState(BaseStateConfig):
    experience_type: ExperienceType = Field(
        description="The type of experience. 'CAREER' or 'PROJECT'",
    )

    career_experience: CareerExperienceBase | None = Field(
        default=None, description="The career experience."
    )

    project_experience: ProjectExperienceBase | None = Field(
        default=None, description="The project experience."
    )

    question: Question = Field(description="The question.")

    is_guide_answer_enabled: bool = Field(
        description="Whether the guide answer is enabled.", default=True
    )

    answer: str = Field(
        description="The answer to the question.",
    )


class OutputState(BaseStateConfig):
    feedback: Feedback | None = Field(
        description="The feedback to the question.", default=None
    )
    structured_guide_answer: StructuredGuideAnswer | None = Field(
        description="The structured guide answer.", default=None
    )


class GraphState(InputState, OutputState, BaseState):
    pass
