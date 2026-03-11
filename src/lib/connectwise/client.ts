// ConnectWise Manage API client
// Uses Basic auth: companyId+publicKey:privateKey
// Requires clientId header for API access

type CWClientConfig = {
  baseUrl: string;
  companyId: string;
  publicKey: string;
  privateKey: string;
  clientId: string;
};

const MAX_PAGE_SIZE = 1000;
const RATE_LIMIT_DELAY_MS = 100; // ~10 requests/second
const REQUEST_TIMEOUT_MS = 30_000; // 30s per call
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000; // exponential: 1s, 2s, 4s

export class ConnectWiseClient {
  private config: CWClientConfig | null;

  constructor() {
    const baseUrl = process.env.CW_BASE_URL;
    const companyId = process.env.CW_COMPANY_ID;
    const publicKey = process.env.CW_PUBLIC_KEY;
    const privateKey = process.env.CW_PRIVATE_KEY;
    const clientId = process.env.CW_CLIENT_ID;

    if (!baseUrl || !companyId || !publicKey || !privateKey || !clientId) {
      this.config = null;
    } else {
      this.config = { baseUrl, companyId, publicKey, privateKey, clientId };
    }
  }

  /**
   * Returns true if API credentials are configured.
   */
  isConfigured(): boolean {
    return this.config !== null;
  }

  /**
   * Makes an authenticated GET request to the ConnectWise API.
   * Includes 30s timeout, exponential backoff on 429, and error handling on 500.
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T[]> {
    if (!this.config) {
      return [];
    }

    const results: T[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const url = new URL(`${this.config.baseUrl}${endpoint}`);
      url.searchParams.set("pageSize", String(MAX_PAGE_SIZE));
      url.searchParams.set("page", String(page));

      if (params) {
        for (const [key, value] of Object.entries(params)) {
          url.searchParams.set(key, value);
        }
      }

      const data = await this.fetchWithRetry<T[]>(url.toString());
      if (!data) break;

      results.push(...data);

      // If we got less than a full page, we're done
      hasMore = data.length === MAX_PAGE_SIZE;
      page++;

      // Rate limiting
      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
      }
    }

    return results;
  }

  /**
   * Fetch with exponential backoff on 429 and abort timeout.
   * Throws on non-retryable errors (4xx except 429).
   * Returns null on 500+ errors (logged, not thrown).
   */
  private async fetchWithRetry<T>(url: string): Promise<T | null> {
    if (!this.config) return null;

    const authString = `${this.config.companyId}+${this.config.publicKey}:${this.config.privateKey}`;
    const authHeader = `Basic ${Buffer.from(authString).toString("base64")}`;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
            clientId: this.config.clientId,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return (await response.json()) as T;
        }

        // Rate limited — retry with exponential backoff
        if (response.status === 429 && attempt < MAX_RETRIES) {
          const delay = RETRY_BASE_MS * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // Server error — log and return null (don't break entire sync)
        if (response.status >= 500) {
          return null;
        }

        // Client error (non-429) — throw
        throw new Error(`CW API error: ${response.status} ${response.statusText}`);
      } catch (err) {
        clearTimeout(timeoutId);

        // AbortError from timeout
        if (err instanceof DOMException && err.name === "AbortError") {
          if (attempt < MAX_RETRIES) {
            const delay = RETRY_BASE_MS * Math.pow(2, attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          return null; // All retries exhausted on timeout
        }

        throw err;
      }
    }

    return null;
  }
}
