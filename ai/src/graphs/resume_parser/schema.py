"""Resume parsing schema module.

Defines the data models for parsed resume information.
"""

from typing import List, Literal

from pydantic import Field

from common.schemas.project import CareerExperience, Duration, ProjectExperience
from common.state_model import BaseStateConfig

Degree = Literal["BACHELOR", "MASTER", "DOCTOR", "HIGH_SCHOOL", "ASSOCIATE", "OTHER"]


# -----------------------------------------------------------------------------
# Education & Root Schema
# -----------------------------------------------------------------------------


class Education(BaseStateConfig):
    institution: str = Field(
        description="Name of the university or educational institution."
    )
    major: str = Field(description="Major or field of study.")
    degree: str | None = Field(
        default=None, description="Degree obtained (e.g., 'Bachelor', 'Master')."
    )
    duration: Duration | None = Field(
        default=None, description="Duration of the study."
    )
    description: str | None = Field(
        default=None,
        description="Additional details like GPA, relevant coursework, or thesis.",
    )


class ResumeParseResult(BaseStateConfig):
    """The root schema for the parsed resume data, optimized for generating technical interview questions."""

    summary: List[str] = Field(
        default=[],
        description="""A list of key statements summarizing the candidate's professional identity, and core technical strengths.
        Extracts content from sections labeled 'Professional Summary', 'Profile', 'About Me', or introductory text.
        Focuses on value propositions and achievements rather than generic objectives.
""",
    )

    work_experiences: List[CareerExperience] = Field(
        default=[], description="List of professional work experiences."
    )

    project_experiences: List[ProjectExperience] = Field(
        default=[], description="List of personal, team, or academic projects."
    )

    educations: List[Education] = Field(
        default=[], description="Educational background."
    )
