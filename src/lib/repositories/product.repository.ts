import { createClient } from "@/lib/supabase/server";
import { DatabaseError } from "@/lib/errors";
import { createLogger, withTiming } from "@/lib/logger";
import type { Product, ProductCategory, ProductDependency, ClientProduct } from "@/types/database";

const log = createLogger("repo:products");

const PRODUCT_COLUMNS = "id, category_id, name, vendor, sku, description, type, lifecycle_years, is_active, created_at, updated_at" as const;
const CATEGORY_COLUMNS = "id, name, slug, icon, description, sort_order, created_at, updated_at" as const;
const DEPENDENCY_COLUMNS = "id, product_id, depends_on_product_id, dependency_type, created_at" as const;
const CLIENT_PRODUCT_COLUMNS = "id, company_id, product_id, quantity, purchase_date, expiry_date, status, created_at, updated_at" as const;

/** Fetch all active products, ordered by name. */
export async function getActiveProducts(): Promise<Product[]> {
  return withTiming(log, "getActiveProducts", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("is_active", true)
      .order("name", { ascending: true })
      .returns<Product[]>();

    if (error) throw new DatabaseError(`Failed to fetch products: ${error.message}`);
    return data ?? [];
  });
}

/** Fetch all product categories, ordered by sort_order. */
export async function getProductCategories(): Promise<ProductCategory[]> {
  return withTiming(log, "getProductCategories", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_categories")
      .select(CATEGORY_COLUMNS)
      .order("sort_order", { ascending: true })
      .returns<ProductCategory[]>();

    if (error) throw new DatabaseError(`Failed to fetch product categories: ${error.message}`);
    return data ?? [];
  });
}

/** Fetch all product dependencies. */
export async function getProductDependencies(): Promise<ProductDependency[]> {
  return withTiming(log, "getProductDependencies", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_dependencies")
      .select(DEPENDENCY_COLUMNS)
      .returns<ProductDependency[]>();

    if (error) throw new DatabaseError(`Failed to fetch product dependencies: ${error.message}`);
    return data ?? [];
  });
}

/** Fetch active client products for a specific company. */
export async function getClientProducts(companyId: string): Promise<ClientProduct[]> {
  return withTiming(log, "getClientProducts", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("client_products")
      .select(CLIENT_PRODUCT_COLUMNS)
      .eq("company_id", companyId)
      .eq("status", "active")
      .returns<ClientProduct[]>();

    if (error) throw new DatabaseError(`Failed to fetch client products: ${error.message}`);
    return data ?? [];
  }, { companyId });
}
