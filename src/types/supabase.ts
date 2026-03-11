// Auto-generated Supabase Database type definitions
// Matches the schema defined in database/*.sql
// Used to type the Supabase client for compile-time query verification

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          is_yielder: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          is_yielder?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          is_yielder?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      companies: {
        Row: {
          id: string;
          name: string;
          cw_company_id: number | null;
          employee_count: number | null;
          industry: string | null;
          region: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          cw_company_id?: number | null;
          employee_count?: number | null;
          industry?: string | null;
          region?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
        Update: {
          id?: string;
          name?: string;
          cw_company_id?: number | null;
          employee_count?: number | null;
          industry?: string | null;
          region?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_company_mapping: {
        Row: {
          user_id: string;
          company_id: string;
        };
        Insert: {
          user_id: string;
          company_id: string;
        };
        Relationships: [];
        Update: {
          user_id?: string;
          company_id?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          company_id: string;
          cw_ticket_id: number | null;
          summary: string;
          description: string | null;
          status: "open" | "in_progress" | "closed";
          priority: "urgent" | "high" | "normal" | "low";
          contact_name: string | null;
          source: string | null;
          is_closed: boolean;
          cw_created_at: string | null;
          cw_updated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          cw_ticket_id?: number | null;
          summary: string;
          description?: string | null;
          status?: "open" | "in_progress" | "closed";
          priority?: "urgent" | "high" | "normal" | "low";
          contact_name?: string | null;
          source?: string | null;
          is_closed?: boolean;
          cw_created_at?: string | null;
          cw_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
        Update: {
          id?: string;
          company_id?: string;
          cw_ticket_id?: number | null;
          summary?: string;
          description?: string | null;
          status?: "open" | "in_progress" | "closed";
          priority?: "urgent" | "high" | "normal" | "low";
          contact_name?: string | null;
          source?: string | null;
          is_closed?: boolean;
          cw_created_at?: string | null;
          cw_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      hardware_assets: {
        Row: {
          id: string;
          company_id: string;
          cw_config_id: number | null;
          name: string;
          type: "Desktop" | "Laptop" | "Server" | "Netwerk" | "Overig";
          manufacturer: string | null;
          model: string | null;
          serial_number: string | null;
          assigned_to: string | null;
          warranty_expiry: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          cw_config_id?: number | null;
          name: string;
          type: "Desktop" | "Laptop" | "Server" | "Netwerk" | "Overig";
          manufacturer?: string | null;
          model?: string | null;
          serial_number?: string | null;
          assigned_to?: string | null;
          warranty_expiry?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
        Update: {
          id?: string;
          company_id?: string;
          cw_config_id?: number | null;
          name?: string;
          type?: "Desktop" | "Laptop" | "Server" | "Netwerk" | "Overig";
          manufacturer?: string | null;
          model?: string | null;
          serial_number?: string | null;
          assigned_to?: string | null;
          warranty_expiry?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      agreements: {
        Row: {
          id: string;
          company_id: string;
          cw_agreement_id: number | null;
          name: string;
          type: string | null;
          status: "active" | "expired" | "cancelled";
          bill_amount: number | null;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          cw_agreement_id?: number | null;
          name: string;
          type?: string | null;
          status?: "active" | "expired" | "cancelled";
          bill_amount?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
        Update: {
          id?: string;
          company_id?: string;
          cw_agreement_id?: number | null;
          name?: string;
          type?: string | null;
          status?: "active" | "expired" | "cancelled";
          bill_amount?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          company_id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          role: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          role?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
        Update: {
          id?: string;
          company_id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          role?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      licenses: {
        Row: {
          id: string;
          company_id: string;
          vendor: string;
          product_name: string;
          license_type: string | null;
          seats_total: number;
          seats_used: number;
          expiry_date: string | null;
          status: "active" | "expiring" | "expired";
          cost_per_seat: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          vendor: string;
          product_name: string;
          license_type?: string | null;
          seats_total?: number;
          seats_used?: number;
          expiry_date?: string | null;
          status?: "active" | "expiring" | "expired";
          cost_per_seat?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
        Update: {
          id?: string;
          company_id?: string;
          vendor?: string;
          product_name?: string;
          license_type?: string | null;
          seats_total?: number;
          seats_used?: number;
          expiry_date?: string | null;
          status?: "active" | "expiring" | "expired";
          cost_per_seat?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          company_id: string;
          user_id: string | null;
          title: string;
          message: string;
          type: "info" | "warning" | "alert" | "success";
          is_read: boolean;
          link: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id?: string | null;
          title: string;
          message: string;
          type?: "info" | "warning" | "alert" | "success";
          is_read?: boolean;
          link?: string | null;
          created_at?: string;
        };
        Relationships: [];
        Update: {
          id?: string;
          company_id?: string;
          user_id?: string | null;
          title?: string;
          message?: string;
          type?: "info" | "warning" | "alert" | "success";
          is_read?: boolean;
          link?: string | null;
          created_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          category: "handleiding" | "contract" | "whitepaper" | "rapport" | "overig";
          file_url: string | null;
          file_size: number | null;
          uploaded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          title: string;
          category?: "handleiding" | "contract" | "whitepaper" | "rapport" | "overig";
          file_url?: string | null;
          file_size?: number | null;
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
        Update: {
          id?: string;
          company_id?: string;
          title?: string;
          category?: "handleiding" | "contract" | "whitepaper" | "rapport" | "overig";
          file_url?: string | null;
          file_size?: number | null;
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_log: {
        Row: {
          id: string;
          user_id: string | null;
          company_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          company_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
        Update: {
          id?: string;
          user_id?: string | null;
          company_id?: string | null;
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      sync_logs: {
        Row: {
          id: string;
          entity_type: "companies" | "tickets" | "agreements" | "hardware" | "contacts" | "licenses";
          status: "running" | "completed" | "failed";
          records_synced: number;
          records_failed: number;
          error_message: string | null;
          started_at: string;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: "companies" | "tickets" | "agreements" | "hardware" | "contacts" | "licenses";
          status?: "running" | "completed" | "failed";
          records_synced?: number;
          records_failed?: number;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
        Update: {
          id?: string;
          entity_type?: "companies" | "tickets" | "agreements" | "hardware" | "contacts" | "licenses";
          status?: "running" | "completed" | "failed";
          records_synced?: number;
          records_failed?: number;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
        };
      };
      product_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string;
          description: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon?: string;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          icon?: string;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          vendor: string | null;
          sku: string | null;
          description: string | null;
          type: "hardware" | "software" | "service";
          lifecycle_years: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          vendor?: string | null;
          sku?: string | null;
          description?: string | null;
          type: "hardware" | "software" | "service";
          lifecycle_years?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          vendor?: string | null;
          sku?: string | null;
          description?: string | null;
          type?: "hardware" | "software" | "service";
          lifecycle_years?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_dependencies: {
        Row: {
          id: string;
          product_id: string;
          depends_on_product_id: string;
          dependency_type: "requires" | "recommended" | "enhances";
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          depends_on_product_id: string;
          dependency_type: "requires" | "recommended" | "enhances";
          created_at?: string;
        };
        Relationships: [];
        Update: {
          id?: string;
          product_id?: string;
          depends_on_product_id?: string;
          dependency_type?: "requires" | "recommended" | "enhances";
          created_at?: string;
        };
      };
      client_products: {
        Row: {
          id: string;
          company_id: string;
          product_id: string;
          quantity: number;
          purchase_date: string | null;
          expiry_date: string | null;
          status: "active" | "expiring" | "expired";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          product_id: string;
          quantity?: number;
          purchase_date?: string | null;
          expiry_date?: string | null;
          status?: "active" | "expiring" | "expired";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
        Update: {
          id?: string;
          company_id?: string;
          product_id?: string;
          quantity?: number;
          purchase_date?: string | null;
          expiry_date?: string | null;
          status?: "active" | "expiring" | "expired";
          created_at?: string;
          updated_at?: string;
        };
      };
      distributor_prices: {
        Row: {
          id: string;
          product_id: string;
          distributor: "copaco" | "ingram" | "td-synnex" | "esprinet";
          sku: string;
          price: number;
          currency: string;
          availability: "in_stock" | "limited" | "out_of_stock" | "on_order";
          fetched_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          distributor: "copaco" | "ingram" | "td-synnex" | "esprinet";
          sku: string;
          price?: number;
          currency?: string;
          availability?: "in_stock" | "limited" | "out_of_stock" | "on_order";
          fetched_at?: string;
          created_at?: string;
        };
        Relationships: [];
        Update: {
          id?: string;
          product_id?: string;
          distributor?: "copaco" | "ingram" | "td-synnex" | "esprinet";
          sku?: string;
          price?: number;
          currency?: string;
          availability?: "in_stock" | "limited" | "out_of_stock" | "on_order";
          fetched_at?: string;
          created_at?: string;
        };
      };
      contact_requests: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          subject: string;
          message: string | null;
          product_id: string | null;
          urgency: "normaal" | "hoog";
          status: "new" | "read" | "replied";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id: string;
          subject: string;
          message?: string | null;
          product_id?: string | null;
          urgency?: "normaal" | "hoog";
          status?: "new" | "read" | "replied";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
        Update: {
          id?: string;
          company_id?: string;
          user_id?: string;
          subject?: string;
          message?: string | null;
          product_id?: string | null;
          urgency?: "normaal" | "hoog";
          status?: "new" | "read" | "replied";
          created_at?: string;
          updated_at?: string;
        };
      };
      recommendation_feedback: {
        Row: {
          id: string;
          company_id: string;
          product_id: string;
          recommendation_score: number;
          action: "shown" | "clicked" | "contacted" | "purchased" | "dismissed";
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          product_id: string;
          recommendation_score: number;
          action: "shown" | "clicked" | "contacted" | "purchased" | "dismissed";
          created_at?: string;
        };
        Relationships: [];
        Update: {
          id?: string;
          company_id?: string;
          product_id?: string;
          recommendation_score?: number;
          action?: "shown" | "clicked" | "contacted" | "purchased" | "dismissed";
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience type aliases derived from the Database type
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
