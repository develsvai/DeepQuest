---
description: Gemini 모델에 최적화된 프롬프트로 개선합니다. 프롬프트 작성, 최적화, 디버깅 시 사용하세요.
argument-hint: [prompt-text or file-path]
---
# Prompt Improvement Command

Gemini 프롬프트 최적화 가이드라인을 적용하여 사용자의 프롬프트를 개선합니다.

## Instructions

1. **gemini-prompting skill 호출**: 먼저 Skill tool을 사용하여 `gemini-prompting` skill을 호출하세요
2. **프롬프트 분석**: 사용자가 제공한 프롬프트를 분석합니다 
   - User Prompt: 
        ```
        $ARGUMENTS
        ```
3. **개선 적용**: skill의 가이드라인을 적용하여 프롬프트를 개선합니다
4. **결과 제시**: 원본 분석, 개선된 프롬프트, 변경사항을 함께 제공합니다

## Output Format

```markdown
## 분석

- **타입**: [Question/Task/Entity/Completion]
- **개선점**: [발견된 문제점]

## 개선된 프롬프트

[최적화된 프롬프트]

## 변경사항

1. [적용된 개선 1]
2. [적용된 개선 2]
```
