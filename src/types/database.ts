// Types derived from the Supabase Database schema (single source of truth)
// All types are extracted from src/types/supabase.ts — never define manually

import type { Database } from "./supabase";

// Helper types for extracting Row/Insert/Update from any table
type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

// ── Core entities ──────────────────────────────────────────────

export type Profile = TableRow<"profiles">;
export type Company = TableRow<"companies">;
export type UserCompanyMapping = TableRow<"user_company_mapping">;

// ── Tickets ────────────────────────────────────────────────────

export type Ticket = TableRow<"tickets">;
export type TicketStatus = Ticket["status"];
export type TicketPriority = Ticket["priority"];

// ── Hardware ───────────────────────────────────────────────────

export type HardwareAsset = TableRow<"hardware_assets">;
export type HardwareAssetType = HardwareAsset["type"];

// ── Agreements ─────────────────────────────────────────────────

export type Agreement = TableRow<"agreements">;
export type AgreementStatus = Agreement["status"];

// ── Contacts ───────────────────────────────────────────────────

export type Contact = TableRow<"contacts">;

// ── Licenses ───────────────────────────────────────────────────

export type License = TableRow<"licenses">;
export type LicenseStatus = License["status"];

// ── Notifications ──────────────────────────────────────────────

export type Notification = TableRow<"notifications">;
export type NotificationType = Notification["type"];

// ── Documents ──────────────────────────────────────────────────

export type Document = TableRow<"documents">;
export type DocumentCategory = Document["category"];

// ── Sync Logs ──────────────────────────────────────────────────

export type SyncLog = TableRow<"sync_logs">;
export type SyncEntityType = SyncLog["entity_type"];
export type SyncStatus = SyncLog["status"];

// ── Product Catalog ────────────────────────────────────────────

export type ProductCategory = TableRow<"product_categories">;
export type Product = TableRow<"products">;
export type ProductType = Product["type"];

export type ProductDependency = TableRow<"product_dependencies">;
export type DependencyType = ProductDependency["dependency_type"];

export type ClientProduct = TableRow<"client_products">;
export type ClientProductStatus = ClientProduct["status"];

// ── Distributor Prices ─────────────────────────────────────────

export type DistributorPrice = TableRow<"distributor_prices">;
export type Distributor = DistributorPrice["distributor"];
export type Availability = DistributorPrice["availability"];

// ── Contact Requests ───────────────────────────────────────────

export type ContactRequest = TableRow<"contact_requests">;
export type ContactRequestUrgency = ContactRequest["urgency"];
export type ContactRequestStatus = ContactRequest["status"];

// ── Recommendation Feedback ────────────────────────────────────

export type RecommendationFeedback = TableRow<"recommendation_feedback">;
export type FeedbackAction = RecommendationFeedback["action"];

// ── Audit Log ──────────────────────────────────────────────────

export type AuditLog = TableRow<"audit_log">;

// ── Dashboard (computed, not from DB) ──────────────────────────

export type DashboardStats = {
  openTickets: number;
  hardwareCount: number;
  activeContracts: number;
  monthlyAmount: number;
};

// ── Company Size (application-level, not in DB) ────────────────

export type CompanySize = "small" | "medium" | "large";
