from typing import Any

from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig

from common.rate_limit import acquire_gemini_slot_async
from common.schemas.question_category import (
    generate_answer_structure_section,
    generate_evaluation_criteria_section,
)
from question_feedback_gen.configuration import ConfigSchema
from question_feedback_gen.convert import (
    convert_expericent_prompt,
    format_feedback_summary,
)
from question_feedback_gen.prompts import (
    FEEDBACK_USER_PROMPT,
    GUIDE_GENERATION_PROMPT,
)
from question_feedback_gen.schema import Feedback, StructuredGuideAnswer
from question_feedback_gen.state import GraphState


async def question_feedback_gen_node(
    state: GraphState, config: RunnableConfig
) -> dict[str, Any]:
    """Evaluate candidate's answer and generate structured feedback.

    This node uses an evaluator mindset (Judge/Critic) to:
    - Analyze answer-question alignment
    - Assess technical accuracy and specificity
    - Generate strengths, weaknesses, suggestions, and rating
    """
    configuration = ConfigSchema.from_runnable_config(config)

    model = init_chat_model(
        model=configuration.structuring_model,
        temperature=configuration.temperature,
        max_retries=3,
        streaming=True,
    )

    experience_context = convert_expericent_prompt(state)

    # Generate category-specific evaluation criteria
    evaluation_criteria = generate_evaluation_criteria_section(state.question.category)

    # Prepare LLM input messages with feedback-specific system prompt
    input_messages = [
        SystemMessage(content=configuration.feedback_system_prompt),
        HumanMessage(
            content=FEEDBACK_USER_PROMPT.format(
                question=state.question.content,
                answer=state.answer,
                evaluation_criteria=evaluation_criteria,
                experience_context=experience_context,
            )
        ),
    ]

    # Invoke LLM with structured output
    await acquire_gemini_slot_async()
    response = await model.with_structured_output(
        Feedback, method="json_schema"
    ).ainvoke(
        input_messages
    )  # method="json_schema" 값을 줘야 streaming이 가능해진다!

    # Ensure response is Feedback instance (not dict)
    if isinstance(response, dict):
        response = Feedback(**response)

    # Return both the feedback and messages for next node to access
    return {
        "feedback": response,
    }


async def structured_guide_answer_gen_node(
    state: GraphState, config: RunnableConfig
) -> dict[str, Any]:
    """Generate personalized guide answer based on feedback and experience.

    This node uses a coach mindset (Coach/Mentor) to:
    - Transform candidate's experience into compelling interview narratives
    - Structure answers using category-specific frameworks
    - Create natural, conversational interview responses
    """
    configuration = ConfigSchema.from_runnable_config(config)

    model = init_chat_model(
        model=configuration.structuring_model,
        temperature=configuration.temperature,
        max_retries=3,
        streaming=True,
    )

    # Get experience context (same as feedback node)
    experience_context = convert_expericent_prompt(state)

    # Format feedback summary for the prompt
    feedback_summary = format_feedback_summary(state.feedback)

    # Generate category-specific answer structure
    answer_structure = generate_answer_structure_section(state.question.category)

    # Add new HumanMessage with full context for guide generation
    guide_request_message = HumanMessage(
        content=GUIDE_GENERATION_PROMPT.format(
            question=state.question.content,
            answer=state.answer,
            feedback=feedback_summary,
            experience_context=experience_context,
            answer_structure=answer_structure,
        )
    )

    # Use guide-specific system prompt for coach mindset
    input_messages = [
        SystemMessage(content=configuration.guide_system_prompt),
        guide_request_message,
    ]

    # Invoke LLM with structured output
    await acquire_gemini_slot_async()
    guide_answer = await model.with_structured_output(
        StructuredGuideAnswer, method="json_schema"
    ).ainvoke(input_messages)

    return {"structured_guide_answer": guide_answer}
