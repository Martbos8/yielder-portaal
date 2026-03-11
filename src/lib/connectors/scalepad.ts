// ScalePad Lifecycle Manager API client
// Uses x-api-key authentication
// Rate limited: 50 requests per 5 seconds
// Cursor-based pagination

type ScalePadConfig = {
  baseUrl: string;
  apiKey: string;
};

// --- API Response Types ---

export type ScalePadClient = {
  id: string;
  name: string;
  externalId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ScalePadHardwareAsset = {
  id: string;
  clientId: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  category: string | null;
  operatingSystem: string | null;
  cpu: string | null;
  ramGb: number | null;
  diskGb: number | null;
  purchaseDate: string | null;
  warrantyExpiry: string | null;
  endOfLife: string | null;
  lastSeen: string | null;
  status: "active" | "retired" | "unknown";
};

export type ScalePadLifecycle = {
  assetId: string;
  phase: "current" | "aging" | "end_of_life" | "past_end_of_life";
  warrantyStatus: "covered" | "expiring" | "expired" | "unknown";
  warrantyExpiry: string | null;
  endOfLife: string | null;
  replacementUrgency: "none" | "low" | "medium" | "high" | "critical";
  recommendedAction: string | null;
};

type CursorPage<T> = {
  data: T[];
  cursor: string | null;
  hasMore: boolean;
};

// --- Rate Limiter ---

class SlidingWindowLimiter {
  private timestamps: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);

    if (this.timestamps.length >= this.maxRequests) {
      const oldest = this.timestamps[0] ?? now;
      const waitMs = this.windowMs - (now - oldest) + 10;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    this.timestamps.push(Date.now());
  }
}

// --- Client ---

const DEFAULT_PAGE_SIZE = 100;

export class ScalePadApiClient {
  private config: ScalePadConfig | null;
  private limiter = new SlidingWindowLimiter(50, 5000);

  constructor() {
    const baseUrl = process.env['SCALEPAD_BASE_URL'];
    const apiKey = process.env['SCALEPAD_API_KEY'];

    if (!baseUrl || !apiKey) {
      this.config = null;
    } else {
      this.config = { baseUrl: baseUrl.replace(/\/$/, ""), apiKey };
    }
  }

  isConfigured(): boolean {
    return this.config !== null;
  }

  /**
   * Makes an authenticated GET request to the ScalePad API.
   */
  private async request<T>(
    endpoint: string,
    params?: Record<string, string>
  ): Promise<T> {
    if (!this.config) {
      throw new Error("ScalePad API not configured — missing SCALEPAD_BASE_URL or SCALEPAD_API_KEY");
    }

    await this.limiter.waitForSlot();

    const url = new URL(`${this.config.baseUrl}${endpoint}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        "x-api-key": this.config.apiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `ScalePad API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Fetches all pages using cursor-based pagination.
   */
  private async fetchAll<T>(
    endpoint: string,
    params?: Record<string, string>
  ): Promise<T[]> {
    const results: T[] = [];
    let cursor: string | null = null;

    do {
      const queryParams: Record<string, string> = {
        limit: String(DEFAULT_PAGE_SIZE),
        ...params,
      };

      if (cursor) {
        queryParams["cursor"] = cursor;
      }

      const page = await this.request<CursorPage<T>>(endpoint, queryParams);
      results.push(...page.data);
      cursor = page.hasMore ? (page.cursor ?? null) : null;
    } while (cursor);

    return results;
  }

  /**
   * Fetches all clients (managed companies) from ScalePad.
   */
  async fetchClients(): Promise<ScalePadClient[]> {
    if (!this.isConfigured()) return [];
    return this.fetchAll<ScalePadClient>("/v1/clients");
  }

  /**
   * Fetches all hardware assets for a specific client.
   */
  async fetchHardwareAssets(
    clientId: string
  ): Promise<ScalePadHardwareAsset[]> {
    if (!this.isConfigured()) return [];
    return this.fetchAll<ScalePadHardwareAsset>(
      `/v1/clients/${encodeURIComponent(clientId)}/assets`
    );
  }

  /**
   * Fetches hardware lifecycle data for a specific client.
   * Includes warranty status, end-of-life dates, and replacement urgency.
   */
  async fetchHardwareLifecycles(
    clientId: string
  ): Promise<ScalePadLifecycle[]> {
    if (!this.isConfigured()) return [];
    return this.fetchAll<ScalePadLifecycle>(
      `/v1/clients/${encodeURIComponent(clientId)}/lifecycles`
    );
  }
}
