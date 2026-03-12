-- ============================================================
-- Recommendation Feedback Data
-- Per bedrijf 15-25 feedback records
-- Acties: shown (veel), clicked (sommige), contacted (weinig),
--         purchased (heel weinig), dismissed (sommige)
-- Verspreid over laatste 3 maanden (jan-mrt 2026)
-- ============================================================

-- ============================================================
-- Bakkerij Groot & Zonen — 20 feedback records
-- Mist: endpoint protection, MFA, cloud backup, MDM, managed firewall
-- ============================================================

INSERT INTO recommendation_feedback (id, company_id, product_id, recommendation_score, action, created_at) VALUES
  -- FortiClient Endpoint Protection (FC-EP-100) — veel interactie, uiteindelijk purchased
  ('a0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'FC-EP-100'), 95, 'shown', '2026-01-05T10:00:00Z'),
  ('a0000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'FC-EP-100'), 95, 'shown', '2026-01-12T10:00:00Z'),
  ('a0000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'FC-EP-100'), 95, 'clicked', '2026-01-20T14:30:00Z'),
  ('a0000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'FC-EP-100'), 95, 'contacted', '2026-02-03T09:15:00Z'),
  ('a0000001-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'FC-EP-100'), 95, 'purchased', '2026-02-18T11:00:00Z'),

  -- MFA (MS-MFA) — clicked maar nog niet gekocht
  ('a0000001-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'MS-MFA'), 90, 'shown', '2026-01-08T10:00:00Z'),
  ('a0000001-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'MS-MFA'), 90, 'shown', '2026-01-22T10:00:00Z'),
  ('a0000001-0000-0000-0000-000000000008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'MS-MFA'), 90, 'clicked', '2026-02-10T15:00:00Z'),
  ('a0000001-0000-0000-0000-000000000009', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'MS-MFA'), 90, 'shown', '2026-03-01T10:00:00Z'),

  -- Cloud Backup (VBR-365) — alleen shown
  ('a0000001-0000-0000-0000-000000000010', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'VBR-365'), 85, 'shown', '2026-01-10T10:00:00Z'),
  ('a0000001-0000-0000-0000-000000000011', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'VBR-365'), 85, 'shown', '2026-02-05T10:00:00Z'),
  ('a0000001-0000-0000-0000-000000000012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'VBR-365'), 85, 'shown', '2026-03-05T10:00:00Z'),

  -- MDM Intune (MS-INTUNE) — dismissed
  ('a0000001-0000-0000-0000-000000000013', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'MS-INTUNE'), 60, 'shown', '2026-01-15T10:00:00Z'),
  ('a0000001-0000-0000-0000-000000000014', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'MS-INTUNE'), 60, 'dismissed', '2026-01-15T10:05:00Z'),
  ('a0000001-0000-0000-0000-000000000015', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'MS-INTUNE'), 60, 'shown', '2026-02-15T10:00:00Z'),

  -- Managed Firewall (YLD-MFW) — clicked, contacted
  ('a0000001-0000-0000-0000-000000000016', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'YLD-MFW'), 75, 'shown', '2026-01-20T10:00:00Z'),
  ('a0000001-0000-0000-0000-000000000017', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'YLD-MFW'), 75, 'clicked', '2026-02-08T11:30:00Z'),
  ('a0000001-0000-0000-0000-000000000018', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'YLD-MFW'), 75, 'contacted', '2026-02-25T14:00:00Z'),

  -- Managed Endpoint Security (YLD-MES) — only shown
  ('a0000001-0000-0000-0000-000000000019', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'YLD-MES'), 50, 'shown', '2026-02-01T10:00:00Z'),
  ('a0000001-0000-0000-0000-000000000020', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'YLD-MES'), 50, 'shown', '2026-03-01T10:00:00Z')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- Technisch Bureau Veldhuis — 18 feedback records
-- Meer compleet, minder recommendations → minder shown
-- Mist: SD-WAN, Teams Room, Copilot, DRaaS
-- ============================================================

INSERT INTO recommendation_feedback (id, company_id, product_id, recommendation_score, action, created_at) VALUES
  -- SD-WAN (FG-SDWAN) — clicked
  ('a0000002-0000-0000-0000-000000000001', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'FG-SDWAN'), 45, 'shown', '2026-01-10T10:00:00Z'),
  ('a0000002-0000-0000-0000-000000000002', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'FG-SDWAN'), 45, 'shown', '2026-02-10T10:00:00Z'),
  ('a0000002-0000-0000-0000-000000000003', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'FG-SDWAN'), 45, 'clicked', '2026-02-20T14:00:00Z'),

  -- Teams Room (MS-TEAMS-ROOM) — contacted
  ('a0000002-0000-0000-0000-000000000004', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'MS-TEAMS-ROOM'), 40, 'shown', '2026-01-15T10:00:00Z'),
  ('a0000002-0000-0000-0000-000000000005', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'MS-TEAMS-ROOM'), 40, 'clicked', '2026-01-28T11:00:00Z'),
  ('a0000002-0000-0000-0000-000000000006', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'MS-TEAMS-ROOM'), 40, 'contacted', '2026-02-15T09:00:00Z'),
  ('a0000002-0000-0000-0000-000000000007', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'MS-TEAMS-ROOM'), 40, 'shown', '2026-03-05T10:00:00Z'),

  -- M365 Copilot (MS-COPILOT) — dismissed
  ('a0000002-0000-0000-0000-000000000008', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'MS-COPILOT'), 35, 'shown', '2026-01-20T10:00:00Z'),
  ('a0000002-0000-0000-0000-000000000009', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'MS-COPILOT'), 35, 'dismissed', '2026-01-20T10:02:00Z'),
  ('a0000002-0000-0000-0000-000000000010', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'MS-COPILOT'), 35, 'shown', '2026-02-20T10:00:00Z'),
  ('a0000002-0000-0000-0000-000000000011', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'MS-COPILOT'), 35, 'dismissed', '2026-02-20T10:03:00Z'),

  -- DRaaS (VBR-DRAAS) — shown only
  ('a0000002-0000-0000-0000-000000000012', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'VBR-DRAAS'), 55, 'shown', '2026-01-25T10:00:00Z'),
  ('a0000002-0000-0000-0000-000000000013', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'VBR-DRAAS'), 55, 'shown', '2026-02-25T10:00:00Z'),

  -- Managed Endpoint Security (YLD-MES) — clicked
  ('a0000002-0000-0000-0000-000000000014', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'YLD-MES'), 50, 'shown', '2026-01-12T10:00:00Z'),
  ('a0000002-0000-0000-0000-000000000015', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'YLD-MES'), 50, 'clicked', '2026-02-05T15:00:00Z'),
  ('a0000002-0000-0000-0000-000000000016', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'YLD-MES'), 50, 'shown', '2026-03-05T10:00:00Z'),

  -- Managed Network Service (YLD-MNS) — shown
  ('a0000002-0000-0000-0000-000000000017', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'YLD-MNS'), 30, 'shown', '2026-02-01T10:00:00Z'),
  ('a0000002-0000-0000-0000-000000000018', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'YLD-MNS'), 30, 'shown', '2026-03-01T10:00:00Z')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- Autogroep Rensen — 22 feedback records
-- Meest complete klant, maar mist: security awareness, managed backup, DMS upgrade
-- ============================================================

INSERT INTO recommendation_feedback (id, company_id, product_id, recommendation_score, action, created_at) VALUES
  -- Yielder Beheer Basis upgrade naar Premium — al gedaan (purchased)
  ('a0000003-0000-0000-0000-000000000001', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'YLD-BHR-PRE'), 80, 'shown', '2025-12-15T10:00:00Z'),
  ('a0000003-0000-0000-0000-000000000002', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'YLD-BHR-PRE'), 80, 'clicked', '2025-12-20T14:00:00Z'),
  ('a0000003-0000-0000-0000-000000000003', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'YLD-BHR-PRE'), 80, 'contacted', '2025-12-28T09:00:00Z'),
  ('a0000003-0000-0000-0000-000000000004', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'YLD-BHR-PRE'), 80, 'purchased', '2026-01-01T10:00:00Z'),

  -- M365 Copilot (MS-COPILOT) — purchased
  ('a0000003-0000-0000-0000-000000000005', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'MS-COPILOT'), 70, 'shown', '2025-12-10T10:00:00Z'),
  ('a0000003-0000-0000-0000-000000000006', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'MS-COPILOT'), 70, 'clicked', '2025-12-18T11:00:00Z'),
  ('a0000003-0000-0000-0000-000000000007', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'MS-COPILOT'), 70, 'contacted', '2026-01-10T09:30:00Z'),
  ('a0000003-0000-0000-0000-000000000008', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'MS-COPILOT'), 70, 'purchased', '2026-01-25T10:00:00Z'),

  -- SD-WAN (FG-SDWAN) — clicked, interested
  ('a0000003-0000-0000-0000-000000000009', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'FG-SDWAN'), 55, 'shown', '2026-01-05T10:00:00Z'),
  ('a0000003-0000-0000-0000-000000000010', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'FG-SDWAN'), 55, 'clicked', '2026-01-15T14:00:00Z'),
  ('a0000003-0000-0000-0000-000000000011', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'FG-SDWAN'), 55, 'shown', '2026-02-05T10:00:00Z'),
  ('a0000003-0000-0000-0000-000000000012', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'FG-SDWAN'), 55, 'contacted', '2026-02-20T15:00:00Z'),

  -- Teams Room (MS-TEAMS-ROOM) — shown, dismissed
  ('a0000003-0000-0000-0000-000000000013', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'MS-TEAMS-ROOM'), 30, 'shown', '2026-01-10T10:00:00Z'),
  ('a0000003-0000-0000-0000-000000000014', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'MS-TEAMS-ROOM'), 30, 'dismissed', '2026-01-10T10:01:00Z'),
  ('a0000003-0000-0000-0000-000000000015', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'MS-TEAMS-ROOM'), 30, 'shown', '2026-02-10T10:00:00Z'),

  -- Managed Network Service (YLD-MNS) — clicked
  ('a0000003-0000-0000-0000-000000000016', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'YLD-MNS'), 45, 'shown', '2026-01-20T10:00:00Z'),
  ('a0000003-0000-0000-0000-000000000017', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'YLD-MNS'), 45, 'clicked', '2026-02-05T11:00:00Z'),
  ('a0000003-0000-0000-0000-000000000018', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'YLD-MNS'), 45, 'shown', '2026-03-05T10:00:00Z'),

  -- Power Platform (MS-PWRPLAT) — shown
  ('a0000003-0000-0000-0000-000000000019', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'MS-PWRPLAT'), 25, 'shown', '2026-02-01T10:00:00Z'),
  ('a0000003-0000-0000-0000-000000000020', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'MS-PWRPLAT'), 25, 'shown', '2026-03-01T10:00:00Z'),

  -- NAS (SYN-DS1621) — shown, dismissed
  ('a0000003-0000-0000-0000-000000000021', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'SYN-DS1621'), 20, 'shown', '2026-02-15T10:00:00Z'),
  ('a0000003-0000-0000-0000-000000000022', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'SYN-DS1621'), 20, 'dismissed', '2026-02-15T10:02:00Z')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- Verificatie query (als comment)
-- SELECT c.name, COUNT(*) AS feedback_count
-- FROM recommendation_feedback rf
-- JOIN companies c ON c.id = rf.company_id
-- GROUP BY c.name;
-- Verwacht: Bakkerij ~20, Veldhuis ~18, Rensen ~22
--
-- SELECT action, COUNT(*) FROM recommendation_feedback GROUP BY action ORDER BY COUNT(*) DESC;
-- Verwacht: shown > clicked > contacted/dismissed > purchased
-- ============================================================
