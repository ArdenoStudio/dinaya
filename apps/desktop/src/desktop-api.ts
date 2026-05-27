import { invoke } from "@tauri-apps/api/core";

type DesktopApiMethod = "DELETE" | "GET" | "PATCH" | "POST";

type DesktopApiRequest = {
  body?: unknown;
  method: DesktopApiMethod;
  path: `/api/v1/desktop/${string}`;
};

export async function desktopApiRequest<T>(request: DesktopApiRequest): Promise<T> {
  return invoke<T>("desktop_api_request", {
    request: {
      body: request.body ?? null,
      method: request.method,
      path: request.path,
    },
  });
}

export function buildDesktopApiPath(
  path: `/api/v1/desktop/${string}`,
  params?: Record<string, string | number | undefined>,
): `/api/v1/desktop/${string}` {
  if (!params) return path;

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && String(value).trim() !== "") {
      query.set(key, String(value));
    }
  }

  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` as `/api/v1/desktop/${string}` : path;
}
