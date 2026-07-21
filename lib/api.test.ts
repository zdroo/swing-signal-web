import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, setAccessToken, setOnUnauthorized, ApiError } from "@/lib/api";

// The silent-refresh interceptor and in-memory token handling in lib/api.ts,
// driven through the public `api` surface with a mocked fetch. These pin the
// behaviours that make the HttpOnly-cookie auth model work: transparent renewal,
// single-flight (no refresh stampede → no server-side reuse-detection false
// positive), no refresh loop on the auth endpoints, and hard-logout on failure.

type FetchArgs = [string, RequestInit | undefined];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// A fetch double routed by (method, path-suffix). Each route is a queue so the
// same URL can answer differently on successive calls (401 then 200 on retry).
function mockFetch(routes: Array<{ match: (url: string, init?: RequestInit) => boolean; responses: Response[] }>) {
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    for (const route of routes) {
      if (route.match(url, init)) {
        return route.responses.length > 1 ? route.responses.shift()! : route.responses[0];
      }
    }
    throw new Error(`unexpected fetch: ${init?.method ?? "GET"} ${url}`);
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

const isGet = (url: string, init?: RequestInit) => (init?.method ?? "GET") === "GET";
const hits = (fn: ReturnType<typeof mockFetch>, pathPart: string) =>
  (fn.mock.calls as FetchArgs[]).filter(([u]) => u.includes(pathPart));
const authHeaderOf = (init?: RequestInit) =>
  new Headers(init?.headers as HeadersInit | undefined).get("Authorization");

beforeEach(() => {
  setAccessToken(null);
  setOnUnauthorized(null);
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("silent-refresh interceptor", () => {
  it("on a 401, refreshes once and transparently retries with the new token", async () => {
    setAccessToken("OLD");
    const fetchMock = mockFetch([
      {
        match: (u, i) => u.includes("/api/regime/current") && isGet(u, i),
        responses: [json({ message: "unauthorized" }, 401), json({ health: { score: 1 } })],
      },
      { match: (u) => u.includes("/api/auth/refresh"), responses: [json({ accessToken: "NEW", email: "u@x", plan: "Free", accessTokenExpiry: "" })] },
    ]);

    const result = await api.getCurrentRegime();

    expect(result).toEqual({ health: { score: 1 } });
    expect(hits(fetchMock, "/api/auth/refresh")).toHaveLength(1);
    const getCalls = hits(fetchMock, "/api/regime/current");
    expect(getCalls).toHaveLength(2);
    expect(authHeaderOf(getCalls[0][1])).toBe("Bearer OLD");   // first try, stale token
    expect(authHeaderOf(getCalls[1][1])).toBe("Bearer NEW");   // retry, rotated token
  });

  it("shares ONE refresh across a burst of concurrent 401s (single-flight)", async () => {
    setAccessToken("OLD");
    const fetchMock = mockFetch([
      { match: (u, i) => u.includes("/api/regime/current") && isGet(u, i), responses: [json({}, 401), json({ a: 1 })] },
      { match: (u, i) => u.includes("/api/sectors") && isGet(u, i), responses: [json({}, 401), json({ b: 2 })] },
      { match: (u) => u.includes("/api/auth/refresh"), responses: [json({ accessToken: "NEW", email: "u@x", plan: "Free", accessTokenExpiry: "" })] },
    ]);

    const [regime, sectors] = await Promise.all([api.getCurrentRegime(), api.getSectors()]);

    expect(regime).toEqual({ a: 1 });
    expect(sectors).toEqual({ b: 2 });
    // The stampede guard: two 401s, but only a single refresh call
    expect(hits(fetchMock, "/api/auth/refresh")).toHaveLength(1);
  });

  it("when the refresh itself fails, calls onUnauthorized and rejects", async () => {
    setAccessToken("OLD");
    const onUnauthorized = vi.fn();
    setOnUnauthorized(onUnauthorized);
    mockFetch([
      { match: (u, i) => u.includes("/api/regime/current") && isGet(u, i), responses: [json({}, 401)] },
      { match: (u) => u.includes("/api/auth/refresh"), responses: [json({ message: "Session is invalid." }, 401)] },
    ]);

    await expect(api.getCurrentRegime()).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("does NOT refresh-loop when an auth endpoint itself 401s (bad credentials)", async () => {
    const fetchMock = mockFetch([
      { match: (u) => u.includes("/api/auth/login"), responses: [json({ message: "Invalid email or password." }, 401)] },
    ]);

    await expect(api.login("u@x.com", "wrong")).rejects.toBeInstanceOf(ApiError);
    expect(hits(fetchMock, "/api/auth/login")).toHaveLength(1); // no retry
    expect(hits(fetchMock, "/api/auth/refresh")).toHaveLength(0); // no refresh triggered
  });
});

describe("in-memory token & session flow", () => {
  it("login parks the access token so later requests carry the Bearer", async () => {
    const fetchMock = mockFetch([
      { match: (u) => u.includes("/api/auth/login"), responses: [json({ accessToken: "TOK", email: "u@x", plan: "Pro", accessTokenExpiry: "" })] },
      { match: (u, i) => u.includes("/api/regime/current") && isGet(u, i), responses: [json({ ok: true })] },
    ]);

    const auth = await api.login("u@x.com", "right");
    expect(auth.accessToken).toBe("TOK");
    await api.getCurrentRegime();

    expect(authHeaderOf(hits(fetchMock, "/api/regime/current")[0][1])).toBe("Bearer TOK");
  });

  it("sends credentials on auth POSTs (to store the cookie) but not on GETs", async () => {
    const fetchMock = mockFetch([
      { match: (u) => u.includes("/api/auth/login"), responses: [json({ accessToken: "T", email: "u@x", plan: "Free", accessTokenExpiry: "" })] },
      { match: (u, i) => u.includes("/api/regime/current") && isGet(u, i), responses: [json({})] },
    ]);

    await api.login("u@x.com", "p");
    await api.getCurrentRegime();

    expect((hits(fetchMock, "/api/auth/login")[0][1] as RequestInit).credentials).toBe("include");
    expect((hits(fetchMock, "/api/regime/current")[0][1] as RequestInit).credentials).toBeUndefined();
  });

  it("refresh() posts to the cookie endpoint with no body and returns the session", async () => {
    const fetchMock = mockFetch([
      { match: (u) => u.includes("/api/auth/refresh"), responses: [json({ accessToken: "R", email: "who@x", plan: "Pro", accessTokenExpiry: "" })] },
    ]);

    const auth = await api.refresh();

    expect(auth.email).toBe("who@x");
    const call = hits(fetchMock, "/api/auth/refresh")[0][1] as RequestInit;
    expect(call.method).toBe("POST");
    expect(call.credentials).toBe("include");
    expect(call.body).toBeUndefined();
  });

  it("refresh() rejects when there is no valid session", async () => {
    mockFetch([{ match: (u) => u.includes("/api/auth/refresh"), responses: [json({}, 401)] }]);
    await expect(api.refresh()).rejects.toBeInstanceOf(ApiError);
  });

  it("logout revokes server-side and clears the in-memory token", async () => {
    setAccessToken("LIVE");
    const fetchMock = mockFetch([
      { match: (u) => u.includes("/api/auth/logout"), responses: [json({ message: "Signed out." })] },
      { match: (u, i) => u.includes("/api/regime/current") && isGet(u, i), responses: [json({})] },
    ]);

    await api.logout();
    await api.getCurrentRegime();

    expect(hits(fetchMock, "/api/auth/logout")).toHaveLength(1);
    expect(authHeaderOf(hits(fetchMock, "/api/regime/current")[0][1])).toBeNull(); // token gone
  });

  it("changePassword adopts the freshly-rotated access token from the response", async () => {
    setAccessToken("OLD");
    const fetchMock = mockFetch([
      { match: (u) => u.includes("/api/users/me/password"), responses: [json({ message: "Password updated.", accessToken: "ROTATED" })] },
      { match: (u, i) => u.includes("/api/regime/current") && isGet(u, i), responses: [json({})] },
    ]);

    await api.changePassword("old-pw", "new-pw-123");
    await api.getCurrentRegime();

    expect(authHeaderOf(hits(fetchMock, "/api/regime/current")[0][1])).toBe("Bearer ROTATED");
  });
});
