-- ============================================================
-- 030_indexes.sql — Compound indexes for common query patterns
-- ============================================================
-- Run in Supabase SQL Editor after 000_complete_setup.sql
-- These indexes optimize the most common filter/sort combinations
-- used by the portal's repository layer.
-- ============================================================

-- tickets: filter by company + open/closed, sort by created_at
CREATE INDEX IF NOT EXISTS idx_tickets_company_closed
  ON tickets (company_id, is_closed);

CREATE INDEX IF NOT EXISTS idx_tickets_company_created
  ON tickets (company_id, cw_created_at DESC);

-- tickets: trend queries filter by cw_created_at range
CREATE INDEX IF NOT EXISTS idx_tickets_created_at
  ON tickets (cw_created_at DESC);

-- hardware_assets: filter by company, sort by name
CREATE INDEX IF NOT EXISTS idx_hardware_company
  ON hardware_assets (company_id);

-- hardware_assets: warranty expiry queries (expired + expiring soon)
CREATE INDEX IF NOT EXISTS idx_hardware_warranty_expiry
  ON hardware_assets (warranty_expiry)
  WHERE warranty_expiry IS NOT NULL;

-- agreements: filter by company + status, sort by end_date
CREATE INDEX IF NOT EXISTS idx_agreements_company_status
  ON agreements (company_id, status);

-- agreements: expiring soon queries
CREATE INDEX IF NOT EXISTS idx_agreements_end_date
  ON agreements (end_date)
  WHERE status = 'active' AND end_date IS NOT NULL;

-- contacts: filter by company, sort by name
CREATE INDEX IF NOT EXISTS idx_contacts_company
  ON contacts (company_id, full_name);

-- notifications: filter by user + read status, sort by created_at
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON notifications (user_id, is_read, created_at DESC);

-- notifications: filter by company
CREATE INDEX IF NOT EXISTS idx_notifications_company
  ON notifications (company_id, created_at DESC);

-- audit_log: recent activity queries
CREATE INDEX IF NOT EXISTS idx_audit_log_company_created
  ON audit_log (company_id, created_at DESC);

-- audit_log: sort by created_at (for getRecentActivity)
CREATE INDEX IF NOT EXISTS idx_audit_log_created
  ON audit_log (created_at DESC);

-- licenses: filter by company, sort by vendor + product
CREATE INDEX IF NOT EXISTS idx_licenses_company
  ON licenses (company_id);

-- sync_logs: latest sync per entity type
CREATE INDEX IF NOT EXISTS idx_sync_logs_entity_synced
  ON sync_logs (entity_type, synced_at DESC);

-- user_company_mapping: reverse lookup (company → users)
CREATE INDEX IF NOT EXISTS idx_ucm_company
  ON user_company_mapping (company_id);

-- ============================================================
-- Additional indexes for query optimization (030b)
-- ============================================================

-- tickets: similar tickets query (company + source + date sort)
CREATE INDEX IF NOT EXISTS idx_tickets_company_source_created
  ON tickets (company_id, source, cw_created_at DESC);

-- tickets: stats timing query (need both timestamps not null)
CREATE INDEX IF NOT EXISTS idx_tickets_timestamps
  ON tickets (cw_created_at, cw_updated_at)
  WHERE cw_created_at IS NOT NULL AND cw_updated_at IS NOT NULL;

-- hardware_assets: company listing sorted by name
CREATE INDEX IF NOT EXISTS idx_hardware_company_name
  ON hardware_assets (company_id, name);

-- licenses: company listing sorted by vendor + product
CREATE INDEX IF NOT EXISTS idx_licenses_company_vendor
  ON licenses (company_id, vendor, product_name);

-- products: active products sorted by name
CREATE INDEX IF NOT EXISTS idx_products_active_name
  ON products (name)
  WHERE is_active = true;

-- client_products: company + active status filter
CREATE INDEX IF NOT EXISTS idx_client_products_company_status
  ON client_products (company_id, status);

-- agreements: bill_amount for active (dashboard sum query)
CREATE INDEX IF NOT EXISTS idx_agreements_active_amount
  ON agreements (status, bill_amount)
  WHERE status = 'active';

-- tickets: cursor-based pagination (id as tiebreaker for cw_created_at)
CREATE INDEX IF NOT EXISTS idx_tickets_cursor
  ON tickets (cw_created_at DESC, id DESC);

-- notifications: cursor-based pagination
CREATE INDEX IF NOT EXISTS idx_notifications_cursor
  ON notifications (created_at DESC, id DESC);
