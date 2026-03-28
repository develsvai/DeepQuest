"""
Locust 부하 테스트 — Task 2 (Noisy Neighbor / 안정성)
수정 버전: 에러(429, 500 등) 발생 시 누락 없이 Failure로 집계되도록 수정됨.
추가: 응답 시간 체크 및 응답 본문 검사로 가짜 성공(Soft Failure) 감지.
"""

import json
import os
import urllib3
from locust import HttpUser, task, between

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# =============================================================================
# 설정 (Environment Variables & Defaults)
# =============================================================================

DEFAULT_RESUME_PDF_URL = (
    "https://uvkbijydvzapwndhzdjv.supabase.co/storage/v1/object/public/resumes/1770044277907_________________.docx.pdf"
)

# host 설정 (example.com 방지 및 nip.io 기본값)
DEFAULT_BASE_URL = os.environ.get("DEEPQUEST_HOST", "https://deepquest.192.168.0.110.nip.io").rstrip("/")

DEFAULT_EXPERIENCE_NAMES = [
    "온프레미스 Kubernetes 아키텍처 설계 및 한계 검증",
    "SSH가 끊겨도 접속 가능한 비상 복구 시스템: Docker 기반의 KVM 구축",
]


class AiUser(HttpUser):
    """AI 분석 API만 호출. Next /api/langgraph → LangGraph 서버로 프록시되며 AI 파드에 부하를 준다."""

    # 부하 강도 조절 (DEEPQUEST_LOCUST_FASTER=1 이면 더 빠르게 요청)
    wait_time = between(0.2, 0.5) if os.environ.get("DEEPQUEST_LOCUST_FASTER") else between(0.5, 1.5)

    def on_start(self):
        # TLS 검증 스킵 (nip.io 등 내부망 테스트용)
        base = (self.host or "").rstrip("/") or DEFAULT_BASE_URL
        if "nip.io" in base:
            self.client.verify = False

        self.resume_pdf_url = os.environ.get("DEEPQUEST_RESUME_PDF_URL", DEFAULT_RESUME_PDF_URL)

    @task(10)
    def create_thread_and_run(self):
        if not self.resume_pdf_url:
            return

        thread_id = None

        # -------------------------------------------------------
        # 1) 스레드 생성 요청 (실패 시 Failure 기록)
        # -------------------------------------------------------
        with self.client.post(
            "/api/langgraph/threads",
            headers={"Content-Type": "application/json"},
            json={},
            catch_response=True
        ) as r:
            if r.status_code != 200:
                # 에러 발생 시 Locust에 '실패'라고 명시적으로 보고
                r.failure(f"Thread Create Failed: {r.status_code} - {r.text[:100]}")
                return  # 여기서 종료해야 다음 단계(run 생성)로 안 넘어감

            # 성공(200)했지만 JSON 파싱이 안 되는 경우도 처리
            try:
                data = r.json()
                thread_id = data.get("thread_id")
            except (json.JSONDecodeError, KeyError, TypeError):
                r.failure(f"Thread Create JSON Parse Error: {r.text[:100]}")
                return

        if not thread_id:
            return

        # -------------------------------------------------------
        # 2) Run 생성 요청 (이력서 파싱 시작)
        # -------------------------------------------------------
        with self.client.post(
            f"/api/langgraph/threads/{thread_id}/runs",
            headers={"Content-Type": "application/json"},
            json={
                "assistant_id": "resume_parser",
                "input": {
                    "resume_file_path": self.resume_pdf_url,
                    "applied_position": "백엔드 개발자",
                    "experience_names_to_analyze": DEFAULT_EXPERIENCE_NAMES,
                },
            },
            catch_response=True
        ) as r:
            # 1. 상태 코드 체크
            if r.status_code != 200:
                r.failure(f"Run Create Failed: {r.status_code} - {r.text[:100]}")
                return

            # 2. 응답 시간 체크 (10ms 미만이면 가짜 성공 의심)
            # LLM 처리는 최소 수 초가 걸려야 함. 0.1초 미만은 비정상
            if r.elapsed.total_seconds() < 0.1:
                r.failure(f"Fake Success (Too Fast): {r.elapsed.total_seconds()*1000:.1f}ms - {r.text[:100]}")
                return

            # 3. 응답 본문에 에러 키워드가 있는지 확인
            response_text = r.text.lower()
            if "error" in response_text or "failed" in response_text or "quota" in response_text:
                r.failure(f"Logic Error in Response: {r.text[:100]}")
                return

            # 4. JSON 파싱 검사 (에러 필드 확인)
            try:
                data = r.json()
                # 응답에 error 필드가 있으면 실패 처리
                if isinstance(data, dict) and data.get("error"):
                    r.failure(f"Error in Response Body: {data.get('error')}")
                    return
            except (json.JSONDecodeError, TypeError):
                # JSON이 아니어도 성공으로 처리 (스트리밍 응답일 수 있음)
                pass

            # 모든 검사를 통과하면 성공
            r.success()

    @task(1)
    def health_ok(self):
        """AI 서버 헬스 체크 (단순 조회)"""
        with self.client.get("/api/langgraph/ok", catch_response=True) as r:
            if r.status_code != 200:
                r.failure(f"Health Check Failed: {r.status_code}")
            else:
                r.success()


class WebUser(HttpUser):
    """웹 서버만 호출. AI 부하 중 웹 지연 확인용."""

    wait_time = between(0.3, 0.8)

    def on_start(self):
        if "nip.io" in (self.host or ""):
            self.client.verify = False

    @task
    def health(self):
        with self.client.get("/api/health", catch_response=True) as r:
            if r.status_code != 200:
                r.failure(f"Web Health Failed: {r.status_code}")
            else:
                r.success()
