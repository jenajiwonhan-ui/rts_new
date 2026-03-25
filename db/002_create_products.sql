-- ============================================================
-- RTS Dashboard - 제품 테이블 (products)
-- alias, product_owner는 NULL — 추후 직접 지정
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    alias           VARCHAR(100),
    product_owner   VARCHAR(50),
    color           VARCHAR(9),
    is_active       BOOLEAN DEFAULT TRUE,
    sort_order      SMALLINT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_owner ON products(product_owner);

-- ============================================================
-- 제품 데이터 INSERT
-- ============================================================
INSERT INTO products (id, name, alias, product_owner, color, sort_order) VALUES
( 1, 'ArcheryKing',                NULL, NULL,   '#a890d0',  1),
( 2, 'Backpack Arena',             NULL, NULL,   '#70b8a8',  2),
( 3, 'Battlegrounds Mobile India', NULL, NULL,   '#60b898',  3),
( 4, 'Bullet Echo',                NULL, NULL,   '#d080a0',  4),
( 5, 'Copperhead',                 NULL, NULL,   '#78b0c0',  5),
( 6, 'Dinkum Original',            'DKO',     'GPD3', '#b898c8',  6),
( 7, 'Garuda Saga',                NULL, NULL,   '#a0b070',  7),
( 8, 'Hi-Fi Rush',                 NULL, NULL,   '#d49878',  8),
( 9, 'Mimesis',                    NULL, NULL,   '#b8b068',  9),
(10, 'New State Mobile',           NULL, NULL,   '#c890a8', 10),
(11, 'Non-product',                NULL, NULL,   '#b8bcc5', 11),
(12, 'PUBG Mobile(Global)',        NULL, NULL,   '#78c0a0', 12),
(13, 'PUBG Mobile(JP)',            NULL, NULL,   '#70b8a8', 13),
(14, 'PUBG Mobile(KR)',            NULL, NULL,   '#80c8b0', 14),
(15, 'PUBG PC/Console',            NULL, NULL,   '#68b0a0', 15),
(16, 'Palworld Mobile',            'PalM',    'GPD1', '#78c0b0', 16),
(17, 'Project AB',                 NULL, NULL,   '#d48080', 17),
(18, 'Project ARC',                NULL, NULL,   '#80b898', 18),
(19, 'Project Black Budget',       NULL, NULL,   '#c8a868', 19),
(20, 'Project IMPACT',             'No Law',  'GPD2', '#dc9080', 20),
(21, 'Project Kafka',              NULL, NULL,   '#70b0b0', 21),
(22, 'Project MLP',                NULL, NULL,   '#b890c8', 22),
(23, 'Project Rivals',             NULL, NULL,   '#80a0b8', 23),
(24, 'Project UROPA',              NULL, NULL,   '#70c0a0', 24),
(25, 'Project Valor',              NULL, NULL,   '#b898c0', 25),
(26, 'Project Windless',           'Windless','GPD2', '#e4a868', 26),
(27, 'Project ZETA',               'ZETA',    'GPD3', '#a890d0', 27),
(28, 'Project inZOI',              'inZOI',   'GPD1', '#68b8d0', 28),
(29, 'Real Cricket',               NULL, NULL,   '#a0b878', 29),
(30, 'Sports Nation',              NULL, NULL,   '#b088a0', 30),
(31, 'Subnautica',                 NULL, NULL,   '#c080a0', 31),
(32, 'Subnautica 2',               'SN2',     'GPD1', '#78acd0', 32),
(33, 'Subnautica: Below Zero',     NULL, NULL,   '#b080a0', 33),
(34, 'The Ascent',                 'Ascent',  'GPD2', '#c09078', 34),
(35, 'The Callisto Protocol',      NULL, NULL,   '#70a8b0', 35),
(36, '휴가(Out of Office)',         NULL, NULL,   '#888e95', 36);

SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
