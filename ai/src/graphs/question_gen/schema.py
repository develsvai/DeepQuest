from typing import List

from pydantic import Field

from common.schemas.question import Question
from common.state_model import BaseStateConfig


class QuestionGenerationSchema(BaseStateConfig):
    questions: List[Question] = Field(description="The list of questions.")
