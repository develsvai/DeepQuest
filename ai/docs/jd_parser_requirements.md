# 채용 공고 URL 파서(Parser) 요구사항 정의서

## 1. 개요

본 문서는 채용 공고 웹 페이지의 URL을 입력받아, 해당 페이지의 내용을 분석하고 정해진 형식의 구조화된 데이터로 추출하는 시스템의 요구사항을 정의합니다.

## 2. 시스템 요구사항

### 2.1. 주요 기능
시스템은 단일 URL을 입력받아 두 단계의 처리 과정을 거칩니다. 첫 번째 단계에서는 URL의 유효성을 검증하고, 두 번째 단계에서는 유효한 URL의 내용을 파싱하여 주요 정보를 추출합니다. 전체 과정 중 오류 발생 시, 명확한 오류 코드를 포함한 결과를 반환해야 합니다.

### 2.2. 입력 명세
- 시스템의 입력은 단일 `URL` 문자열입니다.
  - 예: `{"url": "https://example.com/job-posting/123"}`

### 2.3. 출력 명세
- **성공 시**: 추출된 채용 공고 정보를 포함하는 JSON 객체를 반환합니다.
  ```json
  {
    "company_name": "추출된 회사명",
    "job_title": "추출된 직무명",
    "job_description": "추출된 상세 직무 내용...",
    "error_code": null,
    "error_message": null
  }
  ```
- **실패 시**: `error_code`와 `error_message` 필드가 채워진 JSON 객체를 반환합니다.
  ```json
  {
    "company_name": null,
    "job_title": null,
    "job_description": null,
    "error_code": "오류 유형 코드",
    "error_message": "발생한 오류에 대한 상세 설명"
  }
  ```

## 3. 상세 기능 명세

### 3.1. 1단계: 입력 URL 검증
입력된 URL에 대해 아래 두 가지 조건을 순차적으로 검증해야 합니다.

- **조건 1: URL 접근성**: 시스템이 해당 URL의 웹 페이지 콘텐츠를 정상적으로 읽을 수 있는지 확인합니다.
- **조건 2: 콘텐츠 유형**: 접근한 콘텐츠가 '소프트웨어 개발자/엔지니어' 직군에 관련된 채용 공고인지 확인합니다.

- **성공 처리**: 위 두 가지 조건을 모두 만족할 경우, 다음 '정보 추출' 단계로 진행합니다.
- **실패 처리**: 두 조건 중 하나라도 만족하지 못할 경우, 즉시 처리를 중단하고 해당하는 오류 코드와 함께 결과를 반환합니다.

### 3.2. 2단계: 채용 공고 정보 추출
검증이 완료된 URL의 콘텐츠에서 아래 세 가지 정보를 추출합니다.

- `company_name`: 채용을 진행하는 회사의 공식 명칭
- `job_title`: 채용 직무의 공식 명칭 (예: "시니어 백엔드 개발자")
- `job_description`:
    - `company_name`과 `job_title`을 제외한 나머지 모든 직무 관련 텍스트를 포함해야 합니다.
    - 책임, 자격 요건, 기술 스택, 우대 사항, 복지, 회사 소개 등 모든 관련 내용을 포함해야 합니다.
    - **요약하거나 수정하지 않고 원본 내용을 그대로** 가져와야 합니다.
    - 추출된 정보(`company_name`, `job_title`, `job_description`)의 언어는 원본 채용 공고의 언어와 동일해야 합니다.

## 4. 비기능적 요구사항

### 4.1. 오류 처리 및 재시도 메커니즘

- **재시도**: '3.2 정보 추출' 단계가 실패할 경우, 시스템은 동일한 작업에 대해 최대 2번까지 추가로 재시도를 수행해야 합니다. (총 3회 시도)
- 3회 시도 후에도 정보 추출에 계속 실패하면, 최종적으로 파싱 실패(PARSING_FAILED) 오류를 반환해야 합니다.
- **오류 코드**: 시스템은 아래 정의된 오류 코드를 사용하여 실패 원인을 명확히 알려야 합니다.
    - `URL_INACCESSIBLE`: URL의 콘텐츠에 접근할 수 없거나 읽을 수 없음.
    - `NOT_DEV_JOB`: 해당 URL이 개발자 채용 공고가 아니라고 판단됨.
    - `VALIDATION_FAILED`: URL 검증 단계에서 예측하지 못한 오류 발생.
    - `PARSING_FAILED`: 정보 추출 단계에서 3회 시도 모두 실패함.

### 4.2. 외부 서비스 연동

- **URL 처리**: 시스템은 반드시 URL의 내용을 직접 읽고 처리할 수 있는 기능이 내장된 외부 AI 서비스(예: Google Generative AI)를 사용해야 합니다.
- **인증**: 외부 AI 서비스와의 연동을 위한 API 키는 반드시 환경 변수(예: `GEMINI_API_KEY`)를 통해 설정되어야 합니다. 코드 내에 키를 하드코딩해서는 안 됩니다.

## 5. 참고 사항

- ai 관련 기능을 구현하기 전에는, 반드시 context7 mcp를 사용해 최신 정보를 습득할 것
- 아래 구현 예시를 참고할 것
  - 1단계

    ```typescript
    import {
      GoogleGenAI,
    } from '@google/genai';

    async function main() {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });
      const tools = [
        { urlContext: {} },
      ];
      const config = {
        temperature: 0.2,
        thinkingConfig: {
          thinkingBudget: 0,
        },
        tools,
        systemInstruction: [
            {
              text: `<ROLE>
    You are a highly precise API endpoint that processes URL content. You do not provide explanations, apologies, or any text outside of the specified JSON format. Your entire response must be a single, raw JSON object.
    </ROLE>

    <TASK>
    Analyze the provided URL content to determine two facts:
    1.  If the URL content is accessible.
    2.  If it is a job posting for a 'software developer/engineer'.
    </TASK>

    <OUTPUT_INSTRUCTIONS>
    - The response MUST be a single, valid JSON object.
    - The response MUST NOT contain any text, markdown (like \`\`\`json), or explanations before or after the JSON object.
    - The JSON object must have this exact structure:
    {"is_accessible": boolean, "is_developer_job": boolean}
    </OUTPUT_INSTRUCTIONS>`,
            }
        ],
      };
      const model = 'gemini-2.5-flash';
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: `INSERT_INPUT_HERE`, // sholud be the single url
            },
          ],
        },
      ];

      const response = await ai.models.generateContent({
        model,
        config,
        contents,
      });
    }

    main();

    ```

  - 2단계

    ```typescript
    import {
      GoogleGenAI,
    } from '@google/genai';

    async function main() {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });
      const tools = [
        { urlContext: {} },
      ];
      const config = {
        temperature: 0.15,
        thinkingConfig: {
          thinkingBudget: 0,
        },
        tools,
        systemInstruction: [
            {
              text: `<ROLE>
    You are a specialized content extraction API. Your sole function is to parse the text of a job posting and return structured data. You do not engage in conversation or provide any explanatory text. Your entire output must be a single raw JSON object.
    </ROLE>

    <TASK>
    From the provided text of a software developer job posting, extract the following three pieces of information: \`company_name\`, \`job_title\`, and \`job_description\`.
    </TASK>

    <DEFINITIONS>
    1.  \`company_name\`: The official name of the company that is hiring.
    2.  \`job_title\`: The specific title for the job position (e.g., "Senior Backend Developer", "Frontend Engineer").
    3.  \`job_description\`: All text content directly related to the job position after excluding the company name and job title. This MUST include sections like responsibilities, qualifications, required skills, preferred skills, benefits, and company culture. It MUST EXCLUDE irrelevant information such as website navigation links, headers, footers, advertisements, or lists of other open positions. The content should be preserved in its original form without summarization.
    </DEFINITIONS>

    <OUTPUT_INSTRUCTIONS>
    - The response MUST be a single, valid JSON object.
    - The response MUST NOT contain any text, markdown (like \`\`\`json), or explanations before or after the JSON object.
    - The JSON object must have this exact structure:
    {"company_name": string, "job_title": string, "job_description": string}
    </OUTPUT_INSTRUCTIONS>`,
            }
        ],
      };
      const model = 'gemini-2.5-flash';
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: `INSERT_INPUT_HERE`, // sholud be the single url
            },
          ],
        },
      ];

      const response = await ai.models.generateContent({
        model,
        config,
        contents,
      });
    }

    main();
    ```