import { useEffect, useMemo, useState } from "react";
import {
  fetchOperationalPolicy,
  updateOperationalPolicy
} from "../../service/systemConfig.api";

const toBool = (value) => Boolean(value);

export default function IncubationConfiguration() {
  const [form, setForm] = useState({
    incubation_duration_days: 1,
    enforce_change_day_for_leave: true,
    min_group_members: 9,
    max_group_members: 11,
    allow_student_group_creation: false,
    require_leadership_for_activation: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const data = await fetchOperationalPolicy();
      setForm({
        incubation_duration_days: Number(data?.incubation_duration_days ?? 1),
        enforce_change_day_for_leave: toBool(data?.enforce_change_day_for_leave),
        min_group_members: Number(data?.min_group_members ?? 9),
        max_group_members: Number(data?.max_group_members ?? 11),
        allow_student_group_creation: toBool(data?.allow_student_group_creation),
        require_leadership_for_activation: toBool(data?.require_leadership_for_activation)
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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

  const onSubmit = async (e) => {
    e.preventDefault();
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
      const res = await updateOperationalPolicy(payload);
      const data = res?.data || payload;
      setForm({
        incubation_duration_days: Number(data.incubation_duration_days),
        enforce_change_day_for_leave: Boolean(data.enforce_change_day_for_leave),
        min_group_members: Number(data.min_group_members),
        max_group_members: Number(data.max_group_members),
        allow_student_group_creation: Boolean(data.allow_student_group_creation),
        require_leadership_for_activation: Boolean(data.require_leadership_for_activation)
      });
      setSuccess("Operational policy updated.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4 rounded border">Loading incubation configuration...</div>;
  }

  return (
    <div className="p-6 max-w-4xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Incubation & Group Policy</h1>
          <p className="text-sm text-gray-600">
            Configure incubation duration and core SRS group policy rules used by backend logic.
          </p>
        </div>
        <button onClick={load} className="px-3 py-2 rounded border">
          Refresh
        </button>
      </div>

      {error ? (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700">{error}</div>
      ) : null}
      {success ? (
        <div className="p-3 rounded border border-green-300 bg-green-50 text-green-700">{success}</div>
      ) : null}

      <form onSubmit={onSubmit} className="rounded border bg-white p-5 space-y-6">
        <section className="space-y-3">
          <h2 className="font-semibold">Switching & Incubation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm">
              <div className="mb-1">Incubation Duration (days)</div>
              <input
                type="number"
                min={0}
                max={30}
                className="w-full border rounded px-3 py-2"
                value={form.incubation_duration_days}
                onChange={(e) =>
                  setForm((p) => ({ ...p, incubation_duration_days: Number(e.target.value) }))
                }
              />
              <div className="mt-1 text-xs text-gray-500">
                Stored on switched memberships as `incubation_end_date`.
              </div>
            </label>

            <label className="text-sm flex items-center gap-3 rounded border p-3">
              <input
                type="checkbox"
                checked={form.enforce_change_day_for_leave}
                onChange={(e) =>
                  setForm((p) => ({ ...p, enforce_change_day_for_leave: e.target.checked }))
                }
              />
              <div>
                <div className="font-medium">Enforce Change Day for Leave</div>
                <div className="text-xs text-gray-500">
                  Student leave/switch operations will be blocked unless it is the phase change day.
                </div>
              </div>
            </label>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Group Activation & Vacancy Policy</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm">
              <div className="mb-1">Minimum Active Members</div>
              <input
                type="number"
                min={1}
                max={200}
                className="w-full border rounded px-3 py-2"
                value={form.min_group_members}
                onChange={(e) =>
                  setForm((p) => ({ ...p, min_group_members: Number(e.target.value) }))
                }
              />
            </label>
            <label className="text-sm">
              <div className="mb-1">Maximum Active Members</div>
              <input
                type="number"
                min={1}
                max={200}
                className="w-full border rounded px-3 py-2"
                value={form.max_group_members}
                onChange={(e) =>
                  setForm((p) => ({ ...p, max_group_members: Number(e.target.value) }))
                }
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm flex items-center gap-3 rounded border p-3">
              <input
                type="checkbox"
                checked={form.require_leadership_for_activation}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    require_leadership_for_activation: e.target.checked
                  }))
                }
              />
              <div>
                <div className="font-medium">Require 4 leadership roles before activation</div>
                <div className="text-xs text-gray-500">
                  CAPTAIN, VICE_CAPTAIN, STRATEGIST and MANAGER must be filled unless admin override is used.
                </div>
              </div>
            </label>

            <label className="text-sm flex items-center gap-3 rounded border p-3">
              <input
                type="checkbox"
                checked={form.allow_student_group_creation}
                onChange={(e) =>
                  setForm((p) => ({ ...p, allow_student_group_creation: e.target.checked }))
                }
              />
              <div>
                <div className="font-medium">Allow Student Group Creation</div>
                <div className="text-xs text-gray-500">
                  Enables student users to create groups through the existing group creation endpoint.
                </div>
              </div>
            </label>
          </div>
        </section>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={saving || !canSave}
            className="px-4 py-2 rounded bg-blue-600 text-white font-medium disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Configuration"}
          </button>
          {!canSave ? (
            <div className="text-sm text-red-600">
              Check min/max members and incubation duration values.
            </div>
          ) : null}
        </div>
      </form>
    </div>
  );
}
