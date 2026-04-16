export type DealStage =
  | 'new'
  | 'initial_review'
  | 'due_diligence'
  | 'committee'
  | 'term_sheet'
  | 'docs'
  | 'funding'
  | 'closed'
  | 'declined';

export type CollateralType =
  | 'real_estate'
  | 'accounts_receivable'
  | 'inventory'
  | 'equipment'
  | 'endorsement_contracts'
  | 'future_earnings'
  | 'life_insurance'
  | 'personal_guarantee'
  | 'mixed'
  | 'other';

export type UserRole = 'analyst' | 'underwriter' | 'closer' | 'partner';

export type DocStatus = 'pending' | 'received' | 'under_review' | 'approved' | 'needs_resubmission';

export type ChecklistStatus = 'pending' | 'in_progress' | 'completed' | 'not_applicable';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Borrower {
  id: string;
  contact_name: string;
  company_name: string | null;
  email: string;
  phone: string | null;
  state: string | null;
  created_at: string;
}

export interface Deal {
  id: string;
  reference_number: string;
  borrower_id: string;
  borrower?: Borrower;
  stage: DealStage;
  loan_amount: number;
  loan_purpose: string;
  collateral_type: CollateralType;
  collateral_description: string | null;
  deal_description: string | null;
  interest_rate: number | null;
  term_months: number | null;
  origination_fee: number | null;
  assigned_to: string | null;
  assigned_user?: User;
  upload_token: string;
  created_at: string;
  updated_at: string;
  score?: DealScore;
}

export interface Collateral {
  id: string;
  deal_id: string;
  collateral_type: CollateralType;
  description: string | null;
  estimated_value: number | null;
  address: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface Document {
  id: string;
  deal_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  category: string;
  is_required: boolean;
  status: DocStatus;
  uploaded_by_borrower: boolean;
  reviewer_id: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  deal_id: string;
  title: string;
  description: string | null;
  category: string;
  status: ChecklistStatus;
  assigned_to: string | null;
  assigned_user?: User;
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface DealScore {
  id: string;
  deal_id: string;
  collateral_quality: number | null;
  collateral_quality_notes: string | null;
  ltv_score: number | null;
  ltv_score_notes: string | null;
  personal_balance_sheet: number | null;
  personal_balance_sheet_notes: string | null;
  downside_recovery: number | null;
  downside_recovery_notes: string | null;
  composite_score: number | null;
  overall_notes: string | null;
  scored_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealNote {
  id: string;
  deal_id: string;
  user_id: string;
  user?: User;
  content: string;
  is_pinned: boolean;
  created_at: string;
}

export interface DealStageHistory {
  id: string;
  deal_id: string;
  from_stage: DealStage | null;
  to_stage: DealStage;
  changed_by: string | null;
  user?: User;
  notes: string | null;
  created_at: string;
}

export const STAGE_LABELS: Record<DealStage, string> = {
  new: 'New',
  initial_review: 'Initial Review',
  due_diligence: 'Due Diligence',
  committee: 'Committee',
  term_sheet: 'Term Sheet',
  docs: 'Docs',
  funding: 'Funding',
  closed: 'Closed',
  declined: 'Declined',
};

export const STAGE_ORDER: DealStage[] = [
  'new',
  'initial_review',
  'due_diligence',
  'committee',
  'term_sheet',
  'docs',
  'funding',
  'closed',
  'declined',
];

export const COLLATERAL_LABELS: Record<CollateralType, string> = {
  real_estate: 'Real Estate',
  accounts_receivable: 'Accounts Receivable',
  inventory: 'Inventory',
  equipment: 'Equipment',
  endorsement_contracts: 'Endorsement Contracts',
  future_earnings: 'Future Earnings',
  life_insurance: 'Life Insurance',
  personal_guarantee: 'Personal Guarantee',
  mixed: 'Mixed Collateral',
  other: 'Other',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  analyst: 'Analyst',
  underwriter: 'Underwriter',
  closer: 'Closer',
  partner: 'Partner',
};
