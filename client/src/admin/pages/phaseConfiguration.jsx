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

const toInputDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
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
    start_date: "",
    total_working_days: 10,
    change_day_number: 5
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
    const hasValidDateInputs =
      form.start_date &&
      Number(form.total_working_days) > 1 &&
      Number(form.change_day_number) > 0 &&
      Number(form.change_day_number) < Number(form.total_working_days);

    const hasValidTargets = targets.every((t) => {
      const group = Number(t.group_target);
      return Number.isFinite(group) && group >= 0;
    });

    const parsedIndividual = Number(individualTarget);
    const hasValidIndividual =
      Number.isFinite(parsedIndividual) && parsedIndividual >= 0;

    return hasValidDateInputs && hasValidTargets && hasValidIndividual;
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
        start_date: form.start_date,
        total_working_days: Number(form.total_working_days),
        change_day_number: Number(form.change_day_number),
        targets: normalizedTargets,
        individual_target: parsedIndividualTarget
      };
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Phase Configuration</h1>
        <button onClick={loadCurrentPhase} className="px-3 py-2 rounded border">
          Refresh
        </button>
      </div>

      {error ? (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700">{error}</div>
      ) : null}

      {success ? (
        <div className="p-3 rounded border border-green-300 bg-green-50 text-green-700">{success}</div>
      ) : null}

      <section className="p-4 rounded border space-y-3">
        <h2 className="font-semibold">Current Active Phase</h2>
        {phase ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
            <div className="p-3 rounded bg-gray-50 border">
              <div className="text-gray-500">Phase ID</div>
              <div className="font-medium break-all">{phase.phase_id}</div>
            </div>
            <div className="p-3 rounded bg-gray-50 border">
              <div className="text-gray-500">Start Date</div>
              <div className="font-medium">{toInputDate(phase.start_date)}</div>
            </div>
            <div className="p-3 rounded bg-gray-50 border">
              <div className="text-gray-500">Change Day</div>
              <div className="font-medium">{toInputDate(phase.change_day)}</div>
            </div>
            <div className="p-3 rounded bg-gray-50 border">
              <div className="text-gray-500">End Date</div>
              <div className="font-medium">{toInputDate(phase.end_date)}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600">No active phase found.</div>
        )}
      </section>

      <section className="p-4 rounded border space-y-3">
        <h2 className="font-semibold">Create New Phase</h2>
        <form onSubmit={onCreatePhase} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="text-sm">
            <div className="mb-1">Start Date</div>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
          </label>

          <label className="text-sm">
            <div className="mb-1">Total Working Days</div>
            <input
              type="number"
              min={2}
              value={form.total_working_days}
              onChange={(e) => setForm((p) => ({ ...p, total_working_days: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
          </label>

          <label className="text-sm">
            <div className="mb-1">Change Day Number</div>
            <input
              type="number"
              min={1}
              value={form.change_day_number}
              onChange={(e) => setForm((p) => ({ ...p, change_day_number: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={!canCreate || createLoading}
              className="w-full px-3 py-2 rounded border disabled:opacity-60"
            >
              {createLoading ? "Creating..." : "Create Phase"}
            </button>
          </div>
        </form>
      </section>

      <section className="p-4 rounded border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Tier Targets</h2>
          <button
            onClick={onSaveTargets}
            disabled={!phase?.phase_id || targetsLoading}
            className="px-3 py-2 rounded border disabled:opacity-60"
          >
            {targetsLoading ? "Saving..." : "Save Targets"}
          </button>
        </div>

        <div className="overflow-auto border rounded">
          <table className="min-w-[560px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 border-b">Tier</th>
                <th className="text-left p-3 border-b">Group Target</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((row) => (
                <tr key={row.tier}>
                  <td className="p-3 border-b font-medium">{row.tier}</td>
                  <td className="p-3 border-b">
                    <input
                      type="number"
                      min={0}
                      value={row.group_target}
                      onChange={(e) => onTargetChange(row.tier, e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="max-w-sm">
          <label className="text-sm">
            <div className="mb-1 font-medium">Individual Target (Same for All Students)</div>
            <input
              type="number"
              min={0}
              value={individualTarget}
              onChange={(e) => setIndividualTarget(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </label>
        </div>
      </section>
    </div>
  );
}
