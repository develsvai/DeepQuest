-- PostgreSQL Extensions for Deep Quest

-- UUID 생성
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Full Text Search (한글 검색 지원)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- JSON 처리 강화
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 성능 모니터링
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

COMMENT ON EXTENSION "uuid-ossp" IS 'UUID generation functions';
COMMENT ON EXTENSION "pg_trgm" IS 'Trigram matching for text search';

