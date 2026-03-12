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
