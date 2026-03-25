-- ============================================================
-- RTS Dashboard - 주간 투입률 원본 데이터 (rts_entries)
-- API: GET /rts/total/product/user/rate?year=&week=
-- ============================================================

CREATE TABLE IF NOT EXISTS rts_entries (
    id                          SERIAL PRIMARY KEY,
    year                        SMALLINT NOT NULL,
    week                        SMALLINT NOT NULL,
    week_starting               DATE NOT NULL,             -- 해당 주 월요일 날짜
    month                       CHAR(7) NOT NULL,          -- 귀속 월 "YYYY-MM" (7일 중 과반 기준)
    user_id                     INT NOT NULL,
    employee_number             VARCHAR(20) NOT NULL,
    display_name                VARCHAR(200) NOT NULL,
    user_state                  SMALLINT NOT NULL,         -- 0=재직, 1=휴직, 2=퇴사
    product_id                  VARCHAR(20) NOT NULL,
    product_name                VARCHAR(200) NOT NULL,
    participation_rate          NUMERIC(5,4) NOT NULL,     -- 0.0 ~ 1.0
    org_id                      VARCHAR(20) NOT NULL,
    org_name                    VARCHAR(200) NOT NULL,
    org_line_path               TEXT NOT NULL,             -- "KRAFTON HQ>...>Team"
    created_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- 주차+유저+프로덕트 기준 유니크 (upsert용, 주직만 저장)
CREATE UNIQUE INDEX IF NOT EXISTS idx_rts_entries_upsert
    ON rts_entries(year, week, user_id, product_id);

CREATE INDEX IF NOT EXISTS idx_rts_entries_year_week ON rts_entries(year, week);
CREATE INDEX IF NOT EXISTS idx_rts_entries_month ON rts_entries(month);
CREATE INDEX IF NOT EXISTS idx_rts_entries_user ON rts_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_rts_entries_product ON rts_entries(product_name);
CREATE INDEX IF NOT EXISTS idx_rts_entries_org ON rts_entries(org_name);
