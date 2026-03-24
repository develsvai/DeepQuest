from langgraph.graph import END, START, StateGraph

from question_feedback_gen.configuration import ConfigSchema
from question_feedback_gen.nodes import (
    question_feedback_gen_node,
    structured_guide_answer_gen_node,
)
from question_feedback_gen.state import GraphState, InputState, OutputState


def question_feedback_gen_conditions(state: GraphState) -> str:
    """Determine if we should generate question feedback or structured guide answer."""
    # If generation was successful, end the graph.
    if state.feedback is not None:
        # 우선은 임시로 모든 답변에 대해 그에 알맞는 가이드 답변을 생성하게 함
        # if state.is_guide_answer_enabled:
        return "structured_guide_answer_gen"

        return END

    # If generation failed, check the retry count.
    if state.retry_count >= 3:
        state.error_code = "GENERATION_FAILED"
        state.error_message = "Failed to generate feedback after multiple attempts."
        return END

    # Otherwise, increment retry count and retry generation.
    state.retry_count += 1
    return "question_feedback_gen"


workflow = StateGraph(
    GraphState,
    input_schema=InputState,
    output_schema=OutputState,
    context_schema=ConfigSchema,
)

workflow.add_node("question_feedback_gen", question_feedback_gen_node)
workflow.add_node("structured_guide_answer_gen", structured_guide_answer_gen_node)
workflow.add_edge(START, "question_feedback_gen")

workflow.add_conditional_edges(
    "question_feedback_gen",
    question_feedback_gen_conditions,
    {
        "question_feedback_gen": "question_feedback_gen",
        "structured_guide_answer_gen": "structured_guide_answer_gen",
        END: END,
    },
)

graph = workflow.compile()
graph.name = "QuestionFeedbackGen"
