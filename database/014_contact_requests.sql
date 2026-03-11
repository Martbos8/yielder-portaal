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
