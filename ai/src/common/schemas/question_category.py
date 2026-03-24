"""Question category definitions and helper functions.

This is the Source of Truth for question categories in the /ai project.
Sync manually with /web/prisma/schema.prisma when categories change.

See: /common-contents/question-categories/README.md
"""

from enum import Enum

from pydantic import BaseModel, Field

# =============================================================================
# ENUM & METADATA DEFINITIONS
# =============================================================================


class QuestionCategoryName(str, Enum):
    """Question category identifiers (stable DB/API identifiers)."""

    TECHNICAL_DECISION = "TECHNICAL_DECISION"
    TECHNICAL_DEPTH = "TECHNICAL_DEPTH"
    PROBLEM_SOLVING = "PROBLEM_SOLVING"
    SCALABILITY = "SCALABILITY"


class AnswerSection(BaseModel):
    """A single section in an answer framework."""

    name: str = Field(description="Section name for the answer structure")
    description: str = Field(description="What to include in this section")
    example: str = Field(description="Example content for this section")


class AnswerFramework(BaseModel):
    """Category-specific answer framework for guide answer generation."""

    framework_name: str = Field(description="Name of the answer framework")
    sections: list[AnswerSection] = Field(
        description="Ordered list of sections in the framework"
    )


class CategoryMetadata(BaseModel):
    """Category metadata for UI display and prompt generation."""

    full_name: str = Field(description="Display name for prompts")
    description: str = Field(
        description="Focus and verification points for system prompt"
    )
    star_mapping: str = Field(description="STAR element mapping for user prompt")


CATEGORY_METADATA: dict[QuestionCategoryName, CategoryMetadata] = {
    QuestionCategoryName.TECHNICAL_DECISION: CategoryMetadata(
        full_name="Technical Decision Making",
        description="""Focus: Verify 'WHY' behind technical choices made before implementation.

Verification Points:
- Suitability: Was the choice optimal for the given scale, timeline, and team capabilities?
- Trade-offs: What was gained vs. lost by this technical decision?
- Alternatives: What other options were considered and why were they rejected?

Generate questions that probe the decision-making PROCESS, not just the outcome.""",
        star_mapping="""[Situation/Task → Actions] relationship
- Situation/Task: Constraints and requirements that shaped decisions
- Actions: Actual choices made in response to constraints""",
    ),
    QuestionCategoryName.TECHNICAL_DEPTH: CategoryMetadata(
        full_name="Technical Depth & Principles",
        description="""Focus: Verify deep understanding of 'HOW & WHAT' - implementation mechanics and CS fundamentals.

Verification Points:
- Under the Hood: What happens internally when using these tools/frameworks?
- CS Fundamentals: How do data structures, algorithms, or system concepts apply?
- Best Practices: Were language/framework recommended patterns followed?

Generate questions that distinguish practitioners who understand internals from those who only use APIs.""",
        star_mapping="""[Actions] deep-dive
- Actions: Specific technologies, libraries, and implementation details
- Probe understanding beyond surface-level API usage""",
    ),
    QuestionCategoryName.PROBLEM_SOLVING: CategoryMetadata(
        full_name="Problem Solving & Verification",
        description="""Focus: Verify that results came from rigorous problem-solving, not luck.

Verification Points:
- Root Cause Analysis: Was the true source of the problem identified, not just symptoms?
- Measurement: Were baseline metrics and success criteria clearly defined?
- Causality: Can the candidate prove their actions directly caused the results?

Generate questions that challenge the candidate to PROVE their impact with objective evidence.""",
        star_mapping="""[Actions ↔ Results] causal chain
- Actions: Problem-solving approach and methodology used
- Results: Must be provably caused by the actions taken""",
    ),
    QuestionCategoryName.SCALABILITY: CategoryMetadata(
        full_name="Scalability",
        description="""Focus: Verify forward-thinking engineering perspective beyond current results.

Verification Points:
- Bottleneck Prediction: What breaks at 10x or 100x scale?
- System Design: Were long-term maintainability and flexibility considered?
- Retrospective: What limitations exist and what would be improved with hindsight?

Generate questions that reveal whether the candidate thinks beyond immediate deliverables.""",
        star_mapping="""[Results → Future] projection
- Results: Current state and achievements as baseline
- Future: System limits, growth scenarios, and improvement opportunities""",
    ),
}


# =============================================================================
# ANSWER FRAMEWORKS (Category-specific answer structures)
# =============================================================================

ANSWER_FRAMEWORKS: dict[QuestionCategoryName, AnswerFramework] = {
    QuestionCategoryName.TECHNICAL_DECISION: AnswerFramework(
        framework_name="Trade-off Framework",
        sections=[
            AnswerSection(
                name="Core Answer",
                description="Start with the decision and key rationale (conclusion first)",
                example="We chose PostgreSQL. The main reasons were ACID compliance for our financial transactions and the team's 3 years of experience with it, which meant faster development velocity...",
            ),
            AnswerSection(
                name="Decision Context",
                description="Explain alternatives considered and evaluation criteria",
                example="We evaluated MongoDB for schema flexibility and DynamoDB for serverless scaling. Key factors were data consistency needs, team expertise, and our 3-month timeline to MVP...",
            ),
            AnswerSection(
                name="Hindsight",
                description="Share what you learned and would do differently",
                example="Looking back, I would have set up read replicas from the start. We added them at month 6 when read queries impacted write performance...",
            ),
        ],
    ),
    QuestionCategoryName.TECHNICAL_DEPTH: AnswerFramework(
        framework_name="Layered Explanation",
        sections=[
            AnswerSection(
                name="Core Answer",
                description="Define the concept and its purpose clearly (conclusion first)",
                example="Event sourcing stores state changes as a sequence of events instead of just the current state. This gives us full audit trails and the ability to reconstruct state at any point in time...",
            ),
            AnswerSection(
                name="How It Works",
                description="Explain the internal mechanism and implementation details",
                example="Each event is appended to an immutable log. The current state is reconstructed by replaying events, or from periodic snapshots for performance. In our system, we used Kafka as the event store...",
            ),
            AnswerSection(
                name="My Application",
                description="Describe how you applied this in your actual project with specific results",
                example="In our order management system, each state change (created, paid, shipped) became an event. This let us debug customer disputes by replaying the exact sequence of events...",
            ),
        ],
    ),
    QuestionCategoryName.PROBLEM_SOLVING: AnswerFramework(
        framework_name="Root Cause Analysis",
        sections=[
            AnswerSection(
                name="Core Answer",
                description="State the root cause and solution upfront (conclusion first)",
                example="The issue was a missing index causing full table scans on our 10M row products table. I added a composite index and P99 latency dropped from 5 seconds to 150ms...",
            ),
            AnswerSection(
                name="Discovery",
                description="Explain how the problem was found and investigated",
                example="Users reported 5-second delays during checkout. APM traces pointed to the inventory service. Database slow query logs showed sequential scans after a bulk import that made statistics stale...",
            ),
            AnswerSection(
                name="Validation",
                description="Describe how you verified the fix and prevented recurrence",
                example="After adding the index and running ANALYZE, I verified P99 dropped to 150ms. I set up monitoring alerts for slow queries above 500ms and automated statistics updates after bulk imports...",
            ),
        ],
    ),
    QuestionCategoryName.SCALABILITY: AnswerFramework(
        framework_name="System Thinking",
        sections=[
            AnswerSection(
                name="Core Answer",
                description="Present the scaling strategy upfront (conclusion first)",
                example="My strategy is read replicas for read scaling and tenant-based sharding for write scaling. This would handle 100x growth while maintaining sub-200ms response times...",
            ),
            AnswerSection(
                name="Analysis",
                description="Explain current state, constraints, and predicted bottlenecks",
                example="Currently we handle 10K RPM on a single PostgreSQL instance. At 100K RPM, the database becomes the bottleneck - connection pool exhaustion and write contention on hot tables would cause failures...",
            ),
            AnswerSection(
                name="Trade-offs",
                description="Discuss what you gain and lose with the scaling approach",
                example="Sharding enables horizontal write scaling but complicates cross-shard queries. We'd need to denormalize some data and accept eventual consistency for aggregate reports...",
            ),
        ],
    ),
}

# Fallback framework for None category
_FALLBACK_FRAMEWORK = AnswerFramework(
    framework_name="General Interview Answer",
    sections=[
        AnswerSection(
            name="Core Answer",
            description="Start with your main point and key result (conclusion first)",
            example="I implemented Redis caching that reduced database load by 60% and improved response times from 800ms to 120ms...",
        ),
        AnswerSection(
            name="Approach",
            description="Explain your methodology, reasoning, and implementation details",
            example="I analyzed the traffic patterns, identified that product data was read 100x more than written, and implemented a cache-aside pattern with TTL based on update frequency...",
        ),
        AnswerSection(
            name="Learnings",
            description="Share what you learned and would do differently",
            example="I learned the importance of cache invalidation strategies. Next time, I'd implement pub/sub for real-time invalidation instead of TTL-based expiry...",
        ),
    ],
)


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

__all__ = [
    "QuestionCategoryName",
    "CategoryMetadata",
    "CATEGORY_METADATA",
    "AnswerSection",
    "AnswerFramework",
    "ANSWER_FRAMEWORKS",
    "get_num_categories",
    "get_full_name",
    "get_description",
    "get_star_mapping",
    "generate_category_prompt_section",
    "generate_star_mapping_section",
    "generate_evaluation_criteria_section",
    "generate_answer_structure_section",
]


def get_num_categories() -> int:
    """Return the total number of question categories.

    Returns:
        int: Total count of defined question categories.
    """
    return len(QuestionCategoryName)


def get_full_name(category: QuestionCategoryName) -> str:
    """Get the display name for a category.

    Args:
        category: The category enum value.

    Returns:
        str: The full display name of the category.
    """
    return CATEGORY_METADATA[category].full_name


def get_description(category: QuestionCategoryName) -> str:
    """Get the description for a category.

    Args:
        category: The category enum value.

    Returns:
        str: The description text for the category.
    """
    return CATEGORY_METADATA[category].description


def get_star_mapping(category: QuestionCategoryName) -> str:
    """Get the STAR mapping for a category.

    Args:
        category: The category enum value.

    Returns:
        str: The STAR mapping text for the category.
    """
    return CATEGORY_METADATA[category].star_mapping


def generate_category_prompt_section() -> str:
    """Generate the category section for system prompts.

    Creates a formatted string with all category names and descriptions
    for injection into the question generation system prompt.

    Returns:
        str: Formatted category section with numbered list.

    Example:
        >>> section = generate_category_prompt_section()
        >>> print(section)
        ### 1. **Technical Decision Making**
        Verify the logic and strategy at the design stage...

        ### 2. **Technical Depth & Principles**
        Verify understanding of 'How & What'...
    """
    sections: list[str] = []
    for i, category in enumerate(QuestionCategoryName, start=1):
        meta = CATEGORY_METADATA[category]
        sections.append(f"### {i}. **{meta.full_name}**\n{meta.description}")
    return "\n\n".join(sections)


def generate_star_mapping_section(categories: list[QuestionCategoryName]) -> str:
    """Generate STAR mapping section for selected categories.

    Creates a formatted string showing requested categories with their
    STAR element mapping for the user prompt.

    Args:
        categories: List of selected question categories.

    Returns:
        str: Formatted STAR mapping section for user prompt.

    Example:
        >>> section = generate_star_mapping_section([QuestionCategoryName.TECHNICAL_DECISION])
        >>> print(section)
        Generate questions for the following categories:

        **Technical Decision Making** (TECHNICAL_DECISION)
        STAR Mapping: [Problems → Actions] relationship
        - Problems: Constraints and requirements that shaped decisions
        - Actions: Actual choices made in response to constraints
    """
    lines: list[str] = ["Generate questions for the following categories:"]
    for category in categories:
        meta = CATEGORY_METADATA[category]
        lines.append(
            f"\n**{meta.full_name}** ({category.value})\n"
            f"{meta.description}\n\n"
            f"STAR Mapping: {meta.star_mapping}"
        )
    return "\n".join(lines)


def generate_evaluation_criteria_section(
    category: QuestionCategoryName | None,
) -> str:
    """Generate evaluation criteria section for feedback assessment.

    Creates a formatted string showing the category's focus and verification
    points for evaluating candidate answers.

    Args:
        category: The question category to generate criteria for.
                  If None, returns generic evaluation guidance.

    Returns:
        str: Formatted evaluation criteria section for feedback prompt.

    Example:
        >>> section = generate_evaluation_criteria_section(
        ...     QuestionCategoryName.TECHNICAL_DECISION
        ... )
        >>> print(section)
        This question tests: **Technical Decision Making**

        Focus: Verify 'WHY' behind technical choices...

        Verification Points:
        - Suitability: Was the choice optimal...
    """
    if category is None:
        return (
            "No specific category assigned. "
            "Evaluate based on general technical interview standards: "
            "alignment, accuracy, specificity, and experience connection."
        )

    meta = CATEGORY_METADATA[category]
    return f"This question tests: **{meta.full_name}**\n\n{meta.description}"


def generate_answer_structure_section(
    category: QuestionCategoryName | None,
) -> str:
    """Generate answer structure section for guide answer generation.

    Creates a formatted string showing the category-specific answer framework
    with section names, descriptions, and examples.

    Args:
        category: The question category to generate structure for.
                  If None, returns a general interview answer framework.

    Returns:
        str: Formatted answer structure section for guide generation prompt.

    Example:
        >>> section = generate_answer_structure_section(
        ...     QuestionCategoryName.TECHNICAL_DECISION
        ... )
        >>> print(section)
        **Answer Framework: Trade-off Framework**

        Structure your answer using these sections:

        1. **Alternatives Considered**
           - What to include: List the options evaluated before making the decision
           - Example: "We considered PostgreSQL for ACID compliance..."
    """
    framework = (
        ANSWER_FRAMEWORKS.get(category) if category else None
    ) or _FALLBACK_FRAMEWORK

    lines = [
        f"**Answer Framework: {framework.framework_name}**",
        "",
        "Structure your answer using these sections:",
        "",
    ]

    for i, section in enumerate(framework.sections, start=1):
        lines.append(f"{i}. **{section.name}**")
        lines.append(f"   - What to include: {section.description}")
        lines.append(f'   - Example: "{section.example}"')
        lines.append("")

    return "\n".join(lines)
