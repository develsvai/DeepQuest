"""Pydantic schemas for structured job description data.

This module defines the data models used to represent parsed and structured
job description information. It includes schemas for qualifications,
company information, and the main structured job description format.
"""

from typing import List

from pydantic import Field

from common.state_model import BaseStateConfig


class Qualifications(BaseStateConfig):
    """Model for job qualifications including required and preferred qualifications."""

    required: List[str] = Field(
        description="Extract the required qualifications as a list of full sentences. Each sentence should describe a specific skill, experience level, or competency. Example: ['- 3+ years of experience in web application development using Java and Spring Boot.']"
    )
    preferred: List[str] | None = Field(
        None,
        description="Extract the preferred (optional) qualifications as a list of full sentences. Include skills or experiences that are considered a plus.",
    )


class CompanyInfo(BaseStateConfig):
    """Model for company information extracted from job descriptions."""

    culture_and_values: List[str] | None = Field(
        None,
        description="List key phrases or sentences that describe the company's culture, work environment, and core values.",
    )
    team_introduction: List[str] | None = Field(
        None,
        description="Extract sentences that introduce the team the candidate will join, including its goals and current projects.",
    )
    core_service_product: List[str] | None = Field(
        None,
        description="Identify and list the company's main products or services mentioned in the job description.",
    )


class StructuredJD(BaseStateConfig):
    """A structured representation of a software developer job description, optimized for LLM extraction."""

    tech_stack: List[str] | None = Field(
        None,
        description="List only the names of technologies, languages, and frameworks as a list of keywords. DO NOT include experience levels or descriptions. Example: ['Java', 'Spring Boot', 'React', 'AWS']",
    )
    responsibilities: List[str] = Field(
        description="Extract the main responsibilities and day-to-day tasks as a list of concise sentences. Each item should start with a verb. Example: ['- Design and develop backend systems.', '- Collaborate with cross-functional teams.']"
    )
    qualifications: Qualifications = Field(
        description="Extract the required and preferred qualifications. This should contain full, descriptive sentences, distinct from the 'tech_stack' keywords."
    )
    company_info: CompanyInfo | None = Field(
        None,
        description="Extract information about the company, including its culture, team, and products.",
    )
