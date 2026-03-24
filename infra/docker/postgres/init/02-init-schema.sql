-- Deep Quest Initial Schema Setup

-- 데이터베이스 소유자 확인
SELECT current_database(), current_user;

-- Prisma 스키마는 애플리케이션에서 관리하므로
-- 여기서는 기본 설정만

-- 타임스탬프 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

COMMENT ON FUNCTION update_updated_at_column() IS 'Auto-update updated_at timestamp';

-- 개발용 유틸리티 뷰
CREATE OR REPLACE VIEW db_size AS
SELECT
    pg_size_pretty(pg_database_size(current_database())) as size;

COMMENT ON VIEW db_size IS 'Current database size';

