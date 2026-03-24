from typing import Any

from common.schemas.project import (
    CareerExperience,
    ExperienceType,
    KeyAchievement,
    ProjectExperience,
)
from common.schemas.question import Question
from common.schemas.question_category import (
    CATEGORY_METADATA,
    QuestionCategoryName,
    generate_star_mapping_section,
)
from question_gen.prompts import EXISTING_QUESTIONS_SECTION

# =============================================================================
# HELPER FUNCTIONS - Category Building
# =============================================================================


def build_star_mapping_section(categories: list[QuestionCategoryName]) -> str:
    """Build STAR mapping section for selected categories.

    Delegates to generate_star_mapping_section from question_category module.

    Args:
        categories: List of user-selected question categories.

    Returns:
        Formatted STAR mapping section for user prompt injection.
    """
    return generate_star_mapping_section(categories)


def build_requested_categories_list(categories: list[QuestionCategoryName]) -> str:
    """Build simple list of requested category names.

    Args:
        categories: List of user-selected question categories.

    Returns:
        Formatted bullet list of category names with enum values.
    """
    return "\n".join(
        f"- {CATEGORY_METADATA[cat].full_name} ({cat.value})" for cat in categories
    )


# =============================================================================
# HELPER FUNCTIONS - Experience Formatting
# =============================================================================


def build_experience_context(
    experience_type: ExperienceType,
    details: CareerExperience | ProjectExperience,
) -> str:
    """Build experience context section based on experience type.

    Args:
        experience_type: Either CAREER or PROJECT.
        details: The experience details object.

    Returns:
        Formatted experience context string for prompt injection.
    """
    if experience_type == ExperienceType.CAREER:
        return format_career_experience(details)  # type: ignore[arg-type]
    return format_project_experience(details)  # type: ignore[arg-type]


def _format_duration(duration: Any) -> str:
    """Format duration object to readable string.

    Args:
        duration: Duration object with start_date, end_date, is_current.

    Returns:
        Formatted duration string.
    """
    if not duration:
        return "Not specified"
    start = duration.start_date or "Unknown"
    end = "Present" if duration.is_current else (duration.end_date or "Unknown")
    return f"{start} - {end}"


def _format_architecture(architecture: Any) -> str:
    """Format architecture object to readable string.

    Args:
        architecture: Architecture object with description and optional mermaid.

    Returns:
        Formatted architecture string.
    """
    if not architecture:
        return "Not specified"
    result: str = architecture.description or "Not specified"
    if architecture.mermaid:
        result += f"\n```mermaid\n{architecture.mermaid}\n```"
    return result


def format_career_experience(exp: CareerExperience) -> str:
    """Format career experience for prompt context.

    Args:
        exp: CareerExperience object.

    Returns:
        Formatted career experience string.
    """
    return f"""Experience Type: CAREER

Company: {exp.company}
Company Description: {exp.company_description or "Not specified"}
Position: {", ".join(exp.position) if exp.position else "Not specified"}
Employee Type: {exp.employee_type.value if exp.employee_type else "Not specified"}
Job Level: {exp.job_level or "Not specified"}
Duration: {_format_duration(exp.duration)}

Tech Stack: {", ".join(exp.tech_stack) if exp.tech_stack else "Not specified"}

Architecture:
{_format_architecture(exp.architecture)}"""


def format_project_experience(exp: ProjectExperience) -> str:
    """Format project experience for prompt context.

    Args:
        exp: ProjectExperience object.

    Returns:
        Formatted project experience string.
    """
    return f"""Experience Type: PROJECT

Project Name: {exp.project_name}
Project Description: {exp.project_description or "Not specified"}
Project Type: {exp.project_type.value if exp.project_type else "Not specified"}
Team Composition: {exp.team_composition or "Not specified"}
Position: {", ".join(exp.position) if exp.position else "Not specified"}
Duration: {_format_duration(exp.duration)}

Tech Stack: {", ".join(exp.tech_stack) if exp.tech_stack else "Not specified"}

Architecture:
{_format_architecture(exp.architecture)}"""


# =============================================================================
# HELPER FUNCTIONS - Achievement & Existing Questions
# =============================================================================


def format_key_achievement(achievement: KeyAchievement) -> dict[str, str]:
    """Format KeyAchievement STAR-L fields for prompt.

    Args:
        achievement: KeyAchievement object with STAR-L fields.

    Returns:
        Dictionary with formatted achievement fields.
    """
    return {
        "achievement_title": achievement.title or "Untitled Achievement",
        "problems": (
            "\n".join(f"- {p}" for p in achievement.problems)
            if achievement.problems
            else "Not specified"
        ),
        "actions": (
            "\n".join(f"- {a}" for a in achievement.actions)
            if achievement.actions
            else "Not specified"
        ),
        "results": (
            "\n".join(f"- {r}" for r in achievement.results)
            if achievement.results
            else "Not specified"
        ),
        "reflections": (
            "\n".join(f"- {r}" for r in achievement.reflections)
            if achievement.reflections
            else "Not specified"
        ),
    }


def build_existing_questions_section(
    existing_questions: list[Question] | None,
) -> str:
    """Build existing questions section for duplicate prevention.

    Args:
        existing_questions: Optional list of existing questions.

    Returns:
        Formatted existing questions section or empty string.
    """
    if not existing_questions:
        return ""

    questions_list = "\n".join(
        f"{i + 1}. [{q.category.value if q.category else 'UNKNOWN'}] {q.content}"
        for i, q in enumerate(existing_questions)
    )
    return EXISTING_QUESTIONS_SECTION.format(existing_questions_list=questions_list)
