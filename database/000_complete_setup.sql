-- ============================================================
-- Mijn Yielder — Complete Database Setup
-- ============================================================
-- Kopieer dit bestand in de Supabase SQL Editor en voer het uit.
-- Datum referentie: 2026-03-11
--
-- STAPPEN:
--   1. Voer dit SQL-bestand uit in de Supabase SQL Editor
--   2. Maak een gebruiker aan via Supabase Auth → Users → Add User
--   3. Voer het SQL-blok onderaan uit (STAP 3) met het UUID van de gebruiker
-- ============================================================


-- ############################################################
-- SECTIE 0: OPRUIMEN BESTAANDE TABELLEN
-- ############################################################
-- Drop in omgekeerde volgorde vanwege foreign keys

DROP TABLE IF EXISTS contact_requests CASCADE;
DROP TABLE IF EXISTS distributor_prices CASCADE;
DROP TABLE IF EXISTS recommendation_feedback CASCADE;
DROP TABLE IF EXISTS client_products CASCADE;
DROP TABLE IF EXISTS product_dependencies CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS sync_logs CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS licenses CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS agreements CASCADE;
DROP TABLE IF EXISTS hardware_assets CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS user_company_mapping CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop oude trigger als die bestaat
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();


-- ############################################################
-- SECTIE 1: CORE TABLES
-- ############################################################

-- profiles: extends auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_yielder BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- companies
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cw_company_id INTEGER,
  employee_count INTEGER,
  industry TEXT,
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- user_company_mapping
CREATE TABLE IF NOT EXISTS user_company_mapping (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, company_id)
);

-- tickets
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cw_ticket_id INTEGER,
  summary TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  contact_name TEXT,
  source TEXT,
  is_closed BOOLEAN DEFAULT false NOT NULL,
  cw_created_at TIMESTAMPTZ,
  cw_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- hardware_assets
CREATE TABLE IF NOT EXISTS hardware_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cw_config_id INTEGER,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Desktop', 'Laptop', 'Server', 'Netwerk', 'Overig')),
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  assigned_to TEXT,
  warranty_expiry DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- agreements
CREATE TABLE IF NOT EXISTS agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cw_agreement_id INTEGER,
  name TEXT NOT NULL,
  type TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  bill_amount NUMERIC,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- contacts
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- licenses
CREATE TABLE IF NOT EXISTS licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vendor TEXT NOT NULL,
  product_name TEXT NOT NULL,
  license_type TEXT,
  seats_total INTEGER NOT NULL DEFAULT 0,
  seats_used INTEGER NOT NULL DEFAULT 0,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expiring', 'expired')),
  cost_per_seat NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'alert', 'success')),
  is_read BOOLEAN DEFAULT false NOT NULL,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'overig' CHECK (category IN ('handleiding', 'contract', 'whitepaper', 'rapport', 'overig')),
  file_url TEXT,
  file_size INTEGER,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- audit_log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- sync_logs
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('companies', 'tickets', 'agreements', 'hardware', 'contacts', 'licenses')),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  records_synced INTEGER DEFAULT 0 NOT NULL,
  records_failed INTEGER DEFAULT 0 NOT NULL,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);


-- ############################################################
-- SECTIE 2: RLS POLICIES — CORE TABLES
-- ############################################################

-- --- profiles ---
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- --- companies ---
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_select_mapped" ON companies
  FOR SELECT TO authenticated USING (
    id IN (
      SELECT company_id FROM user_company_mapping WHERE user_id = auth.uid()
    )
  );

-- --- user_company_mapping ---
ALTER TABLE user_company_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ucm_select_own" ON user_company_mapping
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- --- tickets ---
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tickets_select_company" ON tickets
  FOR SELECT TO authenticated USING (
    company_id IN (
      SELECT company_id FROM user_company_mapping WHERE user_id = auth.uid()
    )
  );

-- --- hardware_assets ---
ALTER TABLE hardware_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hardware_select_company" ON hardware_assets
  FOR SELECT TO authenticated USING (
    company_id IN (
      SELECT company_id FROM user_company_mapping WHERE user_id = auth.uid()
    )
  );

-- --- agreements ---
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agreements_select_company" ON agreements
  FOR SELECT TO authenticated USING (
    company_id IN (
      SELECT company_id FROM user_company_mapping WHERE user_id = auth.uid()
    )
  );

-- --- contacts ---
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_select_company" ON contacts
  FOR SELECT TO authenticated USING (
    company_id IN (
      SELECT company_id FROM user_company_mapping WHERE user_id = auth.uid()
    )
  );

-- --- licenses ---
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "licenses_select_company" ON licenses
  FOR SELECT TO authenticated USING (
    company_id IN (
      SELECT company_id FROM user_company_mapping WHERE user_id = auth.uid()
    )
  );

-- --- notifications ---
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_company" ON notifications
  FOR SELECT TO authenticated USING (
    company_id IN (
      SELECT company_id FROM user_company_mapping WHERE user_id = auth.uid()
    )
  );

-- --- documents ---
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select_company" ON documents
  FOR SELECT TO authenticated USING (
    company_id IN (
      SELECT company_id FROM user_company_mapping WHERE user_id = auth.uid()
    )
  );

-- --- audit_log ---
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_select_company" ON audit_log
  FOR SELECT TO authenticated USING (
    company_id IN (
      SELECT company_id FROM user_company_mapping WHERE user_id = auth.uid()
    )
  );

-- --- sync_logs ---
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sync_logs_select_authenticated" ON sync_logs
  FOR SELECT TO authenticated USING (true);


-- ############################################################
-- SECTIE 3: AUTO-CREATE PROFILE TRIGGER
-- ############################################################

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ############################################################
-- SECTIE 4: MIGRATION 011 — Product Catalog
-- ############################################################

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

-- Firewall -> Managed Firewall Service (recommended)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'recommended'
FROM products p1, products p2
WHERE p1.sku = 'FG-60F' AND p2.sku = 'YLD-MFW'
ON CONFLICT DO NOTHING;

-- WatchGuard Firewall -> Managed Firewall Service (recommended)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'recommended'
FROM products p1, products p2
WHERE p1.sku = 'WG-T45' AND p2.sku = 'YLD-MFW'
ON CONFLICT DO NOTHING;

-- Laptops -> MDM (recommended)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'recommended'
FROM products p1, products p2
WHERE p1.sku = 'HP-EB840-G10' AND p2.sku = 'MS-INTUNE'
ON CONFLICT DO NOTHING;

-- Laptops -> Endpoint Protection (requires)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'requires'
FROM products p1, products p2
WHERE p1.sku = 'HP-EB840-G10' AND p2.sku = 'FC-EP-100'
ON CONFLICT DO NOTHING;

-- Desktops -> Endpoint Protection (requires)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'requires'
FROM products p1, products p2
WHERE p1.sku = 'HP-PD400-G9' AND p2.sku = 'FC-EP-100'
ON CONFLICT DO NOTHING;

-- Cloud (M365) -> MFA (requires)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'requires'
FROM products p1, products p2
WHERE p1.sku = 'MS-365-BP' AND p2.sku = 'MS-MFA'
ON CONFLICT DO NOTHING;

-- Cloud (M365) -> Cloud Backup (requires)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'requires'
FROM products p1, products p2
WHERE p1.sku = 'MS-365-BP' AND p2.sku = 'VBR-365'
ON CONFLICT DO NOTHING;

-- Azure Hosting -> Backup & Replicatie (requires)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'requires'
FROM products p1, products p2
WHERE p1.sku = 'AZ-HOST' AND p2.sku = 'VBR-STD'
ON CONFLICT DO NOTHING;

-- Azure Hosting -> Disaster Recovery (recommended)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'recommended'
FROM products p1, products p2
WHERE p1.sku = 'AZ-HOST' AND p2.sku = 'VBR-DRAAS'
ON CONFLICT DO NOTHING;

-- Server -> Managed Service (recommended)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'recommended'
FROM products p1, products p2
WHERE p1.sku = 'HPE-DL380-G11' AND p2.sku = 'YLD-BHR-PRE'
ON CONFLICT DO NOTHING;

-- Server -> Backup (requires)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'requires'
FROM products p1, products p2
WHERE p1.sku = 'HPE-DL380-G11' AND p2.sku = 'VBR-STD'
ON CONFLICT DO NOTHING;

-- Mobile devices -> MDM (recommended)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'recommended'
FROM products p1, products p2
WHERE p1.sku = 'APL-IP15P' AND p2.sku = 'MS-INTUNE'
ON CONFLICT DO NOTHING;

-- M365 Copilot -> M365 (requires)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'requires'
FROM products p1, products p2
WHERE p1.sku = 'MS-COPILOT' AND p2.sku = 'MS-365-BP'
ON CONFLICT DO NOTHING;

-- Endpoint Security -> Managed Endpoint Security (enhances)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'enhances'
FROM products p1, products p2
WHERE p1.sku = 'FC-EP-100' AND p2.sku = 'YLD-MES'
ON CONFLICT DO NOTHING;

-- NAS -> Backup (requires)
INSERT INTO product_dependencies (product_id, depends_on_product_id, dependency_type)
SELECT p1.id, p2.id, 'requires'
FROM products p1, products p2
WHERE p1.sku = 'SYN-DS1621' AND p2.sku = 'VBR-STD'
ON CONFLICT DO NOTHING;


-- ############################################################
-- SECTIE 5: MIGRATION 012 — Recommendation Feedback
-- ############################################################

-- Migration: Recommendation feedback for learning algorithm
-- Tracks user interactions with recommendations to improve scoring over time

CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  recommendation_score NUMERIC NOT NULL DEFAULT 0,
  action TEXT NOT NULL CHECK (action IN ('shown', 'clicked', 'contacted', 'purchased', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_rec_feedback_company ON recommendation_feedback(company_id);
CREATE INDEX IF NOT EXISTS idx_rec_feedback_product ON recommendation_feedback(product_id);
CREATE INDEX IF NOT EXISTS idx_rec_feedback_action ON recommendation_feedback(action);
CREATE INDEX IF NOT EXISTS idx_rec_feedback_product_action ON recommendation_feedback(product_id, action);

-- RLS policies
ALTER TABLE recommendation_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert feedback for their own companies
CREATE POLICY "Users can insert feedback for their companies"
  ON recommendation_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_company_mapping
      WHERE user_id = auth.uid()
    )
  );

-- Users can read feedback for their own companies
CREATE POLICY "Users can read feedback for their companies"
  ON recommendation_feedback FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_company_mapping
      WHERE user_id = auth.uid()
    )
  );

-- Yielder admins can read all feedback (for aggregate analysis)
CREATE POLICY "Admins can read all feedback"
  ON recommendation_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_yielder = true
    )
  );


-- ############################################################
-- SECTIE 6: MIGRATION 013 — Distributor Prices
-- ############################################################

-- Migration: Distributor prices cache
-- Stores fetched prices from distributors with 24h cache validity

CREATE TABLE IF NOT EXISTS distributor_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  distributor TEXT NOT NULL CHECK (distributor IN ('copaco', 'ingram', 'td-synnex', 'esprinet')),
  sku TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  availability TEXT NOT NULL DEFAULT 'in_stock' CHECK (availability IN ('in_stock', 'limited', 'out_of_stock', 'on_order')),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dist_prices_product ON distributor_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_dist_prices_sku ON distributor_prices(sku);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dist_prices_product_distributor ON distributor_prices(product_id, distributor);

-- RLS policies
ALTER TABLE distributor_prices ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read prices (catalog data)
CREATE POLICY "Authenticated users can read prices"
  ON distributor_prices FOR SELECT
  TO authenticated
  USING (true);


-- ############################################################
-- SECTIE 7: MIGRATION 014 — Contact Requests
-- ############################################################

-- Contact requests table for "Neem contact op met het team" feature
-- Stores contact requests from portal users linked to product recommendations

CREATE TABLE IF NOT EXISTS contact_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  urgency TEXT NOT NULL DEFAULT 'normaal' CHECK (urgency IN ('normaal', 'hoog')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by company
CREATE INDEX IF NOT EXISTS idx_contact_requests_company ON contact_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);

-- RLS policies
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own contact requests
CREATE POLICY "Users can create contact requests for their companies"
  ON contact_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_company_mapping WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Users can view their own company's contact requests
CREATE POLICY "Users can view their company contact requests"
  ON contact_requests FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_company_mapping WHERE user_id = auth.uid()
    )
  );

-- Yielder admins can view all contact requests
CREATE POLICY "Admins can view all contact requests"
  ON contact_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_yielder = true
    )
  );

-- Yielder admins can update contact request status
CREATE POLICY "Admins can update contact requests"
  ON contact_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_yielder = true
    )
  );


-- ############################################################
-- SECTIE 8: SEED DATA — Demo bedrijven, tickets, hardware, etc.
-- ############################################################

-- Fixed UUIDs voor cross-referenties
-- Bakkerij Groot & Zonen:   a1b2c3d4-e5f6-7890-abcd-ef1234567890
-- Technisch Bureau Veldhuis: b2c3d4e5-f6a7-8901-bcde-f12345678901
-- Autogroep Rensen:         c3d4e5f6-a7b8-9012-cdef-123456789012

-- ============================================================
-- 8.1 Companies
-- ============================================================

INSERT INTO companies (id, name, cw_company_id, employee_count, industry, region, created_at) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Bakkerij Groot & Zonen', 12345, 25, 'Voedingsindustrie', 'Overijssel', '2025-06-15T10:00:00Z'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Technisch Bureau Veldhuis', 12346, 40, 'Techniek', 'Overijssel', '2025-04-20T09:00:00Z'),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Autogroep Rensen', 12347, 80, 'Automotive', 'Gelderland', '2025-03-10T08:00:00Z')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 8.2 Tickets — Bakkerij Groot & Zonen (8 tickets)
-- ============================================================

INSERT INTO tickets (id, company_id, cw_ticket_id, summary, description, status, priority, contact_name, source, is_closed, created_at) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 88901,
   'Printer 2e verdieping print niet meer',
   'HP LaserJet op de 2e verdieping geeft foutmelding "Paper Jam" maar er zit geen papier vast. Herstart heeft niet geholpen.',
   'open', 'normal', 'Annemarie Groot-Veldman', 'email', false,
   '2026-03-09T08:30:00Z'),

  ('d0000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 88895,
   'Outlook synchroniseert niet op laptop Jan',
   'Jan Vermeer meldt dat zijn Outlook al 2 dagen niet meer synchroniseert. Cached Exchange Mode staat aan, internet werkt wel.',
   'in_progress', 'high', 'Pieter Groot', 'telefoon', false,
   '2026-03-08T11:15:00Z'),

  ('d0000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 88910,
   'Nieuwe medewerker account aanmaken - Sophie Bakker',
   'Sophie Bakker begint volgende week maandag. Nodig: M365 account, laptop configuratie, toegang tot gedeelde mappen Productie.',
   'open', 'normal', 'Pieter Groot', 'portaal', false,
   '2026-03-10T14:00:00Z'),

  ('d0000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 88870,
   'VPN verbinding valt steeds weg',
   'Meerdere thuiswerkers melden dat de FortiClient VPN na 10-15 minuten automatisch disconnecte. Probleem sinds vorige week.',
   'in_progress', 'urgent', 'Tom Hendriks', 'telefoon', false,
   '2026-03-06T09:00:00Z'),

  ('d0000001-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 88915,
   'Monitor flikkert bij werkplek receptie',
   'Samsung monitor bij de receptie flikkert onregelmatig. Kabel al verwisseld, probleem blijft.',
   'open', 'low', 'Annemarie Groot-Veldman', 'email', false,
   '2026-03-11T07:45:00Z'),

  ('d0000001-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 88820,
   'Windows update mislukt op server',
   'KB5034441 security update faalt steeds met foutcode 0x80070643 op de fileserver. Recovery partitie is te klein.',
   'closed', 'high', 'Tom Hendriks', 'monitoring', true,
   '2026-03-01T06:00:00Z'),

  ('d0000001-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 88780,
   'WiFi bereik in magazijn verbeteren',
   'In het magazijn achteraan is het WiFi signaal te zwak voor de handterminals. Extra access point gewenst.',
   'closed', 'normal', 'Tom Hendriks', 'portaal', true,
   '2026-02-25T10:30:00Z'),

  ('d0000001-0000-0000-0000-000000000008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 88918,
   'Backup melding - schijf bijna vol',
   'Veeam backup job meldt dat de backup schijf nog maar 12% vrije ruimte heeft. Opschonen of uitbreiden noodzakelijk.',
   'open', 'urgent', NULL, 'monitoring', false,
   '2026-03-11T05:30:00Z')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 8.3 Hardware Assets — Bakkerij Groot & Zonen (15 items)
-- ============================================================

INSERT INTO hardware_assets (id, company_id, cw_config_id, name, type, manufacturer, model, serial_number, assigned_to, warranty_expiry) VALUES
  -- Laptops (5)
  ('e0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5001, 'Laptop Pieter', 'Laptop', 'HP', 'EliteBook 840 G10', 'CND4231HPK', 'Pieter Groot', '2027-08-15'),
  ('e0000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5002, 'Laptop Annemarie', 'Laptop', 'HP', 'EliteBook 840 G10', 'CND4231HQL', 'Annemarie Groot-Veldman', '2027-08-15'),
  ('e0000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5003, 'Laptop Tom', 'Laptop', 'HP', 'EliteBook 840 G9', 'CND3189JRT', 'Tom Hendriks', '2026-04-20'),
  ('e0000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5004, 'Laptop Jan Vermeer', 'Laptop', 'HP', 'EliteBook 830 G8', 'CND2105KMN', 'Jan Vermeer', '2025-11-30'),
  ('e0000001-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5005, 'Laptop Sophie', 'Laptop', 'HP', 'EliteBook 840 G10', 'CND4512LPQ', 'Sophie Bakker', '2028-01-10'),

  -- Desktops (5)
  ('e0000001-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5006, 'Desktop Receptie', 'Desktop', 'HP', 'ProDesk 400 G9', 'MXL3290BRP', 'Receptie', '2027-03-01'),
  ('e0000001-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5007, 'Desktop Productie 1', 'Desktop', 'HP', 'ProDesk 400 G9', 'MXL3290BST', 'Productie', '2027-03-01'),
  ('e0000001-0000-0000-0000-000000000008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5008, 'Desktop Productie 2', 'Desktop', 'HP', 'ProDesk 400 G7', 'MXL1810DVW', 'Productie', '2025-06-15'),
  ('e0000001-0000-0000-0000-000000000009', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5009, 'Desktop Magazijn', 'Desktop', 'HP', 'ProDesk 400 G7', 'MXL1810DXY', 'Magazijn', '2025-06-15'),
  ('e0000001-0000-0000-0000-000000000010', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5010, 'Desktop Administratie', 'Desktop', 'HP', 'ProDesk 400 G9', 'MXL3290BUV', 'Administratie', '2027-03-01'),

  -- Server (1)
  ('e0000001-0000-0000-0000-000000000011', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5011, 'Fileserver BG-SRV01', 'Server', 'HPE', 'ProLiant DL380 Gen10', 'USE1234ABC', 'Serverruimte', '2026-09-30'),

  -- Netwerk (4)
  ('e0000001-0000-0000-0000-000000000012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5012, 'Firewall FortiGate 60F', 'Netwerk', 'Fortinet', 'FortiGate 60F', 'FGT60FTK22000123', 'Serverruimte', '2027-06-01'),
  ('e0000001-0000-0000-0000-000000000013', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5013, 'Access Point Kantoor', 'Netwerk', 'Ubiquiti', 'UniFi U6-Pro', 'UBNT-U6P-001', 'Kantoor 1e verdieping', '2028-02-15'),
  ('e0000001-0000-0000-0000-000000000014', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5014, 'Access Point Magazijn', 'Netwerk', 'Ubiquiti', 'UniFi U6-Pro', 'UBNT-U6P-002', 'Magazijn', '2028-02-15'),
  ('e0000001-0000-0000-0000-000000000015', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5015, 'Switch Serverruimte', 'Netwerk', 'Ubiquiti', 'UniFi USW-24-POE', 'UBNT-USW24-001', 'Serverruimte', '2028-02-15')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 8.4 Agreements — Bakkerij Groot & Zonen (5)
-- ============================================================

INSERT INTO agreements (id, company_id, cw_agreement_id, name, type, status, bill_amount, start_date, end_date) VALUES
  ('f0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 3001,
   'Yielder Beheer Premium', 'Managed Service', 'active', 1250.00, '2025-02-01', '2027-01-31'),

  ('f0000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 3002,
   'Microsoft 365 Business Premium', 'Software', 'active', 325.00, '2025-01-01', '2026-12-31'),

  ('f0000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 3003,
   'Managed Firewall Service', 'Security', 'active', 195.00, '2025-04-01', '2026-04-01'),

  ('f0000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 3004,
   'Hosted Telefonie', 'Telecom', 'active', 180.00, '2025-07-01', '2027-06-30'),

  ('f0000001-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 3005,
   'Server Onderhoud', 'Onderhoud', 'expired', 450.00, '2024-01-15', '2026-01-15')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 8.5 Contacts — Bakkerij Groot & Zonen (4)
-- ============================================================

INSERT INTO contacts (id, company_id, full_name, email, phone, role) VALUES
  ('10000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Pieter Groot', 'pieter@bakkerijgroot.nl', '06-12345678', 'Directeur'),
  ('10000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Annemarie Groot-Veldman', 'annemarie@bakkerijgroot.nl', '06-23456789', 'Administratie'),
  ('10000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Tom Hendriks', 'tom@bakkerijgroot.nl', '06-34567890', 'Productieleider'),
  ('10000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Sophie Bakker', 'sophie@bakkerijgroot.nl', '06-45678901', 'Medewerker')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 8.6 Licenses — Bakkerij Groot & Zonen (4)
-- ============================================================

INSERT INTO licenses (id, company_id, vendor, product_name, license_type, seats_total, seats_used, expiry_date, status, cost_per_seat) VALUES
  ('20000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Microsoft', 'Microsoft 365 Business Premium', 'Subscription', 25, 23, '2026-12-31', 'active', 18.70),
  ('20000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Adobe', 'Adobe Creative Cloud', 'Subscription', 3, 3, '2027-02-28', 'active', 59.99),
  ('20000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Veeam', 'Veeam Backup & Replication', 'Perpetual', 1, 1, '2026-04-15', 'expiring', 850.00),
  ('20000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Fortinet', 'FortiClient VPN', 'Subscription', 25, 20, '2027-06-01', 'active', 3.50)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 8.7 Notifications — Bakkerij Groot & Zonen (5)
-- ============================================================

INSERT INTO notifications (id, company_id, title, message, type, is_read, link, created_at) VALUES
  ('30000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Contract verloopt binnenkort', 'Managed Firewall Service verloopt op 1 april 2026. Neem contact op voor verlenging.', 'warning', false, '/contracten',
   '2026-03-10T09:00:00Z'),

  ('30000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Backup waarschuwing', 'Schijfruimte backup server onder 15%. Directe actie vereist om dataverlies te voorkomen.', 'alert', false, '/tickets',
   '2026-03-11T05:30:00Z'),

  ('30000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Nieuwe update beschikbaar', 'Windows Server 2022 security update (KB5035857) klaar voor installatie op BG-SRV01.', 'info', false, NULL,
   '2026-03-09T07:00:00Z'),

  ('30000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Welkom bij Mijn Yielder', 'Uw portaal is succesvol geactiveerd. Bekijk het dashboard voor een overzicht van uw IT-omgeving.', 'success', true, '/dashboard',
   '2025-06-15T10:05:00Z'),

  ('30000001-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Hardware garantie verlopen', '2 apparaten hebben een verlopen garantie: Desktop Productie 2 en Desktop Magazijn.', 'warning', false, '/hardware',
   '2026-03-08T08:00:00Z')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 8.8 Documents — Bakkerij Groot & Zonen (4)
-- ============================================================

INSERT INTO documents (id, company_id, title, category, file_url, file_size, uploaded_by, created_at) VALUES
  ('40000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'IT Beveiligingsbeleid 2026', 'handleiding', '/documents/it-beveiligingsbeleid-2026.pdf', 245000, 'Yielder IT', '2026-01-15T10:00:00Z'),
  ('40000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'SLA Overeenkomst Yielder', 'contract', '/documents/sla-overeenkomst-yielder.pdf', 180000, 'Yielder IT', '2025-02-01T09:00:00Z'),
  ('40000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Cybersecurity Whitepaper MKB', 'whitepaper', '/documents/cybersecurity-whitepaper-mkb.pdf', 520000, 'Yielder IT', '2025-11-20T14:00:00Z'),
  ('40000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Kwartaalrapport Q4 2025', 'rapport', '/documents/kwartaalrapport-q4-2025.pdf', 310000, 'Yielder IT', '2026-01-10T11:00:00Z')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 8.9 Client Products — Bakkerij Groot & Zonen
-- Strategisch: WEL firewall, laptops, desktops, server, M365, telefonie, beheer
-- GEEN: endpoint protection, MFA, cloud backup, MDM, managed firewall
-- Dit triggert kritieke aanbevelingen in de recommendation engine
-- ============================================================

INSERT INTO client_products (id, company_id, product_id, quantity, purchase_date, expiry_date, status) VALUES
  -- FortiGate Firewall
  ('50000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'FG-60F'), 1, '2024-06-01', '2029-06-01', 'active'),
  -- HP EliteBook laptops
  ('50000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'HP-EB840-G10'), 5, '2024-08-15', NULL, 'active'),
  -- HP ProDesk desktops
  ('50000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'HP-PD400-G9'), 5, '2024-03-01', NULL, 'active'),
  -- HPE ProLiant server
  ('50000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'HPE-DL380-G11'), 1, '2023-09-30', NULL, 'active'),
  -- Microsoft 365 Business Premium
  ('50000001-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'MS-365-BP'), 25, '2025-01-01', '2026-12-31', 'active'),
  -- Hosted Telefonie
  ('50000001-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'OD-UCAAS'), 25, '2025-07-01', '2027-06-30', 'active'),
  -- Yielder Beheer Premium
  ('50000001-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   (SELECT id FROM products WHERE sku = 'YLD-BHR-PRE'), 1, '2025-02-01', '2027-01-31', 'active')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 8.10 Client Products — Technisch Bureau Veldhuis (meer compleet)
-- Heeft WEL: firewall, endpoint, MFA, M365, cloud backup, MDM, beheer, managed firewall
-- Dit maakt dat peer-matching ziet: Veldhuis heeft producten die Bakkerij mist
-- ============================================================

INSERT INTO client_products (id, company_id, product_id, quantity, purchase_date, expiry_date, status) VALUES
  ('60000001-0000-0000-0000-000000000001', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'FG-60F'), 1, '2024-03-01', '2029-03-01', 'active'),
  ('60000001-0000-0000-0000-000000000002', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'FC-EP-100'), 40, '2025-01-01', '2027-12-31', 'active'),
  ('60000001-0000-0000-0000-000000000003', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'MS-MFA'), 40, '2025-01-01', '2027-12-31', 'active'),
  ('60000001-0000-0000-0000-000000000004', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'MS-365-BP'), 40, '2025-01-01', '2026-12-31', 'active'),
  ('60000001-0000-0000-0000-000000000005', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'VBR-365'), 1, '2025-01-01', '2026-12-31', 'active'),
  ('60000001-0000-0000-0000-000000000006', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'MS-INTUNE'), 40, '2025-01-01', '2026-12-31', 'active'),
  ('60000001-0000-0000-0000-000000000007', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'YLD-BHR-PRE'), 1, '2025-04-01', '2027-03-31', 'active'),
  ('60000001-0000-0000-0000-000000000008', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'YLD-MFW'), 1, '2025-04-01', '2027-03-31', 'active'),
  ('60000001-0000-0000-0000-000000000009', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'HP-EB840-G10'), 15, '2024-06-01', NULL, 'active'),
  ('60000001-0000-0000-0000-000000000010', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'HP-PD400-G9'), 10, '2024-06-01', NULL, 'active'),
  ('60000001-0000-0000-0000-000000000011', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'HPE-DL380-G11'), 2, '2024-03-01', NULL, 'active'),
  ('60000001-0000-0000-0000-000000000012', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'VBR-STD'), 1, '2025-01-01', '2026-12-31', 'active'),
  ('60000001-0000-0000-0000-000000000013', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
   (SELECT id FROM products WHERE sku = 'OD-UCAAS'), 40, '2025-04-01', '2027-03-31', 'active')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 8.11 Client Products — Autogroep Rensen (groot, compleet)
-- Heeft alles inclusief Copilot en Azure — de "voorbeeldklant"
-- ============================================================

INSERT INTO client_products (id, company_id, product_id, quantity, purchase_date, expiry_date, status) VALUES
  ('70000001-0000-0000-0000-000000000001', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'FG-60F'), 2, '2024-01-15', '2029-01-15', 'active'),
  ('70000001-0000-0000-0000-000000000002', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'FC-EP-100'), 80, '2025-01-01', '2027-12-31', 'active'),
  ('70000001-0000-0000-0000-000000000003', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'MS-MFA'), 80, '2025-01-01', '2027-12-31', 'active'),
  ('70000001-0000-0000-0000-000000000004', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'MS-365-BP'), 80, '2025-01-01', '2026-12-31', 'active'),
  ('70000001-0000-0000-0000-000000000005', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'VBR-365'), 1, '2025-01-01', '2026-12-31', 'active'),
  ('70000001-0000-0000-0000-000000000006', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'MS-INTUNE'), 80, '2025-01-01', '2026-12-31', 'active'),
  ('70000001-0000-0000-0000-000000000007', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'YLD-BHR-PRE'), 1, '2025-01-01', '2027-12-31', 'active'),
  ('70000001-0000-0000-0000-000000000008', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'YLD-MFW'), 2, '2025-01-01', '2027-12-31', 'active'),
  ('70000001-0000-0000-0000-000000000009', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'HP-EB840-G10'), 30, '2024-06-01', NULL, 'active'),
  ('70000001-0000-0000-0000-000000000010', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'HP-PD400-G9'), 20, '2024-06-01', NULL, 'active'),
  ('70000001-0000-0000-0000-000000000011', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'HPE-DL380-G11'), 3, '2024-01-15', NULL, 'active'),
  ('70000001-0000-0000-0000-000000000012', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'VBR-STD'), 1, '2025-01-01', '2026-12-31', 'active'),
  ('70000001-0000-0000-0000-000000000013', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'MS-COPILOT'), 20, '2025-06-01', '2026-05-31', 'active'),
  ('70000001-0000-0000-0000-000000000014', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'AZ-HOST'), 1, '2025-03-01', '2026-02-28', 'active'),
  ('70000001-0000-0000-0000-000000000015', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'YLD-MES'), 1, '2025-01-01', '2027-12-31', 'active'),
  ('70000001-0000-0000-0000-000000000016', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'OD-UCAAS'), 80, '2025-01-01', '2027-12-31', 'active'),
  ('70000001-0000-0000-0000-000000000017', 'c3d4e5f6-a7b8-9012-cdef-123456789012',
   (SELECT id FROM products WHERE sku = 'VBR-DRAAS'), 1, '2025-03-01', '2026-02-28', 'active')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 8.12 Sync Logs (3 recente succesvolle syncs)
-- ============================================================

INSERT INTO sync_logs (id, entity_type, status, records_synced, records_failed, started_at, completed_at) VALUES
  ('80000001-0000-0000-0000-000000000001', 'companies', 'completed', 3, 0,
   '2026-03-11T02:00:00Z', '2026-03-11T02:00:12Z'),
  ('80000001-0000-0000-0000-000000000002', 'tickets', 'completed', 8, 0,
   '2026-03-11T02:00:15Z', '2026-03-11T02:00:28Z'),
  ('80000001-0000-0000-0000-000000000003', 'hardware', 'completed', 15, 0,
   '2026-03-11T02:00:30Z', '2026-03-11T02:00:45Z')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 8.13 Audit Log (een paar entries voor het admin overzicht)
-- ============================================================

INSERT INTO audit_log (id, company_id, action, entity_type, entity_id, metadata, created_at) VALUES
  ('90000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'sync_completed', 'companies', NULL, '{"records": 3, "duration_ms": 12000}', '2026-03-11T02:00:12Z'),
  ('90000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'ticket_created', 'tickets', 'd0000001-0000-0000-0000-000000000008', '{"summary": "Backup melding - schijf bijna vol", "priority": "urgent"}', '2026-03-11T05:30:00Z'),
  ('90000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'notification_sent', 'notifications', '30000001-0000-0000-0000-000000000002', '{"type": "alert", "title": "Backup waarschuwing"}', '2026-03-11T05:30:05Z')
ON CONFLICT (id) DO NOTHING;


-- ############################################################
-- STAP 3: Na het aanmaken van de demo-gebruiker in Supabase Auth
-- ############################################################
--
-- Ga naar Supabase Dashboard → Authentication → Users → Add User
-- Maak een gebruiker aan met email + wachtwoord.
-- Kopieer het UUID van de nieuwe gebruiker.
--
-- Voer dan het volgende SQL uit, waarbij je YOUR_USER_UUID vervangt:
-- ============================================================

-- UPDATE profiles
-- SET full_name = 'Mart Bos', is_yielder = true
-- WHERE id = 'YOUR_USER_UUID';

-- INSERT INTO user_company_mapping (user_id, company_id)
-- VALUES ('YOUR_USER_UUID', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');

-- Optioneel: koppel ook aan de andere demo-bedrijven (voor Yielder admin view):
-- INSERT INTO user_company_mapping (user_id, company_id)
-- VALUES ('YOUR_USER_UUID', 'b2c3d4e5-f6a7-8901-bcde-f12345678901');
-- INSERT INTO user_company_mapping (user_id, company_id)
-- VALUES ('YOUR_USER_UUID', 'c3d4e5f6-a7b8-9012-cdef-123456789012');
