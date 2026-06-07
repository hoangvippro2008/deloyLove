import type { ApiResponse } from "@/types/api";

const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/$/, "");
const apiOrigin = /^https?:\/\//.test(apiUrl) ? apiUrl.replace(/\/api\/?$/, "") : "";

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

type ValidationDetails = {
  details?: {
    fieldErrors?: Record<string, string[] | undefined>;
    formErrors?: string[];
  };
};

function extractValidationMessage(data: unknown) {
  const details = (data as ValidationDetails | null)?.details;
  const fieldErrors = details?.fieldErrors;

  if (fieldErrors) {
    const firstFieldError = Object.values(fieldErrors)
      .flatMap((errors) => errors ?? [])
      .find(Boolean);

    if (firstFieldError) {
      return firstFieldError;
    }
  }

  return details?.formErrors?.find(Boolean);
}

export function createApiUrl(path: string) {
  if (/^(https?:|data:|blob:)/.test(path)) {
    return path;
  }

  return `${apiUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function createMediaUrl(path: string | null | undefined) {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const mediaPath = path.startsWith("/") ? path : `/${path}`;

  return `${apiOrigin}${mediaPath}`;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(createApiUrl(path), {
    ...init,
    headers,
    credentials: "include"
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !payload?.success) {
    const message = extractValidationMessage(payload?.data) ?? payload?.message ?? "Không thể hoàn tất thao tác";

    throw new ApiClientError(
      response.status,
      message,
      payload?.data ?? null
    );
  }

  return payload.data;
}
