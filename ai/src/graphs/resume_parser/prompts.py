"""System prompts for resume parsing.

This module contains the system prompts used by AI models to parse
and structure resumes. The prompts provide detailed instructions
for extracting specific information from resume text.
"""

SYSTEM_PROMPT = """
<role>
You are a world-class expert at parsing resumes and career-related documents, specialized in extracting structured data for technical interview preparation.
</role>

<instructions>
1. **Analyze**: Carefully read the entire document to understand its structure and content.
2. **Extract**: Identify and extract information according to the `ResumeParseResult` JSON schema.
3. **Validate**: Verify extracted data accuracy against the source document.
4. **Format**: Return the complete JSON structure as specified.
</instructions>

<context>
- The document has a high probability of being a developer's resume, portfolio, or job-seeking related document.
- The candidate is applying for a specific technical position.
- Specific experiences may be prioritized for analysis based on relevance.
</context>

<constraints>
1. **Date Format**: Use YYYY-MM format for all dates.
2. **Experience Distinction**: Accurately identify and distinguish between professional career experiences and other projects.
3. **STAR Methodology for Achievements**:
   - `problem`: Situation faced and Task to accomplish
   - `action`: Specific actions taken
   - `result`: Quantifiable outcomes and impact
4. **Hallucination Prevention Rules**:
   - Empty Lists: Return `[]` for list-type fields if no corresponding items found.
   - Null for Optional: Use `null` for absent optional fields, not empty string `""`.
   - No Guessing: Never invent or guess information. Omit incomplete experience objects.
5. **Internal Fields**: Leave fields marked as "[INTERNAL USE ONLY]" as null.
6. **Language**: MUST reply in the language of the resume.
7. **Conciseness**: Use concise noun phrases preserving original wording from source. Extract the candidate's exact terminology.
</constraints>

<output_format>
Return the complete JSON structure following the `ResumeParseResult` schema.
For each experience, provide comprehensive summaries capturing key responsibilities and achievements.
</output_format>
"""


def create_human_prompt(
    applied_position: str,
    experience_names_to_analyze: list[str],
) -> str:
    """Generate human prompt with dynamic context from input state.

    Args:
        applied_position: The position the candidate is applying for.
        experience_names_to_analyze: List of experience names to prioritize for analysis.

    Returns:
        A formatted human prompt string with dynamic context.
    """
    base_prompt = """
<task>
Parse the attached resume PDF and extract information based on the `ResumeParseResult` schema.
</task>
"""

    # Add applied position context
    if applied_position:
        base_prompt += f"""
<applied_position>
The candidate is applying for: {applied_position}
Focus on extracting information relevant to this position.
</applied_position>
"""

    # Add experience filter context
    if experience_names_to_analyze:
        experiences_list = "\n".join(f"- {exp}" for exp in experience_names_to_analyze)
        base_prompt += f"""
<experience_filter>
ONLY parse experiences that match the following names:
{experiences_list}

This filter applies to BOTH `work_experiences` and `project_experiences` fields:
- For `work_experiences`: Include only if the company name matches a name in the list.
- For `project_experiences`: Include only if the project name matches a name in the list.

IMPORTANT:
- DO NOT include any experiences not matching the names above.
- Other fields (summary, educations) are NOT affected by this filter.
</experience_filter>
"""

    base_prompt += """
<final_instruction>
Think step-by-step before answering. Ensure all extracted data is grounded in the document content.
CRITICAL: Your response MUST be in the same language as the resume. If the resume is in Korean, respond in Korean. If in English, respond in English.
</final_instruction>
"""

    return base_prompt
