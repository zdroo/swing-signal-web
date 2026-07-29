"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { INDICATORS } from "@/lib/indicators";
import { InfoTip } from "@/components/InfoTip";
import type { AlertConditionDto, AlertRuleDto } from "@/types";
import { ArrowLeft, Bell, Loader2, Lock, Plus, Trash2 } from "lucide-react";

const TYPE_LABEL: Record<string, string> = {
  MacroIndicator: "Macro indicator",
  AssetPrice: "Asset price",
  MovingAverage: "Moving average",
  VolumeSpike: "Volume spike",
};

const inputCls =
  "rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1.5 text-sm text-zinc-900 dark:text-white";

function newCondition(type = "MacroIndicator"): AlertConditionDto {
  switch (type) {
    case "AssetPrice":
      return { type, subject: "", operator: "Above", threshold: 0, param: 0 };
    case "MovingAverage":
      return { type, subject: "", operator: "Below", threshold: 0, param: 200 };
    case "VolumeSpike":
      return { type, subject: "", operator: "Above", threshold: 2, param: 20 };
    default:
      return { type: "MacroIndicator", subject: "VIX", operator: "Above", threshold: 30, param: 0 };
  }
}

export default function AlertsPage() {
  const { user, loading: authLoading } = useAuth();
  const [rules, setRules] = useState<AlertRuleDto[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [conditions, setConditions] = useState<AlertConditionDto[]>([newCondition()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRules(await api.getAlertRules());
    } catch {
      /* leave empty */
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    api.getAlertRules()
      .then((r) => !cancelled && setRules(r))
      .catch(() => {})
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const setCondition = (i: number, patch: Partial<AlertConditionDto>) =>
    setConditions((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  async function create() {
    if (!name.trim()) {
      setError("Give the alert a name.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.createAlertRule(name.trim(), conditions);
      setName("");
      setConditions([newCondition()]);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the alert.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggle(rule: AlertRuleDto) {
    await api.updateAlertRule(rule.id, { enabled: !rule.enabled });
    load();
  }
  async function remove(id: string) {
    await api.deleteAlertRule(id);
    load();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </Link>

      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Bell className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Alerts</h1>
        </div>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Get an email when your conditions are met — a macro indicator crossing a level, a price
          breaking its moving average, a volume spike, or any combination. Evaluated on daily closes.
        </p>
      </div>

      {authLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>
      ) : !user ? (
        <div className="rounded-xl border border-emerald-500/30 bg-white dark:bg-zinc-900 px-6 py-12 text-center">
          <Lock className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">Alerts are a free account feature</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
            Create a free account to set up email alerts on macro and price conditions.
          </p>
          <Link href="/auth?returnTo=/alerts" className="mt-5 inline-block rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white hover:bg-emerald-500">
            Create free account
          </Link>
        </div>
      ) : (
        <>
          {/* Existing rules */}
          {loaded && rules.length > 0 && (
            <section className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-white">{rule.name}</div>
                      <div className="mt-0.5 text-sm text-zinc-500">{rule.summary}</div>
                      {rule.lastTriggeredAt && (
                        <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                          Last triggered {new Date(rule.lastTriggeredAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggle(rule)}
                        className={`rounded-md border px-2 py-0.5 text-xs font-medium ${
                          rule.enabled
                            ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-400"
                            : "border-zinc-300 dark:border-zinc-700 text-zinc-500"
                        }`}
                      >
                        {rule.enabled ? "On" : "Off"}
                      </button>
                      <button type="button" onClick={() => remove(rule.id)} aria-label="Delete alert" className="text-zinc-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Create form */}
          <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">New alert</h2>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alert name (e.g. Risk-off setup)"
              className={`${inputCls} mt-3 w-full`}
            />

            <p className="mt-4 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Notify me when ALL of these are true
              <InfoTip align="left">
                Conditions are combined with AND. The alert emails you once when they first all hold,
                and re-arms after they stop — so you get the crossing, not a message every few hours.
              </InfoTip>
            </p>

            <div className="mt-2 space-y-2">
              {conditions.map((c, i) => (
                <ConditionEditor
                  key={i}
                  c={c}
                  onChange={(patch) => setCondition(i, patch)}
                  onRetype={(type) => setConditions((cs) => cs.map((x, j) => (j === i ? newCondition(type) : x)))}
                  onRemove={conditions.length > 1 ? () => setConditions((cs) => cs.filter((_, j) => j !== i)) : undefined}
                />
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setConditions((cs) => [...cs, newCondition()])}
                disabled={conditions.length >= 5}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                Add condition
              </button>
              <button
                type="button"
                onClick={create}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                Create alert
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
          </section>
        </>
      )}
    </div>
  );
}

function ConditionEditor({
  c,
  onChange,
  onRetype,
  onRemove,
}: {
  c: AlertConditionDto;
  onChange: (patch: Partial<AlertConditionDto>) => void;
  onRetype: (type: string) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-2.5">
      <select value={c.type} onChange={(e) => onRetype(e.target.value)} className={inputCls}>
        {Object.entries(TYPE_LABEL).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>

      {c.type === "MacroIndicator" ? (
        <select value={c.subject} onChange={(e) => onChange({ subject: e.target.value })} className={`${inputCls} min-w-40`}>
          {INDICATORS.map((ind) => (
            <option key={ind.key} value={ind.key}>{ind.name}</option>
          ))}
        </select>
      ) : (
        <input
          value={c.subject}
          onChange={(e) => onChange({ subject: e.target.value.toUpperCase() })}
          placeholder="Ticker"
          className={`${inputCls} w-28 uppercase placeholder:normal-case`}
        />
      )}

      <select value={c.operator} onChange={(e) => onChange({ operator: e.target.value })} className={inputCls}>
        <option value="Above">is above</option>
        <option value="Below">is below</option>
      </select>

      {c.type === "MovingAverage" ? (
        <span className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
          its
          <input
            type="number"
            value={c.param}
            onChange={(e) => onChange({ param: Number(e.target.value) })}
            className={`${inputCls} w-16 tabular-nums`}
          />
          -day average
        </span>
      ) : c.type === "VolumeSpike" ? (
        <span className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
          <input
            type="number"
            value={c.threshold}
            onChange={(e) => onChange({ threshold: Number(e.target.value) })}
            className={`${inputCls} w-16 tabular-nums`}
          />
          × its
          <input
            type="number"
            value={c.param}
            onChange={(e) => onChange({ param: Number(e.target.value) })}
            className={`${inputCls} w-16 tabular-nums`}
          />
          -day avg volume
        </span>
      ) : (
        <input
          type="number"
          value={c.threshold}
          onChange={(e) => onChange({ threshold: Number(e.target.value) })}
          placeholder={c.type === "AssetPrice" ? "Price" : "Value"}
          className={`${inputCls} w-24 tabular-nums`}
        />
      )}

      {onRemove && (
        <button type="button" onClick={onRemove} aria-label="Remove condition" className="ml-auto text-zinc-400 hover:text-red-500">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
