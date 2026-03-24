# PostgreSQL for Deep Quest Development
FROM postgres:15-alpine

# 메타데이터
LABEL maintainer="deepquest"
LABEL description="PostgreSQL for Deep Quest Development"

# 필요한 패키지 설치
RUN apk add --no-cache \
    postgresql-contrib \
    curl

# 커스텀 PostgreSQL 설정 복사
COPY postgresql.conf /etc/postgresql/postgresql.conf

# 초기화 스크립트 복사
COPY init/*.sql /docker-entrypoint-initdb.d/

# 헬스체크 스크립트
COPY healthcheck.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/healthcheck.sh

# 데이터 디렉토리
VOLUME /var/lib/postgresql/data

# 포트
EXPOSE 5432

# 헬스체크
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
  CMD /usr/local/bin/healthcheck.sh

# PostgreSQL 실행 (커스텀 설정 사용)
CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]

