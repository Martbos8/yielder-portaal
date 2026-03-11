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

export class ConnectWiseClient {
  private config: CWClientConfig | null;

  constructor() {
    const baseUrl = process.env['CW_BASE_URL'];
    const companyId = process.env['CW_COMPANY_ID'];
    const publicKey = process.env['CW_PUBLIC_KEY'];
    const privateKey = process.env['CW_PRIVATE_KEY'];
    const clientId = process.env['CW_CLIENT_ID'];

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

      const authString = `${this.config.companyId}+${this.config.publicKey}:${this.config.privateKey}`;
      const authHeader = `Basic ${Buffer.from(authString).toString("base64")}`;

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          clientId: this.config.clientId,
        },
      });

      if (!response.ok) {
        throw new Error(`CW API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as T[];
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
}
