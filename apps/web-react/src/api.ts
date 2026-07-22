export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly payload: unknown,
    message = `API request failed with status ${status}`,
  ) {
    super(message);
  }
}

export type TokenProvider = () => Promise<string>;

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  async post<T>(path: string, body: unknown, headers: Record<string, string> = {}): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const token = await this.tokenProvider();
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Request-ID": crypto.randomUUID(),
        ...(init.headers ?? {}),
      },
    });

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new ApiError(response.status, payload);
    }

    return payload as T;
  }
}
