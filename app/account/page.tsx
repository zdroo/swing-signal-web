"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PRO_ENABLED } from "@/lib/features";
import { UpgradePanel } from "@/components/UpgradePanel";
import type { UserProfileDto } from "@/types";
import {
  UserCircle, Loader2, MailCheck, MailWarning, KeyRound, Trash2, Check, CreditCard, Sparkles,
} from "lucide-react";

export default function AccountPage() {
  const { user, loading: authLoading, logout, refreshSession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const justUpgraded = searchParams.get("upgraded") === "1";

  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);

  // billing
  const [portalBusy, setPortalBusy] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [confirmingUpgrade, setConfirmingUpgrade] = useState(justUpgraded);

  // change password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwState, setPwState] = useState<"idle" | "busy" | "done">("idle");
  const [pwError, setPwError] = useState<string | null>(null);

  // resend confirmation
  const [resendState, setResendState] = useState<"idle" | "busy" | "sent">("idle");

  // delete account
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // notification toggles (Pro)
  const [toggleBusy, setToggleBusy] = useState<"report" | "alerts" | null>(null);

  const toggleNotification = async (kind: "report" | "alerts") => {
    if (!profile || toggleBusy) return;
    const enabled = kind === "report" ? !profile.weeklyReportEnabled : !profile.alertsEnabled;
    setToggleBusy(kind);
    try {
      if (kind === "report") {
        await api.setWeeklyReport(enabled);
        setProfile({ ...profile, weeklyReportEnabled: enabled });
      } else {
        await api.setAlerts(enabled);
        setProfile({ ...profile, alertsEnabled: enabled });
      }
    } catch {
      // leave the toggle as-is; next profile load shows the truth
    } finally {
      setToggleBusy(null);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth?returnTo=/account");
      return;
    }

    let cancelled = false;

    // After returning from Stripe, the webhook may lag the redirect by a
    // moment — poll the profile until it reads Pro, then refresh the token
    // so the plan claim (navbar, gates) updates without a re-login.
    async function loadWithUpgradeSync() {
      let p = await api.getProfile().catch(() => null);
      if (justUpgraded) {
        for (let i = 0; i < 5 && p?.plan !== "Pro"; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          if (cancelled) return;
          p = await api.getProfile().catch(() => p);
        }
        if (p?.plan === "Pro") await refreshSession().catch(() => {});
        if (!cancelled) setConfirmingUpgrade(false);
        // Drop the ?upgraded=1 so a refresh doesn't re-run this
        router.replace("/account");
      }
      if (!cancelled) {
        setProfile(p);
        setLoading(false);
      }
    }

    loadWithUpgradeSync();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const openPortal = async () => {
    if (portalBusy) return;
    setPortalBusy(true);
    setBillingError(null);
    try {
      const { url } = await api.openBillingPortal();
      window.location.href = url;
    } catch (err) {
      setBillingError(err instanceof ApiError ? err.message : "Could not open billing. Try again shortly.");
      setPortalBusy(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      setPwError("New passwords don't match.");
      return;
    }
    setPwState("busy");
    setPwError(null);
    try {
      await api.changePassword(currentPw, newPw);
      setPwState("done");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err) {
      setPwState("idle");
      setPwError(
        err instanceof ApiError && err.message && !err.message.startsWith("API error")
          ? err.message.replace(/^"|"$/g, "")
          : "Could not update the password."
      );
    }
  };

  const handleResend = async () => {
    if (!profile) return;
    setResendState("busy");
    try {
      await api.resendConfirmation(profile.email);
      setResendState("sent");
    } catch {
      setResendState("idle");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteAccount();
      logout();
      router.push("/");
    } catch {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-24 text-center text-sm text-zinc-500">
        Could not load your account. <Link href="/auth" className="text-emerald-600 dark:text-emerald-400">Try logging in again.</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-10">
      <div className="text-center">
        <UserCircle className="mx-auto mb-2 h-9 w-9 text-emerald-600 dark:text-emerald-400" />
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Your Account</h1>
      </div>

      {/* Profile */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium text-zinc-900 dark:text-white">{profile.email}</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Member since{" "}
              {new Date(profile.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
              })}
            </p>
          </div>
          <span className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            {profile.plan} plan
          </span>
        </div>

        <div className="mt-4 border-t border-zinc-200 dark:border-zinc-800 pt-4">
          {profile.isEmailConfirmed ? (
            <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
              <MailCheck className="h-4 w-4" /> Email confirmed
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <p className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <MailWarning className="h-4 w-4" /> Email not confirmed — unconfirmed accounts are
                deleted after 7 days
              </p>
              {resendState === "sent" ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3.5 w-3.5" /> Sent — check your inbox
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resendState === "busy"}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:border-zinc-400 dark:hover:border-zinc-500 disabled:opacity-50"
                >
                  Resend confirmation email
                </button>
              )}
            </div>
          )}
        </div>
        {/* Pro notifications */}
        {profile.plan === "Pro" && (
          <>
            {(
              [
                {
                  kind: "report" as const,
                  title: "Weekly regime report",
                  detail: "Market health, playbook and your watchlist — every Monday by email.",
                  enabled: profile.weeklyReportEnabled,
                },
                {
                  kind: "alerts" as const,
                  title: "Change alerts",
                  detail:
                    "An email when a watchlist asset's read flips, its regime edge turns positive, or its price breaks its 3-month target range — plus Market Health band moves.",
                  enabled: profile.alertsEnabled,
                },
              ]
            ).map((setting) => (
              <div
                key={setting.kind}
                className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-4"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{setting.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{setting.detail}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={setting.enabled}
                  onClick={() => toggleNotification(setting.kind)}
                  disabled={toggleBusy !== null}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                    setting.enabled ? "bg-emerald-600" : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      setting.enabled ? "left-5.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </>
        )}
      </section>

      {/* Billing */}
      {confirmingUpgrade ? (
        <section className="rounded-xl border border-emerald-500/30 bg-white dark:bg-zinc-900 p-5">
          <p className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
            Confirming your upgrade…
          </p>
        </section>
      ) : profile.plan === "Pro" ? (
        profile.hasBilling && (
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <h2 className="mb-1 flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Pro subscription
            </h2>
            <p className="mb-4 text-xs text-zinc-500">
              Update your payment method, view invoices, or cancel — you keep Pro until the period ends.
            </p>
            {billingError && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{billingError}</p>}
            <button
              type="button"
              onClick={openPortal}
              disabled={portalBusy}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:border-zinc-400 dark:hover:border-zinc-500 disabled:opacity-50"
            >
              {portalBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Manage billing
            </button>
          </section>
        )
      ) : (
        PRO_ENABLED && <UpgradePanel source="account" />
      )}

      {/* Change password */}
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <h2 className="mb-1 flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
          <KeyRound className="h-4 w-4 text-zinc-500" /> Change password
        </h2>
        <p className="mb-4 text-xs text-zinc-500">
          Signed up with Google and never set a password? Use{" "}
          <Link href="/auth/forgot-password" className="text-emerald-600 dark:text-emerald-400 hover:underline">
            password reset
          </Link>{" "}
          to create one first.
        </p>

        {pwState === "done" ? (
          <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
            <Check className="h-4 w-4" /> Password updated. Other sessions were signed out.
          </p>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-3">
            <input
              type="password"
              required
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="Current password"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 sm:text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <input
              type="password"
              required
              minLength={8}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="New password (min. 8 characters)"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 sm:text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <input
              type="password"
              required
              minLength={8}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Repeat new password"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 sm:text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {pwError && <p className="text-sm text-red-600 dark:text-red-400">{pwError}</p>}
            <button
              type="submit"
              disabled={pwState === "busy"}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {pwState === "busy" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Update password
            </button>
          </form>
        )}
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-red-300/50 dark:border-red-900/50 bg-white dark:bg-zinc-900 p-5">
        <h2 className="mb-1 flex items-center gap-2 font-semibold text-red-700 dark:text-red-400">
          <Trash2 className="h-4 w-4" /> Delete account
        </h2>
        <p className="mb-3 text-xs text-zinc-500">
          Permanently removes your account, email, and personal data. Your anonymous
          usage history is kept without any link to you. This cannot be undone.
        </p>

        {!confirmingDelete ? (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="rounded-lg border border-red-400/50 px-3.5 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 transition-colors hover:bg-red-500/10"
          >
            Delete my account
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-zinc-900 dark:text-white">Are you sure?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
            >
              {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Yes, delete everything
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              Cancel
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
