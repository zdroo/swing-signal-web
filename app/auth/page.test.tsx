// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthPage from "./page";

// Spies the page ultimately calls. Hoisted so the vi.mock factories below —
// which are lifted above the imports — can close over them.
const { login, register, googleLogin, push, getParam } = vi.hoisted(() => ({
  login: vi.fn().mockResolvedValue(undefined),
  register: vi.fn().mockResolvedValue(undefined),
  googleLogin: vi.fn().mockResolvedValue(undefined),
  push: vi.fn(),
  getParam: vi.fn().mockReturnValue(null), // no ?returnTo → defaults to /dashboard
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => ({ get: getParam }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ login, register, googleLogin }),
}));

vi.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ theme: "dark", toggleTheme: vi.fn() }),
}));

// Keep the real Google widget out of the test — it renders an external iframe.
vi.mock("@/components/GoogleProvider", () => ({
  GoogleProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@react-oauth/google", () => ({
  GoogleLogin: () => null,
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe("/auth page", () => {
  it("renders in login mode by default", () => {
    render(<AuthPage />);

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Log in" })).toBeDefined();
    // The register CTA is the secondary toggle, not the primary action
    expect(screen.getByRole("button", { name: /Create a free account/ })).toBeDefined();
  });

  it("toggles to register mode when the CTA is clicked", async () => {
    const user = userEvent.setup();
    render(<AuthPage />);

    await user.click(screen.getByRole("button", { name: /Create a free account/ }));

    expect(screen.getByRole("heading", { name: "Create your free account" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Create account" })).toBeDefined();
    // …and the toggle now offers the way back to login
    expect(screen.getByRole("button", { name: /Already have an account/ })).toBeDefined();
  });

  it("submits login credentials to the auth API and redirects", async () => {
    const user = userEvent.setup();
    render(<AuthPage />);

    await user.type(screen.getByPlaceholderText("Email"), "trader@example.com");
    await user.type(screen.getByPlaceholderText(/Password/), "password123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith("trader@example.com", "password123")
    );
    expect(register).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("submits registration credentials after toggling to register mode", async () => {
    const user = userEvent.setup();
    render(<AuthPage />);

    await user.click(screen.getByRole("button", { name: /Create a free account/ }));
    await user.type(screen.getByPlaceholderText("Email"), "new@example.com");
    await user.type(screen.getByPlaceholderText(/Password/), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith("new@example.com", "password123")
    );
    expect(login).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/dashboard");
  });
});
