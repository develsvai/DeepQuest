"""Configuration schema for resume parsing.

This module defines the configuration settings for the resume parsing
parsing graph, including model selection, temperature settings,
and system prompts.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field, fields
from typing import Annotated, Type, TypeVar

from langchain_core.runnables import RunnableConfig, ensure_config
from langgraph.config import get_config

from resume_parser.prompts import SYSTEM_PROMPT


@dataclass(kw_only=True)
class ConfigSchema:
    """Configuration schema for resume parsing settings.

    This class defines the configurable parameters for the resume parsing
    parsing process, including the AI model to use, temperature settings,
    and system prompts.
    """

    parsing_model: Annotated[str, {"__template_metadata__": {"kind": "llm"}}] = field(
        default="gemini-2.5-flash-lite",
        metadata={
            "description": "The model to use for parsing the resume."
            "Should be in the form = provider:model-name."
            "gemini-2.5-flash-lite: 할당량 여유·저비용 기본값."
        },
    )

    temperature: float = field(
        default=1.0,
        metadata={
            "description": "The temperature of the language model to use for parsing the resume."
            "0.0 is the most deterministic output."
        },
    )

    system_prompt: str = field(
        default=SYSTEM_PROMPT,
        metadata={"description": "The system prompt to use for parsing the resume."},
    )

    @classmethod
    def from_runnable_config(cls: Type[T], config: RunnableConfig | None = None) -> T:
        """Create a Configuration instance from a RunnableConfig object."""
        try:
            config = get_config()
        except RuntimeError:
            config = None
        config = ensure_config(config)
        configurable = dict(config.get("configurable") or {})
        _fields = {f.name for f in fields(cls) if f.init}
        # 배포 시 이미지 재빌드 없이 모델 변경: ConfigMap에서 RESUME_PARSER_PARSING_MODEL 설정
        if "parsing_model" not in configurable and os.getenv("RESUME_PARSER_PARSING_MODEL"):
            configurable["parsing_model"] = os.getenv("RESUME_PARSER_PARSING_MODEL")
        return cls(**{k: v for k, v in configurable.items() if k in _fields})


T = TypeVar("T", bound=ConfigSchema)
