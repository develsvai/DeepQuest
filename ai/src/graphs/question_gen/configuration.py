"""Configuration schema for developer interview question generation.

This module defines the configuration settings for the developer interview question generation
graph, including model selection, temperature settings,
and system prompts.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field, fields
from typing import Annotated, Type, TypeVar

from langchain_core.runnables import RunnableConfig, ensure_config
from langgraph.config import get_config

from question_gen.prompts import SYSTEM_PROMPT, USER_PROMPT

_DEFAULT_MODEL = (
    "gemini-2.5-flash-lite"
    if os.getenv("ENVIRONMENT") == "development"
    else "gemini-2.5-flash-lite"
)


@dataclass(kw_only=True)
class ConfigSchema:
    """Configuration schema for question generation settings.

    This class defines the configurable parameters for the question generation
    process, including the AI model to use, temperature settings,
    and system prompts.
    """

    model: Annotated[str, {"__template_metadata__": {"kind": "llm"}}] = field(
        default="gemini-2.5-flash-lite",
        metadata={
            "description": "The model to use for generating questions."
            "Should be in the form = provider:model-name."
        },
    )

    temperature: float = field(
        default=1.0,
        metadata={
            "description": "The temperature of the language model to use for generating questions."
            "0.0 is the most deterministic output."
        },
    )

    system_prompt: str = field(
        default=SYSTEM_PROMPT,
        metadata={"description": "The system prompt to use for generating questions."},
    )

    user_prompt: str = field(
        default=USER_PROMPT,
        metadata={"description": "The user prompt to use for generating questions."},
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
