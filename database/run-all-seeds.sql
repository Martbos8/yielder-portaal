-- ============================================================
-- Master Seed Script — voert alle demo data SQL uit
-- ============================================================
-- Volgorde is belangrijk: eerst schema (000), dan catalog (011-015),
-- dan demo data (020-023)
--
-- GEBRUIK:
--   Kopieer de inhoud van elk bestand in volgorde naar de Supabase SQL Editor
--   OF voer dit script uit als je directe DB toegang hebt.
--
-- BESTANDEN:
--   1. database/000_complete_setup.sql   — Schema + Bakkerij Groot data
--   2. database/011_product_catalog.sql  — Product catalogus (al in 000)
--   3. database/012_recommendation_feedback.sql — Feedback tabel (al in 000)
--   4. database/013_distributor_prices.sql — Prijzen tabel (al in 000)
--   5. database/014_contact_requests.sql — Contact requests (al in 000)
--   6. database/015_login_flow.sql       — Login flow policies
--   7. database/020_demo_veldhuis.sql    — Veldhuis demo data
--   8. database/021_demo_rensen.sql      — Rensen demo data
--   9. database/022_distributor_prices.sql — Distributeur prijzen
--  10. database/023_recommendation_feedback.sql — Feedback data
--
-- NB: 000_complete_setup.sql bevat al de tabeldefinities uit 011-014.
-- De losse migratie bestanden (011-015) zijn alleen nodig als je
-- de schema's incrementeel wilt toepassen.
-- ============================================================


-- ============================================================
-- VERIFICATIE QUERIES — voer uit na alle seeds
-- ============================================================

-- 1. Records per bedrijf per tabel
SELECT 'TICKETS' AS tabel, c.name, COUNT(t.id) AS records
FROM companies c
LEFT JOIN tickets t ON t.company_id = c.id
GROUP BY c.name
ORDER BY c.name;

SELECT 'HARDWARE' AS tabel, c.name, COUNT(h.id) AS records
FROM companies c
LEFT JOIN hardware_assets h ON h.company_id = c.id
GROUP BY c.name
ORDER BY c.name;

SELECT 'AGREEMENTS' AS tabel, c.name, COUNT(a.id) AS records
FROM companies c
LEFT JOIN agreements a ON a.company_id = c.id
GROUP BY c.name
ORDER BY c.name;

SELECT 'CONTACTS' AS tabel, c.name, COUNT(ct.id) AS records
FROM companies c
LEFT JOIN contacts ct ON ct.company_id = c.id
GROUP BY c.name
ORDER BY c.name;

SELECT 'LICENSES' AS tabel, c.name, COUNT(l.id) AS records
FROM companies c
LEFT JOIN licenses l ON l.company_id = c.id
GROUP BY c.name
ORDER BY c.name;

SELECT 'NOTIFICATIONS' AS tabel, c.name, COUNT(n.id) AS records
FROM companies c
LEFT JOIN notifications n ON n.company_id = c.id
GROUP BY c.name
ORDER BY c.name;

SELECT 'DOCUMENTS' AS tabel, c.name, COUNT(d.id) AS records
FROM companies c
LEFT JOIN documents d ON d.company_id = c.id
GROUP BY c.name
ORDER BY c.name;

SELECT 'CLIENT_PRODUCTS' AS tabel, c.name, COUNT(cp.id) AS records
FROM companies c
LEFT JOIN client_products cp ON cp.company_id = c.id
GROUP BY c.name
ORDER BY c.name;

-- 2. Distributor prijzen check
SELECT COUNT(*) AS total_distributor_prices FROM distributor_prices;
SELECT distributor, COUNT(*) AS products, ROUND(AVG(price)::numeric, 2) AS avg_price
FROM distributor_prices
GROUP BY distributor
ORDER BY distributor;

-- 3. Recommendation feedback check
SELECT c.name, COUNT(*) AS feedback_records
FROM recommendation_feedback rf
JOIN companies c ON c.id = rf.company_id
GROUP BY c.name;

SELECT action, COUNT(*) AS total
FROM recommendation_feedback
GROUP BY action
ORDER BY total DESC;

-- ============================================================
-- VERWACHTE RESULTATEN:
-- ============================================================
-- TICKETS:     Bakkerij=8,  Veldhuis=10, Rensen=12
-- HARDWARE:    Bakkerij=15, Veldhuis=20, Rensen=30
-- AGREEMENTS:  Bakkerij=5,  Veldhuis=6,  Rensen=8
-- CONTACTS:    Bakkerij=4,  Veldhuis=5,  Rensen=6
-- LICENSES:    Bakkerij=4,  Veldhuis=6,  Rensen=8
-- NOTIFICATIONS: Bakkerij=5, Veldhuis=6, Rensen=8
-- DOCUMENTS:   Bakkerij=4,  Veldhuis=4,  Rensen=5
-- CLIENT_PRODUCTS: Bakkerij=7, Veldhuis=13, Rensen=17
-- DISTRIBUTOR_PRICES: ~80 rijen
-- RECOMMENDATION_FEEDBACK: Bakkerij=20, Veldhuis=18, Rensen=22
-- ============================================================
