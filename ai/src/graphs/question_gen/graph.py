from langgraph.constants import END, START
from langgraph.graph.state import StateGraph

from question_gen.configuration import ConfigSchema
from question_gen.nodes import question_gen_node
from question_gen.state import GraphState, InputState

workflow = StateGraph(
    state_schema=GraphState, input_schema=InputState, context_schema=ConfigSchema
)
workflow.add_node("question_gen", question_gen_node)

workflow.add_edge(START, "question_gen")
workflow.add_edge("question_gen", END)

graph = workflow.compile()
graph.name = "QuestionGen"
