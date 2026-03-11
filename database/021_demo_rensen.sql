-- ============================================================
-- Demo Data: Autogroep Rensen
-- ============================================================
-- Bedrijf: Autogroep Rensen (80 medewerkers, Automotive, Gelderland)
-- UUID prefix: d0000003-... voor tickets, e0000003-... voor hardware, etc.
-- Alle inserts zijn idempotent met ON CONFLICT (id) DO NOTHING
-- Datum referentie: maart 2026
-- ============================================================

-- Rensen company ID
-- c3d4e5f6-a7b8-9012-cdef-123456789012


-- ============================================================
-- 1. Tickets — 12 stuks (automotive-specifiek)
-- ============================================================

INSERT INTO tickets (id, company_id, cw_ticket_id, summary, description, status, priority, contact_name, source, is_closed, created_at) VALUES
  ('d0000003-0000-0000-0000-000000000001', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 90001,
   'DMS systeem crasht bij facturering werkorders',
   'Het Dealer Management Systeem (Incadea) crasht regelmatig bij het afsluiten van werkorders met meer dan 15 onderdelen. Foutmelding: "Database timeout". Gebeurt 3-4x per dag.',
   'open', 'urgent', 'Gerard Rensen', 'telefoon', false,
   '2026-03-10T08:00:00Z'),

  ('d0000003-0000-0000-0000-000000000002', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 90002,
   'Kassa print geen bonnen meer — showroom Arnhem',
   'De Epson TM-T88VI kassaprinter in de showroom Arnhem print geen bonnen meer. Display toont "Paper Near End" maar papier is net vervangen. USB kabel al gewisseld.',
   'in_progress', 'high', 'Marieke van den Berg', 'telefoon', false,
   '2026-03-11T09:30:00Z'),

  ('d0000003-0000-0000-0000-000000000003', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 90003,
   'WiFi werkplaats Nijmegen — tablets verliezen verbinding',
   'De 4 werkplaats tablets (Samsung Galaxy Tab Active) verliezen constant de WiFi verbinding in hal 2. Signaalsterkte wisselt tussen -75 en -85 dBm. Extra AP nodig.',
   'open', 'high', 'Jan Kuipers', 'portaal', false,
   '2026-03-09T11:00:00Z'),

  ('d0000003-0000-0000-0000-000000000004', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 90004,
   'Camerasysteem vestiging Doetinchem offline',
   'Alle 8 Hikvision camera''s op vestiging Doetinchem zijn sinds gisteravond 22:00 offline. NVR toont "Network Unreachable". Vermoedelijk switch probleem.',
   'in_progress', 'urgent', 'Gerard Rensen', 'telefoon', false,
   '2026-03-11T07:15:00Z'),

  ('d0000003-0000-0000-0000-000000000005', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 90005,
   'Werkorder app traag op alle werkplaats PCs',
   'De webgebaseerde werkorder module in het DMS laadt 15-20 seconden per pagina op alle werkplaats terminals. Andere websites laden normaal. Server performance issue.',
   'open', 'normal', 'Jan Kuipers', 'email', false,
   '2026-03-08T14:00:00Z'),

  ('d0000003-0000-0000-0000-000000000006', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 90006,
   'Nieuwe vestiging Ede — complete IT setup',
   'Autogroep Rensen opent medio april een nieuwe vestiging in Ede. Benodigdheden: 8 werkplekken, 4 werkplaats terminals, WiFi, camerasysteem, kassasysteem, DMS connectie.',
   'open', 'normal', 'Gerard Rensen', 'portaal', false,
   '2026-03-06T10:00:00Z'),

  ('d0000003-0000-0000-0000-000000000007', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 90007,
   'Printer showroom Arnhem — papierlade 2 pakt niet',
   'De HP LaserJet Pro in de showroom trekt geen papier meer uit lade 2 (A4). Lade 1 (handinvoer) werkt nog wel. Rollers waarschijnlijk versleten.',
   'closed', 'low', 'Marieke van den Berg', 'email', true,
   '2026-02-25T09:00:00Z'),

  ('d0000003-0000-0000-0000-000000000008', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 90008,
   'Phishing email naar 12 medewerkers — factuur bijlage',
   'Vandaag hebben 12 medewerkers een phishing email ontvangen met als onderwerp "Factuur Auto Inkoop BV". 2 medewerkers hebben de bijlage geopend. Scan en containment nodig.',
   'in_progress', 'urgent', 'Petra Scholten', 'telefoon', false,
   '2026-03-10T11:45:00Z'),

  ('d0000003-0000-0000-0000-000000000009', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 90009,
   'Backup fout — SQL database DMS te groot',
   'De nachtelijke SQL backup van de DMS database (Incadea) duurt nu langer dan het backup window. Database is gegroeid naar 380GB. Differential backup of compressie nodig.',
   'open', 'high', NULL, 'monitoring', false,
   '2026-03-09T06:00:00Z'),

  ('d0000003-0000-0000-0000-000000000010', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 90010,
   'Windows update werkplaats PCs — herstart nodig',
   '6 werkplaats terminals in Nijmegen wachten al 2 weken op een herstart voor Windows updates. Monteurs sluiten de PCs nooit af. Geforceerde herstart inplannen.',
   'closed', 'normal', NULL, 'monitoring', true,
   '2026-02-28T07:00:00Z'),

  ('d0000003-0000-0000-0000-000000000011', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 90011,
   'Telefooncentrale storing — doorverbinden werkt niet',
   'Klanten die bellen naar het hoofdnummer worden niet doorverbonden naar de juiste afdeling. Keuzemenu werkt, maar de doorschakeling geeft een bezettoon.',
   'closed', 'high', 'Petra Scholten', 'telefoon', true,
   '2026-03-03T08:30:00Z'),

  ('d0000003-0000-0000-0000-000000000012', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 90012,
   'Website autogroeprensen.nl laadt traag',
   'De website laadt gemiddeld 8 seconden. Voorheen was dit 2-3 seconden. Mogelijk te veel afbeeldingen in de nieuwe voorraadmodule of hosting probleem.',
   'closed', 'normal', 'Marieke van den Berg', 'portaal', true,
   '2026-02-18T13:00:00Z')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 2. Hardware Assets — 30 stuks
-- ============================================================

INSERT INTO hardware_assets (id, company_id, cw_config_id, name, type, manufacturer, model, serial_number, assigned_to, warranty_expiry) VALUES
  -- Desktops (10: werkplaats terminals, kassas, showroom)
  ('e0000003-0000-0000-0000-000000000001', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7001,
   'Terminal Werkplaats 1 Nijmegen', 'Desktop', 'HP', 'ProDesk 400 G9', 'MXL3401WP1', 'Werkplaats Nijmegen', '2027-04-01'),
  ('e0000003-0000-0000-0000-000000000002', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7002,
   'Terminal Werkplaats 2 Nijmegen', 'Desktop', 'HP', 'ProDesk 400 G9', 'MXL3401WP2', 'Werkplaats Nijmegen', '2027-04-01'),
  ('e0000003-0000-0000-0000-000000000003', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7003,
   'Terminal Werkplaats 3 Nijmegen', 'Desktop', 'HP', 'ProDesk 400 G7', 'MXL1820WP3', 'Werkplaats Nijmegen', '2025-06-15'),
  ('e0000003-0000-0000-0000-000000000004', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7004,
   'Terminal Werkplaats Doetinchem', 'Desktop', 'HP', 'ProDesk 400 G7', 'MXL1820WP4', 'Werkplaats Doetinchem', '2025-06-15'),
  ('e0000003-0000-0000-0000-000000000005', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7005,
   'Kassa Showroom Arnhem', 'Desktop', 'HP', 'ProDesk 400 G9', 'MXL3401KS1', 'Showroom Arnhem', '2027-04-01'),
  ('e0000003-0000-0000-0000-000000000006', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7006,
   'Kassa Showroom Nijmegen', 'Desktop', 'HP', 'ProDesk 400 G9', 'MXL3401KS2', 'Showroom Nijmegen', '2027-04-01'),
  ('e0000003-0000-0000-0000-000000000007', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7007,
   'Desktop Administratie 1', 'Desktop', 'HP', 'ProDesk 400 G9', 'MXL3401AD1', 'Administratie', '2027-04-01'),
  ('e0000003-0000-0000-0000-000000000008', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7008,
   'Desktop Administratie 2', 'Desktop', 'HP', 'ProDesk 400 G9', 'MXL3401AD2', 'Administratie', '2027-04-01'),
  ('e0000003-0000-0000-0000-000000000009', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7009,
   'Desktop Receptie Arnhem', 'Desktop', 'HP', 'ProDesk 400 G7', 'MXL1820RC1', 'Receptie Arnhem', '2025-03-20'),
  ('e0000003-0000-0000-0000-000000000010', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7010,
   'Desktop Receptie Nijmegen', 'Desktop', 'HP', 'ProDesk 400 G9', 'MXL3401RC2', 'Receptie Nijmegen', '2027-04-01'),

  -- Laptops (8: verkoop, management)
  ('e0000003-0000-0000-0000-000000000011', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7011,
   'Laptop Directeur', 'Laptop', 'HP', 'EliteBook 840 G10', 'CND4401DIR', 'Gerard Rensen', '2027-08-15'),
  ('e0000003-0000-0000-0000-000000000012', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7012,
   'Laptop Verkoopleider', 'Laptop', 'HP', 'EliteBook 840 G10', 'CND4401VKL', 'Marieke van den Berg', '2027-08-15'),
  ('e0000003-0000-0000-0000-000000000013', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7013,
   'Laptop Verkoper 1', 'Laptop', 'HP', 'EliteBook 840 G9', 'CND3201VK1', 'Verkoop', '2026-05-10'),
  ('e0000003-0000-0000-0000-000000000014', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7014,
   'Laptop Verkoper 2', 'Laptop', 'HP', 'EliteBook 840 G9', 'CND3201VK2', 'Verkoop', '2026-05-10'),
  ('e0000003-0000-0000-0000-000000000015', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7015,
   'Laptop Verkoper 3', 'Laptop', 'HP', 'EliteBook 830 G8', 'CND2105VK3', 'Verkoop', '2025-08-30'),
  ('e0000003-0000-0000-0000-000000000016', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7016,
   'Laptop Werkplaatschef', 'Laptop', 'HP', 'EliteBook 840 G10', 'CND4401WPC', 'Jan Kuipers', '2027-08-15'),
  ('e0000003-0000-0000-0000-000000000017', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7017,
   'Laptop Administratie', 'Laptop', 'HP', 'EliteBook 840 G9', 'CND3201ADM', 'Petra Scholten', '2026-05-10'),
  ('e0000003-0000-0000-0000-000000000018', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7018,
   'Laptop IT-contact', 'Laptop', 'HP', 'EliteBook 840 G10', 'CND4401ITC', 'Dennis Brouwer', '2027-08-15'),

  -- Servers (3)
  ('e0000003-0000-0000-0000-000000000019', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7019,
   'DMS Server AR-SRV01', 'Server', 'Dell', 'PowerEdge R750xs', 'DELL-R750-AR01', 'Serverruimte Arnhem', '2027-06-30'),
  ('e0000003-0000-0000-0000-000000000020', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7020,
   'Fileserver AR-SRV02', 'Server', 'Dell', 'PowerEdge R650xs', 'DELL-R650-AR02', 'Serverruimte Arnhem', '2027-06-30'),
  ('e0000003-0000-0000-0000-000000000021', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7021,
   'Backup Server AR-SRV03', 'Server', 'HPE', 'ProLiant DL380 Gen10', 'USE1345BKP', 'Serverruimte Arnhem', '2025-12-31'),

  -- Netwerk (5: meerdere APs voor grote hal)
  ('e0000003-0000-0000-0000-000000000022', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7022,
   'Firewall FortiGate 100F', 'Netwerk', 'Fortinet', 'FortiGate 100F', 'FGT100FTK22000789', 'Serverruimte Arnhem', '2027-09-01'),
  ('e0000003-0000-0000-0000-000000000023', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7023,
   'AP Showroom Arnhem', 'Netwerk', 'Ubiquiti', 'UniFi U6-Enterprise', 'UBNT-U6E-201', 'Showroom Arnhem', '2028-03-15'),
  ('e0000003-0000-0000-0000-000000000024', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7024,
   'AP Werkplaats Nijmegen Hal 1', 'Netwerk', 'Ubiquiti', 'UniFi U6-Enterprise', 'UBNT-U6E-202', 'Werkplaats Nijmegen', '2028-03-15'),
  ('e0000003-0000-0000-0000-000000000025', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7025,
   'AP Werkplaats Nijmegen Hal 2', 'Netwerk', 'Ubiquiti', 'UniFi U6-Enterprise', 'UBNT-U6E-203', 'Werkplaats Nijmegen', '2028-03-15'),
  ('e0000003-0000-0000-0000-000000000026', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7026,
   'Switch Serverruimte Arnhem', 'Netwerk', 'Ubiquiti', 'UniFi USW-48-POE', 'UBNT-USW48-201', 'Serverruimte Arnhem', '2028-03-15'),

  -- Tablets/Overig (4)
  ('e0000003-0000-0000-0000-000000000027', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7027,
   'Tablet Werkplaats 1', 'Overig', 'Samsung', 'Galaxy Tab Active4 Pro', 'R5CN30ABCDE', 'Werkplaats Nijmegen', '2027-02-01'),
  ('e0000003-0000-0000-0000-000000000028', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7028,
   'Tablet Werkplaats 2', 'Overig', 'Samsung', 'Galaxy Tab Active4 Pro', 'R5CN30ABCDF', 'Werkplaats Nijmegen', '2027-02-01'),
  ('e0000003-0000-0000-0000-000000000029', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7029,
   'Tablet Werkplaats Doetinchem', 'Overig', 'Samsung', 'Galaxy Tab Active3', 'R5CN20XYZAB', 'Werkplaats Doetinchem', '2025-10-15'),
  ('e0000003-0000-0000-0000-000000000030', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 7030,
   'NVR Camerasysteem', 'Overig', 'Hikvision', 'DS-7616NXI-K2', 'HIK-NVR-AR01', 'Serverruimte Arnhem', '2026-08-01')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 3. Agreements — 8 stuks (grotere bedragen, mix active/expired)
-- ============================================================

INSERT INTO agreements (id, company_id, cw_agreement_id, name, type, status, bill_amount, start_date, end_date) VALUES
  ('f0000003-0000-0000-0000-000000000001', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 5001,
   'Yielder Beheer Premium', 'Managed Service', 'active', 2950.00, '2025-01-01', '2027-12-31'),

  ('f0000003-0000-0000-0000-000000000002', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 5002,
   'Microsoft 365 Business Premium', 'Software', 'active', 1496.00, '2025-01-01', '2026-12-31'),

  ('f0000003-0000-0000-0000-000000000003', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 5003,
   'DMS Licentie Incadea', 'Software', 'active', 3200.00, '2025-03-01', '2027-02-28'),

  ('f0000003-0000-0000-0000-000000000004', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 5004,
   'Managed Firewall Service', 'Security', 'active', 295.00, '2025-01-01', '2027-12-31'),

  ('f0000003-0000-0000-0000-000000000005', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 5005,
   'Camera Bewaking & Monitoring', 'Security', 'active', 450.00, '2025-06-01', '2027-05-31'),

  ('f0000003-0000-0000-0000-000000000006', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 5006,
   'Hosted Telefonie 3 vestigingen', 'Telecom', 'active', 680.00, '2025-01-01', '2027-12-31'),

  ('f0000003-0000-0000-0000-000000000007', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 5007,
   'Zakelijk Internet Glasvezel (3x)', 'Telecom', 'active', 750.00, '2025-04-01', '2028-03-31'),

  ('f0000003-0000-0000-0000-000000000008', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 5008,
   'Printer Lease Canon (verlopen)', 'Onderhoud', 'expired', 520.00, '2023-07-01', '2025-06-30')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 4. Contacts — 6 stuks
-- ============================================================

INSERT INTO contacts (id, company_id, full_name, email, phone, role) VALUES
  ('10000003-0000-0000-0000-000000000001', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Gerard Rensen', 'gerard@autogroeprensen.nl', '06-61234567', 'Directeur'),
  ('10000003-0000-0000-0000-000000000002', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Jan Kuipers', 'jan@autogroeprensen.nl', '06-62345678', 'Werkplaatschef'),
  ('10000003-0000-0000-0000-000000000003', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Marieke van den Berg', 'marieke@autogroeprensen.nl', '06-63456789', 'Verkoopleider'),
  ('10000003-0000-0000-0000-000000000004', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Petra Scholten', 'petra@autogroeprensen.nl', '06-64567890', 'Administratie'),
  ('10000003-0000-0000-0000-000000000005', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Dennis Brouwer', 'dennis@autogroeprensen.nl', '06-65678901', 'IT-contactpersoon'),
  ('10000003-0000-0000-0000-000000000006', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Lisa de Groot', 'lisa@autogroeprensen.nl', '06-66789012', 'Receptie')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 5. Licenses — 8 stuks
-- ============================================================

INSERT INTO licenses (id, company_id, vendor, product_name, license_type, seats_total, seats_used, expiry_date, status, cost_per_seat) VALUES
  ('20000003-0000-0000-0000-000000000001', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Incadea', 'Incadea DMS Professional', 'Subscription', 80, 72, '2027-02-28', 'active', 45.00),
  ('20000003-0000-0000-0000-000000000002', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Microsoft', 'Microsoft 365 Business Premium', 'Subscription', 80, 76, '2026-12-31', 'active', 18.70),
  ('20000003-0000-0000-0000-000000000003', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Adobe', 'Adobe Creative Cloud', 'Subscription', 3, 3, '2027-03-31', 'active', 59.99),
  ('20000003-0000-0000-0000-000000000004', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Lightspeed', 'Lightspeed Kassasoftware', 'Subscription', 4, 3, '2026-09-30', 'active', 79.00),
  ('20000003-0000-0000-0000-000000000005', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Plan-IT', 'Werkplaatsplanning Pro', 'Subscription', 20, 18, '2026-12-31', 'active', 15.00),
  ('20000003-0000-0000-0000-000000000006', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Hikvision', 'HikCentral Professional', 'Perpetual', 1, 1, '2026-08-01', 'expiring', 2500.00),
  ('20000003-0000-0000-0000-000000000007', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Microsoft', 'Teams Rooms Pro', 'Subscription', 2, 2, '2026-12-31', 'active', 32.00),
  ('20000003-0000-0000-0000-000000000008', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'WordPress', 'WordPress Business + WooCommerce', 'Subscription', 1, 1, '2026-06-30', 'active', 25.00)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 6. Notifications — 8 stuks
-- ============================================================

INSERT INTO notifications (id, company_id, title, message, type, is_read, link, created_at) VALUES
  ('30000003-0000-0000-0000-000000000001', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'DMS systeem prestatieproblemen', 'Het Incadea DMS toont verhoogde responstijden. Onderzoek is gestart.', 'alert', false, '/tickets',
   '2026-03-10T08:15:00Z'),

  ('30000003-0000-0000-0000-000000000002', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Camerasysteem Doetinchem offline', 'Alle camera''s op vestiging Doetinchem zijn offline. Ticket is aangemaakt met urgente prioriteit.', 'alert', false, '/tickets',
   '2026-03-11T07:20:00Z'),

  ('30000003-0000-0000-0000-000000000003', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Phishing aanval gedetecteerd', '12 medewerkers ontvingen een phishing email. 2 hebben de bijlage geopend. Containment is gestart.', 'alert', false, '/tickets',
   '2026-03-10T12:00:00Z'),

  ('30000003-0000-0000-0000-000000000004', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Backup waarschuwing', 'De SQL backup van de DMS database overschrijdt het backup window. Optimalisatie is nodig.', 'warning', false, '/tickets',
   '2026-03-09T06:15:00Z'),

  ('30000003-0000-0000-0000-000000000005', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Hardware garantie verlopen', '4 apparaten hebben een verlopen garantie: 2 werkplaats terminals, 1 desktop receptie, 1 tablet Doetinchem.', 'warning', false, '/hardware',
   '2026-03-08T08:00:00Z'),

  ('30000003-0000-0000-0000-000000000006', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Nieuwe vestiging Ede — IT planning', 'IT setup voor de nieuwe vestiging in Ede is in voorbereiding. Verwachte oplevering medio april.', 'info', true, '/tickets',
   '2026-03-06T10:30:00Z'),

  ('30000003-0000-0000-0000-000000000007', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Contract verloopt: Printer Lease', 'Het Canon printer lease contract is verlopen per juni 2025. Neem contact op voor vernieuwing.', 'warning', true, '/contracten',
   '2025-07-01T08:00:00Z'),

  ('30000003-0000-0000-0000-000000000008', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Welkom bij Mijn Yielder', 'Uw portaal is succesvol geactiveerd. Bekijk het dashboard voor een overzicht van uw IT-omgeving.', 'success', true, '/dashboard',
   '2025-03-10T08:05:00Z')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 7. Documents — 5 stuks
-- ============================================================

INSERT INTO documents (id, company_id, title, category, file_url, file_size, uploaded_by, created_at) VALUES
  ('40000003-0000-0000-0000-000000000001', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'IT Handleiding Autogroep Rensen', 'handleiding', '/documents/it-handleiding-rensen.pdf', 420000, 'Yielder IT', '2025-04-15T10:00:00Z'),
  ('40000003-0000-0000-0000-000000000002', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'SLA Overeenkomst Yielder Beheer Premium', 'contract', '/documents/sla-overeenkomst-rensen.pdf', 225000, 'Yielder IT', '2025-01-01T09:00:00Z'),
  ('40000003-0000-0000-0000-000000000003', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Cybersecurity Awareness Handleiding', 'whitepaper', '/documents/cybersecurity-awareness-automotive.pdf', 550000, 'Yielder IT', '2025-10-01T14:00:00Z'),
  ('40000003-0000-0000-0000-000000000004', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Kwartaalrapport IT Q4 2025', 'rapport', '/documents/kwartaalrapport-rensen-q4-2025.pdf', 340000, 'Yielder IT', '2026-01-15T11:00:00Z'),
  ('40000003-0000-0000-0000-000000000005', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'DMS Migratie Plan 2025', 'rapport', '/documents/dms-migratie-plan-rensen.pdf', 280000, 'Yielder IT', '2025-02-20T14:00:00Z')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- Verificatie query (uitvoeren na insert)
-- ============================================================
-- SELECT 'tickets' AS tabel, COUNT(*) AS aantal FROM tickets WHERE company_id = 'c3d4e5f6-a7b8-9012-cdef-123456789012'
-- UNION ALL SELECT 'hardware_assets', COUNT(*) FROM hardware_assets WHERE company_id = 'c3d4e5f6-a7b8-9012-cdef-123456789012'
-- UNION ALL SELECT 'agreements', COUNT(*) FROM agreements WHERE company_id = 'c3d4e5f6-a7b8-9012-cdef-123456789012'
-- UNION ALL SELECT 'contacts', COUNT(*) FROM contacts WHERE company_id = 'c3d4e5f6-a7b8-9012-cdef-123456789012'
-- UNION ALL SELECT 'licenses', COUNT(*) FROM licenses WHERE company_id = 'c3d4e5f6-a7b8-9012-cdef-123456789012'
-- UNION ALL SELECT 'notifications', COUNT(*) FROM notifications WHERE company_id = 'c3d4e5f6-a7b8-9012-cdef-123456789012'
-- UNION ALL SELECT 'documents', COUNT(*) FROM documents WHERE company_id = 'c3d4e5f6-a7b8-9012-cdef-123456789012'
-- UNION ALL SELECT 'client_products', COUNT(*) FROM client_products WHERE company_id = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
