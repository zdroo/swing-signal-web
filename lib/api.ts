import type {
  AssetDto,
  AssetOddsDto,
  AssetPeriodOddsDto,
  AuthResponse,
  BacktestComparisonDto,
  BacktestResultDto,
  CandleDto,
  HistoricalMatchDto,
  MacroRegimeDto,
  PopularAssetDto,
  BillingUrlDto,
  ScreenerResultDto,
  SectorRotationResultDto,
  UpcomingEventsDto,
  SymbolSearchResultDto,
  UserProfileDto,
  WatchlistItemDto,
  WatchlistRowDto,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:7260";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ── Session state ──────────────────────────────────────────────────────
// Access token lives ONLY in memory (never localStorage) so XSS can't read it;
// the long-lived refresh token is an HttpOnly cookie JS can't touch. A reload
// loses the in-memory token — AuthContext rehydrates it via refresh() on mount.
let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

// Called when a silent refresh ultimately fails (session dead) — drops to logged-out UI
export function setOnUnauthorized(cb: (() => void) | null): void {
  onUnauthorized = cb;
}

function authHeaders(): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

// ── Silent refresh (single-flight) ─────────────────────────────────────
// On a 401 we refresh once and retry. A burst of simultaneous 401s must share
// ONE refresh — concurrent refreshes would rotate each other and trip the
// server's reuse detection.
let refreshInFlight: Promise<AuthResponse | null> | null = null;

function refreshAccessOnce(): Promise<AuthResponse | null> {
  refreshInFlight ??= (async () => {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include", // send the HttpOnly refresh cookie
    });
    if (!res.ok) {
      accessToken = null;
      return null;
    }
    const data = (await res.json()) as AuthResponse;
    accessToken = data.accessToken;
    return data;
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

// On a 401 (except the auth endpoints themselves — no loop), refresh once and
// retry. doFetch is a thunk so the retry re-reads the rotated token.
async function withRetry(path: string, doFetch: () => Promise<Response>): Promise<Response> {
  let res = await doFetch();
  if (res.status === 401 && !path.startsWith("/api/auth/")) {
    const refreshed = await refreshAccessOnce();
    if (refreshed) res = await doFetch();
    else onUnauthorized?.();
  }
  return res;
}

// Error bodies are either { message } (exception middleware) or a bare JSON
// string (controller-level BadRequest) — surface the human text either way.
function extractMessage(text: string): string {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === "string") return parsed;
    if (parsed && typeof parsed.message === "string") return parsed.message;
  } catch {
    // not JSON — use as-is
  }
  return text;
}

async function get<T>(path: string): Promise<T> {
  // No credentials on GETs (Bearer covers auth; the cookie is /api/auth-scoped) —
  // keeps Next's data cache eligible.
  const res = await withRetry(path, () =>
    fetch(`${BASE_URL}${path}`, { next: { revalidate: 300 }, headers: authHeaders() }));
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, extractMessage(text) || `API error ${res.status} for ${path}`);
  }
  return res.json();
}

async function send<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await withRetry(path, () =>
    fetch(`${BASE_URL}${path}`, {
      method,
      credentials: "include", // auth POSTs set/read the cookie; cross-origin needs this to store it
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: body === undefined ? undefined : JSON.stringify(body),
    }));
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, extractMessage(text) || `API error ${res.status}`);
  }
  return res.json();
}

const post = <T,>(path: string, body?: unknown): Promise<T> => send<T>("POST", path, body);
const put = <T,>(path: string, body: unknown): Promise<T> => send<T>("PUT", path, body);
const del = <T,>(path: string): Promise<T> => send<T>("DELETE", path);

// For endpoints answering 204 — send() would choke parsing the empty body
async function delVoid(path: string): Promise<void> {
  const res = await withRetry(path, () =>
    fetch(`${BASE_URL}${path}`, { method: "DELETE", credentials: "include", headers: authHeaders() }));
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, extractMessage(text) || `API error ${res.status}`);
  }
}

// Applies a login/register/refresh response: parks the access token in memory.
function applySession(auth: AuthResponse): AuthResponse {
  setAccessToken(auth.accessToken);
  return auth;
}

export const api = {
  getCurrentRegime: (): Promise<MacroRegimeDto> =>
    get("/api/regime/current"),

  getHistoricalMatches: (topK = 10): Promise<HistoricalMatchDto[]> =>
    get(`/api/regime/matches?topK=${topK}`),

  getAssetOdds: (symbol: string, meta?: { q?: string; src?: string }): Promise<AssetOddsDto> => {
    const params = new URLSearchParams();
    if (meta?.q) params.set("q", meta.q);
    if (meta?.src) params.set("src", meta.src);
    const query = params.toString();
    return get(`/api/regime/odds/${encodeURIComponent(symbol)}${query ? `?${query}` : ""}`);
  },

  getOddsForPeriod: (symbol: string, days: number): Promise<AssetPeriodOddsDto> =>
    get(`/api/regime/odds/${encodeURIComponent(symbol)}/period?days=${days}`),

  getAssets: (): Promise<AssetDto[]> =>
    get("/api/assets"),

  getCandles: (symbol: string, limit = 10000): Promise<CandleDto[]> =>
    get(`/api/candles/${encodeURIComponent(symbol)}?interval=OneDay&limit=${limit}`),

  searchSymbols: (q: string): Promise<SymbolSearchResultDto[]> =>
    get(`/api/assets/search?q=${encodeURIComponent(q)}`),

  getPopularAssets: (): Promise<PopularAssetDto[]> =>
    get("/api/assets/popular"),

  runBacktest: (symbol: string, days: number, topK = 10): Promise<BacktestResultDto> =>
    get(`/api/backtest/${encodeURIComponent(symbol)}?days=${days}&topK=${topK}`),

  compareBacktest: (symbol: string, days: number, topK = 10): Promise<BacktestComparisonDto> =>
    get(`/api/backtest/${encodeURIComponent(symbol)}/compare?days=${days}&topK=${topK}`),

  register: async (email: string, password: string): Promise<AuthResponse> =>
    applySession(await post("/api/auth/register", { email, password })),

  login: async (email: string, password: string): Promise<AuthResponse> =>
    applySession(await post("/api/auth/login", { email, password })),

  // No body — the refresh token rides in the HttpOnly cookie. Shares the
  // single-flight guard with the silent interceptor so the two never stampede.
  refresh: async (): Promise<AuthResponse> => {
    const data = await refreshAccessOnce();
    if (!data) throw new ApiError(401, "Session expired.");
    return data;
  },

  googleLogin: async (idToken: string): Promise<AuthResponse> =>
    applySession(await post("/api/auth/google", { idToken })),

  logout: async (): Promise<void> => {
    // Revoke the session server-side (clears the cookie) even if it errors, then
    // drop the in-memory token.
    try {
      await post("/api/auth/logout");
    } catch {
      // best-effort — clear locally regardless
    }
    setAccessToken(null);
  },

  confirmEmail: (token: string): Promise<{ message: string }> =>
    post("/api/auth/confirm-email", { token }),

  resendConfirmation: (email: string): Promise<{ message: string }> =>
    post("/api/auth/resend-confirmation", { email }),

  forgotPassword: (email: string): Promise<{ message: string }> =>
    post("/api/auth/forgot-password", { email }),

  resetPassword: (token: string, newPassword: string): Promise<{ message: string }> =>
    post("/api/auth/reset-password", { token, newPassword }),

  joinWaitlist: (email: string, source: string): Promise<{ message: string }> =>
    post("/api/waitlist", { email, source }),

  getProfile: (): Promise<UserProfileDto> =>
    get("/api/users/me"),

  // Change-password revokes every session and re-issues THIS one: a fresh cookie
  // (set by the response) plus a new access token in the body we must adopt.
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const res = await put<{ message: string; accessToken?: string }>(
      "/api/users/me/password", { currentPassword, newPassword });
    if (res.accessToken) setAccessToken(res.accessToken);
    return res;
  },

  deleteAccount: (): Promise<{ message: string }> =>
    del("/api/users/me"),

  setWeeklyReport: (enabled: boolean): Promise<{ message: string }> =>
    put("/api/users/me/weekly-report", { enabled }),

  setAlerts: (enabled: boolean): Promise<{ message: string }> =>
    put("/api/users/me/alerts", { enabled }),

  getWatchlist: (): Promise<WatchlistItemDto[]> =>
    get("/api/watchlist"),

  getWatchlistOverview: (): Promise<WatchlistRowDto[]> =>
    get("/api/watchlist/overview"),

  addToWatchlist: (symbol: string): Promise<WatchlistItemDto> =>
    post("/api/watchlist", { symbol }),

  removeFromWatchlist: (symbol: string): Promise<void> =>
    delVoid(`/api/watchlist/${encodeURIComponent(symbol)}`),

  getSectors: (): Promise<SectorRotationResultDto> =>
    get("/api/sectors"),

  getUpcomingEvents: (take = 5): Promise<UpcomingEventsDto> =>
    get(`/api/events/upcoming?take=${take}`),

  getScreener: (): Promise<ScreenerResultDto> =>
    get("/api/screener"),

  getScreenerFull: (filters?: { stance?: string; market?: string; minEdge?: number }): Promise<ScreenerResultDto> => {
    const params = new URLSearchParams();
    if (filters?.stance) params.set("stance", filters.stance);
    if (filters?.market) params.set("market", filters.market);
    if (typeof filters?.minEdge === "number") params.set("minEdge", String(filters.minEdge));
    const query = params.toString();
    return get(`/api/screener/full${query ? `?${query}` : ""}`);
  },

  createCheckout: (period: "monthly" | "yearly"): Promise<BillingUrlDto> =>
    post("/api/billing/checkout", { period }),

  openBillingPortal: (): Promise<BillingUrlDto> =>
    post("/api/billing/portal", {}),
};
