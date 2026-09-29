const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// ─── token storage ────────────────────────────────────────────────────────────
export function saveSession(accessToken: string, refreshToken?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("nagargo_access_token", accessToken);
  if (refreshToken) localStorage.setItem("nagargo_refresh_token", refreshToken);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("nagargo_access_token");
  localStorage.removeItem("nagargo_refresh_token");
}

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("nagargo_access_token") : null;
}

function getRefreshToken() {
  return typeof window !== "undefined" ? localStorage.getItem("nagargo_refresh_token") : null;
}

// ─── event bus ───────────────────────────────────────────────────────────────
function dispatchApiError(message: string, path: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nagargo:api-error", { detail: { message, path } }));
  }
}

function dispatchSessionExpired() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nagargo:session-expired"));
  }
}

// ─── token refresh ───────────────────────────────────────────────────────────
let _refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (_refreshing) return _refreshing;

  _refreshing = (async () => {
    const rt = getRefreshToken();
    if (!rt) return null;
    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rt }),
        cache: "no-store",
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.accessToken) {
        saveSession(data.accessToken, data.refreshToken ?? rt);
        return data.accessToken as string;
      }
      return null;
    } catch {
      return null;
    } finally {
      _refreshing = null;
    }
  })();

  return _refreshing;
}

// ─── core fetch wrapper ───────────────────────────────────────────────────────
export async function api<T>(path: string, options: RequestInit = {}, _retry = true): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { ...options, headers, cache: "no-store" });
  } catch {
    const message = "Unable to reach NagarGo server. Please check your internet connection or contact support.";
    dispatchApiError(message, path);
    throw new Error(message);
  }

  // ── Auto-refresh on 401 ───────────────────────────────────────────────────
  if (res.status === 401 && _retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return api<T>(path, options, false); // retry once with new token
    }
    // Refresh also failed — session is completely expired
    clearSession();
    dispatchSessionExpired();
    throw new Error("Session expired. Please sign in again.");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail =
      typeof data.message === "string" ? data.message : `Server returned HTTP ${res.status}.`;
    const hint =
      res.status === 400
        ? "Check the highlighted fields and required document details."
        : res.status === 409
        ? "This record already exists. Check the phone number or application status."
        : res.status === 401 || res.status === 403
        ? "Your session or permission is invalid. Sign in again or contact an admin."
        : res.status >= 500
        ? "The server is having trouble. Try again shortly or contact support."
        : "Review the form details and try again.";
    const message = `${detail} ${hint}`;
    dispatchApiError(message, path);
    throw new Error(message);
  }

  return data as T;
}
