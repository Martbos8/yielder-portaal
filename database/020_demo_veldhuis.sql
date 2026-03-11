-- ============================================================
-- Demo Data: Technisch Bureau Veldhuis
-- ID: b2c3d4e5-f6a7-8901-bcde-f12345678901
-- 40 medewerkers, Techniek, Overijssel
-- UUID patroon: d0000002-... voor alle Veldhuis records
-- ============================================================

-- ============================================================
-- TICKETS (10) — mix open/in_progress/closed, alle prioriteiten
-- ============================================================

INSERT INTO tickets (id, company_id, cw_ticket_id, summary, description, status, priority, contact_name, source, is_closed, created_at) VALUES
  ('d0000002-0000-0000-0000-000000000001', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 89001,
   'CAD workstation extreem traag bij grote assemblies',
   'HP ZBook bij engineering draait SolidWorks assemblies van 500+ parts met slechts 2-3 fps. RAM gebruik 98%. Mogelijk geheugen upgrade nodig van 32GB naar 64GB.',
   'open', 'high', 'Henk Veldhuis', 'portaal', false,
   '2026-03-10T09:15:00Z'),

  ('d0000002-0000-0000-0000-000000000002', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 89002,
   'SolidWorks licentie server onbereikbaar',
   'Sinds vanochtend 07:00 kunnen 3 van de 5 SolidWorks gebruikers geen licentie ophalen. Flexnet service op de licentieserver lijkt gecrasht.',
   'in_progress', 'urgent', 'Mark de Vries', 'telefoon', false,
   '2026-03-11T07:05:00Z'),

  ('d0000002-0000-0000-0000-000000000003', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 89003,
   'VPN toegang voor 5 thuiswerkers configureren',
   'Per volgende week werken 5 engineers 2 dagen per week thuis. FortiClient VPN moet geconfigureerd worden met split-tunneling zodat CAD files via VPN gaan maar internet direct.',
   'open', 'normal', 'Henk Veldhuis', 'email', false,
   '2026-03-09T14:30:00Z'),

  ('d0000002-0000-0000-0000-000000000004', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 89004,
   'HP DesignJet plotter print scheef',
   'De T830 plotter op de tekenkamer print alle A1 tekeningen circa 3mm scheef aan de rechterkant. Printkoppen al gereinigd, probleem blijft.',
   'in_progress', 'normal', 'Sandra Bergsma', 'portaal', false,
   '2026-03-07T10:45:00Z'),

  ('d0000002-0000-0000-0000-000000000005', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 89005,
   'Nachtelijke server backup mislukt — 3 dagen op rij',
   'Veeam backup job "VH-SRV-DAILY" faalt met error "Insufficient disk space on repository". Backup repository is 95% vol.',
   'open', 'urgent', NULL, 'monitoring', false,
   '2026-03-11T06:00:00Z'),

  ('d0000002-0000-0000-0000-000000000006', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 89006,
   'Nieuwe medewerker onboarding — Rick Janssen (projectleider)',
   'Rick Janssen start 17 maart. Nodig: M365 account, laptop, AutoCAD viewer licentie, toegang projectmappen, Teams kanalen Engineering.',
   'open', 'normal', 'Henk Veldhuis', 'email', false,
   '2026-03-08T08:00:00Z'),

  ('d0000002-0000-0000-0000-000000000007', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 89007,
   'WiFi dekking bouwplaats Industrieweg 45 onvoldoende',
   'Op de bouwplaats aan de Industrieweg is geen WiFi bereik bij de achterzijde. Engineers kunnen daar geen tekeningen inzien op hun tablets.',
   'closed', 'normal', 'Mark de Vries', 'portaal', true,
   '2026-02-20T11:00:00Z'),

  ('d0000002-0000-0000-0000-000000000008', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 89008,
   'Mail quota bereikt — postvak Sandra Bergsma vol',
   'Sandra heeft 49.5 GB van 50 GB gebruikt. Veel grote bijlagen met technische tekeningen. Archivering nodig of quota verhoging.',
   'in_progress', 'low', 'Sandra Bergsma', 'email', false,
   '2026-03-06T15:20:00Z'),

  ('d0000002-0000-0000-0000-000000000009', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 89009,
   'Teams vergadering geen geluid bij extern bellen',
   'Bij Teams meetings met externe partijen horen wij hen niet terwijl zij ons wel horen. Intern werkt het prima. Mogelijk firewall issue.',
   'closed', 'high', 'Henk Veldhuis', 'telefoon', true,
   '2026-02-28T09:30:00Z'),

  ('d0000002-0000-0000-0000-000000000010', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 89010,
   'Monitor kalibratie tekenkamer — kleuren wijken af',
   'De 2 Dell UltraSharp monitoren op de tekenkamer tonen kleuren anders dan de print output. Kalibratie met colorimeter gewenst.',
   'open', 'low', 'Mark de Vries', 'portaal', false,
   '2026-03-10T16:00:00Z')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- HARDWARE ASSETS (20) — 8 laptops (incl 2 CAD), 6 desktops, 2 servers, 4 netwerk
-- ============================================================

INSERT INTO hardware_assets (id, company_id, cw_config_id, name, type, manufacturer, model, serial_number, assigned_to, warranty_expiry) VALUES
  -- CAD Workstations / Laptops (8)
  ('e0000002-0000-0000-0000-000000000001', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 6001,
   'CAD Workstation Henk', 'Laptop', 'HP', 'ZBook Fury 16 G10', 'CND5012ZBK', 'Henk Veldhuis', '2028-03-15'),
  ('e0000002-0000-0000-0000-000000000002', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 6002,
   'CAD Workstation Mark', 'Laptop', 'HP', 'ZBook Fury 16 G10', 'CND5012ZBL', 'Mark de Vries', '2028-03-15'),
  ('e0000002-0000-0000-0000-000000000003', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 6003,
   'Laptop Sandra', 'Laptop', 'HP', 'EliteBook 840 G10', 'CND4301EBK', 'Sandra Bergsma', '2027-06-20'),
  ('e0000002-0000-0000-0000-000000000004', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 6004,
   'Laptop Jan-Willem', 'Laptop', 'HP', 'EliteBook 840 G10', 'CND4301EBL', 'Jan-Willem Postma', '2027-06-20'),
  ('e0000002-0000-0000-0000-000000000005', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 6005,
   'Laptop Projectleider 1', 'Laptop', 'HP', 'EliteBook 840 G9', 'CND3201EBM', 'Projectleider', '2026-05-10'),
  ('e0000002-0000-0000-0000-000000000006', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 6006,
   'Laptop Engineer Bouwplaats', 'Laptop', 'HP', 'EliteBook 840 G8', 'CND2105EBN', 'Bouwplaats team', '2025-09-30'),
  ('e0000002-0000-0000-0000-000000000007', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 6007,
   'Laptop Administratie', 'Laptop', 'HP', 'EliteBook 830 G8', 'CND2105EBO', 'Lisa Jansen', '2025-12-15'),
  ('e0000002-0000-0000-0000-000000000008', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 6008,
   'Laptop Reserve', 'Laptop', 'HP', 'EliteBook 840 G9', 'CND3201EBP', 'Voorraad', '2026-08-01'),

  -- Desktops (6)
  ('e0000002-0000-0000-0000-000000000009', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 6009,
   'Desktop Receptie', 'Desktop', 'HP', 'ProDesk 400 G9', 'MXL3401REC', 'Receptie', '2027-02-01'),
  ('e0000002-0000-0000-0000-000000000010', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 6010,
   'Desktop Tekenkamer 1', 'Desktop', 'HP', 'Z2 Tower G9', 'MXL3502TK1', 'Tekenkamer', '2027-09-15'),
  ('e0000002-0000-0000-0000-000000000011', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 6011,
   'Desktop Tekenkamer 2', 'Desktop', 'HP', 'Z2 Tower G9', 'MXL3502TK2', 'Tekenkamer', '2027-09-15'),
  ('e0000002-0000-0000-0000-000000000012', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 6012,
   'Desktop Werkplaats', 'Desktop', 'HP', 'ProDesk 400 G7', 'MXL1810WPL', 'Werkplaats', '2025-04-30'),
  ('e0000002-0000-0000-0000-000000000013', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 6013,
   'Desktop Magazijn', 'Desktop', 'HP', 'ProDesk 400 G7', 'MXL1810MAG', 'Magazijn', '2025-04-30'),
  ('e0000002-0000-0000-0000-000000000014', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 6014,
   'Desktop Vergaderruimte', 'Desktop', 'HP', 'ProDesk 400 G9', 'MXL3401VGR', 'Vergaderruimte', '2027-02-01'),

  -- Servers (2)
  ('e0000002-0000-0000-0000-000000000015', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 6015,
   'Fileserver VH-SRV01', 'Server', 'Dell', 'PowerEdge R750xs', 'DELL-PE-R750-001', 'Serverruimte', '2027-11-30'),
  ('e0000002-0000-0000-0000-000000000016', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 6016,
   'Licentieserver VH-SRV02', 'Server', 'Dell', 'PowerEdge R650xs', 'DELL-PE-R650-001', 'Serverruimte', '2026-06-15'),

  -- Netwerk (4)
  ('e0000002-0000-0000-0000-000000000017', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 6017,
   'Firewall FortiGate 60F', 'Netwerk', 'Fortinet', 'FortiGate 60F', 'FGT60FTK22000456', 'Serverruimte', '2028-04-01'),
  ('e0000002-0000-0000-0000-000000000018', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 6018,
   'Access Point Kantoor', 'Netwerk', 'Ubiquiti', 'UniFi U6-Pro', 'UBNT-U6P-101', 'Kantoor begane grond', '2028-01-15'),
  ('e0000002-0000-0000-0000-000000000019', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 6019,
   'Access Point Tekenkamer', 'Netwerk', 'Ubiquiti', 'UniFi U6-Pro', 'UBNT-U6P-102', 'Tekenkamer 1e etage', '2028-01-15'),
  ('e0000002-0000-0000-0000-000000000020', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 6020,
   'Switch Serverruimte', 'Netwerk', 'Ubiquiti', 'UniFi USW-48-POE', 'UBNT-USW48-101', 'Serverruimte', '2028-01-15')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- AGREEMENTS (6) — mix active/expired
-- ============================================================

INSERT INTO agreements (id, company_id, cw_agreement_id, name, type, status, bill_amount, start_date, end_date) VALUES
  ('f0000002-0000-0000-0000-000000000001', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 3101,
   'Yielder Beheer Standaard', 'Managed Service', 'active', 895.00, '2025-04-01', '2027-03-31'),

  ('f0000002-0000-0000-0000-000000000002', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 3102,
   'Microsoft 365 Business Standard', 'Software', 'active', 480.00, '2025-01-01', '2026-12-31'),

  ('f0000002-0000-0000-0000-000000000003', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 3103,
   'AutoCAD Licenties (10 seats)', 'Software', 'active', 1250.00, '2025-06-01', '2026-05-31'),

  ('f0000002-0000-0000-0000-000000000004', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 3104,
   'Managed Backup Veeam', 'Security', 'active', 345.00, '2025-07-01', '2026-06-30'),

  ('f0000002-0000-0000-0000-000000000005', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 3105,
   'Hosted Telefonie', 'Telecom', 'active', 280.00, '2025-04-01', '2027-03-31'),

  ('f0000002-0000-0000-0000-000000000006', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 3106,
   'Server Onderhoud (verlopen)', 'Onderhoud', 'expired', 650.00, '2024-03-01', '2026-02-28')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- CONTACTS (5)
-- ============================================================

INSERT INTO contacts (id, company_id, full_name, email, phone, role) VALUES
  ('10000002-0000-0000-0000-000000000001', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'Henk Veldhuis', 'henk@veldhuis-techniek.nl', '06-51234567', 'Directeur'),
  ('10000002-0000-0000-0000-000000000002', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'Mark de Vries', 'mark@veldhuis-techniek.nl', '06-52345678', 'Senior Engineer'),
  ('10000002-0000-0000-0000-000000000003', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'Sandra Bergsma', 'sandra@veldhuis-techniek.nl', '06-53456789', 'Administratie'),
  ('10000002-0000-0000-0000-000000000004', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'Jan-Willem Postma', 'janwillem@veldhuis-techniek.nl', '06-54567890', 'Projectleider'),
  ('10000002-0000-0000-0000-000000000005', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'Lisa Jansen', 'lisa@veldhuis-techniek.nl', '06-55678901', 'Junior Engineer')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- LICENSES (6)
-- ============================================================

INSERT INTO licenses (id, company_id, vendor, product_name, license_type, seats_total, seats_used, expiry_date, status, cost_per_seat) VALUES
  ('20000002-0000-0000-0000-000000000001', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'Autodesk', 'AutoCAD LT', 'Subscription', 10, 9, '2026-05-31', 'active', 55.00),
  ('20000002-0000-0000-0000-000000000002', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'Dassault Systèmes', 'SolidWorks Professional', 'Subscription', 5, 5, '2026-09-30', 'active', 195.00),
  ('20000002-0000-0000-0000-000000000003', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'Microsoft', 'Microsoft 365 Business Standard', 'Subscription', 40, 38, '2026-12-31', 'active', 10.80),
  ('20000002-0000-0000-0000-000000000004', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'Adobe', 'Adobe Creative Cloud', 'Subscription', 5, 4, '2027-01-31', 'active', 59.99),
  ('20000002-0000-0000-0000-000000000005', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'Veeam', 'Veeam Backup & Replication', 'Perpetual', 2, 2, '2026-06-30', 'expiring', 850.00),
  ('20000002-0000-0000-0000-000000000006', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'Fortinet', 'FortiClient VPN', 'Subscription', 40, 35, '2028-04-01', 'active', 3.50)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- NOTIFICATIONS (6) — mix types, sommige gelezen
-- ============================================================

INSERT INTO notifications (id, company_id, title, message, type, is_read, link, created_at) VALUES
  ('30000002-0000-0000-0000-000000000001', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'Backup mislukt — 3 dagen', 'De nachtelijke backup job VH-SRV-DAILY is 3 achtereenvolgende keren mislukt. Directe actie vereist.', 'alert', false, '/tickets',
   '2026-03-11T06:05:00Z'),

  ('30000002-0000-0000-0000-000000000002', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'SolidWorks licentie probleem', 'Flexnet licentieservice op VH-SRV02 is gestopt. 3 gebruikers kunnen niet werken.', 'alert', false, '/tickets',
   '2026-03-11T07:10:00Z'),

  ('30000002-0000-0000-0000-000000000003', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'Contract verloopt: AutoCAD Licenties', 'Het AutoCAD licentie contract verloopt op 31 mei 2026. Neem contact op voor verlenging.', 'warning', false, '/contracten',
   '2026-03-05T09:00:00Z'),

  ('30000002-0000-0000-0000-000000000004', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'Hardware garantie verlopen', '2 desktops (Werkplaats, Magazijn) en 2 laptops (Bouwplaats, Administratie) hebben een verlopen garantie.', 'warning', false, '/hardware',
   '2026-03-08T08:00:00Z'),

  ('30000002-0000-0000-0000-000000000005', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'Nieuwe medewerker onboarding gepland', 'Rick Janssen start op 17 maart. IT onboarding ticket is aangemaakt.', 'info', true, '/tickets',
   '2026-03-08T08:30:00Z'),

  ('30000002-0000-0000-0000-000000000006', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'Welkom bij Mijn Yielder', 'Uw portaal is succesvol geactiveerd. Bekijk het dashboard voor een overzicht.', 'success', true, '/dashboard',
   '2025-04-20T09:05:00Z')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- DOCUMENTS (4)
-- ============================================================

INSERT INTO documents (id, company_id, title, category, file_url, file_size, uploaded_by, created_at) VALUES
  ('40000002-0000-0000-0000-000000000001', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'IT Handleiding Technisch Bureau Veldhuis', 'handleiding', '/documents/it-handleiding-veldhuis.pdf', 380000, 'Yielder IT', '2025-05-10T10:00:00Z'),
  ('40000002-0000-0000-0000-000000000002', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'SLA Overeenkomst Yielder', 'contract', '/documents/sla-overeenkomst-veldhuis.pdf', 195000, 'Yielder IT', '2025-04-01T09:00:00Z'),
  ('40000002-0000-0000-0000-000000000003', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'Cybersecurity Best Practices voor Techniek', 'whitepaper', '/documents/cybersecurity-techniek-whitepaper.pdf', 445000, 'Yielder IT', '2025-09-15T14:00:00Z'),
  ('40000002-0000-0000-0000-000000000004', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   'Kwartaalrapport IT Q4 2025', 'rapport', '/documents/kwartaalrapport-veldhuis-q4-2025.pdf', 290000, 'Yielder IT', '2026-01-12T11:00:00Z')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- Verificatie query (als comment)
-- SELECT 'tickets' AS tabel, COUNT(*) FROM tickets WHERE company_id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'
-- UNION ALL SELECT 'hardware', COUNT(*) FROM hardware_assets WHERE company_id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'
-- UNION ALL SELECT 'agreements', COUNT(*) FROM agreements WHERE company_id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'
-- UNION ALL SELECT 'contacts', COUNT(*) FROM contacts WHERE company_id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'
-- UNION ALL SELECT 'licenses', COUNT(*) FROM licenses WHERE company_id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'
-- UNION ALL SELECT 'notifications', COUNT(*) FROM notifications WHERE company_id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'
-- UNION ALL SELECT 'documents', COUNT(*) FROM documents WHERE company_id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
-- ============================================================
