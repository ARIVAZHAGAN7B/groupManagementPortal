import { useEffect, useMemo, useState } from "react";
import IncubationConfigurationHero from "../components/incubation/IncubationConfigurationHero";
import IncubationConfigurationPolicySection from "../components/incubation/IncubationConfigurationPolicySection";
import IncubationConfigurationToggleCard from "../components/incubation/IncubationConfigurationToggleCard";
import { inputClass } from "../components/groups/groupManagement.constants";
import {
  fetchOperationalPolicy,
  updateOperationalPolicy
} from "../../service/systemConfig.api";

const DEFAULT_FORM = {
  incubation_duration_days: 1,
  enforce_change_day_for_leave: true,
  min_group_members: 9,
  max_group_members: 11,
  allow_student_group_creation: false,
  require_leadership_for_activation: true
};

const toBool = (value) => Boolean(value);

const normalizePolicyForm = (data) => ({
  incubation_duration_days: Number(data?.incubation_duration_days ?? DEFAULT_FORM.incubation_duration_days),
  enforce_change_day_for_leave: toBool(data?.enforce_change_day_for_leave),
  min_group_members: Number(data?.min_group_members ?? DEFAULT_FORM.min_group_members),
  max_group_members: Number(data?.max_group_members ?? DEFAULT_FORM.max_group_members),
  allow_student_group_creation: toBool(data?.allow_student_group_creation),
  require_leadership_for_activation: toBool(data?.require_leadership_for_activation)
});

function StatusBanner({ message, tone }) {
  const toneClass =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClass}`}>
      {message}
    </div>
  );
}

function NumberField({ label, max, min, onChange, value }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-900">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        className={inputClass}
        value={value}
        onChange={onChange}
      />
    </label>
  );
}

export default function IncubationConfiguration() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [lastSavedForm, setLastSavedForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async ({ background = false, preserveSuccess = false } = {}) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");
    if (!preserveSuccess) {
      setSuccess("");
    }

    try {
      const data = await fetchOperationalPolicy();
      const nextForm = normalizePolicyForm(data);
      setForm(nextForm);
      setLastSavedForm(nextForm);
      return true;
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load configuration");
      return false;
    } finally {
      if (background) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    load();
  }, []);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(lastSavedForm),
    [form, lastSavedForm]
  );

  const canSave = useMemo(() => {
    const min = Number(form.min_group_members);
    const max = Number(form.max_group_members);
    const incubation = Number(form.incubation_duration_days);
    return (
      Number.isInteger(min) &&
      Number.isInteger(max) &&
      Number.isInteger(incubation) &&
      min >= 1 &&
      max >= min &&
      incubation >= 0 &&
      incubation <= 30
    );
  }, [form]);

  const stats = useMemo(() => {
    const enabledPolicyCount = [
      form.enforce_change_day_for_leave,
      form.allow_student_group_creation,
      form.require_leadership_for_activation
    ].filter(Boolean).length;

    return {
      incubationDays: Number(form.incubation_duration_days) || 0,
      minMembers: Number(form.min_group_members) || 0,
      maxMembers: Number(form.max_group_members) || 0,
      memberWindowLabel: `${Number(form.min_group_members) || 0}-${Number(form.max_group_members) || 0}`,
      enabledPolicyCount,
      totalPolicyCount: 3,
      changeDayRule: Boolean(form.enforce_change_day_for_leave),
      allowStudentCreation: Boolean(form.allow_student_group_creation),
      requireLeadership: Boolean(form.require_leadership_for_activation)
    };
  }, [form]);

  const savePolicy = async () => {
    if (!canSave) {
      setError("Please enter valid policy values.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        incubation_duration_days: Number(form.incubation_duration_days),
        enforce_change_day_for_leave: Boolean(form.enforce_change_day_for_leave),
        min_group_members: Number(form.min_group_members),
        max_group_members: Number(form.max_group_members),
        allow_student_group_creation: Boolean(form.allow_student_group_creation),
        require_leadership_for_activation: Boolean(form.require_leadership_for_activation)
      };
      await updateOperationalPolicy(payload);
      const refreshed = await load({ background: true, preserveSuccess: true });
      setSuccess(refreshed ? "Operational policy updated and refreshed." : "Operational policy updated.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    await savePolicy();
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6">
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-500 shadow-sm">
          Loading incubation configuration...
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-4 px-4 py-5 font-[Inter] text-slate-900 md:px-6">
      <div>
        <IncubationConfigurationHero
          canSave={canSave}
          dirty={isDirty}
          loading={refreshing}
          onRefresh={() => load({ background: true })}
          onSave={savePolicy}
          saving={saving}
          stats={stats}
        />
      </div>

      {error ? <StatusBanner tone="error" message={error} /> : null}
      {success ? <StatusBanner tone="success" message={success} /> : null}

      <form onSubmit={onSubmit} className="grid gap-4 xl:grid-cols-[1fr,1fr]">
          <IncubationConfigurationPolicySection
            eyebrow="Switching Rules"
            title="Incubation and change-day policy"
          >
            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                <NumberField
                  label="Incubation Duration (days)"
                  max={30}
                  min={0}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, incubation_duration_days: Number(e.target.value) }))
                  }
                  value={form.incubation_duration_days}
                />
              </div>

              <IncubationConfigurationToggleCard
                checked={form.enforce_change_day_for_leave}
                label="Enforce Change Day for Leave"
                onChange={(e) =>
                  setForm((p) => ({ ...p, enforce_change_day_for_leave: e.target.checked }))
                }
              />
            </div>
          </IncubationConfigurationPolicySection>

          <IncubationConfigurationPolicySection
            eyebrow="Activation Rules"
            title="Group activation and vacancy policy"
          >
            <div className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <NumberField
                    label="Minimum Active Members"
                    max={200}
                    min={1}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, min_group_members: Number(e.target.value) }))
                    }
                    value={form.min_group_members}
                  />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <NumberField
                    label="Maximum Active Members"
                    max={200}
                    min={1}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, max_group_members: Number(e.target.value) }))
                    }
                    value={form.max_group_members}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <IncubationConfigurationToggleCard
                  checked={form.require_leadership_for_activation}
                  label="Require 4 leadership roles before activation"
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      require_leadership_for_activation: e.target.checked
                    }))
                  }
                />

                <IncubationConfigurationToggleCard
                  checked={form.allow_student_group_creation}
                  label="Allow Student Group Creation"
                  onChange={(e) =>
                    setForm((p) => ({ ...p, allow_student_group_creation: e.target.checked }))
                  }
                />
              </div>
            </div>
          </IncubationConfigurationPolicySection>

          <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Status</p>
              <p
                className={`mt-1 text-xs font-medium ${
                  !canSave ? "text-red-600" : isDirty ? "text-amber-600" : "text-slate-500"
                }`}
              >
                {!canSave
                  ? "Enter valid values to save."
                  : isDirty
                    ? "Unsaved changes"
                    : "No pending changes"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => load({ background: true, preserveSuccess: true })}
                disabled={refreshing || saving}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
              >
                {refreshing ? "Refreshing..." : "Reload Values"}
              </button>

              <button
                type="submit"
                disabled={saving || !canSave || !isDirty}
                className="rounded-lg bg-[#1754cf] px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#1754cf]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                {saving ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </section>
      </form>
    </section>
  );
}
