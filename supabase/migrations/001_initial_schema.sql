-- Visionary Capital Deal Intake App - Database Schema
-- Run this in the Supabase SQL Editor to set up your database

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE deal_stage AS ENUM (
  'new',
  'initial_review',
  'due_diligence',
  'committee',
  'term_sheet',
  'docs',
  'funding',
  'closed',
  'declined'
);

CREATE TYPE collateral_type AS ENUM (
  'real_estate',
  'accounts_receivable',
  'inventory',
  'equipment',
  'endorsement_contracts',
  'future_earnings',
  'life_insurance',
  'personal_guarantee',
  'mixed',
  'other'
);

CREATE TYPE user_role AS ENUM (
  'analyst',
  'underwriter',
  'closer',
  'partner'
);

CREATE TYPE doc_status AS ENUM (
  'pending',
  'received',
  'under_review',
  'approved',
  'needs_resubmission'
);

CREATE TYPE checklist_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'not_applicable'
);

-- ============================================================
-- TABLES
-- ============================================================

-- Internal team users (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'analyst',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Borrower / company info
CREATE TABLE borrowers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name TEXT NOT NULL,
  company_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Core deal record
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT NOT NULL UNIQUE,
  borrower_id UUID NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,
  stage deal_stage NOT NULL DEFAULT 'new',
  loan_amount NUMERIC(14,2) NOT NULL,
  loan_purpose TEXT NOT NULL,
  collateral_type collateral_type NOT NULL,
  secondary_collateral_type collateral_type,
  collateral_description TEXT,
  deal_description TEXT,
  interest_rate NUMERIC(5,2),
  term_months INTEGER,
  origination_fee NUMERIC(5,2),
  assigned_to UUID REFERENCES users(id),
  upload_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Collateral details (flexible key-value + structured fields)
CREATE TABLE collateral (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  collateral_type collateral_type NOT NULL,
  description TEXT,
  estimated_value NUMERIC(14,2),
  address TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  category TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  status doc_status NOT NULL DEFAULT 'pending',
  uploaded_by_borrower BOOLEAN NOT NULL DEFAULT false,
  reviewer_id UUID REFERENCES users(id),
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Diligence checklist items
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  status checklist_status NOT NULL DEFAULT 'pending',
  assigned_to UUID REFERENCES users(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deal scoring (internal only)
CREATE TABLE deal_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE UNIQUE,
  collateral_quality INTEGER CHECK (collateral_quality BETWEEN 1 AND 10),
  collateral_quality_notes TEXT,
  ltv_score INTEGER CHECK (ltv_score BETWEEN 1 AND 10),
  ltv_score_notes TEXT,
  personal_balance_sheet INTEGER CHECK (personal_balance_sheet BETWEEN 1 AND 10),
  personal_balance_sheet_notes TEXT,
  downside_recovery INTEGER CHECK (downside_recovery BETWEEN 1 AND 10),
  downside_recovery_notes TEXT,
  composite_score NUMERIC(4,2) GENERATED ALWAYS AS (
    (COALESCE(collateral_quality, 0) * 0.35 +
     COALESCE(ltv_score, 0) * 0.25 +
     COALESCE(personal_balance_sheet, 0) * 0.20 +
     COALESCE(downside_recovery, 0) * 0.20)
  ) STORED,
  overall_notes TEXT,
  scored_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Internal notes on deals
CREATE TABLE deal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit trail for stage changes
CREATE TABLE deal_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  from_stage deal_stage,
  to_stage deal_stage NOT NULL,
  changed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Document requirement templates (configurable per collateral type)
CREATE TABLE doc_requirement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collateral_type collateral_type,
  category TEXT NOT NULL,
  document_name TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_borrower ON deals(borrower_id);
CREATE INDEX idx_deals_assigned ON deals(assigned_to);
CREATE INDEX idx_deals_upload_token ON deals(upload_token);
CREATE INDEX idx_deals_reference ON deals(reference_number);
CREATE INDEX idx_documents_deal ON documents(deal_id);
CREATE INDEX idx_checklist_deal ON checklist_items(deal_id);
CREATE INDEX idx_deal_notes_deal ON deal_notes(deal_id);
CREATE INDEX idx_stage_history_deal ON deal_stage_history(deal_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE collateral ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_requirement_templates ENABLE ROW LEVEL SECURITY;

-- Internal team: full access to everything
CREATE POLICY "Internal team full access" ON users
  FOR ALL USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Internal team read borrowers" ON borrowers
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Internal team manage deals" ON deals
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Internal team manage collateral" ON collateral
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Internal team manage documents" ON documents
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Internal team manage checklist" ON checklist_items
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Internal team manage scores" ON deal_scores
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Internal team manage notes" ON deal_notes
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Internal team read stage history" ON deal_stage_history
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Internal team read doc templates" ON doc_requirement_templates
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true
  ));

-- Public intake: allow anonymous inserts for borrowers and deals
CREATE POLICY "Public intake insert borrowers" ON borrowers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public intake insert deals" ON deals
  FOR INSERT WITH CHECK (true);

-- Upload via token: borrowers can read their deal and upload docs
CREATE POLICY "Borrower upload via token read deal" ON deals
  FOR SELECT USING (upload_token IS NOT NULL);

CREATE POLICY "Borrower upload docs" ON documents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Borrower read own docs" ON documents
  FOR SELECT USING (uploaded_by_borrower = true);

-- ============================================================
-- STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('deal-documents', 'deal-documents', false, 52428800)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Internal team upload docs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'deal-documents' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Internal team read docs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'deal-documents' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Internal team delete docs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'deal-documents' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true)
  );

-- ============================================================
-- SEED: Default Document Requirement Templates
-- ============================================================

-- Standard (always required)
INSERT INTO doc_requirement_templates (collateral_type, category, document_name, is_required, sort_order) VALUES
  (NULL, 'Financial', 'Business Financial Statements (P&L, Balance Sheet)', true, 1),
  (NULL, 'Financial', 'Personal Financial Statement', true, 2),
  (NULL, 'Entity', 'Entity Documents (Articles/Operating Agreement)', true, 3),
  (NULL, 'Financial', 'Bank Statements (3-6 months)', true, 4),
  (NULL, 'Financial', 'Tax Returns (1-2 years)', true, 5);

-- Real Estate specific
INSERT INTO doc_requirement_templates (collateral_type, category, document_name, is_required, sort_order) VALUES
  ('real_estate', 'Collateral', 'Appraisal Report', true, 10),
  ('real_estate', 'Collateral', 'Title Report / Commitment', true, 11),
  ('real_estate', 'Collateral', 'Property Insurance Certificate', true, 12),
  ('real_estate', 'Collateral', 'Environmental Report (Phase I)', false, 13),
  ('real_estate', 'Collateral', 'Survey / Plat Map', false, 14);

-- AR specific
INSERT INTO doc_requirement_templates (collateral_type, category, document_name, is_required, sort_order) VALUES
  ('accounts_receivable', 'Collateral', 'Accounts Receivable Aging Report', true, 10),
  ('accounts_receivable', 'Collateral', 'Top Customer Contracts', true, 11),
  ('accounts_receivable', 'Collateral', 'Historical Collection Data', false, 12);

-- Inventory specific
INSERT INTO doc_requirement_templates (collateral_type, category, document_name, is_required, sort_order) VALUES
  ('inventory', 'Collateral', 'Inventory Valuation Report', true, 10),
  ('inventory', 'Collateral', 'Warehouse/Storage Agreements', false, 11),
  ('inventory', 'Collateral', 'Insurance on Inventory', true, 12);

-- Equipment specific
INSERT INTO doc_requirement_templates (collateral_type, category, document_name, is_required, sort_order) VALUES
  ('equipment', 'Collateral', 'Equipment Appraisal', true, 10),
  ('equipment', 'Collateral', 'Equipment List with Serial Numbers', true, 11),
  ('equipment', 'Collateral', 'Maintenance Records', false, 12);

-- Endorsement contracts
INSERT INTO doc_requirement_templates (collateral_type, category, document_name, is_required, sort_order) VALUES
  ('endorsement_contracts', 'Collateral', 'Endorsement Contract Copies', true, 10),
  ('endorsement_contracts', 'Collateral', 'Payment Schedule / Proof of Future Payments', true, 11),
  ('endorsement_contracts', 'Collateral', 'Agent/Manager Contact Info', false, 12);

-- Future earnings
INSERT INTO doc_requirement_templates (collateral_type, category, document_name, is_required, sort_order) VALUES
  ('future_earnings', 'Collateral', 'Employment/Contract Agreement', true, 10),
  ('future_earnings', 'Collateral', 'Projected Earnings Documentation', true, 11),
  ('future_earnings', 'Collateral', 'Historical Earnings Records', true, 12);

-- Life insurance
INSERT INTO doc_requirement_templates (collateral_type, category, document_name, is_required, sort_order) VALUES
  ('life_insurance', 'Collateral', 'Life Insurance Policy Declaration Page', true, 10),
  ('life_insurance', 'Collateral', 'Cash Surrender Value Statement', true, 11),
  ('life_insurance', 'Collateral', 'Beneficiary Assignment Agreement', true, 12);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-generate reference number
CREATE OR REPLACE FUNCTION generate_reference_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_num INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO seq_num FROM deals;
  NEW.reference_number := 'VC-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_reference_number
  BEFORE INSERT ON deals
  FOR EACH ROW
  WHEN (NEW.reference_number IS NULL OR NEW.reference_number = '')
  EXECUTE FUNCTION generate_reference_number();

-- Auto-log stage changes
CREATE OR REPLACE FUNCTION log_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO deal_stage_history (deal_id, from_stage, to_stage, changed_by)
    VALUES (NEW.id, OLD.stage, NEW.stage, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_stage_change
  AFTER UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION log_stage_change();

-- Auto-populate checklist when deal is created
CREATE OR REPLACE FUNCTION populate_deal_checklist()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert standard (universal) checklist items
  INSERT INTO checklist_items (deal_id, title, category, sort_order)
  SELECT NEW.id, document_name, category, sort_order
  FROM doc_requirement_templates
  WHERE collateral_type IS NULL;

  -- Insert collateral-specific checklist items
  INSERT INTO checklist_items (deal_id, title, category, sort_order)
  SELECT NEW.id, document_name, category, sort_order
  FROM doc_requirement_templates
  WHERE collateral_type = NEW.collateral_type;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_deal_created
  AFTER INSERT ON deals
  FOR EACH ROW
  EXECUTE FUNCTION populate_deal_checklist();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_borrowers BEFORE UPDATE ON borrowers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_deals BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_documents BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_checklist BEFORE UPDATE ON checklist_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_scores BEFORE UPDATE ON deal_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at();
