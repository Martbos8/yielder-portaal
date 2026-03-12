-- ============================================================
-- 031_materialized_views.sql — Materialized views for dashboard
-- ============================================================
-- Run in Supabase SQL Editor after 030_indexes.sql
-- These pre-compute expensive aggregations for the dashboard.
-- Refresh periodically via cron or after sync operations.
-- ============================================================

-- Dashboard stats per company: pre-computed counts and sums
-- Replaces 4 parallel queries in getDashboardStats()
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_stats AS
SELECT
  c.id AS company_id,
  COALESCE(t.open_count, 0)::int AS open_tickets,
  COALESCE(h.total_count, 0)::int AS hardware_count,
  COALESCE(a.active_count, 0)::int AS active_contracts,
  COALESCE(a.monthly_amount, 0)::numeric AS monthly_amount,
  NOW() AS refreshed_at
FROM companies c
LEFT JOIN LATERAL (
  SELECT COUNT(*) FILTER (WHERE NOT is_closed) AS open_count
  FROM tickets
  WHERE tickets.company_id = c.id
) t ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS total_count
  FROM hardware_assets
  WHERE hardware_assets.company_id = c.id
) h ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS active_count,
    COALESCE(SUM(bill_amount), 0) AS monthly_amount
  FROM agreements
  WHERE agreements.company_id = c.id
    AND agreements.status = 'active'
) a ON true;

-- Unique index required for REFRESH MATERIALIZED VIEW CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_dashboard_stats_company
  ON mv_dashboard_stats (company_id);

-- Ticket trends per company: 30-day window counts
-- Replaces 4 count queries in getDashboardTrends()
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_ticket_trends AS
SELECT
  company_id,
  COUNT(*) FILTER (WHERE cw_created_at >= NOW() - INTERVAL '30 days') AS recent_count,
  COUNT(*) FILTER (WHERE cw_created_at >= NOW() - INTERVAL '60 days'
                     AND cw_created_at < NOW() - INTERVAL '30 days') AS prev_count
FROM tickets
WHERE cw_created_at >= NOW() - INTERVAL '60 days'
GROUP BY company_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_ticket_trends_company
  ON mv_ticket_trends (company_id);

-- ============================================================
-- Refresh function: call after sync or via pg_cron
-- ============================================================
CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ticket_trends;
END;
$$;

-- ============================================================
-- Usage notes:
-- 1. Call refresh_dashboard_views() after ConnectWise sync
-- 2. Or schedule via pg_cron: SELECT cron.schedule('refresh-dashboard', '*/5 * * * *', 'SELECT refresh_dashboard_views()');
-- 3. The application still works without these views (falls back to live queries)
-- 4. CONCURRENTLY refresh allows reads during refresh (no lock)
-- ============================================================
