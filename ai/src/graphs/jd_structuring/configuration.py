"""Configuration schema for job description structuring.

This module defines the configuration settings for the job description
structuring graph, including model selection, temperature settings,
and system prompts.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field, fields
from typing import Annotated, Type, TypeVar

from langchain_core.runnables import RunnableConfig, ensure_config
from langgraph.config import get_config

from jd_structuring.prompts import SYSTEM_PROMPT

_DEFAULT_MODEL = (
    "google_genai:gemini-2.5-flash-lite"
    if os.getenv("ENVIRONMENT") == "development"
    else "google_genai:gemini-2.5-flash-lite"
)


@dataclass(kw_only=True)
class ConfigSchema:
    """Configuration schema for job description structuring settings.

    This class defines the configurable parameters for the job description
    structuring process, including the AI model to use, temperature settings,
    and system prompts.
    """

    structuring_model: Annotated[str, {"__template_metadata__": {"kind": "llm"}}] = (
        field(
            default=_DEFAULT_MODEL,
            metadata={
                "description": "The model to use for structuring the JD."
                "Should be in the form = provider:model-name."
            },
        )
    )

    temperature: float = field(
        default=0.2,
        metadata={
            "description": "The temperature of the language model to use for structuring the JD."
            "0.0 is the most deterministic output."
        },
    )

    system_prompt: str = field(
        default=SYSTEM_PROMPT,
        metadata={"description": "The system prompt to use for structuring the JD."},
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
