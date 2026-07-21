// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

// The AuthContext orchestration: rehydrate-on-mount via the cookie refresh,
// login/logout wiring, and dropping to logged-out when a silent refresh fails.
vi.mock("@/lib/api", () => ({
  setOnUnauthorized: vi.fn(),
  api: {
    refresh: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    googleLogin: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { api, setOnUnauthorized } from "@/lib/api";

function Consumer() {
  const { user, loading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="state">{loading ? "loading" : user ? user.email : "anon"}</span>
      <button onClick={() => void login("u@x.com", "pw")}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

const renderApp = () => render(
  <AuthProvider>
    <Consumer />
  </AuthProvider>,
);

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => cleanup());

const stateText = () => screen.getByTestId("state").textContent;

describe("AuthProvider", () => {
  it("rehydrates the session from the refresh cookie on mount", async () => {
    (api.refresh as Mock).mockResolvedValue({ email: "back@x.com", plan: "Pro", accessToken: "T", accessTokenExpiry: "" });

    renderApp();

    await waitFor(() => expect(stateText()).toBe("back@x.com"));
    expect(api.refresh).toHaveBeenCalledOnce(); // the mount rehydrate
  });

  it("stays anonymous when there is no valid session", async () => {
    (api.refresh as Mock).mockRejectedValue(new Error("401"));

    renderApp();

    await waitFor(() => expect(stateText()).toBe("anon"));
  });

  it("logs in and reflects the user", async () => {
    (api.refresh as Mock).mockRejectedValue(new Error("401")); // start anonymous
    (api.login as Mock).mockResolvedValue({ email: "u@x.com", plan: "Free", accessToken: "T", accessTokenExpiry: "" });
    renderApp();
    await waitFor(() => expect(stateText()).toBe("anon"));

    await userEvent.click(screen.getByText("login"));

    await waitFor(() => expect(stateText()).toBe("u@x.com"));
  });

  it("logout clears the user and revokes server-side", async () => {
    (api.refresh as Mock).mockResolvedValue({ email: "u@x.com", plan: "Free", accessToken: "T", accessTokenExpiry: "" });
    renderApp();
    await waitFor(() => expect(stateText()).toBe("u@x.com"));

    await userEvent.click(screen.getByText("logout"));

    await waitFor(() => expect(stateText()).toBe("anon"));
    expect(api.logout).toHaveBeenCalledOnce();
  });

  it("a silent-refresh failure mid-session drops to logged-out", async () => {
    (api.refresh as Mock).mockResolvedValue({ email: "u@x.com", plan: "Free", accessToken: "T", accessTokenExpiry: "" });
    renderApp();
    await waitFor(() => expect(stateText()).toBe("u@x.com"));

    // Invoke the handler AuthContext registered with the api layer, as the
    // interceptor would after a failed refresh.
    const registered = (setOnUnauthorized as Mock).mock.calls[0][0] as () => void;
    registered();

    await waitFor(() => expect(stateText()).toBe("anon"));
  });
});
