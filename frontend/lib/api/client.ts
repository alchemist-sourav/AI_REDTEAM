const API_BASE = "/api/v1";

const COLLECTION_ENDPOINTS = new Set([
  "/targets",
  "/test-cases",
  "/executions",
  "/evaluations",
  "/users",
]);

const SPECIFIC_ENDPOINTS = new Set([
  "/auth/me",
  "/auth/login",
  "/analytics/dashboard",
]);

function normalizePath(path: string): string {
  const pathWithoutQuery = path.split("?")[0];
  const queryPart = path.includes("?") ? path.slice(pathWithoutQuery.length) : "";

  if (COLLECTION_ENDPOINTS.has(pathWithoutQuery) && !pathWithoutQuery.endsWith("/")) {
    return pathWithoutQuery + "/" + queryPart;
  }

  if (SPECIFIC_ENDPOINTS.has(pathWithoutQuery) && pathWithoutQuery.endsWith("/")) {
    return pathWithoutQuery.replace(/\/$/, "") + queryPart;
  }

  return path;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(`Unexpected response format: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.detail ?? "Request failed") as ApiError;
    error.status = res.status;
    error.detail = data.detail;
    throw error;
  }
  return data as T;
}

export interface ApiError extends Error {
  status?: number;
  detail?: string;
}

export interface RequestOptions extends RequestInit {
  headers?: HeadersInit;
}

export interface ApiClient {
  get: <T>(path: string, options?: RequestOptions) => Promise<T>;
  post: <T>(path: string, body: unknown, options?: RequestOptions) => Promise<T>;
  patch: <T>(path: string, body: unknown, options?: RequestOptions) => Promise<T>;
  delete: <T>(path: string, options?: RequestOptions) => Promise<T>;
}

export function createApiClient(getToken: () => string | null): ApiClient {
  async function request<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const token = getToken();
    const normalizedPath = normalizePath(path);
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const res = await fetch(`${API_BASE}${normalizedPath}`, {
      ...options,
      headers,
    });

    return parseResponse<T>(res);
  }

  return {
    get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
    post: <T>(path: string, body: unknown, options?: RequestOptions) =>
      request<T>(path, { ...options, method: "POST", body: JSON.stringify(body) }),
    patch: <T>(path: string, body: unknown, options?: RequestOptions) =>
      request<T>(path, { ...options, method: "PATCH", body: JSON.stringify(body) }),
    delete: <T>(path: string, options?: RequestOptions) =>
      request<T>(path, { ...options, method: "DELETE" }),
  };
}