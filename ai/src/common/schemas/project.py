from enum import StrEnum
from typing import List

from pydantic import Field

from common.state_model import BaseStateConfig

# -----------------------------------------------------------------------------
# Enums & Helper Classes
# -----------------------------------------------------------------------------


class ProjectType(StrEnum):
    PERSONAL = "PERSONAL"
    TEAM = "TEAM"
    OPEN_SOURCE = "OPEN_SOURCE"
    ACADEMIC = "ACADEMIC"
    HACKATHON = "HACKATHON"
    FREELANCE = "FREELANCE"


class EmployeeType(StrEnum):
    FULL_TIME = "FULL_TIME"
    CONTRACT = "CONTRACT"
    INTERN = "INTERN"
    FREELANCE = "FREELANCE"
    PART_TIME = "PART_TIME"


class ExperienceType(StrEnum):
    CAREER = "CAREER"
    PROJECT = "PROJECT"


# -----------------------------------------------------------------------------
# Component Models
# -----------------------------------------------------------------------------
class Architecture(BaseStateConfig):
    """System architecture details extracted from descriptions or diagrams."""

    description: str = Field(
        description="Textual description of the system architecture, data flow, and key components."
    )
    mermaid: str | None = Field(
        default=None,
        description="Mermaid.js code representing the architecture diagram. Focus on Flowcharts or Sequence Diagrams. Leave empty if insufficient information.",
    )


class KeyAchievement(BaseStateConfig):
    """A specific achievement or troubleshooting experience (STAR-L methodology)."""

    title: str = Field(
        default="",
        description="A concise title summarizing the achievement or the problem solved.",
    )
    problems: List[str] = Field(
        default=[],
        description="[Situation/Task] List of problems, bottlenecks, or technical challenges faced.",
    )
    actions: List[str] = Field(
        default=[],
        description="[Action] List of technical actions taken or decisions made.",
    )
    results: List[str] = Field(
        default=[],
        description="[Result] List of quantitative metrics or qualitative improvements.",
    )
    reflections: List[str] = Field(
        default=[],
        description="[Learning] List of technical insights or takeaways gained.",
    )


# -----------------------------------------------------------------------------
# Experience Models
# -----------------------------------------------------------------------------
class Duration(BaseStateConfig):
    """Duration of the experience."""

    start_date: str | None = Field(description="Start date in YYYY-MM format.")
    end_date: str | None = Field(
        default=None,
        description="End date in YYYY-MM format. Set to None if currently active.",
    )
    is_current: bool = Field(
        default=False,
        description="True if the candidate is currently working in this role or project.",
    )


class BaseExperience(BaseStateConfig):
    """Base class containing common fields for both Work and Project experiences."""

    duration: Duration | None = Field(
        default=None, description="Duration of the experience."
    )
    position: List[str] = Field(
        default=[],
        description="List of job titles or position names only (e.g., 'Backend Engineer', 'Tech Lead'). Extract ONLY the official position title, NOT responsibilities or task descriptions.",
    )
    tech_stack: List[str] = Field(
        default=[],
        description="List of specific technologies used in this experience. Include versions if mentioned (e.g., 'Java 17', 'Spring Boot 3').",
    )
    links: List[str] = Field(
        default=[],
        description="List of relevant URLs (e.g., GitHub repository, live demo, app store link, portfolio page).",
    )
    architecture: Architecture | None = Field(
        default=None,
        description="Details about the system architecture designed or managed during this experience.",
    )
    key_achievements: List[KeyAchievement] = Field(
        default=[],
        description="List of key achievements and technical challenges solved, structured via STAR-L.",
    )


class CareerExperience(BaseExperience):
    """Professional work experience at a company."""

    company: str = Field(description="Official name of the company or organization.")
    company_description: str | None = Field(
        default=None,
        description="Brief description of the company's domain, industry, or key products.",
    )
    employee_type: EmployeeType | None = Field(
        default=None, description="Type of employment (e.g., FULL_TIME, INTERN)."
    )
    job_level: str | None = Field(
        default=None,
        description="Job level or rank (e.g., 'Senior', 'Junior', 'Staff').",
    )


class ProjectExperience(BaseExperience):
    """Independent, academic, or side projects."""

    project_name: str = Field(description="Name or title of the project.")
    project_description: str | None = Field(
        default=None, description="Brief summary of the project's purpose and scope."
    )
    project_type: ProjectType | None = Field(
        default=None, description="Type of project (e.g., PERSONAL, TEAM, ACADEMIC)."
    )
    team_composition: str | None = Field(
        default=None,
        description="Description of the team structure and roles (e.g., 'Backend: 2, Frontend: 2', 'Solo Project'). Provides context for collaboration questions.",
    )
