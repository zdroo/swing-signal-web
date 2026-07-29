// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AlertsPage from "./page";

const { api, useAuthMock } = vi.hoisted(() => ({
  api: {
    getAlertRules: vi.fn(),
    createAlertRule: vi.fn(),
    updateAlertRule: vi.fn(),
    deleteAlertRule: vi.fn(),
  },
  useAuthMock: vi.fn(),
}));
vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...actual, api };
});
vi.mock("@/context/AuthContext", () => ({ useAuth: useAuthMock }));
vi.mock("next/link", () => ({
  default: ({ children, ...p }: { children: React.ReactNode }) => <a {...p}>{children}</a>,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("/alerts page", () => {
  it("gates behind an account when signed out", () => {
    useAuthMock.mockReturnValue({ user: null, loading: false });
    render(<AlertsPage />);
    expect(screen.getByText(/free account feature/)).toBeTruthy();
  });

  it("creates a rule from the default macro condition", async () => {
    useAuthMock.mockReturnValue({ user: { email: "a@b.com", plan: "Free" }, loading: false });
    api.getAlertRules.mockResolvedValue([]);
    api.createAlertRule.mockResolvedValue({
      id: "1", name: "Risk-off", enabled: true, conditions: [], lastTriggeredAt: null, summary: "VIX above 30",
    });
    const u = userEvent.setup();

    render(<AlertsPage />);
    await waitFor(() => expect(api.getAlertRules).toHaveBeenCalled());

    await u.type(screen.getByPlaceholderText(/Alert name/i), "Risk-off");
    await u.click(screen.getByRole("button", { name: /Create alert/i }));

    await waitFor(() =>
      expect(api.createAlertRule).toHaveBeenCalledWith("Risk-off", [
        { type: "MacroIndicator", subject: "VIX", operator: "Above", threshold: 30, param: 0 },
      ]),
    );
  });
});
