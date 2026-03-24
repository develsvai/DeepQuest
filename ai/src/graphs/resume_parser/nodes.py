import asyncio
import base64
import logging
from typing import Any
from urllib.parse import urlparse

import httpx
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from langchain_google_genai import ChatGoogleGenerativeAI

from common.rate_limit import acquire_gemini_slot_async
from resume_parser.configuration import ConfigSchema
from resume_parser.prompts import create_human_prompt
from resume_parser.schema import ResumeParseResult
from resume_parser.state import GraphState

logger = logging.getLogger(__name__)

# PDF 다운로드 설정
PDF_DOWNLOAD_MAX_RETRIES = 3
PDF_DOWNLOAD_BASE_DELAY = 1.0  # 초 단위


class PDFDownloadError(Exception):
    """PDF 다운로드 실패 시 발생하는 에러."""

    pass


async def _download_pdf_with_retry(url: str) -> bytes:
    """PDF를 다운로드하고 유효성을 검증합니다.

    Args:
        url: PDF 파일의 URL

    Returns:
        PDF 파일의 바이트 데이터

    Raises:
        PDFDownloadError: 다운로드 실패 또는 유효하지 않은 PDF
    """
    last_error: Exception | None = None

    for attempt in range(PDF_DOWNLOAD_MAX_RETRIES):
        try:
            # 지수 백오프 (첫 시도 제외)
            if attempt > 0:
                delay = PDF_DOWNLOAD_BASE_DELAY * (2**attempt)
                logger.info(
                    "PDF 다운로드 재시도 %d/%d, %.1f초 대기 중...",
                    attempt + 1,
                    PDF_DOWNLOAD_MAX_RETRIES,
                    delay,
                )
                await asyncio.sleep(delay)

            # HTTP 요청 (nip.io 도메인만 자체 서명이라 SSL 검증 스킵)
            verify_ssl = "nip.io" not in urlparse(url).netloc
            async with httpx.AsyncClient(verify=verify_ssl, timeout=30.0) as client:
                response = await client.get(url)

            # HTTP 상태 코드 확인
            if response.status_code != 200:
                raise PDFDownloadError(
                    f"HTTP 에러: status_code={response.status_code}, url={url}"
                )

            pdf_bytes = response.content

            # 빈 콘텐츠 확인
            if not pdf_bytes or len(pdf_bytes) == 0:
                raise PDFDownloadError(f"빈 PDF 콘텐츠: url={url}")

            # PDF 헤더 검증 (%PDF로 시작해야 함)
            if not pdf_bytes[:4].startswith(b"%PDF"):
                raise PDFDownloadError(
                    f"유효하지 않은 PDF 헤더: got={pdf_bytes[:20]!r}, url={url}"
                )

            logger.info("PDF 다운로드 성공: size=%d bytes, url=%s", len(pdf_bytes), url)
            return pdf_bytes

        except httpx.HTTPError as e:
            last_error = PDFDownloadError(f"네트워크 에러: {e}, url={url}")
            logger.warning(
                "PDF 다운로드 실패 (attempt %d): %s", attempt + 1, last_error
            )
        except PDFDownloadError as e:
            last_error = e
            logger.warning("PDF 검증 실패 (attempt %d): %s", attempt + 1, e)

    # 모든 재시도 실패
    raise last_error or PDFDownloadError(f"PDF 다운로드 실패: url={url}")


async def resume_parsing(
    state: GraphState, config: RunnableConfig
) -> dict[str, Any]:
    configuration = ConfigSchema.from_runnable_config(config)

    model = ChatGoogleGenerativeAI(
        model=configuration.parsing_model,
        temperature=configuration.temperature,
        max_retries=3,
        thinking_budget=-1,
        timeout=100,
    )

    # PDF 다운로드 및 검증 (재시도 포함)
    pdf_bytes = await _download_pdf_with_retry(state.resume_file_path)
    pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")

    # Generate dynamic human prompt with state context
    human_prompt = create_human_prompt(
        applied_position=state.applied_position,
        experience_names_to_analyze=state.experience_names_to_analyze,
    )

    messages = [
        SystemMessage(content=configuration.system_prompt),
        HumanMessage(
            content=[
                {
                    "type": "text",
                    "text": human_prompt,
                },
                # {"type": "image_url", "image_url": {"url": state.resume_file_path}},
                {
                    "type": "file",
                    "source_type": "base64",
                    "mime_type": "application/pdf",
                    "data": pdf_base64,
                },
                # 김산 이력서로 두 방식 중 어떤 방식이 url을 잘 뽑나 테스트 하고 있음 -> 결론. 차이가 없다!
            ]
        ),
    ]

    # recommended way to use structured output(method="json_schema")
    await acquire_gemini_slot_async()
    response = await model.with_structured_output(
        ResumeParseResult, method="json_schema"
    ).ainvoke(messages)

    return {"resume_parse_result": response, "retry_count": state.retry_count + 1}
