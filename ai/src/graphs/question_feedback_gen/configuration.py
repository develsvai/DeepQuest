"""Configuration schema for question feedback generation.

This module defines the configuration settings for the question feedback generation
graph, including model selection, temperature settings,
and system prompts for both evaluation and guide generation nodes.
"""

from __future__ import annotations

from dataclasses import dataclass, field, fields
from typing import Annotated, Type, TypeVar

from langchain_core.runnables import RunnableConfig, ensure_config
from langgraph.config import get_config

from question_feedback_gen.prompts import FEEDBACK_SYSTEM_PROMPT, GUIDE_SYSTEM_PROMPT


@dataclass(kw_only=True)
class ConfigSchema:
    """Configuration schema for question feedback generation settings.

    This class defines the configurable parameters for the question feedback generation
    process, including the AI model to use, temperature settings,
    and separate system prompts for feedback and guide generation.
    """

    structuring_model: Annotated[str, {"__template_metadata__": {"kind": "llm"}}] = (
        field(
            default="google_genai:gemini-2.5-flash-lite",
            metadata={
                "description": "The model to use for generating question feedback."
                "Should be in the form = provider:model-name."
            },
        )
    )

    temperature: float = field(
        default=1.0,
        metadata={
            "description": "The temperature of the language model to use for generating questions."
            "0.0 is the most deterministic output."
        },
    )

    feedback_system_prompt: str = field(
        default=FEEDBACK_SYSTEM_PROMPT,
        metadata={
            "description": "The system prompt for the feedback evaluation node. "
            "Optimized for analytical/evaluative mindset (Judge/Critic)."
        },
    )

    guide_system_prompt: str = field(
        default=GUIDE_SYSTEM_PROMPT,
        metadata={
            "description": "The system prompt for the guide answer generation node. "
            "Optimized for creative/generative mindset (Coach/Mentor)."
        },
    )

    @classmethod
    def from_runnable_config(cls: Type[T], config: RunnableConfig | None = None) -> T:
        """Create a Configuration instance from a RunnableConfig object."""
        try:
            config = get_config()
        except RuntimeError:
            config = None
        config = ensure_config(config)
        configurable = config.get("configurable") or {}
        _fields = {f.name for f in fields(cls) if f.init}
        return cls(**{k: v for k, v in configurable.items() if k in _fields})


T = TypeVar("T", bound=ConfigSchema)
