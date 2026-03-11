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
