---
name: gemini-prompting
description: "This skill provides guidance for designing effective prompts for Gemini AI models. It should be used when creating, optimizing, or debugging prompts for Gemini 2.x or 3.x models, including zero-shot and few-shot strategies, structured prompting with XML or Markdown, agentic workflow design, and parameter tuning. Especially useful for Gemini 3 which requires specific prompting patterns for optimal performance."
---

# Gemini Prompting Skill

This skill enables effective prompt design for Gemini AI models, covering fundamental strategies through advanced agentic workflows.

## When to Use This Skill

- Designing prompts for Gemini 2.x or 3.x models
- Converting existing prompts to Gemini-optimized format
- Building agentic systems with Gemini as the backbone
- Debugging underperforming Gemini prompts
- Structuring complex multi-step prompts

## Quick Reference

For detailed templates, examples, and parameter configurations, refer to `references/gemini-guide.md`.

## Core Workflow

### 1. Determine Prompt Type

Identify the input type based on the task:

| Type | Use When | Example |
|------|----------|---------|
| Question | Seeking information | "What is X?" |
| Task | Requesting action | "Generate a list of..." |
| Entity | Operating on data | "Classify these items..." |
| Completion | Continuing pattern | Provide partial JSON to complete |

### 2. Choose Prompting Strategy

**Few-shot (Recommended)**: Always include 2-5 examples showing desired output patterns.

```
Example 1:
Input: [example input]
Output: [example output]

Example 2:
Input: [example input]
Output: [example output]

Now process:
Input: [actual input]
Output:
```

**Zero-shot**: Only when examples are unavailable or task is trivially simple.

**Completion Strategy**: Provide the start of desired format to guide output structure:
```
Create an outline for...
I. Introduction
  *
```
The model will continue the exact pattern you initiated.

### 3. Structure the Prompt (Gemini 3)

For Gemini 3, use structured formats. Choose XML or Markdown consistently:

**XML Structure:**
```xml
<role>[Identity and expertise]</role>
<constraints>[Rules and limitations]</constraints>
<context>[Background information]</context>
<task>[Specific request]</task>
```

**Markdown Structure:**
```markdown
# Identity
[Role description]

# Constraints
- [Rule 1]
- [Rule 2]

# Task
[Request]
```

### 4. Add Context (Critical for Quality)

**Do not assume the model has all required information.** Provide relevant documents, guides, or data the model needs to generate accurate, specific responses.

**Without context**: Generic, potentially incorrect responses
**With context**: Specific, grounded responses based on provided information

```
Answer the question using the text below. Respond with only the text provided.

Question: [user's question]

Text:
[relevant documentation, guides, or reference material]
```

**Best practices for context:**
- Include only relevant portions of documents
- Place context before the task/question
- Use clear delimiters to separate context from instructions
- For long contexts, place instructions at the END of the prompt

### 5. Add Prefixes for Clarity

Use consistent prefixes to demarcate sections:
- Input prefix: `Text:`, `Question:`, `Input:`
- Output prefix: `Answer:`, `JSON:`, `Output:`

### 6. Set Parameters

| Parameter | Gemini 3 Recommendation |
|-----------|-------------------------|
| Temperature | **Keep at 1.0** (critical) |
| topP | 0.95 (default) |
| topK | Task-dependent |

**Warning**: Changing temperature below 1.0 in Gemini 3 may cause looping or degraded performance.

## Agentic Prompt Design

For building AI agents with Gemini, configure these behavioral dimensions:

1. **Reasoning depth**: How much analysis before action
2. **Persistence level**: Retry behavior on failures
3. **Risk assessment**: Distinguish reads from writes
4. **Verbosity**: Explanation level during execution

See `references/gemini-guide.md` for the complete agentic system instruction template.

## Iteration Checklist

When prompts underperform:

- [ ] Rephrase using different words
- [ ] Add few-shot examples if missing
- [ ] **Add relevant context** (documents, guides, reference data)
- [ ] Switch to analogous task (e.g., open question → multiple choice, free-form → fill-in-blank)
- [ ] Reorder content (try: examples -> context -> input)
- [ ] Add explicit constraints
- [ ] Use output prefix to guide format
- [ ] Check temperature setting (must be 1.0 for Gemini 3)

## Common Patterns

### Classification Task
```
Classify the following into categories: [cat1, cat2, cat3]

Example:
Text: [example]
Category: [result]

Text: [actual input]
Category:
```

### JSON Output
```
Extract information as JSON with fields: [field1, field2, field3]

Example:
Input: [example]
Output: {"field1": "value", "field2": "value"}

Input: [actual input]
Output:
```

### Multi-step Reasoning
```
<instructions>
1. Analyze the task
2. Create a step-by-step plan
3. Execute the plan
4. Validate against requirements
</instructions>

<task>[Complex request]</task>

<final_instruction>
Think step-by-step before answering.
</final_instruction>
```

## Gemini 3 Direct Style

Gemini 3 treats prompts as **executable instructions**, not conversation:
- ❌ `"Please analyze this data for me"` → fluff ignored
- ✅ `"Analyze this data"` → direct instruction

Avoid persuasive or chatty language. State goals clearly without filler words.

## Anti-patterns to Avoid

- Showing negative examples ("Don't do this...")
- Inconsistent formatting across examples (whitespace, separators, XML tags must match exactly)
- Relying on model for factual accuracy without verification
- Changing Gemini 3 temperature from 1.0
- Overly long prompts without clear structure
- Mixing XML and Markdown in same prompt
- Ignoring multimodal inputs - reference images/audio/video explicitly in instructions
- **Open-ended negative constraints** - avoid broad instructions like "do not infer" or "do not guess"
  - ❌ `"Do not use external knowledge"`
  - ✅ `"Use only the provided context for your response"`
