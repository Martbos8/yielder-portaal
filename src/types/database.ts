// Types for all Supabase database tables
// Based on database schema with RLS policies

export type CompanySize = "small" | "medium" | "large";

export type Company = {
  id: string;
  name: string;
  cw_company_id: number | null;
  employee_count: number | null;
  industry: string | null;
  region: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type TicketStatus = "open" | "in_progress" | "closed";
export type TicketPriority = "urgent" | "high" | "normal" | "low";

export type Ticket = {
  id: string;
  company_id: string;
  cw_ticket_id: number | null;
  summary: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  contact_name: string | null;
  source: string | null;
  is_closed: boolean;
  cw_created_at: string | null;
  cw_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type HardwareAssetType =
  | "Desktop"
  | "Laptop"
  | "Server"
  | "Netwerk"
  | "Overig";

export type HardwareAsset = {
  id: string;
  company_id: string;
  cw_config_id: number | null;
  name: string;
  type: HardwareAssetType;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  assigned_to: string | null;
  warranty_expiry: string | null;
  created_at: string;
  updated_at: string;
};

export type AgreementStatus = "active" | "expired" | "cancelled";

export type Agreement = {
  id: string;
  company_id: string;
  cw_agreement_id: number | null;
  name: string;
  type: string | null;
  status: AgreementStatus;
  bill_amount: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Contact = {
  id: string;
  company_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
};

export type DashboardStats = {
  openTickets: number;
  hardwareCount: number;
  activeContracts: number;
  monthlyAmount: number;
};

// Product Catalog types

export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProductType = "hardware" | "software" | "service";

export type Product = {
  id: string;
  category_id: string;
  name: string;
  vendor: string | null;
  sku: string | null;
  description: string | null;
  type: ProductType;
  lifecycle_years: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DependencyType = "requires" | "recommended" | "enhances";

export type ProductDependency = {
  id: string;
  product_id: string;
  depends_on_product_id: string;
  dependency_type: DependencyType;
  created_at: string;
};

export type ClientProductStatus = "active" | "expiring" | "expired";

export type ClientProduct = {
  id: string;
  company_id: string;
  product_id: string;
  quantity: number;
  purchase_date: string | null;
  expiry_date: string | null;
  status: ClientProductStatus;
  created_at: string;
  updated_at: string;
};
