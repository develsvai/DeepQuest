# Gemini Prompting Guide - Complete Reference

This reference contains comprehensive guidance for designing effective prompts for Gemini AI models.

## Input Types

| Input Type | Description | Example |
|------------|-------------|---------|
| Question | Model answers a question | "What's a good name for a flower shop?" |
| Task | Model performs a task | "Give me a list of camping essentials" |
| Entity | Model operates on an entity | "Classify the following items as [large, small]" |
| Completion | Model completes partial input | Providing JSON structure to complete |

## Partial Input Completion

Provide partial content and let the model continue. The model identifies patterns from examples and applies them.

### JSON Field Omission Example
Control which fields appear in output by showing the pattern:

```
Valid fields are cheeseburger, hamburger, fries, and drink.

Order: Give me a cheeseburger and fries
Output: { "cheeseburger": 1, "fries": 1 }

Order: I want two burgers, a drink, and fries.
Output:
```
Result: `{ "hamburger": 2, "drink": 1, "fries": 1 }` - "cheeseburger" omitted because not ordered.

### Format Control via Completion Strategy
Guide response format by providing the start of the desired structure:

```
# Without format hint:
Prompt: Create an outline for an essay about hummingbirds.
Result: Model chooses its own format

# With format hint:
Prompt: Create an outline for an essay about hummingbirds.
I. Introduction
  *

Result: Model continues the exact format pattern you initiated
```

**Use this technique to enforce**:
- Specific outline styles (I, II, III vs 1, 2, 3)
- Bullet point formats
- Code structure patterns
- Any consistent formatting

## Constraints

Specify what the model should and should not do:
- Response length limits
- Format requirements
- Content boundaries
- Style guidelines

## Response Format Options

- Table
- Bulleted list
- Elevator pitch
- Keywords
- Sentence/paragraph
- JSON/code blocks

## Zero-shot vs Few-shot Prompts

### Zero-shot
No examples provided. Model relies on general knowledge.

### Few-shot (Recommended)
Include examples showing desired output patterns:
- Regulate formatting, phrasing, scoping
- Show positive patterns (not anti-patterns)
- Use consistent formatting across examples
- 2-5 examples typically sufficient

**Important**: Few-shot examples are highly recommended. They can often replace explicit instructions.

### Consistent Formatting (Critical)

Ensure identical structure across all examples. Inconsistent formatting leads to unpredictable outputs.

**Pay attention to:**
- XML tags (open/close consistently)
- Whitespace and indentation
- Newlines between sections
- Example separators (---, blank lines, etc.)

```
# BAD - Inconsistent separators and spacing
Example 1:
Input: Apple
Output: Fruit
---
Example2:
Input:Car
Output:Vehicle

# GOOD - Consistent structure
Example 1:
Input: Apple
Output: Fruit

Example 2:
Input: Car
Output: Vehicle
```

## Adding Context

Include instructions and information the model needs to solve a problem. Do not assume the model has all required information. Context helps the model understand constraints and details of the task.

### Why Context Matters

**Without context** (generic response):
```
Prompt: What should I do to fix my disconnected wifi? The light on my router is yellow.

Response: A yellow blinking light usually indicates a problem with the internet connection.
Here are some steps: 1. Restart your router... [generic troubleshooting]
```

**With context** (specific response):
```
Prompt: Answer using the text below. Respond with only the provided text.

Question: What should I do to fix my disconnected wifi? The light is yellow and blinking slowly.

Text:
Color: Slowly pulsing yellow
What it means: There is a network error.
What to do: Check that the Ethernet cable is connected to both your router and modem...

Response: Check that the Ethernet cable is connected to both your router and modem
and both devices are turned on. You might need to unplug and plug in each device again.
```

### Best Practices for Context

1. **Include only relevant information** - Filter documents to relevant sections
2. **Place context before questions** - Model processes sequentially
3. **Use clear delimiters** - Separate context from instructions with markers
4. **For long contexts** - Place specific instructions at the END of the prompt
5. **Constrain responses** - Use phrases like "Respond with only the text provided"

## Prefixes

### Input Prefix
Demarcates semantically meaningful parts:
- "English:", "French:" for language translation
- "Text:", "Question:" for input types

### Output Prefix
Signals expected response format:
- "JSON:", "The answer is:", "Summary:"

### Example Prefix
Labels in few-shot examples for easier parsing.

## Breaking Down Complex Prompts

1. **Break down instructions**: One prompt per instruction
2. **Chain prompts**: Sequential steps where output feeds into next input
3. **Aggregate responses**: Parallel operations on different data portions

## Model Parameters

| Parameter | Description | Recommendation |
|-----------|-------------|----------------|
| Max output tokens | Maximum response length | 100 tokens ≈ 60-80 words |
| Temperature | Randomness in token selection | **Keep at 1.0 for Gemini 3** |
| topK | Number of top tokens to consider | Lower = more focused |
| topP | Cumulative probability threshold | Default 0.95 |
| stop_sequences | Sequences that stop generation | Use unique markers |

**Critical for Gemini 3**: Keep temperature at default 1.0. Changing it may cause looping or degraded performance.

### Using stop_sequences Effectively

Stop sequences tell the model when to stop generating. Useful for:
- Preventing over-generation
- Extracting specific portions of output
- Controlling response boundaries

```
# Example: Extract only the first item
stop_sequences: ["\n2."]  # Stops before second item

# Example: Stop at section boundary
stop_sequences: ["---", "## "]  # Stops at separator or next heading

# Example: JSON extraction
stop_sequences: ["}"]  # Stops after closing brace (use with care)
```

**Best practices:**
- Use unique sequences unlikely to appear in desired output
- Test thoroughly - common words/punctuation may cause premature stops
- Combine with output prefixes for precise extraction

## Prompt Iteration Strategies

1. **Rephrase**: Try different words/phrasing
2. **Switch to analogous task**: Reframe as multiple choice, categorization, etc.
3. **Change content order**: Try different arrangements of examples, context, input

### Analogous Task Transformation Example

When the model doesn't follow constraints, reframe the task:

```
# Original - Model provides verbose explanation
Prompt: Which category does The Odyssey belong to: thriller, sci-fi, mythology, biography

Response: The Odyssey belongs to **mythology**. Here's why:
The Odyssey tells the story of Odysseus, a hero from Greek mythology...
[unwanted explanation continues]

# Reframed as multiple choice - Model gives concise answer
Prompt: Multiple choice problem: Which of the following options describes The Odyssey?
Options:
- thriller
- sci-fi
- mythology
- biography

Response: The correct answer is mythology.
```

**Common reframing patterns:**
- Open question → Multiple choice
- Free-form → Fill-in-the-blank
- Classification → Yes/No per category
- Generation → Selection from options

## Fallback Responses

When model returns generic safety responses:
- Try increasing temperature
- Rephrase the request
- Provide more context

## Things to Avoid

- Relying on models for factual information without verification
- Complex math/logic without step-by-step breakdown
- Anti-pattern examples (show what TO do, not what NOT to do)

---

# Gemini 3 Specific Guidelines

## Core Principles

1. **Be precise and direct**: State goals clearly, avoid persuasive language
2. **Use consistent structure**: XML tags or Markdown headings
3. **Define parameters**: Explain ambiguous terms explicitly
4. **Control verbosity**: Request detailed responses explicitly if needed
5. **Handle multimodal coherently**: Reference each modality clearly
6. **Prioritize critical instructions**: Place in System Instruction or prompt start
7. **Structure for long contexts**: Context first, instructions at end
8. **Anchor context**: Use transition phrases like "Based on the information above..."

## Handling Multimodal Inputs

Gemini 3 treats text, images, audio, and video as equal-class inputs. When combining modalities:

**Best practices:**
- Reference each modality explicitly in instructions
- Specify which input to prioritize if they conflict
- Use clear markers when switching between modalities

```
# Example: Image + Text prompt
<image>[uploaded image]</image>

<task>
Analyze the image above and answer the following:
1. What objects are visible?
2. Based on the text overlay in the image, what is the main message?
3. Describe the color palette used.
</task>

# Example: Audio + Text
<audio>[uploaded audio file]</audio>

<task>
1. Transcribe the spoken content
2. Identify the speaker's emotional tone
3. Summarize the key points in bullet format
</task>
```

**Cross-modal referencing:**
- "In the image above..." / "The audio clip shows..."
- "Compare the chart (image 1) with the data table (image 2)"
- "Based on both the transcript and the visual diagram..."

## XML Structure Template

```xml
<role>
You are a helpful assistant.
</role>

<constraints>
1. Be objective.
2. Cite sources.
</constraints>

<context>
[Insert User Input Here - The model knows this is data, not instructions]
</context>

<task>
[Insert the specific user request here]
</task>
```

## Markdown Structure Template

```markdown
# Identity
You are a senior solution architect.

# Constraints
- No external libraries allowed.
- Python 3.11+ syntax only.

# Output format
Return a single code block.
```

## Complete Template (Best Practices)

### System Instruction:

```xml
<role>
You are Gemini 3, a specialized assistant for [Insert Domain].
You are precise, analytical, and persistent.
</role>

<instructions>
1. **Plan**: Analyze the task and create a step-by-step plan.
2. **Execute**: Carry out the plan.
3. **Validate**: Review your output against the user's task.
4. **Format**: Present the final answer in the requested structure.
</instructions>

<constraints>
- Verbosity: [Specify Low/Medium/High]
- Tone: [Specify Formal/Casual/Technical]
</constraints>

<output_format>
Structure your response as follows:
1. **Executive Summary**: [Short overview]
2. **Detailed Response**: [The main content]
</output_format>
```

### User Prompt:

```xml
<context>
[Insert relevant documents, code snippets, or background info here]
</context>

<task>
[Insert specific user request here]
</task>

<final_instruction>
Remember to think step-by-step before answering.
</final_instruction>
```

## Enhancing Reasoning

### Explicit Planning Prompt:
```
Before providing the final answer, please:
1. Parse the stated goal into distinct sub-tasks.
2. Check if the input information is complete.
3. Create a structured outline to achieve the goal.
```

### Self-Critique Prompt:
```
Before returning your final response, review your generated output:
1. Did I answer the user's intent, not just their literal words?
2. Is the tone authentic to the requested persona?
```

---

# Agentic Workflow Configuration

## Behavior Dimensions

### Reasoning and Strategy
- **Logical decomposition**: How thoroughly to analyze constraints and order of operations
- **Problem diagnosis**: Depth of root cause analysis
- **Information exhaustiveness**: Speed vs. thoroughness trade-off

### Execution and Reliability
- **Adaptability**: How to react to new data
- **Persistence and Recovery**: Self-correction attempts
- **Risk Assessment**: Distinguishing reads (low-risk) from writes (high-risk)

### Interaction and Output
- **Ambiguity handling**: When to ask vs. assume
- **Verbosity**: Explanation level during execution
- **Precision and completeness**: Exactness requirements

## Agentic System Instruction Template

```
You are a very strong reasoner and planner. Use these critical instructions:

Before taking any action, proactively plan and reason about:

1) Logical dependencies and constraints:
   1.1) Policy-based rules, mandatory prerequisites
   1.2) Order of operations
   1.3) Other prerequisites
   1.4) Explicit user constraints

2) Risk assessment:
   2.1) For exploratory tasks, missing optional parameters is LOW risk

3) Abductive reasoning:
   3.1) Look beyond immediate causes
   3.2) Hypotheses may require multiple steps to test
   3.3) Prioritize by likelihood but don't discard prematurely

4) Outcome evaluation and adaptability:
   4.1) Generate new hypotheses if initial ones are disproven

5) Information availability:
   5.1) Available tools
   5.2) All policies and constraints
   5.3) Previous observations
   5.4) Information from user

6) Precision and Grounding:
   6.1) Quote exact applicable information

7) Completeness:
   7.1) Resolve conflicts by importance
   7.2) Avoid premature conclusions
   7.3) Review all information sources

8) Persistence:
   8.1) Don't give up unless reasoning exhausted
   8.2) Retry transient errors, change strategy for other errors

9) Inhibit response: Only act after all reasoning is completed.
```

---

# Generative Model Internals

## Two-Stage Response Generation

1. **Stage 1 (Deterministic)**: Generate probability distribution over tokens
2. **Stage 2 (Configurable)**: Select tokens via decoding strategy

Temperature controls Stage 2 randomness:
- **Temperature 0**: Always select highest probability (deterministic)
- **Temperature 1.0**: Balanced sampling (recommended for Gemini 3)
- **High temperature**: More diverse/creative but less predictable
