-- ============================================================
-- Distributor Prijzen — voor alle producten in de catalogus
-- 2-3 distributeur prijzen per product (copaco, ingram, td-synnex)
-- Prijzen realistisch EUR, 5-15% variatie tussen distributeurs
-- availability: 60% in_stock, 30% limited, 10% out_of_stock
-- ============================================================

-- Cybersecurity

-- FortiGate Next-Gen Firewall (FG-60F) — ~EUR 650-720
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'FG-60F'), 'copaco', 'FG-60F-BDL-950-36', 685.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'FG-60F'), 'ingram', 'FG-60F-BDL-950-36', 710.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'FG-60F'), 'td-synnex', 'FG-60F-BDL-950-36', 649.00, 'EUR', 'limited', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();

-- FortiClient Endpoint Protection (FC-EP-100) — ~EUR 28-35 per seat/jaar
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'FC-EP-100'), 'copaco', 'FC-EP-100-25', 32.50, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'FC-EP-100'), 'ingram', 'FC-EP-100-25', 29.90, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'FC-EP-100'), 'td-synnex', 'FC-EP-100-25', 34.00, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();

-- Managed Firewall Service (YLD-MFW) — ~EUR 175-210/mnd
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'YLD-MFW'), 'copaco', 'YLD-MFW-MSP', 195.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'YLD-MFW'), 'ingram', 'YLD-MFW-MSP', 185.00, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();

-- WatchGuard Firebox (WG-T45) — ~EUR 520-580
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'WG-T45'), 'copaco', 'WGT45643-WW', 545.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'WG-T45'), 'ingram', 'WGT45643-WW', 529.00, 'EUR', 'limited', NOW()),
  ((SELECT id FROM products WHERE sku = 'WG-T45'), 'td-synnex', 'WGT45643-WW', 575.00, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();

-- Multi-Factor Authenticatie (MS-MFA) — ~EUR 5-7 per user/mnd
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'MS-MFA'), 'copaco', 'MS-MFA-P1', 5.80, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'MS-MFA'), 'ingram', 'MS-MFA-P1', 5.50, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'MS-MFA'), 'td-synnex', 'MS-MFA-P1', 6.20, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();


-- Connectivity

-- Zakelijk Glasvezel Internet (KPN-GLAS-1G) — ~EUR 250-320/mnd
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'KPN-GLAS-1G'), 'copaco', 'KPN-GLAS-1G-ZAK', 289.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'KPN-GLAS-1G'), 'ingram', 'KPN-GLAS-1G-ZAK', 310.00, 'EUR', 'limited', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();

-- SD-WAN Oplossing (FG-SDWAN) — ~EUR 1800-2200
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'FG-SDWAN'), 'copaco', 'FG-SDWAN-100F', 1950.00, 'EUR', 'limited', NOW()),
  ((SELECT id FROM products WHERE sku = 'FG-SDWAN'), 'ingram', 'FG-SDWAN-100F', 2089.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'FG-SDWAN'), 'td-synnex', 'FG-SDWAN-100F', 1849.00, 'EUR', 'out_of_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();

-- Managed Network Service (YLD-MNS) — ~EUR 350-420/mnd
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'YLD-MNS'), 'copaco', 'YLD-MNS-MSP', 385.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'YLD-MNS'), 'ingram', 'YLD-MNS-MSP', 395.00, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();


-- Devices

-- HP EliteBook 840 G10 (HP-EB840-G10) — ~EUR 1100-1250
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'HP-EB840-G10'), 'copaco', 'HP-EB840G10-I7', 1149.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'HP-EB840-G10'), 'ingram', 'HP-EB840G10-I7', 1195.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'HP-EB840-G10'), 'td-synnex', 'HP-EB840G10-I7', 1109.00, 'EUR', 'limited', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();

-- HP ProDesk 400 G9 (HP-PD400-G9) — ~EUR 650-750
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'HP-PD400-G9'), 'copaco', 'HP-PD400G9-MT', 689.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'HP-PD400-G9'), 'ingram', 'HP-PD400G9-MT', 725.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'HP-PD400-G9'), 'td-synnex', 'HP-PD400G9-MT', 669.00, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();

-- Samsung 27" Monitor (SAM-S27R650) — ~EUR 280-340
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'SAM-S27R650'), 'copaco', 'LS27R650FDU', 295.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'SAM-S27R650'), 'ingram', 'LS27R650FDU', 309.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'SAM-S27R650'), 'td-synnex', 'LS27R650FDU', 285.00, 'EUR', 'limited', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();

-- HPE ProLiant DL380 Gen11 (HPE-DL380-G11) — ~EUR 3500-4500
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'HPE-DL380-G11'), 'copaco', 'HPE-DL380-G11-4LFF', 3890.00, 'EUR', 'limited', NOW()),
  ((SELECT id FROM products WHERE sku = 'HPE-DL380-G11'), 'ingram', 'HPE-DL380-G11-4LFF', 4125.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'HPE-DL380-G11'), 'td-synnex', 'HPE-DL380-G11-4LFF', 3749.00, 'EUR', 'out_of_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();


-- Cloud

-- Microsoft 365 Business Premium (MS-365-BP) — ~EUR 18-22 per user/mnd
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'MS-365-BP'), 'copaco', 'MS-365-BP-CSP', 19.70, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'MS-365-BP'), 'ingram', 'MS-365-BP-CSP', 18.70, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'MS-365-BP'), 'td-synnex', 'MS-365-BP-CSP', 20.50, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();

-- Azure Cloud Hosting (AZ-HOST) — ~EUR 450-600/mnd per VM
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'AZ-HOST'), 'copaco', 'AZ-VM-D4SV5', 485.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'AZ-HOST'), 'ingram', 'AZ-VM-D4SV5', 475.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'AZ-HOST'), 'td-synnex', 'AZ-VM-D4SV5', 510.00, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();

-- Cloud Backup (VBR-365) — ~EUR 2.50-3.50 per user/mnd
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'VBR-365'), 'copaco', 'VBR-365-CSP', 2.85, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'VBR-365'), 'ingram', 'VBR-365-CSP', 3.10, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'VBR-365'), 'td-synnex', 'VBR-365-CSP', 2.65, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();

-- Hosted Desktop VDI (VMW-HRZ) — ~EUR 35-45 per user/mnd
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'VMW-HRZ'), 'copaco', 'VMW-HRZ-STD', 38.50, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'VMW-HRZ'), 'ingram', 'VMW-HRZ-STD', 42.00, 'EUR', 'limited', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();


-- Voice & Video

-- Microsoft Teams Telefonie (MS-TEAMS-TEL) — ~EUR 7-10 per user/mnd
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'MS-TEAMS-TEL'), 'copaco', 'MS-TEAMS-TEL-CSP', 8.50, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'MS-TEAMS-TEL'), 'ingram', 'MS-TEAMS-TEL-CSP', 7.90, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'MS-TEAMS-TEL'), 'td-synnex', 'MS-TEAMS-TEL-CSP', 9.20, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();

-- Hosted Telefonie UCaaS (OD-UCAAS) — ~EUR 12-16 per user/mnd
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'OD-UCAAS'), 'copaco', 'OD-UCAAS-PRO', 13.50, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'OD-UCAAS'), 'ingram', 'OD-UCAAS-PRO', 14.90, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();


-- Enterprise Apps

-- Microsoft Dynamics 365 (MS-DYN365) — ~EUR 60-80 per user/mnd
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'MS-DYN365'), 'copaco', 'MS-DYN365-BC-CSP', 65.50, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'MS-DYN365'), 'ingram', 'MS-DYN365-BC-CSP', 62.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'MS-DYN365'), 'td-synnex', 'MS-DYN365-BC-CSP', 69.90, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();

-- Power Platform (MS-PWRPLAT) — ~EUR 18-25 per user/mnd
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'MS-PWRPLAT'), 'copaco', 'MS-PWRPLAT-CSP', 20.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'MS-PWRPLAT'), 'ingram', 'MS-PWRPLAT-CSP', 18.50, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();


-- Mobile

-- Microsoft Intune MDM (MS-INTUNE) — ~EUR 7-10 per device/mnd
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'MS-INTUNE'), 'copaco', 'MS-INTUNE-P1-CSP', 7.80, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'MS-INTUNE'), 'ingram', 'MS-INTUNE-P1-CSP', 8.50, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'MS-INTUNE'), 'td-synnex', 'MS-INTUNE-P1-CSP', 7.20, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();

-- Zakelijk Mobiel Abonnement (OD-MOB-UNL) — ~EUR 25-35/mnd
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'OD-MOB-UNL'), 'copaco', 'OD-MOB-UNL-ZAK', 27.50, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'OD-MOB-UNL'), 'ingram', 'OD-MOB-UNL-ZAK', 29.00, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();

-- Apple iPhone 15 Pro (APL-IP15P) — ~EUR 1150-1300
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'APL-IP15P'), 'copaco', 'APL-IP15P-256', 1189.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'APL-IP15P'), 'ingram', 'APL-IP15P-256', 1225.00, 'EUR', 'limited', NOW()),
  ((SELECT id FROM products WHERE sku = 'APL-IP15P'), 'td-synnex', 'APL-IP15P-256', 1159.00, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();


-- Data

-- Synology NAS (SYN-DS1621) — ~EUR 750-880
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'SYN-DS1621'), 'copaco', 'SYN-DS1621PLUS', 789.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'SYN-DS1621'), 'ingram', 'SYN-DS1621PLUS', 829.00, 'EUR', 'limited', NOW()),
  ((SELECT id FROM products WHERE sku = 'SYN-DS1621'), 'td-synnex', 'SYN-DS1621PLUS', 769.00, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();

-- Disaster Recovery as a Service (VBR-DRAAS) — ~EUR 150-200/mnd
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'VBR-DRAAS'), 'copaco', 'VBR-DRAAS-STD', 175.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'VBR-DRAAS'), 'ingram', 'VBR-DRAAS-STD', 189.00, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();

-- Backup & Replicatie (VBR-STD) — ~EUR 450-550 per socket/jaar
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'VBR-STD'), 'copaco', 'VBR-STD-S', 479.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'VBR-STD'), 'ingram', 'VBR-STD-S', 515.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'VBR-STD'), 'td-synnex', 'VBR-STD-S', 459.00, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();


-- Pro AV

-- Teams Room Vergaderoplossing (MS-TEAMS-ROOM) — ~EUR 3500-4500
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'MS-TEAMS-ROOM'), 'copaco', 'MS-TR-POLYBAR', 3850.00, 'EUR', 'limited', NOW()),
  ((SELECT id FROM products WHERE sku = 'MS-TEAMS-ROOM'), 'ingram', 'MS-TR-POLYBAR', 4100.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'MS-TEAMS-ROOM'), 'td-synnex', 'MS-TR-POLYBAR', 3695.00, 'EUR', 'out_of_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();

-- Digitaal Whiteboard (SAM-FLIP55) — ~EUR 2500-3000
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'SAM-FLIP55'), 'copaco', 'SAM-FLIP55-WM55B', 2695.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'SAM-FLIP55'), 'ingram', 'SAM-FLIP55-WM55B', 2890.00, 'EUR', 'limited', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();


-- AI

-- Microsoft 365 Copilot (MS-COPILOT) — ~EUR 28-33 per user/mnd
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'MS-COPILOT'), 'copaco', 'MS-COPILOT-CSP', 30.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'MS-COPILOT'), 'ingram', 'MS-COPILOT-CSP', 28.50, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'MS-COPILOT'), 'td-synnex', 'MS-COPILOT-CSP', 31.50, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();

-- Azure AI Services (AZ-AI) — ~EUR 200-300/mnd basis
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'AZ-AI'), 'copaco', 'AZ-AI-S0', 245.00, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'AZ-AI'), 'ingram', 'AZ-AI-S0', 235.00, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();


-- Managed Services

-- Yielder Beheer Basis (YLD-BHR-BAS) — ~EUR 8-12 per device/mnd
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'YLD-BHR-BAS'), 'copaco', 'YLD-BHR-BAS-MSP', 9.50, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'YLD-BHR-BAS'), 'ingram', 'YLD-BHR-BAS-MSP', 10.50, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();

-- Yielder Beheer Premium (YLD-BHR-PRE) — ~EUR 15-22 per device/mnd
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'YLD-BHR-PRE'), 'copaco', 'YLD-BHR-PRE-MSP', 17.50, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'YLD-BHR-PRE'), 'ingram', 'YLD-BHR-PRE-MSP', 19.00, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();

-- Managed Endpoint Security (YLD-MES) — ~EUR 6-9 per device/mnd
INSERT INTO distributor_prices (product_id, distributor, sku, price, currency, availability, fetched_at)
VALUES
  ((SELECT id FROM products WHERE sku = 'YLD-MES'), 'copaco', 'YLD-MES-MSP', 7.50, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'YLD-MES'), 'ingram', 'YLD-MES-MSP', 8.20, 'EUR', 'in_stock', NOW()),
  ((SELECT id FROM products WHERE sku = 'YLD-MES'), 'td-synnex', 'YLD-MES-MSP', 6.90, 'EUR', 'in_stock', NOW())
ON CONFLICT (product_id, distributor) DO UPDATE SET price = EXCLUDED.price, availability = EXCLUDED.availability, fetched_at = NOW();


-- ============================================================
-- Verificatie query (als comment)
-- SELECT p.name, p.sku, dp.distributor, dp.price, dp.availability
-- FROM distributor_prices dp
-- JOIN products p ON p.id = dp.product_id
-- ORDER BY p.sku, dp.distributor;
--
-- SELECT COUNT(*) AS total_prices FROM distributor_prices;
-- Verwacht: ~80 rijen (30+ producten x 2-3 distributeurs)
-- ============================================================
