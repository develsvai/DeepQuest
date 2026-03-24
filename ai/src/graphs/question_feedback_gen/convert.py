"""Convert experience data to prompt format for question feedback generation."""

from question_feedback_gen.schema import Feedback
from question_feedback_gen.state import (
    CareerExperienceBase,
    GraphState,
    ProjectExperienceBase,
)


def convert_expericent_prompt(state: GraphState) -> str:
    """Convert experience from state to prompt format.

    Args:
        state: Graph state containing experience data.

    Returns:
        Formatted string representation of the experience.

    Raises:
        ValueError: If neither career_experience nor project_experience is provided.
    """
    if state.career_experience is None:
        if state.project_experience is None:
            raise ValueError(
                "Either career_experience or project_experience must be provided"
            )
        return convert_project_experience_to_prompt(state.project_experience)

    return convert_career_experience_to_prompt(state.career_experience)


def convert_career_experience_to_prompt(
    career_experience: CareerExperienceBase,
) -> str:
    """Convert career experience to structured prompt format.

    Organizes career experience data into logical sections for better readability
    and easier parsing by LLMs.

    Args:
        career_experience: Career experience data to convert.

    Returns:
        Formatted string representation of the career experience.
    """
    # Format single key achievement
    achievement_text = ""
    achievement = career_experience.key_achievement
    if achievement:
        achievement_text = "\nKey Achievement:\n"
        if achievement.problems:
            achievement_text += f"  - Situation & Task: {achievement.problems}\n"
        if achievement.actions:
            achievement_text += f"  - Action: {achievement.actions}\n"
        if achievement.results:
            achievement_text += f"  - Result: {achievement.results}\n"
        if achievement.reflections:
            achievement_text += f"  - Reflection: {achievement.reflections}\n"

    return f"""
=== CAREER EXPERIENCE CONTEXT ===

** Company Information **
- Company: {career_experience.company}
- Description: {career_experience.company_description}
- Position: {career_experience.position}
- Job Level: {career_experience.job_level}

** Technical Stack & Architecture **
- Tech Stack: {career_experience.tech_stack}
- Architecture: {career_experience.architecture}

** Key Achievement (STAR-L Methodology) **
{achievement_text if achievement_text else "No specific achievement documented."}
"""


def convert_project_experience_to_prompt(
    project_experience: ProjectExperienceBase,
) -> str:
    """Convert project experience to structured prompt format.

    Organizes project experience data into logical sections for better readability
    and easier parsing by LLMs.

    Args:
        project_experience: Project experience data to convert.

    Returns:
        Formatted string representation of the project experience.
    """
    # Format single key achievement
    achievement_text = ""
    achievement = project_experience.key_achievement
    if achievement:
        achievement_text = "\nKey Achievement:\n"
        if achievement.problems:
            achievement_text += f"  - Situation & Task: {achievement.problems}\n"
        if achievement.actions:
            achievement_text += f"  - Action: {achievement.actions}\n"
        if achievement.results:
            achievement_text += f"  - Result: {achievement.results}\n"
        if achievement.reflections:
            achievement_text += f"  - Reflection: {achievement.reflections}\n"

    return f"""
=== PROJECT EXPERIENCE CONTEXT ===

** Project Information **
- Project Name: {project_experience.project_name}
- Project Type: {project_experience.project_type}
- Position/Role: {project_experience.position}
- Team Composition: {project_experience.team_composition}

** Technical Stack & Architecture **
- Tech Stack: {project_experience.tech_stack}
- Architecture: {project_experience.architecture}

** Key Achievement (STAR-L Methodology) **
{achievement_text if achievement_text else "No specific achievement documented."}
"""


def format_feedback_summary(feedback: Feedback | None) -> str:
    """Format feedback into a concise summary for the guide generation prompt.

    Args:
        feedback: Feedback object from the previous node.

    Returns:
        Formatted string summarizing the feedback.
    """
    if feedback is None:
        return "No feedback available."

    strengths = (
        "\n".join(f"  - {s}" for s in feedback.strengths)
        if feedback.strengths
        else "  - None identified"
    )
    weaknesses = (
        "\n".join(f"  - {w}" for w in feedback.weaknesses)
        if feedback.weaknesses
        else "  - None identified"
    )
    suggestions = (
        "\n".join(f"  - {s}" for s in feedback.suggestions)
        if feedback.suggestions
        else "  - None provided"
    )

    rationale = (
        "\n".join(f"  - {r}" for r in feedback.rating.rationale)
        if feedback.rating.rationale
        else "  - None provided"
    )

    return f"""Rating: {feedback.rating.level}

Rationale:
{rationale}

Strengths:
{strengths}

Weaknesses (areas to address in guide):
{weaknesses}

Suggestions (to incorporate in guide):
{suggestions}"""
