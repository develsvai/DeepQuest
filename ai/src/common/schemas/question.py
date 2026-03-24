from pydantic import Field

from common.schemas.question_category import QuestionCategoryName
from common.state_model import BaseStateConfig


class Question(BaseStateConfig):
    """Interview question with category classification."""

    content: str = Field(description="The content of the question.")
    category: QuestionCategoryName | None = Field(
        default=None,
        description="Map this question to the most relevant category from the framework definitions",
    )
