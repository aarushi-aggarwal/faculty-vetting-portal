const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

function getTokenFromCookieString(cookieStr: string): string | undefined {
  return cookieStr
    .split("; ")
    .find((c) => c.startsWith("portal_token="))
    ?.split("=")[1]
}

async function getServerToken(): Promise<string | undefined> {
  const { cookies } = await import("next/headers")
  const store = await cookies()
  return store.get("portal_token")?.value
}

function getClientToken(): string | undefined {
  if (typeof document === "undefined") return undefined
  return getTokenFromCookieString(document.cookie)
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  let token: string | undefined
  if (typeof window === "undefined") {
    token = await getServerToken()
  } else {
    token = getClientToken()
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  return fetch(`${API_URL}${path}`, { ...init, headers })
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch(path)
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: "POST",
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).detail ?? `POST ${path} failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}
