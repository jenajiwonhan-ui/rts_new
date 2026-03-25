-- ============================================================
-- RTS Dashboard - 조직도 테이블 (org_nodes)
-- 자기참조 구조, Level = 실제 꺽쇠(>) 깊이
--   Level 1: Division (최상위)
--   Level 2: Division 바로 아래 (Dept 또는 직할 Team)
--   Level 3: Level 2 아래 (Team 또는 직할 Part)
--   Level 4: Level 3 아래 (Part)
-- ============================================================

-- 테이블 생성
CREATE TABLE IF NOT EXISTS org_nodes (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    level       SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 4),
    parent_id   INT REFERENCES org_nodes(id),
    sort_order  SMALLINT DEFAULT 0,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_nodes_parent ON org_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_org_nodes_level  ON org_nodes(level);
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_nodes_name_parent ON org_nodes(name, COALESCE(parent_id, 0));

-- ============================================================
-- Level 1 (Division)
-- ============================================================
INSERT INTO org_nodes (id, name, level, parent_id, sort_order) VALUES
(1, 'EPS',  1, NULL, 1),
(2, 'GCD',  1, NULL, 2),
(3, 'NAPS', 1, NULL, 3),
(4, 'PSM',  1, NULL, 4),
(5, 'WPS',  1, NULL, 5);

-- ============================================================
-- Level 2 (Div 아래: Dept 또는 직할 Team)
-- ============================================================
INSERT INTO org_nodes (id, name, level, parent_id, sort_order) VALUES
-- EPS > Dept
(10, 'Greater China Publishing Dept.', 2, 1, 1),
(11, 'JP Publishing Dept.',            2, 1, 2),
(12, 'SEA Publishing Dept.',           2, 1, 3),
-- EPS > 직할 Team
(13, 'SEA Publishing Team',            2, 1, 4),

-- GCD > Dept
(20, 'Brand Creative Dept.',           2, 2, 1),
(21, 'Creative Cinematic Dept.',       2, 2, 2),
(22, 'Creative Producer Dept.',        2, 2, 3),

-- NAPS > 직할 Team
(30, 'NA Publishing Team',             2, 3, 1),
(31, 'NA Scale-Up Team',               2, 3, 2),

-- PSM > Dept
(40, 'Live Service Support Dept.',     2, 4, 1),
(41, 'Publishing QA Dept.',            2, 4, 2),

-- WPS > 직할 Team
(50, 'CIS Publishing Team',            2, 5, 1),
(51, 'EU Publishing Team',             2, 5, 2),
(52, 'MENA & LATAM Publishing Team',   2, 5, 3),
(53, 'West Publishing AI Ops. Team',   2, 5, 4),
(54, 'West Scale-Up Team 1',           2, 5, 5),
(55, 'West Scale-Up Team 2',           2, 5, 6),
(56, 'West Scale-Up Team 3',           2, 5, 7),
(57, 'West Scale-up Team',             2, 5, 8);

-- ============================================================
-- Level 3 (Dept > Team, 직할Team > Part, Dept > 직할Part)
-- ============================================================
INSERT INTO org_nodes (id, name, level, parent_id, sort_order) VALUES

-- EPS > Greater China Publishing Dept. > Team
(100, 'CN MarCom Team',                  3, 10, 1),
(101, 'CN Publishing Team',              3, 10, 2),
(102, 'CN Service Ops Team',             3, 10, 3),
-- EPS > Greater China Publishing Dept. > 직할 Part
(103, 'CN PM Part',                      3, 10, 4),
(104, 'Greater China Service Part',      3, 10, 5),
(105, 'TW Publishing Part',             3, 10, 6),

-- EPS > JP Publishing Dept. > Team
(110, 'JP MarCom Team',                  3, 11, 1),
(111, 'JP PM Team',                      3, 11, 2),
(112, 'JP Publishing Contents Team',     3, 11, 3),
(113, 'JP Publishing Management Team',   3, 11, 4),
-- EPS > JP Publishing Dept. > 직할 Part
(114, 'JP PR & Planning Part',           3, 11, 5),

-- EPS > SEA Publishing Team > Part
(120, 'SEA Content Part',                3, 13, 1),

-- GCD > Brand Creative Dept. > Team
(130, 'Creative Americas Production Team', 3, 20, 1),
(131, 'Graphic Design Team',               3, 20, 2),
(132, 'Motion Creative Team',              3, 20, 3),
(133, 'Video Creative Team',               3, 20, 4),
-- GCD > Brand Creative Dept. > 직할 Part
(134, 'Creative Americas Producer Part',   3, 20, 5),
(135, 'Sound Creative Part',               3, 20, 6),

-- GCD > Creative Cinematic Dept. > Team
(140, 'Cinematic Direction & Tech Team',   3, 21, 1),
(141, 'Cinematic Production Team',         3, 21, 2),
(142, 'Cinematic Solutions Team',          3, 21, 3),
(143, 'Creative Cinematic Team 1',         3, 21, 4),

-- GCD > Creative Producer Dept. > Team
(150, 'Creative Producer Team',            3, 22, 1),
(151, 'Creative Producer Team 4',          3, 22, 2),
(152, 'Creative Project Management Team',  3, 22, 3),
(153, 'Live Creative Team',                3, 22, 4),

-- NAPS > NA Publishing Team > Part
(160, 'NA Channels Part',                  3, 30, 1),
(161, 'NA Community & Social Part',        3, 30, 2),
(162, 'NA PR & Influencers Part',          3, 30, 3),

-- NAPS > NA Scale-Up Team > Part
(163, 'NA Scale-Up Part 1',                3, 31, 1),
(164, 'NA Scale-Up Part 2',                3, 31, 2),

-- PSM > Live Service Support Dept. > Team
(170, 'Customer Intelligence Team',        3, 40, 1),
(171, 'Live Ops Team',                     3, 40, 2),
(172, 'Live Ops Team 2',                   3, 40, 3),
(173, 'Live Ops Team 3',                   3, 40, 4),
(174, 'Live Service Planning Team',        3, 40, 5),
(175, 'Player Support Team',              3, 40, 6),
(176, 'Service Policy Team',              3, 40, 7),

-- PSM > Publishing QA Dept. > Team
(180, 'Compatibility & Optimization QA Team', 3, 41, 1),
(181, 'Platform Management Team',             3, 41, 2),
(182, 'Publishing QA Team 1',                 3, 41, 3),
(183, 'Publishing QA Team 2',                 3, 41, 4),
(184, 'Publishing QA Team 3',                 3, 41, 5),

-- WPS > CIS Publishing Team > Part
(190, 'CIS MarCom Part',                      3, 50, 1),
(191, 'CIS Publishing Operations Part',       3, 50, 2),

-- WPS > EU Publishing Team > Part
(192, 'EU MarCom Part',                        3, 51, 1),
(193, 'EU Publishing Operations Part',         3, 51, 2),
(194, 'West Creative Part',                    3, 51, 3),

-- WPS > MENA & LATAM Publishing Team > Part
(195, 'MENA & LATAM MarCom Part',              3, 52, 1),
(196, 'MENA & LATAM Publishing Operations Part', 3, 52, 2),

-- WPS > West Scale-up Team > Part
(197, 'West Publishing AI Ops Part',           3, 57, 1),
(198, 'West Scale-Up Part 1',                  3, 57, 2),
(199, 'West Scale-Up Part 2',                  3, 57, 3);

-- ============================================================
-- Level 4 (Dept > Team > Part)
-- ============================================================
INSERT INTO org_nodes (id, name, level, parent_id, sort_order) VALUES

-- EPS > Greater China Publishing Dept. > CN Publishing Team > Part
(200, 'CN MarCom Part',                       4, 101, 1),
(201, 'CN Publishing Mgmt Part',              4, 101, 2),

-- EPS > Greater China Publishing Dept. > CN Service Ops Team > Part
(202, 'CN Player Support Part',               4, 102, 1),
(203, 'CN Service Data Part',                 4, 102, 2),

-- EPS > JP Publishing Dept. > JP Publishing Contents Team > Part
(210, 'JP Art Part',                          4, 112, 1),
(211, 'JP Contents Part 1',                   4, 112, 2),
(212, 'JP Contents Part 2',                   4, 112, 3),

-- EPS > JP Publishing Dept. > JP Publishing Management Team > Part
(213, 'JP PR Part',                           4, 113, 1),
(214, 'JP Publishing Planning Part',          4, 113, 2),

-- GCD > Brand Creative Dept. > Creative Americas Production Team > Part
(220, 'Creative Americas Sound Part',         4, 130, 1),
(221, 'Creative Americas Video Part',         4, 130, 2),
(222, 'Creative Americas Visual Design Part', 4, 130, 3),

-- GCD > Brand Creative Dept. > Graphic Design Team > Part
(223, 'Design Creative Part',                 4, 131, 1),
(224, 'Motion Creative Part',                 4, 131, 2),

-- GCD > Brand Creative Dept. > Video Creative Team > Part
(225, 'Capture Artist Creative Part',         4, 133, 1),
(226, 'Video Creative Part',                  4, 133, 2),

-- GCD > Creative Cinematic Dept. > Cinematic Direction & Tech Team > Part
(230, 'Cinematic Motion Part',                4, 140, 1),

-- GCD > Creative Cinematic Dept. > Cinematic Production Team > Part
(231, 'Cinematic Animation Part',             4, 141, 1),
(232, 'Cinematic Asset Part',                 4, 141, 2),
(233, 'Cinematic FX Part',                    4, 141, 3),
(234, 'Cinematic Rigging Part',               4, 141, 4),
(235, 'Cinematic World Part',                 4, 141, 5),

-- GCD > Creative Cinematic Dept. > Creative Cinematic Team 1 > Part
(236, 'Cinematic Character Part',             4, 143, 1),

-- GCD > Creative Producer Dept. > Creative Producer Team > Part
(240, 'Creative Producer Part 1',             4, 150, 1),
(241, 'Creative Producer Part 2',             4, 150, 2),

-- GCD > Creative Producer Dept. > Live Creative Team > Part
(242, 'Live Creative Part 1',                 4, 153, 1),
(243, 'Live Creative Part 2',                 4, 153, 2),

-- PSM > Publishing QA Dept. > Publishing QA Team 1 > Part
(250, 'Publishing QA Part 1',                 4, 182, 1),
(251, 'Publishing QA Part 2',                 4, 182, 2),
(252, 'QA AI & Operations Part',              4, 182, 3),

-- PSM > Publishing QA Dept. > Publishing QA Team 2 > Part
(253, 'Publishing QA Part 3',                 4, 183, 1),
(254, 'Publishing QA Part 4',                 4, 183, 2);

-- 시퀀스를 마지막 ID 이후로 재설정
SELECT setval('org_nodes_id_seq', (SELECT MAX(id) FROM org_nodes));

-- ============================================================
-- 전체 트리 조회용 뷰
-- ============================================================
CREATE OR REPLACE VIEW v_org_tree AS
WITH RECURSIVE tree AS (
    SELECT id, name, level, parent_id, sort_order,
           name::TEXT AS path
    FROM org_nodes
    WHERE parent_id IS NULL

    UNION ALL

    SELECT c.id, c.name, c.level, c.parent_id, c.sort_order,
           t.path || ' > ' || c.name
    FROM org_nodes c
    JOIN tree t ON c.parent_id = t.id
)
SELECT * FROM tree ORDER BY path;
