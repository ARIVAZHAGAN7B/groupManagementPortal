import { useEffect, useMemo, useState } from "react";
import {
  createPhase,
  fetchCurrentPhase,
  fetchPhaseTargets,
  setPhaseTargets
} from "../../service/phase.api";

const TIERS = ["D", "C", "B", "A"];

const defaultTargets = () =>
  TIERS.map((tier) => ({
    tier,
    group_target: ""
  }));

const pad2 = (value) => String(value).padStart(2, "0");

const addDaysToDateInput = (value, days) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return "";

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return "";

  date.setDate(date.getDate() + Number(days || 0));
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

export default function PhaseConfiguration() {
  const [phase, setPhase] = useState(null);
  const [targets, setTargets] = useState(defaultTargets());
  const [individualTarget, setIndividualTarget] = useState("");
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    phase_name: "",
    start_date: "",
    end_date: "",
    change_day_number: 5,
    start_time: "08:00",
    end_time: "19:00"
  });

  const loadCurrentPhase = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchCurrentPhase();
      setPhase(data || null);
      if (data?.phase_id) {
        const t = await fetchPhaseTargets(data.phase_id);
        const rows = Array.isArray(t?.targets) ? t.targets : [];

        setTargets(
          TIERS.map((tier) => {
            const row = rows.find((x) => String(x.tier).toUpperCase() === tier);
            return {
              tier,
              group_target: row?.group_target ?? ""
            };
          })
        );

        setIndividualTarget(
          t?.individual_target === null || t?.individual_target === undefined
            ? ""
            : String(t.individual_target)
        );
      } else {
        setTargets(defaultTargets());
        setIndividualTarget("");
      }
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to load phase configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentPhase();
  }, []);

  const canCreate = useMemo(() => {
    const hasPhaseName = String(form.phase_name || "").trim().length > 0;
    const parsedChangeDayNumber = Number(form.change_day_number);
    const hasValidDateInputs =
      form.start_date &&
      Number.isInteger(parsedChangeDayNumber) &&
      parsedChangeDayNumber > 0 &&
      (!form.end_date || String(form.end_date) > String(form.start_date));

    const hasValidTargets = targets.every((t) => {
      const group = Number(t.group_target);
      return Number.isFinite(group) && group >= 0;
    });

    const parsedIndividual = Number(individualTarget);
    const hasValidIndividual =
      Number.isFinite(parsedIndividual) && parsedIndividual >= 0;

    return hasPhaseName && hasValidDateInputs && hasValidTargets && hasValidIndividual;
  }, [form, targets, individualTarget]);

  const onCreatePhase = async (e) => {
    e.preventDefault();
    if (!canCreate) return;

    setCreateLoading(true);
    setError("");
    setSuccess("");
    try {
      const normalizedTargets = targets.map((t) => ({
        tier: t.tier,
        group_target: Number(t.group_target)
      }));
      const parsedIndividualTarget = Number(individualTarget);

      if (
        normalizedTargets.some(
          (x) => !Number.isFinite(x.group_target) || x.group_target < 0
        ) ||
        !Number.isFinite(parsedIndividualTarget) ||
        parsedIndividualTarget < 0
      ) {
        setError("Enter valid group targets and individual target before creating a phase.");
        return;
      }

      const payload = {
        phase_name: String(form.phase_name || "").trim(),
        start_date: form.start_date,
        change_day_number: Number(form.change_day_number),
        start_time: form.start_time,
        end_time: form.end_time,
        targets: normalizedTargets,
        individual_target: parsedIndividualTarget
      };
      if (form.end_date) {
        payload.end_date = form.end_date;
      }
      const res = await createPhase(payload);
      setPhase(res?.phase || null);
      await loadCurrentPhase();
      setSuccess("Phase created successfully.");
    } catch (e2) {
      setError(e2?.response?.data?.error || "Failed to create phase");
    } finally {
      setCreateLoading(false);
    }
  };

  const onTargetChange = (tier, value) => {
    setTargets((prev) =>
      prev.map((row) =>
        row.tier === tier
          ? {
              ...row,
              group_target: value
            }
          : row
      )
    );
  };

  const onSaveTargets = async () => {
    if (!phase?.phase_id) {
      setError("Create or load a phase first.");
      return;
    }

    setTargetsLoading(true);
    setError("");
    setSuccess("");
    try {
      const payload = targets.map((t) => ({
        tier: t.tier,
        group_target: Number(t.group_target)
      }));
      const parsedIndividualTarget = Number(individualTarget);

      if (
        payload.some((x) => Number.isNaN(x.group_target) || x.group_target < 0) ||
        Number.isNaN(parsedIndividualTarget) ||
        parsedIndividualTarget < 0
      ) {
        setError("All group targets and individual target must be valid numbers.");
        return;
      }

      await setPhaseTargets(phase.phase_id, payload, parsedIndividualTarget);
      setSuccess("Targets saved successfully.");
      await loadCurrentPhase();
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to save targets");
    } finally {
      setTargetsLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 border rounded">Loading phase configuration...</div>;
  }

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition";

  return (
    <div className="p-6 max-w-6xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-900">Phase Configuration</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Create new phases and configure eligibility targets for each tier.
          </p>
        </div>
        <button
          onClick={loadCurrentPhase}
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors w-fit"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="px-4 py-2.5 rounded-lg border border-green-200 bg-green-50 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <section className="rounded-xl border border-gray-100 bg-white p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Create Phase</h2>
          <p className="text-xs text-gray-500 mt-1">
            Enter schedule values. If end date is not set, total working days defaults to 10.
          </p>
        </div>

        <form onSubmit={onCreatePhase} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <label className="text-sm">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Phase Name
            </div>
            <input
              type="text"
              value={form.phase_name}
              onChange={(e) => setForm((p) => ({ ...p, phase_name: e.target.value }))}
              className={inputClass}
              placeholder="e.g. Phase 1"
            />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Start Date
            </div>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
              className={inputClass}
            />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              End Date (Optional)
            </div>
            <input
              type="date"
              value={form.end_date}
              min={addDaysToDateInput(form.start_date, 1) || undefined}
              onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
              className={inputClass}
            />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Change Day Number
            </div>
            <input
              type="number"
              min={1}
              value={form.change_day_number}
              onChange={(e) => setForm((p) => ({ ...p, change_day_number: e.target.value }))}
              className={inputClass}
            />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Start Time
            </div>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
              className={inputClass}
            />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              End Time
            </div>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
              className={inputClass}
            />
          </label>

          <div className="xl:col-span-3 md:col-span-2 flex justify-end pt-1">
            <button
              type="submit"
              disabled={!canCreate || createLoading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {createLoading ? "Creating..." : "Create Phase"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Set Targets</h2>
            <p className="text-xs text-gray-500 mt-1">Update active-phase group and individual targets.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {targets.map((row) => (
            <label key={row.tier} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Tier {row.tier}
              </div>
              <input
                type="number"
                min={0}
                value={row.group_target}
                onChange={(e) => onTargetChange(row.tier, e.target.value)}
                className={`${inputClass} mt-2`}
                placeholder="Group target"
              />
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,320px)_auto] gap-3 items-end">
          <label className="text-sm">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Individual Target (All Students)
            </div>
            <input
              type="number"
              min={0}
              value={individualTarget}
              onChange={(e) => setIndividualTarget(e.target.value)}
              className={inputClass}
              placeholder="Individual target"
            />
          </label>

          <button
            onClick={onSaveTargets}
            disabled={!phase?.phase_id || targetsLoading}
            className="w-fit px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {targetsLoading ? "Saving..." : "Save Targets"}
          </button>
        </div>
      </section>
    </div>
  );
}
