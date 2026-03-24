"""Node functions for question generation graph.

This module contains the core processing nodes for the question generation
workflow. It handles the interaction with AI models to generate hyper-personalized
technical interview questions based on candidate's specific achievements.
"""

from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from langchain_google_genai.chat_models import ChatGoogleGenerativeAI

from common.rate_limit import acquire_gemini_slot_async
from question_gen.configuration import ConfigSchema
from question_gen.helpers import (
    build_existing_questions_section,
    build_experience_context,
    build_star_mapping_section,
    format_key_achievement,
)
from question_gen.prompts import (
    SYSTEM_PROMPT,
    USER_PROMPT,
)
from question_gen.schema import QuestionGenerationSchema
from question_gen.state import GraphState

# =============================================================================
# MAIN NODE FUNCTION
# =============================================================================


async def question_gen_node(
    state: GraphState, config: RunnableConfig
) -> dict[str, Any]:
    """Generate hyper-personalized technical interview questions.

    This node processes the input state containing:
    - applied_position: Target job position
    - experience: Career or Project experience context
    - key_achievement: Specific STAR-L achievement to generate questions for
    - question_categories: User-selected categories to generate
    - existing_questions: Optional list for duplicate prevention

    Args:
        state: GraphState containing all input data.
        config: RunnableConfig with model configuration.

    Returns:
        Dictionary with 'questions' key containing list of generated Question objects.
    """
    configuration = ConfigSchema.from_runnable_config(config)

    # Initialize model with Gemini configuration
    model = ChatGoogleGenerativeAI(
        model=configuration.model,
        temperature=configuration.temperature,
    )

    # Build dynamic prompt components
    star_mapping_section = build_star_mapping_section(state.question_categories)
    experience_context = build_experience_context(
        state.experience.experience_type,
        state.experience.details,
    )
    achievement_data = format_key_achievement(state.key_achievement)
    existing_questions_section = build_existing_questions_section(
        state.existing_questions
    )

    # System prompt now contains all category definitions statically
    system_content = SYSTEM_PROMPT

    # Build user prompt with all context
    user_content = USER_PROMPT.format(
        applied_position=state.applied_position,
        experience_context=experience_context,
        star_mapping_section=star_mapping_section,
        existing_questions_section=existing_questions_section,
        **achievement_data,
    )

    messages = [
        SystemMessage(content=system_content),
        HumanMessage(content=user_content),
    ]

    # Invoke with structured output
    await acquire_gemini_slot_async()
    response = await model.with_structured_output(
        schema=QuestionGenerationSchema,
        method="json_schema",
    ).ainvoke(messages)

    # Pyrefly Error Prevention
    if not isinstance(response, QuestionGenerationSchema):
        return {"questions": []}

    return {"questions": response.questions}
