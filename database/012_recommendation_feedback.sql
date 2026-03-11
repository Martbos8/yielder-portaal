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
