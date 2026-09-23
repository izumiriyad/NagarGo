const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function dispatchApiError(message: string, path: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("nagargo:api-error", { detail: { message, path } })
    );
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("nagargo_access_token") : null;
  const headers = new Headers(options.headers);
  // Only set Content-Type for non-FormData bodies
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { ...options, headers, cache: "no-store" });
  } catch {
    const message =
      "Unable to reach NagarGo server. Please check your internet connection or contact support.";
    dispatchApiError(message, path);
    throw new Error(message);
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

export function saveSession(accessToken: string) {
  localStorage.setItem("nagargo_access_token", accessToken);
}

export function clearSession() {
  localStorage.removeItem("nagargo_access_token");
}
