"""Schema definitions for question feedback generation graph.

Field descriptions serve as prompts for LLM structured output.
They follow gemini-prompting guidelines with positive examples only.
"""

from typing import List, Literal

from pydantic import Field

from common.state_model import BaseStateConfig

RatingLevel = Literal["DEEP", "INTERMEDIATE", "SURFACE"]


class Rating(BaseStateConfig):
    """Rating with rationale explaining why this rating was given."""

    level: RatingLevel = Field(
        description=(
            "Overall rating level based on hierarchical evaluation.\n\n"
            "DEEP: Perfect alignment + high accuracy/specificity + strong structure/experience. "
            "Demonstrates mastery through concrete metrics, trade-offs, and practical examples.\n\n"
            "INTERMEDIATE: Good understanding but lacks depth. "
            "Mostly correct but missing metrics, trade-offs, or experience connection.\n\n"
            "SURFACE: Poor alignment, significant errors, or purely theoretical. "
            "Misunderstands question or provides generic/incorrect answers.\n\n"
            "Evaluation priority: Alignment > Technical Quality > Structure/Experience"
        )
    )

    rationale: List[str] = Field(
        description=(
            "Key reasons explaining why this rating was given. "
            "Each item should be a concise, specific point highlighting "
            "what the candidate did well or poorly.\n\n"
            "Example for DEEP rating:\n"
            "- 'Provided concrete metrics (500ms → 80ms latency reduction)'\n"
            "- 'Explained trade-offs between cache invalidation complexity and DB load'\n"
            "- 'Connected solution to real project experience with measurable outcomes'\n\n"
            "Example for INTERMEDIATE rating:\n"
            "- 'Correctly identified Redis as caching solution'\n"
            "- 'Missing specific metrics to quantify improvement'\n"
            "- 'Did not explain why Redis was chosen over alternatives'\n\n"
            "Example for SURFACE rating:\n"
            "- 'Answer was generic without connection to actual experience'\n"
            "- 'Provided textbook definition without practical application'\n"
            "- 'Did not address the core question about implementation details'"
        )
    )


class Feedback(BaseStateConfig):
    """Structured feedback for candidate's interview answer."""

    strengths: List[str] = Field(
        description=(
            "List the strengths of the answer with specific examples. "
            "Quote exact parts from the candidate's answer and explain WHY each is effective.\n\n"
            'Example 1: \'You provided concrete metrics ("reduced latency from 500ms to 80ms") '
            "which demonstrates measurable impact and technical specificity.'\n\n"
            "Example 2: 'Your explanation of the trade-off between cache invalidation complexity "
            "and database load reduction shows the architectural thinking that interviewers value.'\n\n"
            "Example 3: 'Your comparison of PostgreSQL vs MongoDB alternatives demonstrates "
            "systematic decision-making that addresses the question's intent.'"
        )
    )

    weaknesses: List[str] = Field(
        description=(
            "List the weaknesses of the answer with specific examples. "
            "The weaknesses should be based on the candidate's actual experience. "
            "Explain the impact and maintain encouraging tone.\n\n"
            'Example 1: \'The answer focused on tool names ("Redis", "Kafka") rather than '
            "the handling strategy (caching patterns, partitioning approach), which is what "
            "interviewers assess for architectural thinking.'\n\n"
            "Example 2: 'While you mentioned performance improvement, adding specific metrics "
            '(e.g., "response time reduced from X to Y") would strengthen your credibility.\'\n\n'
            "Example 3: 'The answer could benefit from explaining WHY you chose this approach "
            "over alternatives, demonstrating your decision-making process.'"
        )
    )

    suggestions: List[str] = Field(
        description=(
            "Actionable improvement recommendations with specific steps. "
            "Reference candidate's experience when possible. Prioritize most impactful suggestions.\n\n"
            "Example 1: 'Leverage your [Project X] experience: mention the cache-aside pattern "
            "you implemented and the trade-offs you encountered (e.g., cache invalidation "
            "complexity vs. database load reduction).'\n\n"
            "Example 2: 'Add depth by explaining your decision process: \"We considered "
            "Memcached vs Redis, and chose Redis for its persistence and pub/sub features "
            "needed for our real-time notification system.\"'\n\n"
            "Example 3: 'Include a hindsight reflection: share what you learned and what "
            "you would do differently with your current knowledge.'"
        )
    )

    rating: Rating = Field(
        description="Rating with level and rationale explaining the evaluation."
    )


class StructuredGuideAnswerParagraph(BaseStateConfig):
    """A single section of the structured guide answer."""

    structure_section_name: str = Field(
        description=(
            "Section name from the answer framework provided in the prompt.\n\n"
            "Use the exact section names from the <answer_structure> provided:\n"
            "- For Trade-off Framework: 'Core Answer', 'Decision Context', 'Hindsight'\n"
            "- For Layered Explanation: 'Core Answer', 'How It Works', 'My Application'\n"
            "- For Root Cause Analysis: 'Core Answer', 'Discovery', 'Validation'\n"
            "- For System Thinking: 'Core Answer', 'Analysis', 'Trade-offs'\n\n"
            "CRITICAL: Always start with 'Core Answer' section (conclusion first).\n\n"
            "Example: 'Core Answer'\n"
            "Example: 'Discovery'"
        )
    )

    content: str = Field(
        description=(
            "Detailed, personalized content for this section. "
            "Must leverage candidate's experience and feedback insights.\n\n"
            "Requirements:\n"
            "1. Reference candidate's actual experience: "
            "Cite specific projects, technologies, or achievements from their background.\n"
            "2. Include concrete details: Use metrics, technology names, trade-offs.\n"
            "3. Address feedback weaknesses: Fill gaps identified in the feedback.\n"
            "4. Write in natural interview speech: Complete sentences, conversational flow.\n\n"
            "Example for 'Alternatives Considered' section:\n"
            "'When we started the project, I evaluated three database options: PostgreSQL for "
            "its strong ACID guarantees, MongoDB for its schema flexibility, and DynamoDB for "
            "serverless scaling. Each had distinct trade-offs for our use case.'\n\n"
            "Example for 'Symptom Observed' section:\n"
            "'Users reported 5-second delays during checkout. Our monitoring showed P99 latency "
            "spiked from 200ms to 5000ms during peak hours, affecting approximately 15% of orders.'"
        )
    )


class StructuredGuideAnswer(BaseStateConfig):
    """Structured guide answer to help candidate improve their response."""

    paragraphs: List[StructuredGuideAnswerParagraph] = Field(
        description=(
            "Section-by-section guide answer following the provided answer framework.\n\n"
            "Key Requirements:\n"
            "1. **Conclusion First (두괄식)**: Always start with 'Core Answer' section "
            "that directly answers the question with key rationale.\n\n"
            "2. Follow the answer structure provided in <answer_structure>: "
            "Each paragraph should correspond to one section in the framework.\n\n"
            "3. Hyper-personalize: Every paragraph must reference candidate's documented "
            "experience. Use specific project names, technologies they've worked with, "
            "and challenges they've faced.\n\n"
            "4. Be comprehensive: Cover all aspects the candidate missed. If they lacked "
            "metrics, show example metrics from their experience. If they missed trade-offs, "
            "explain relevant trade-offs.\n\n"
            "Example for Trade-off Framework (TECHNICAL_DECISION category):\n"
            "- Paragraph 1: Core Answer (conclusion + key rationale)\n"
            "- Paragraph 2: Decision Context (alternatives, criteria)\n"
            "- Paragraph 3: Hindsight (learnings)\n\n"
            "Typical length: 3 paragraphs.\n\n"
            "CRITICAL: Write as a complete interview answer example, NOT as improvement "
            "suggestions. Each paragraph is part of what the candidate should actually "
            "SAY in the interview."
        )
    )
