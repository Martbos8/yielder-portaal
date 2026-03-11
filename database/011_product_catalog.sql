-- Migration: Product Catalog for Recommendation Engine
-- Creates product_categories, products, product_dependencies, and client_products tables

-- 1. Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT 'category',
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Products
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  vendor TEXT,
  sku TEXT,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('hardware', 'software', 'service')),
  lifecycle_years INTEGER,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Product Dependencies
CREATE TABLE IF NOT EXISTS product_dependencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  depends_on_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL CHECK (dependency_type IN ('requires', 'recommended', 'enhances')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(product_id, depends_on_product_id)
);

-- 4. Client Products (what a company owns/uses)
CREATE TABLE IF NOT EXISTS client_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 NOT NULL,
  purchase_date DATE,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expiring', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_client_products_company ON client_products(company_id);
CREATE INDEX IF NOT EXISTS idx_client_products_product ON client_products(product_id);
CREATE INDEX IF NOT EXISTS idx_product_dependencies_product ON product_dependencies(product_id);
CREATE INDEX IF NOT EXISTS idx_product_dependencies_depends ON product_dependencies(depends_on_product_id);

-- RLS Policies
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_products ENABLE ROW LEVEL SECURITY;

-- Product categories and products are readable by all authenticated users
CREATE POLICY "product_categories_read" ON product_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "products_read" ON products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "product_dependencies_read" ON product_dependencies
  FOR SELECT TO authenticated USING (true);

-- Client products filtered by company (RLS via user_company_mapping)
CREATE POLICY "client_products_read" ON client_products
  FOR SELECT TO authenticated USING (
    company_id IN (
      SELECT company_id FROM user_company_mapping
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- SEED DATA: 11 Categories
-- ============================================================

INSERT INTO product_categories (name, slug, icon, description, sort_order) VALUES
  ('Cybersecurity', 'cybersecurity', 'security', 'Firewalls, endpoint protection, managed security en backup', 1),
  ('Connectivity', 'connectivity', 'lan', 'Internet, SD-WAN en netwerken', 2),
  ('Devices', 'devices', 'devices', 'Laptops, desktops, servers en monitoren', 3),
  ('Cloud', 'cloud', 'cloud', 'Microsoft 365, Azure, cloud backup en hosted servers', 4),
  ('Voice & Video', 'voice-video', 'call', 'UCaaS, CCaaS en hosted telefonie', 5),
  ('Enterprise Apps', 'enterprise-apps', 'apps', 'ERP, CRM en branchespecifieke applicaties', 6),
  ('Mobile', 'mobile', 'smartphone', 'MDM, mobile devices en mobiele abonnementen', 7),
  ('Data', 'data', 'storage', 'Opslag, backup en disaster recovery', 8),
  ('Pro AV', 'pro-av', 'videocam', 'Audiovisueel en vergaderruimtes', 9),
  ('AI', 'ai', 'psychology', 'AI-tools, copilots en automatisering', 10),
  ('Managed Services', 'managed-services', 'support_agent', 'Beheer, monitoring, helpdesk en patch management', 11)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED DATA: 30+ Products across categories
-- ============================================================

-- Cybersecurity (cat 1)
INSERT INTO products (category_id, name, vendor, sku, description, type, lifecycle_years, is_active) VALUES
  ((SELECT id FROM product_categories WHERE slug = 'cybersecurity'), 'FortiGate Next-Gen Firewall', 'Fortinet', 'FG-60F', 'Next-generation firewall met IPS, antivirus en web filtering', 'hardware', 5, true),
  ((SELECT id FROM product_categories WHERE slug = 'cybersecurity'), 'FortiClient Endpoint Protection', 'Fortinet', 'FC-EP-100', 'Endpoint bescherming met VPN en vulnerability scanning', 'software', 3, true),
  ((SELECT id FROM product_categories WHERE slug = 'cybersecurity'), 'Managed Firewall Service', 'Yielder', 'YLD-MFW', 'Volledig beheerde firewall inclusief monitoring en updates', 'service', 1, true),
  ((SELECT id FROM product_categories WHERE slug = 'cybersecurity'), 'WatchGuard Firebox', 'WatchGuard', 'WG-T45', 'UTM firewall voor MKB', 'hardware', 5, true),
  ((SELECT id FROM product_categories WHERE slug = 'cybersecurity'), 'Multi-Factor Authenticatie (MFA)', 'Microsoft', 'MS-MFA', 'Azure AD MFA voor veilige toegang', 'software', 1, true);

-- Connectivity (cat 2)
INSERT INTO products (category_id, name, vendor, sku, description, type, lifecycle_years, is_active) VALUES
  ((SELECT id FROM product_categories WHERE slug = 'connectivity'), 'Zakelijk Glasvezel Internet', 'KPN', 'KPN-GLAS-1G', 'Dedicated glasvezel 1Gbps symmetrisch', 'service', 3, true),
  ((SELECT id FROM product_categories WHERE slug = 'connectivity'), 'SD-WAN Oplossing', 'Fortinet', 'FG-SDWAN', 'Software-defined WAN voor multi-site verbinding', 'hardware', 5, true),
  ((SELECT id FROM product_categories WHERE slug = 'connectivity'), 'Managed Network Service', 'Yielder', 'YLD-MNS', 'Volledig beheerd netwerk inclusief monitoring', 'service', 1, true);

-- Devices (cat 3)
INSERT INTO products (category_id, name, vendor, sku, description, type, lifecycle_years, is_active) VALUES
  ((SELECT id FROM product_categories WHERE slug = 'devices'), 'HP EliteBook 840 G10', 'HP', 'HP-EB840-G10', 'Zakelijke laptop 14" i7 16GB 512GB SSD', 'hardware', 4, true),
  ((SELECT id FROM product_categories WHERE slug = 'devices'), 'HP ProDesk 400 G9', 'HP', 'HP-PD400-G9', 'Zakelijke desktop mini tower', 'hardware', 5, true),
  ((SELECT id FROM product_categories WHERE slug = 'devices'), 'Samsung 27" Monitor', 'Samsung', 'SAM-S27R650', 'Zakelijke IPS monitor 27" QHD', 'hardware', 6, true),
  ((SELECT id FROM product_categories WHERE slug = 'devices'), 'HPE ProLiant DL380 Gen11', 'HPE', 'HPE-DL380-G11', 'Rack server voor bedrijfskritische workloads', 'hardware', 5, true);

-- Cloud (cat 4)
INSERT INTO products (category_id, name, vendor, sku, description, type, lifecycle_years, is_active) VALUES
  ((SELECT id FROM product_categories WHERE slug = 'cloud'), 'Microsoft 365 Business Premium', 'Microsoft', 'MS-365-BP', 'Complete office suite met beveiligingsfeatures', 'software', 1, true),
  ((SELECT id FROM product_categories WHERE slug = 'cloud'), 'Azure Cloud Hosting', 'Microsoft', 'AZ-HOST', 'Virtual machines en cloud infrastructure', 'service', 1, true),
  ((SELECT id FROM product_categories WHERE slug = 'cloud'), 'Cloud Backup', 'Veeam', 'VBR-365', 'Cloud backup voor Microsoft 365 en on-premise', 'software', 1, true),
  ((SELECT id FROM product_categories WHERE slug = 'cloud'), 'Hosted Desktop (VDI)', 'VMware', 'VMW-HRZ', 'Virtual Desktop Infrastructure', 'service', 1, true);

-- Voice & Video (cat 5)
INSERT INTO products (category_id, name, vendor, sku, description, type, lifecycle_years, is_active) VALUES
  ((SELECT id FROM product_categories WHERE slug = 'voice-video'), 'Microsoft Teams Telefonie', 'Microsoft', 'MS-TEAMS-TEL', 'Cloud telefonie via Microsoft Teams', 'service', 1, true),
  ((SELECT id FROM product_categories WHERE slug = 'voice-video'), 'Hosted Telefonie (UCaaS)', 'Odido', 'OD-UCAAS', 'Hosted VoIP telefonie oplossing', 'service', 2, true);

-- Enterprise Apps (cat 6)
INSERT INTO products (category_id, name, vendor, sku, description, type, lifecycle_years, is_active) VALUES
  ((SELECT id FROM product_categories WHERE slug = 'enterprise-apps'), 'Microsoft Dynamics 365', 'Microsoft', 'MS-DYN365', 'Cloud ERP en CRM platform', 'software', 1, true),
  ((SELECT id FROM product_categories WHERE slug = 'enterprise-apps'), 'Power Platform', 'Microsoft', 'MS-PWRPLAT', 'Low-code platform: Power Apps, Automate, BI', 'software', 1, true);

-- Mobile (cat 7)
INSERT INTO products (category_id, name, vendor, sku, description, type, lifecycle_years, is_active) VALUES
  ((SELECT id FROM product_categories WHERE slug = 'mobile'), 'Microsoft Intune MDM', 'Microsoft', 'MS-INTUNE', 'Mobile Device Management via Intune', 'software', 1, true),
  ((SELECT id FROM product_categories WHERE slug = 'mobile'), 'Zakelijk Mobiel Abonnement', 'Odido', 'OD-MOB-UNL', 'Onbeperkt bellen en data zakelijk', 'service', 2, true),
  ((SELECT id FROM product_categories WHERE slug = 'mobile'), 'Apple iPhone 15 Pro', 'Apple', 'APL-IP15P', 'Zakelijke smartphone', 'hardware', 3, true);

-- Data (cat 8)
INSERT INTO products (category_id, name, vendor, sku, description, type, lifecycle_years, is_active) VALUES
  ((SELECT id FROM product_categories WHERE slug = 'data'), 'Synology NAS', 'Synology', 'SYN-DS1621', 'Network Attached Storage 6-bay', 'hardware', 5, true),
  ((SELECT id FROM product_categories WHERE slug = 'data'), 'Disaster Recovery as a Service', 'Veeam', 'VBR-DRAAS', 'DRaaS met automatische failover', 'service', 1, true),
  ((SELECT id FROM product_categories WHERE slug = 'data'), 'Backup & Replicatie', 'Veeam', 'VBR-STD', 'On-premise en cloud backup', 'software', 1, true);

-- Pro AV (cat 9)
INSERT INTO products (category_id, name, vendor, sku, description, type, lifecycle_years, is_active) VALUES
  ((SELECT id FROM product_categories WHERE slug = 'pro-av'), 'Teams Room Vergaderoplossing', 'Microsoft', 'MS-TEAMS-ROOM', 'Complete vergaderruimte oplossing met Teams', 'hardware', 5, true),
  ((SELECT id FROM product_categories WHERE slug = 'pro-av'), 'Digitaal Whiteboard', 'Samsung', 'SAM-FLIP55', 'Interactief display 55" voor vergaderruimtes', 'hardware', 5, true);

-- AI (cat 10)
INSERT INTO products (category_id, name, vendor, sku, description, type, lifecycle_years, is_active) VALUES
  ((SELECT id FROM product_categories WHERE slug = 'ai'), 'Microsoft 365 Copilot', 'Microsoft', 'MS-COPILOT', 'AI-assistent geïntegreerd in Microsoft 365', 'software', 1, true),
  ((SELECT id FROM product_categories WHERE slug = 'ai'), 'Azure AI Services', 'Microsoft', 'AZ-AI', 'AI en machine learning diensten in Azure', 'service', 1, true);

-- Managed Services (cat 11)
INSERT INTO products (category_id, name, vendor, sku, description, type, lifecycle_years, is_active) VALUES
  ((SELECT id FROM product_categories WHERE slug = 'managed-services'), 'Yielder Beheer Basis', 'Yielder', 'YLD-BHR-BAS', 'Basismonitoring en patchmanagement', 'service', 1, true),
  ((SELECT id FROM product_categories WHERE slug = 'managed-services'), 'Yielder Beheer Premium', 'Yielder', 'YLD-BHR-PRE', 'Premium beheer met 24/7 monitoring, helpdesk en proactief onderhoud', 'service', 1, true),
  ((SELECT id FROM product_categories WHERE slug = 'managed-services'), 'Managed Endpoint Security', 'Yielder', 'YLD-MES', 'Beheerde endpoint beveiliging met SOC', 'service', 1, true);

-- ============================================================
-- SEED DATA: Product Dependencies
-- ============================================================

-- Firewall → Managed Firewall Service (recommended)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'recommended'
FROM products p1, products p2
WHERE p1.sku = 'FG-60F' AND p2.sku = 'YLD-MFW'
ON CONFLICT DO NOTHING;

-- WatchGuard Firewall → Managed Firewall Service (recommended)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'recommended'
FROM products p1, products p2
WHERE p1.sku = 'WG-T45' AND p2.sku = 'YLD-MFW'
ON CONFLICT DO NOTHING;

-- Laptops → MDM (recommended)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'recommended'
FROM products p1, products p2
WHERE p1.sku = 'HP-EB840-G10' AND p2.sku = 'MS-INTUNE'
ON CONFLICT DO NOTHING;

-- Laptops → Endpoint Protection (requires)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'requires'
FROM products p1, products p2
WHERE p1.sku = 'HP-EB840-G10' AND p2.sku = 'FC-EP-100'
ON CONFLICT DO NOTHING;

-- Desktops → Endpoint Protection (requires)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'requires'
FROM products p1, products p2
WHERE p1.sku = 'HP-PD400-G9' AND p2.sku = 'FC-EP-100'
ON CONFLICT DO NOTHING;

-- Cloud (M365) → MFA (requires)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'requires'
FROM products p1, products p2
WHERE p1.sku = 'MS-365-BP' AND p2.sku = 'MS-MFA'
ON CONFLICT DO NOTHING;

-- Cloud (M365) → Cloud Backup (requires)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'requires'
FROM products p1, products p2
WHERE p1.sku = 'MS-365-BP' AND p2.sku = 'VBR-365'
ON CONFLICT DO NOTHING;

-- Azure Hosting → Backup & Replicatie (requires)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'requires'
FROM products p1, products p2
WHERE p1.sku = 'AZ-HOST' AND p2.sku = 'VBR-STD'
ON CONFLICT DO NOTHING;

-- Azure Hosting → Disaster Recovery (recommended)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'recommended'
FROM products p1, products p2
WHERE p1.sku = 'AZ-HOST' AND p2.sku = 'VBR-DRAAS'
ON CONFLICT DO NOTHING;

-- Server → Managed Service (recommended)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'recommended'
FROM products p1, products p2
WHERE p1.sku = 'HPE-DL380-G11' AND p2.sku = 'YLD-BHR-PRE'
ON CONFLICT DO NOTHING;

-- Server → Backup (requires)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'requires'
FROM products p1, products p2
WHERE p1.sku = 'HPE-DL380-G11' AND p2.sku = 'VBR-STD'
ON CONFLICT DO NOTHING;

-- Mobile devices → MDM (recommended)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'recommended'
FROM products p1, products p2
WHERE p1.sku = 'APL-IP15P' AND p2.sku = 'MS-INTUNE'
ON CONFLICT DO NOTHING;

-- M365 Copilot → M365 (requires)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'requires'
FROM products p1, products p2
WHERE p1.sku = 'MS-COPILOT' AND p2.sku = 'MS-365-BP'
ON CONFLICT DO NOTHING;

-- Endpoint Security → Managed Endpoint Security (enhances)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'enhances'
FROM products p1, products p2
WHERE p1.sku = 'FC-EP-100' AND p2.sku = 'YLD-MES'
ON CONFLICT DO NOTHING;

-- NAS → Backup (requires)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'requires'
FROM products p1, products p2
WHERE p1.sku = 'SYN-DS1621' AND p2.sku = 'VBR-STD'
ON CONFLICT DO NOTHING;
