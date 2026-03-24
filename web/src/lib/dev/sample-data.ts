/**
 * Sample Data for Development Environment
 *
 * This module contains sample/mock data used for testing and development.
 * Import these only in development environment for easy testing.
 *
 * @module lib/dev/sample-data
 */

import type { JobPostingFormData } from '@/lib/schemas/job-posting.schema'
import type { ResumeParseResultV2 } from '@/server/services/ai/contracts/schemas/resumeParsingV2'

/**
 * Sample job posting data for development testing
 *
 * This data represents a real job posting example to test the form functionality.
 * Only used when NODE_ENV === 'development'
 */
export const SAMPLE_JOB_DATA: JobPostingFormData = {
  companyName: '레페리',
  jobTitle: 'Backend Engineer (JAVA / Kotlin)',
  jobDescription: `2013 년 7 월 설립 이후, 지난 11 년간 MCN 업계를 선도해온 레페리(Leferi)가 최초(First)·최고(Best)·유일(Only)을 함께 추구할 인재를 찾습니다.

• 뷰티 MCN 레페리, '업계 최대 규모' 영업익 50억 달성 : https://url.kr/d7bh6l
• 최인석 레페리의장 "다음 목표는 기업가치 1 조원" 인터뷰 : https://url.kr/q3xmn9
• MCN 레페리, 크리에이터와 브랜드 교류 플랫폼 '레코멘드' 앱 공개 : http://bit.ly/lecommend
• 레페리 주최, '제5회 코리아 유튜버스 어워즈 2023 팝업 전시회' 성료: https://bit.ly/4cHuTSC


레페리는 국내 최초의 Digital Video Creator 교육 및 프로듀싱 시스템을 통해 약 1,500명의 수료생과 수백 명의 스타 크리에이터를 배출했습니다.
이 독보적인 인플루언서 프로듀싱 시스템은 레페리를 한국 시장에서 선도적 위치로 이끌었을 뿐만 아니라,
글로벌 인플루언서 그룹 중에서도 두각을 나타내는 핵심 요소가 되었습니다.

최근 뷰티 및 라이프스타일 분야에서 인플루언서의 직접적인 구매 전환 영향력이 강화되고 있고,
이에 발맞춰 레페리는 400명 이상의 뷰티 및 라이프스타일 전문 크리에이터와 협력하여 SNS 인플루언서 커머스 시장을 주도하고 있습니다.

특히 뷰티, 패션, 리빙, 라이프스타일 소비재 영역에서 가장 높은 상거래 전환율을 보이고 있으며, 최근 B2B/B2C 커머스 플랫폼으로 사업 영역을 확장하고 있습니다.
주요업무
[ 조직 소개]

레페리 기술개발팀은 B2B/B2C 플랫폼 및 데이터 지표 사업을 함께 만들어가는 핵심 조직입니다.
브랜드, 크리에이터, 소비자를 연결하는 디지털 플랫폼을 개발하고, 데이터 지표를 통해 산업 전반의 신뢰도를 높이고 있습니다.

• B2B 영역: 브랜드와 크리에이터가 협력할 수 있는 플랫폼과 도구 개발
• B2C 영역: 크리에이터의 콘텐츠와 제품을 소비자에게 전달하는 커머스 경험 설계
• 데이터 영역: 산업 성과 지표를 수집·분석·시각화하여 신뢰도 높은 인사이트 제공

[우리의 팀 문화]
• 기획, 디자인, 개발, 데이터가 유기적으로 협업하는 풀스택 조직
• 빠른 실행, 데이터 기반 의사결정, 전략적 기술 설계에 집중
• 단순한 기능 개발을 넘어 산업적 임팩트와 사용자 경험 혁신을 동시에 추구

기술개발팀은 이러한 영역 전반에서 함께 성장할 동료를 기다리고 있습니다.

--

[ 주요 업무]

• 백엔드 서비스 신규 기능 개발 및 유지보수
• 데이터베이스 모델링 및 쿼리 작성·최적화
• RESTful API 설계, 구현 및 외부 서비스 연동 개발
• B2B 플랫폼, B2C 플랫폼, 데이터 지표 서비스 관련 백엔드 기능 개발
• 서비스 운영 과정에서 발생하는 오류 분석 및 해결
• 성능 개선과 코드 리팩토링을 통한 품질 관리
• 프론트엔드, 기획, 디자인, 데이터 조직과 협업하여 서비스 구현
자격요건
• 서버 사이드 개발 경력 1–4년
• Java 및 Spring Boot 기반 웹 서비스 개발 경험
• 관계형 데이터베이스 설계 및 운영 경험
• RESTful API 설계 및 구현 경험
• Git 등 버전 관리 도구 활용 경험
• 문제 해결 능력과 새로운 기술 학습 의지
우대사항
• Kotlin 경험
• 클라우드 기반 서비스 개발 경험
• QueryDSL, JPA 경험
• 데이터 분석 및 파이프라인 경험
• AI 에이전트 기반 서비스 경험
• MCN 산업 경험`,
}

export const SAMPLE_RESUME_URL =
  'https://iapopjvufcxutgpztxng.supabase.co/storage/v1/object/public/resumes/1758325678408___________________________.pdf'
// 토스 이력서
// 'https://iapopjvufcxutgpztxng.supabase.co/storage/v1/object/public/resumes/1766728441072_____.pdf'
// 산이 이력서. 링크 확인용
// "https://iapopjvufcxutgpztxng.supabase.co/storage/v1/object/public/resumes/1764324884785_______________________________.pdf",
// 완기님 이력서
// 'https://iapopjvufcxutgpztxng.supabase.co/storage/v1/object/public/resumes/1766047861168_________CV_Common_.pdf'
/**
 * Sample test file configuration for development
 *
 * Configuration for auto-loading test files in development environment
 */
export const DEV_TEST_FILE_CONFIG = {
  fileName: 'test-resume.pdf',
  apiEndpoint: '/api/dev/test-file',
  fileType: 'application/pdf',
} as const

/**
 * Sample resume parse result for development testing
 *
 * 프로필: 5년차 백엔드 개발자
 * - 경력: 네이버 (2019-2022) → 토스 (2022-현재)
 * - 학력: 중앙대학교 컴퓨터공학과
 * - 졸업 프로젝트: 캠퍼스 중고거래 플랫폼
 */
export const SAMPLE_RESUME_PARSE_RESULT: ResumeParseResultV2 = {
  summary: [
    '5년차 백엔드 개발자로, 네이버와 토스에서 대규모 트래픽을 처리하는 서비스 개발 경험 보유',
    'MSA 기반 시스템 설계 및 운영 경험, 특히 결제/금융 도메인에서의 안정적인 서비스 구축 역량',
    'Kotlin/Java 기반 Spring 생태계에 능숙하며, 시스템 성능 최적화와 장애 대응에 강점',
  ],

  workExperiences: [
    // 토스 (현재 재직 중)
    {
      company: '비바리퍼블리카 (토스)',
      companyDescription:
        '월간 활성 사용자 2,000만명 이상의 종합 금융 플랫폼. 간편송금, 결제, 보험, 증권, 대출 등 다양한 금융 서비스 제공',
      employeeType: 'FULL_TIME',
      jobLevel: 'Senior Engineer',
      duration: {
        startDate: '2022-03',
        endDate: null,
        isCurrent: true,
      },
      position: ['Server Developer', 'Payment Platform Team'],
      techStack: [
        'Kotlin',
        'Spring Boot',
        'Spring WebFlux',
        'MySQL',
        'Redis',
        'Kafka',
        'Kubernetes',
        'ArgoCD',
        'Datadog',
      ],
      links: [],
      architecture: {
        description:
          '토스페이 결제 플랫폼의 MSA 아키텍처 기반 서버 개발. 결제 승인/취소/정산 파이프라인 담당. 이벤트 드리븐 아키텍처로 서비스 간 느슨한 결합 유지',
        mermaid: null,
      },
      keyAchievements: [
        {
          title: '결제 승인 API 성능 최적화',
          problems: [
            '토스페이 결제 승인 API의 P99 레이턴시가 800ms를 초과하여 가맹점 이탈률 증가',
            '피크 시간대(점심/저녁) 결제 실패율이 0.3%까지 상승하며 사용자 경험 저하',
          ],
          actions: [
            'Redis Pipeline을 활용한 다중 조회 최적화로 네트워크 왕복 횟수 감소',
            '결제 검증 로직의 병렬 처리 도입 (CompletableFuture → Kotlin Coroutines 전환)',
            '핫스팟 데이터에 대한 로컬 캐시 레이어 추가 (Caffeine Cache)',
            '슬로우 쿼리 분석 및 인덱스 튜닝, 불필요한 JOIN 제거',
          ],
          results: [
            'P99 레이턴시 800ms → 150ms로 81% 개선',
            '피크 시간대 결제 실패율 0.3% → 0.05% 감소',
            '가맹점 만족도 조사에서 결제 속도 항목 15% 상승',
          ],
          reflections: [
            '성능 최적화는 측정 가능한 지표 설정이 핵심임을 깨달음',
            '캐시 전략 수립 시 데이터 일관성과 성능 사이의 트레이드오프 고려 필요',
          ],
        },
        {
          title: '결제 시스템 장애 대응 체계 구축',
          problems: [
            '카드사 API 장애 시 전체 결제 서비스가 중단되는 SPOF 문제 존재',
            '장애 발생 시 수동 대응으로 인한 MTTR(평균 복구 시간)이 30분 이상 소요',
          ],
          actions: [
            'Circuit Breaker 패턴 도입으로 장애 전파 방지 (Resilience4j)',
            '카드사별 Fallback 라우팅 로직 구현 (Primary → Secondary 자동 전환)',
            'PagerDuty 연동 자동 알림 시스템 및 Runbook 기반 대응 프로세스 수립',
            '주요 장애 시나리오별 Chaos Engineering 테스트 자동화',
          ],
          results: [
            '카드사 장애 시에도 대체 결제 수단으로 서비스 연속성 99.95% 유지',
            'MTTR 30분 → 5분으로 83% 단축',
            '분기별 장애 대응 훈련을 통한 팀 대응 역량 강화',
          ],
          reflections: [
            '장애는 발생할 수 있다는 전제 하에 시스템을 설계해야 함',
            'Chaos Engineering을 통한 사전 검증의 중요성 체감',
          ],
        },
      ],
    },

    // 네이버 (이전 직장)
    {
      company: '네이버',
      companyDescription:
        '대한민국 최대 포털 및 IT 플랫폼 기업. 검색, 커머스, 콘텐츠, 클라우드 등 다양한 서비스 운영',
      employeeType: 'FULL_TIME',
      jobLevel: 'Software Engineer',
      duration: {
        startDate: '2019-07',
        endDate: '2022-02',
        isCurrent: false,
      },
      position: ['Software Engineer', 'Search Platform Team'],
      techStack: [
        'Java',
        'Spring Boot',
        'Spring Batch',
        'MySQL',
        'Redis',
        'Kafka',
        'Elasticsearch',
        'Hadoop',
        'Spark',
      ],
      links: [],
      architecture: {
        description:
          '네이버 통합검색 백엔드 서비스 개발. 일 평균 10억 건 이상의 검색 요청 처리. 검색 인덱싱 파이프라인 및 API 서버 담당',
        mermaid: null,
      },
      keyAchievements: [
        {
          title: '검색 API 응답 속도 개선',
          problems: [
            '통합검색 API의 평균 응답 시간이 경쟁사 대비 느려 사용자 이탈 발생',
            '특정 검색어 쿼리에서 타임아웃 빈발 (복합 조건 검색)',
          ],
          actions: [
            'Elasticsearch 쿼리 최적화 및 스코어링 로직 개선',
            '검색 결과 프리페칭 레이어 도입으로 인기 검색어 캐시 적중률 향상',
            '검색 서버 파티셔닝 전략 변경 (해시 기반 → 시간 기반)',
            'GC 튜닝 및 JVM 옵션 최적화',
          ],
          results: [
            '평균 응답 시간 120ms → 45ms로 62% 개선',
            '타임아웃 발생률 0.5% → 0.02%로 감소',
            '검색 서비스 NPS(순추천지수) 8점 상승',
          ],
          reflections: [
            '대규모 트래픽 환경에서의 캐시 전략과 분산 시스템 설계 역량 습득',
            '검색 품질과 응답 속도 사이의 균형점을 찾는 것이 중요함',
          ],
        },
        {
          title: '실시간 검색어 순위 시스템 재구축',
          problems: [
            '기존 배치 기반 검색어 순위 시스템의 갱신 주기가 5분으로 실시간성 부족',
            '트래픽 급증 시 순위 계산 지연으로 인한 정확도 저하',
          ],
          actions: [
            'Kafka Streams 기반 실시간 집계 파이프라인 구축',
            'Sliding Window 알고리즘으로 순위 변동 스무딩 처리',
            'Redis Sorted Set을 활용한 실시간 순위 조회 구현',
            'A/B 테스트를 통한 순위 알고리즘 검증 체계 마련',
          ],
          results: [
            '순위 갱신 주기 5분 → 10초로 30배 개선',
            '실시간 검색어 페이지 체류 시간 25% 증가',
            '시스템 리소스 사용량은 오히려 15% 감소 (효율적인 스트림 처리)',
          ],
          reflections: [
            '스트림 처리 아키텍처의 장점과 배치 처리와의 적절한 조합 학습',
            '데이터 파이프라인 설계 시 backpressure 처리의 중요성 인지',
          ],
        },
      ],
    },
  ],

  projectExperiences: [
    // 졸업 프로젝트
    {
      projectName: '캠퍼스마켓',
      projectDescription:
        '대학교 내 중고거래 및 공동구매 플랫폼. 교내 인증 시스템을 통한 신뢰 기반 거래와 실시간 채팅 기능 제공',
      projectType: 'ACADEMIC',
      teamComposition:
        '백엔드 2명, 프론트엔드 2명, 디자이너 1명 (총 5명, PM 겸임)',
      duration: {
        startDate: '2018-09',
        endDate: '2019-02',
        isCurrent: false,
      },
      position: ['Backend Lead', 'PM'],
      techStack: [
        'Java',
        'Spring Boot',
        'MySQL',
        'Redis',
        'WebSocket',
        'AWS EC2',
        'AWS RDS',
        'React',
      ],
      links: ['https://github.com/campus-market/backend'],
      architecture: {
        description:
          'Spring Boot 기반 REST API 서버와 WebSocket을 활용한 실시간 채팅 서버 분리 구성. AWS 프리티어를 활용한 클라우드 배포',
        mermaid: null,
      },
      keyAchievements: [
        {
          title: '실시간 채팅 시스템 구현',
          problems: [
            '중고거래 특성상 판매자-구매자 간 빠른 소통이 필요하나 기존 게시판 댓글 방식은 불편함',
            '실시간 통신 경험이 없어 기술 선택과 구현에 어려움',
          ],
          actions: [
            'WebSocket과 STOMP 프로토콜을 활용한 양방향 통신 구현',
            '채팅 메시지 영구 저장을 위한 MongoDB 도입 검토 후 MySQL JSON 타입으로 결정 (러닝커브 고려)',
            'Redis Pub/Sub을 활용한 다중 서버 환경 대비 설계',
            'Socket 연결 상태 관리 및 재연결 로직 구현',
          ],
          results: [
            '교내 사용자 500명 이상 확보, 동시 채팅 100건 이상 처리',
            '졸업작품 전시회에서 우수상 수상',
            '거래 성사율이 기존 에브리타임 대비 40% 높음 (설문 조사 기반)',
          ],
          reflections: [
            '처음으로 실시간 시스템을 구현하며 WebSocket의 동작 원리와 상태 관리의 복잡성을 이해',
            '팀 리드 경험을 통해 기술 결정에서의 트레이드오프와 팀원 역량을 고려한 기술 선택의 중요성 체감',
          ],
        },
      ],
    },
  ],

  educations: [
    {
      institution: '중앙대학교',
      major: '컴퓨터공학과',
      degree: 'BACHELOR',
      duration: {
        startDate: '2015-03',
        endDate: '2019-02',
        isCurrent: false,
      },
      description:
        'GPA 3.8/4.5, 학부 우수 졸업. 자료구조, 알고리즘, 운영체제, 데이터베이스, 네트워크 과목 수강. ACM-ICPC 교내 예선 참가',
    },
  ],
}

/**
 * Sample resume parse result V2 - Frontend Developer
 *
 * 프로필: 4년차 프론트엔드 개발자
 * - 경력: 카카오 (2020-2022) → 당근마켓 (2022-현재)
 * - 학력: 서울대학교 컴퓨터공학부
 * - 오픈소스: React Table 라이브러리 기여
 */
export const SAMPLE_RESUME_PARSE_RESULT_V2: ResumeParseResultV2 = {
  summary: [
    '4년차 프론트엔드 개발자로, 카카오와 당근마켓에서 대규모 사용자 서비스 UI 개발 경험 보유',
    '디자인 시스템 구축 및 컴포넌트 라이브러리 설계 역량, 재사용 가능한 UI 아키텍처 전문성',
    'Core Web Vitals 기반 웹 성능 최적화와 웹 접근성(WCAG 2.1) 구현에 강점',
  ],

  workExperiences: [
    // 당근마켓 (현재 재직 중)
    {
      company: '당근마켓',
      companyDescription:
        '월간 활성 사용자 1,800만명 이상의 지역 기반 중고거래 및 커뮤니티 플랫폼. 하이퍼로컬 서비스의 선두주자',
      employeeType: 'FULL_TIME',
      jobLevel: 'Senior Frontend Engineer',
      duration: {
        startDate: '2022-05',
        endDate: null,
        isCurrent: true,
      },
      position: ['Frontend Engineer', 'Design System Team'],
      techStack: [
        'TypeScript',
        'React',
        'Next.js',
        'Emotion',
        'Storybook',
        'Turborepo',
        'Radix UI',
        'Playwright',
        'Chromatic',
      ],
      links: [],
      architecture: {
        description:
          '당근마켓 전사 디자인 시스템 "Seed Design" 개발 및 운영. 모노레포 기반 컴포넌트 라이브러리와 토큰 시스템 관리. Figma-Code 동기화 파이프라인 구축',
        mermaid: null,
      },
      keyAchievements: [
        {
          title: '전사 디자인 시스템 "Seed Design" 구축',
          problems: [
            '10개 이상의 프로덕트 팀에서 각자 UI 컴포넌트를 구현하여 디자인 불일치 및 개발 비효율 발생',
            '디자이너-개발자 간 커뮤니케이션 비용이 높고, 디자인 변경 시 전체 서비스 반영에 2주 이상 소요',
          ],
          actions: [
            'Radix UI 기반 Headless 컴포넌트와 Emotion 스타일링을 조합한 유연한 아키텍처 설계',
            'Design Token을 JSON으로 관리하고 Figma Plugin으로 양방향 동기화 구현',
            'Storybook + Chromatic을 활용한 시각적 회귀 테스트 자동화',
            '컴포넌트별 API 문서화 및 사용 가이드라인 작성, 내부 교육 세션 진행',
          ],
          results: [
            '전사 10개 팀에서 채택, 컴포넌트 재사용률 85% 달성',
            'UI 개발 시간 평균 40% 단축 (자체 설문 조사)',
            '디자인 변경 시 전체 서비스 반영 시간 2주 → 2일로 단축',
          ],
          reflections: [
            '디자인 시스템은 기술적 완성도보다 팀 간 합의와 거버넌스가 더 중요함을 깨달음',
            'Headless UI 패턴의 유연성과 스타일 분리의 장점을 깊이 이해',
          ],
        },
        {
          title: 'Core Web Vitals 최적화로 SEO 순위 개선',
          problems: [
            '당근마켓 웹 서비스의 LCP(Largest Contentful Paint)가 4초 이상으로 Google 권장 기준 미달',
            'CLS(Cumulative Layout Shift) 점수 0.25 이상으로 사용자 경험 저하 및 검색 순위 하락',
          ],
          actions: [
            'Next.js Image 컴포넌트와 AVIF/WebP 포맷 적용으로 이미지 최적화',
            '동적 import와 React.lazy를 활용한 코드 스플리팅 및 Critical CSS 인라인화',
            'Skeleton UI 도입으로 레이아웃 시프트 방지',
            'Lighthouse CI를 PR 체크에 통합하여 성능 회귀 방지',
          ],
          results: [
            'LCP 4.2초 → 1.8초로 57% 개선',
            'CLS 0.25 → 0.05로 80% 개선',
            'Google 검색 노출 순위 평균 5단계 상승, 오가닉 트래픽 30% 증가',
          ],
          reflections: [
            '웹 성능은 사용자 경험뿐만 아니라 비즈니스 지표에 직접적인 영향을 미침',
            'CI/CD 파이프라인에 성능 지표를 통합하는 것이 지속적인 품질 관리의 핵심',
          ],
        },
      ],
    },

    // 카카오 (이전 직장)
    {
      company: '카카오',
      companyDescription:
        '대한민국 대표 IT 플랫폼 기업. 카카오톡, 카카오페이, 카카오맵 등 다양한 서비스 운영',
      employeeType: 'FULL_TIME',
      jobLevel: 'Frontend Developer',
      duration: {
        startDate: '2020-07',
        endDate: '2022-04',
        isCurrent: false,
      },
      position: ['Frontend Developer', '카카오톡 Web Platform Team'],
      techStack: [
        'JavaScript',
        'TypeScript',
        'React',
        'Redux',
        'Redux-Saga',
        'Webpack',
        'Babel',
        'Jest',
        'Cypress',
      ],
      links: [],
      architecture: {
        description:
          '카카오톡 PC 웹 버전 프론트엔드 개발. 실시간 메시징 UI와 복잡한 상태 관리. WebSocket 기반 양방향 통신 처리',
        mermaid: null,
      },
      keyAchievements: [
        {
          title: '카카오톡 PC 웹 React 마이그레이션',
          problems: [
            '레거시 jQuery 기반 코드베이스로 인해 신규 기능 개발 속도 저하 및 버그 발생 빈번',
            '상태 관리 부재로 복잡한 채팅 UI 로직 유지보수 어려움',
          ],
          actions: [
            'Feature-Sliced Design 아키텍처를 참고한 모듈화 전략 수립',
            'Redux + Redux-Saga 기반 상태 관리 도입으로 복잡한 비동기 흐름 처리',
            '점진적 마이그레이션 전략: 신규 페이지는 React, 기존 페이지는 단계적 전환',
            '컴포넌트 단위 테스트(Jest) 및 E2E 테스트(Cypress) 커버리지 확보',
          ],
          results: [
            '코드 커버리지 0% → 75% 달성',
            '신규 기능 개발 속도 2배 향상 (스프린트당 처리 티켓 수 기준)',
            '프로덕션 버그 발생률 60% 감소',
          ],
          reflections: [
            '레거시 마이그레이션은 "빅뱅" 보다 점진적 접근이 리스크 관리에 효과적',
            '상태 관리 라이브러리 선택 시 팀의 학습 곡선과 프로젝트 복잡도를 함께 고려해야 함',
          ],
        },
        {
          title: '웹 번들 사이즈 최적화',
          problems: [
            '초기 번들 사이즈가 2.5MB를 초과하여 모바일 환경에서 로딩 시간 8초 이상',
            '불필요한 폴리필과 미사용 라이브러리로 인한 번들 비대화',
          ],
          actions: [
            'Webpack Bundle Analyzer로 번들 구성 분석 및 미사용 코드 제거',
            'Tree Shaking 최적화를 위한 ES Module 전환 및 sideEffects 설정',
            'moment.js → date-fns, lodash → lodash-es 등 경량 라이브러리로 교체',
            'Dynamic Import를 활용한 라우트 기반 코드 스플리팅',
          ],
          results: [
            '초기 번들 사이즈 2.5MB → 800KB로 68% 감소',
            '모바일 First Contentful Paint 8초 → 2.5초로 개선',
            '사용자 이탈률 15% 감소 (GA 기준)',
          ],
          reflections: [
            '번들 최적화는 일회성이 아닌 지속적인 모니터링이 필요한 작업',
            '라이브러리 선택 시 번들 사이즈 영향도를 사전에 검토하는 습관 형성',
          ],
        },
      ],
    },
  ],

  projectExperiences: [
    // 오픈소스 프로젝트
    {
      projectName: 'React Virtual Table',
      projectDescription:
        '대용량 데이터를 효율적으로 렌더링하는 React 테이블 라이브러리. 가상화(Virtualization) 기반으로 수만 행 데이터도 부드럽게 처리',
      projectType: 'OPEN_SOURCE',
      teamComposition: '코어 메인테이너 3명, 외부 컨트리뷰터 20명+',
      duration: {
        startDate: '2021-03',
        endDate: null,
        isCurrent: true,
      },
      position: ['Core Maintainer', 'Lead Developer'],
      techStack: [
        'TypeScript',
        'React',
        'Rollup',
        'Jest',
        'React Testing Library',
        'Changesets',
      ],
      links: [
        'https://github.com/example/react-virtual-table',
        'https://react-virtual-table.dev',
      ],
      architecture: {
        description:
          'Headless UI 패턴 기반 테이블 라이브러리. 코어 로직과 렌더링 분리로 다양한 UI 프레임워크 지원. Window Virtualization으로 DOM 노드 최소화',
        mermaid: null,
      },
      keyAchievements: [
        {
          title: '가상화 테이블 라이브러리 개발 및 오픈소스 운영',
          problems: [
            '기존 React 테이블 라이브러리들이 1만 행 이상 데이터에서 심각한 성능 저하 발생',
            '대부분의 라이브러리가 특정 스타일링 솔루션에 종속되어 커스터마이징 어려움',
          ],
          actions: [
            'Intersection Observer API 기반 Window Virtualization 구현으로 가시 영역만 렌더링',
            'Headless UI 패턴 적용으로 로직과 스타일 완전 분리, 어댑터 패턴으로 다양한 UI 라이브러리 지원',
            '성능 벤치마크 자동화 및 GitHub Actions CI/CD 파이프라인 구축',
            '상세한 API 문서화와 다양한 예제 제공, Discord 커뮤니티 운영',
          ],
          results: [
            'npm 월간 다운로드 12만 회 달성',
            'GitHub 스타 2.5K 획득',
            '10만 행 데이터 렌더링 시 경쟁 라이브러리 대비 10배 빠른 성능',
          ],
          reflections: [
            '오픈소스 운영은 코드 품질만큼 문서화와 커뮤니티 관리가 중요',
            'Breaking Change 관리와 시맨틱 버저닝의 중요성을 실감',
          ],
        },
      ],
    },
  ],

  educations: [
    {
      institution: '서울대학교',
      major: '컴퓨터공학부',
      degree: 'BACHELOR',
      duration: {
        startDate: '2016-03',
        endDate: '2020-02',
        isCurrent: false,
      },
      description:
        'GPA 3.9/4.3, 학부 수석 졸업. HCI(Human-Computer Interaction) 연구실 학부연구생. 웹 프로그래밍, UI/UX 설계, 소프트웨어 공학 과목 수강',
    },
  ],
}

/**
 * Sample resume parse result - US Big Tech Backend Engineer
 *
 * Profile: 6-year Backend Engineer
 * - Career: Stripe (2019-2022) → Google (2022-Present)
 * - Education: UC Berkeley Computer Science
 * - Side Project: Open-source distributed cache library
 */
export const SAMPLE_RESUME_PARSE_RESULT_US_BACKEND: ResumeParseResultV2 = {
  summary: [
    '6-year backend engineer with experience building high-scale distributed systems at Stripe and Google',
    'Deep expertise in payment infrastructure, real-time data processing, and microservices architecture handling millions of QPS',
    'Proficient in Go, Java, and Python with strong focus on system reliability, observability, and performance optimization',
  ],

  workExperiences: [
    // Google (Current)
    {
      company: 'Google',
      companyDescription:
        'Global technology leader operating the largest search engine, cloud platform, and various consumer products serving billions of users worldwide',
      employeeType: 'FULL_TIME',
      jobLevel: 'Senior Software Engineer (L5)',
      duration: {
        startDate: '2022-06',
        endDate: null,
        isCurrent: true,
      },
      position: ['Senior Software Engineer', 'Cloud Spanner Team'],
      techStack: [
        'Go',
        'C++',
        'Spanner',
        'Bigtable',
        'Pub/Sub',
        'Kubernetes',
        'gRPC',
        'Protocol Buffers',
        'Borgmon',
      ],
      links: [],
      architecture: {
        description:
          'Working on Cloud Spanner, a globally distributed, strongly consistent database. Responsible for query optimization layer and cross-region replication features serving enterprise customers',
        mermaid: null,
      },
      keyAchievements: [
        {
          title: 'Query Optimizer Enhancement for Complex Joins',
          problems: [
            'Customer workloads with multi-table joins experienced 10x latency degradation compared to single-table queries',
            'Existing cost-based optimizer failed to generate efficient execution plans for interleaved table hierarchies',
          ],
          actions: [
            'Designed and implemented a new join reordering algorithm leveraging Spanner-specific locality hints',
            'Introduced statistics collection for interleaved table relationships to improve cardinality estimation',
            'Built A/B testing framework to validate optimizer changes against production workloads',
            'Collaborated with SRE team to establish latency budgets and alerting for regression detection',
          ],
          results: [
            'Reduced P99 latency for complex join queries by 65% (from 2.5s to 850ms)',
            'Improved query throughput by 40% for affected workloads',
            'Enabled 3 enterprise customers to migrate legacy Oracle workloads to Spanner',
          ],
          reflections: [
            'Database internals optimization requires deep understanding of both theoretical foundations and real-world access patterns',
            'Rigorous A/B testing is essential when changing query planners—small changes can have unexpected cascading effects',
          ],
        },
        {
          title: 'Cross-Region Replication Latency Optimization',
          problems: [
            'Synchronous replication to distant regions (US to Europe) added 150ms+ to write latency, impacting customer SLAs',
            'Customers requested options to trade consistency for latency in specific use cases',
          ],
          actions: [
            'Designed "Bounded Staleness" read mode with configurable staleness bounds for read replicas',
            'Implemented asynchronous replication pathway with exactly-once delivery guarantees using Pub/Sub',
            'Created comprehensive documentation and migration guides for customers adopting new consistency modes',
            'Led design review process with 5 senior engineers across 3 teams',
          ],
          results: [
            'Reduced cross-region read latency by 80% for customers opting into bounded staleness',
            'Feature adopted by 40+ enterprise customers within first quarter of launch',
            'Contributed to $12M ARR increase attributed to improved global deployment flexibility',
          ],
          reflections: [
            'Distributed systems design requires clear communication of consistency trade-offs to users',
            'Cross-team collaboration is crucial for large infrastructure changes—invested heavily in design docs and alignment meetings',
          ],
        },
      ],
    },

    // Stripe (Previous)
    {
      company: 'Stripe',
      companyDescription:
        'Leading financial infrastructure platform processing hundreds of billions of dollars annually for millions of businesses worldwide',
      employeeType: 'FULL_TIME',
      jobLevel: 'Software Engineer',
      duration: {
        startDate: '2019-08',
        endDate: '2022-05',
        isCurrent: false,
      },
      position: ['Software Engineer', 'Payments Core Team'],
      techStack: [
        'Ruby',
        'Go',
        'Java',
        'PostgreSQL',
        'Redis',
        'Kafka',
        'AWS',
        'Terraform',
        'Datadog',
      ],
      links: [],
      architecture: {
        description:
          'Built and maintained core payment processing infrastructure handling card authorizations, captures, and refunds. Owned the idempotency layer ensuring exactly-once payment processing',
        mermaid: null,
      },
      keyAchievements: [
        {
          title: 'Payment Idempotency System Redesign',
          problems: [
            'Legacy idempotency implementation caused duplicate charges during network partitions, resulting in customer chargebacks',
            'Existing system used database locks causing throughput bottlenecks during peak traffic (Black Friday)',
          ],
          actions: [
            'Designed lock-free idempotency mechanism using Redis with Lua scripts for atomic operations',
            'Implemented two-phase commit pattern with compensation logic for partial failure scenarios',
            'Built comprehensive chaos testing suite simulating network partitions and database failures',
            'Created runbook and trained on-call team on new failure modes and mitigation strategies',
          ],
          results: [
            'Eliminated duplicate charge incidents completely (previously 5-10 per month)',
            'Increased peak throughput capacity by 3x (from 10K to 30K TPS)',
            'Reduced P99 latency for idempotent requests from 200ms to 50ms',
          ],
          reflections: [
            'Financial systems require paranoid-level testing—every edge case can result in real money loss',
            'Distributed transactions are hard; prefer idempotent operations with compensation over distributed locks',
          ],
        },
        {
          title: 'Real-time Fraud Detection Pipeline',
          problems: [
            'Batch-based fraud detection had 15-minute delay, allowing fraudulent transactions to complete before detection',
            'Existing rule engine could not scale to evaluate complex ML model outputs in real-time',
          ],
          actions: [
            'Architected streaming pipeline using Kafka Streams for real-time feature computation',
            'Integrated ML model serving via gRPC with circuit breaker pattern for graceful degradation',
            'Implemented feature store for consistent feature computation between training and inference',
            'Designed shadow mode deployment strategy for safe production rollout of new models',
          ],
          results: [
            'Reduced fraud detection latency from 15 minutes to under 100ms',
            'Blocked an additional $2.3M in fraudulent transactions monthly',
            'Enabled real-time risk scoring for 99.9% of transactions without impacting checkout latency',
          ],
          reflections: [
            'Stream processing architecture requires careful consideration of exactly-once semantics and late-arriving data',
            'ML systems in production need robust fallback mechanisms—models can fail in unexpected ways',
          ],
        },
      ],
    },
  ],

  projectExperiences: [
    // Open Source Project
    {
      projectName: 'go-distcache',
      projectDescription:
        'A high-performance distributed caching library for Go applications. Implements consistent hashing with virtual nodes and supports both write-through and write-behind caching strategies',
      projectType: 'OPEN_SOURCE',
      teamComposition: 'Solo maintainer with 15+ external contributors',
      duration: {
        startDate: '2021-01',
        endDate: null,
        isCurrent: true,
      },
      position: ['Creator', 'Lead Maintainer'],
      techStack: [
        'Go',
        'Redis',
        'Memcached',
        'Protocol Buffers',
        'GitHub Actions',
        'Prometheus',
      ],
      links: [
        'https://github.com/example/go-distcache',
        'https://pkg.go.dev/github.com/example/go-distcache',
      ],
      architecture: {
        description:
          'Pluggable caching library with support for multiple backends (Redis, Memcached, in-memory). Features include consistent hashing, request coalescing (singleflight), and built-in metrics',
        mermaid: null,
      },
      keyAchievements: [
        {
          title: 'Building Production-Grade Distributed Cache Library',
          problems: [
            'Existing Go caching libraries lacked support for distributed invalidation and consistent hashing',
            'Teams at previous companies repeatedly built similar caching abstractions from scratch',
          ],
          actions: [
            'Implemented consistent hashing with virtual nodes for uniform key distribution',
            'Added request coalescing using singleflight pattern to prevent cache stampede',
            'Built comprehensive test suite including chaos tests for network partition scenarios',
            'Created detailed documentation with examples for common use cases and migration guides',
          ],
          results: [
            'Reached 5K+ GitHub stars and 500K+ monthly downloads on pkg.go.dev',
            'Adopted by 3 Fortune 500 companies in production environments',
            'Featured in GopherCon 2023 lightning talks',
          ],
          reflections: [
            'Open source success requires consistent maintenance and responsive community engagement',
            'Good documentation and examples are as important as the code itself for adoption',
          ],
        },
      ],
    },
  ],

  educations: [
    {
      institution: 'University of California, Berkeley',
      major: 'Computer Science',
      degree: 'BACHELOR',
      duration: {
        startDate: '2015-08',
        endDate: '2019-05',
        isCurrent: false,
      },
      description:
        'GPA 3.85/4.0, Magna Cum Laude. Focus on distributed systems and database theory. Teaching Assistant for CS 162 (Operating Systems). Member of Upsilon Pi Epsilon honor society',
    },
  ],
}
