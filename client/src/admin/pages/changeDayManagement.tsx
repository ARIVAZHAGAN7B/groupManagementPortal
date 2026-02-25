import { useEffect, useMemo, useState } from "react";
import { checkPhaseChangeDay, fetchAllPhases, fetchCurrentPhase } from "../../service/phase.api";

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
};

export default function ChangeDayManagement() {
  const [phases, setPhases] = useState([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState("");
  const [currentPhase, setCurrentPhase] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const selectedPhase = useMemo(
    () => phases.find((p) => String(p.phase_id) === String(selectedPhaseId)) || null,
    [phases, selectedPhaseId]
  );

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [allPhases, active] = await Promise.all([fetchAllPhases(), fetchCurrentPhase()]);
      const rows = Array.isArray(allPhases) ? allPhases : [];
      setPhases(rows);
      setCurrentPhase(active || null);

      const preferredId =
        active?.phase_id && rows.some((p) => String(p.phase_id) === String(active.phase_id))
          ? String(active.phase_id)
          : rows[0]?.phase_id
            ? String(rows[0].phase_id)
            : "";

      setSelectedPhaseId((prev) => prev || preferredId);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load phases");
      setPhases([]);
      setCurrentPhase(null);
      setSelectedPhaseId("");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const runCheck = async (phaseId) => {
    if (!phaseId) {
      setResult(null);
      return;
    }
    setChecking(true);
    setError("");
    try {
      const data = await checkPhaseChangeDay(phaseId);
      setResult(data || null);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to check change day");
      setResult(null);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selectedPhaseId) return;
    void runCheck(selectedPhaseId);
  }, [selectedPhaseId]);

  if (loading) {
    return <div className="p-4 rounded border">Loading change-day management...</div>;
  }

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Change Day Management</h1>
          <p className="text-sm text-gray-600">
            Monitor phase change-day windows used to enforce leave/switch rules.
          </p>
        </div>
        <button onClick={load} className="px-3 py-2 rounded border">
          Refresh
        </button>
      </div>

      {error ? (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded border bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500">Current Phase</div>
          <div className="mt-1 font-medium break-all">
            {currentPhase?.phase_name || currentPhase?.phase_id || "No active phase"}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Change Day: {formatDate(currentPhase?.change_day)}
          </div>
          <div className="text-sm text-gray-600">Start: {formatDate(currentPhase?.start_date)}</div>
          <div className="text-sm text-gray-600">End: {formatDate(currentPhase?.end_date)}</div>
        </div>

        <div className="rounded border bg-white p-4 md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
            <label className="text-sm">
              <div className="mb-1">Select Phase</div>
              <select
                value={selectedPhaseId}
                onChange={(e) => setSelectedPhaseId(e.target.value)}
                className="w-full border rounded px-3 py-2 bg-white"
              >
                {phases.map((phase) => (
                  <option key={phase.phase_id} value={String(phase.phase_id)}>
                    {phase.phase_name || phase.phase_id} ({String(phase.status || "").toUpperCase()})
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => runCheck(selectedPhaseId)}
              disabled={checking || !selectedPhaseId}
              className="px-4 py-2 rounded border disabled:opacity-60"
            >
              {checking ? "Checking..." : "Check Change Day"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded border p-3 bg-gray-50">
              <div className="text-xs text-gray-500">Selected Phase</div>
              <div className="font-medium break-all">
                {selectedPhase?.phase_name || selectedPhase?.phase_id || "-"}
              </div>
            </div>
            <div className="rounded border p-3 bg-gray-50">
              <div className="text-xs text-gray-500">Configured Change Day</div>
              <div className="font-medium">{formatDate(result?.change_day || selectedPhase?.change_day)}</div>
            </div>
            <div
              className={`rounded border p-3 ${
                result?.isChangeDay ? "bg-green-50 border-green-200" : "bg-gray-50"
              }`}
            >
              <div className="text-xs text-gray-500">Today Is Change Day?</div>
              <div className={`font-semibold ${result?.isChangeDay ? "text-green-700" : "text-gray-700"}`}>
                {result?.isChangeDay === true ? "Yes" : result?.isChangeDay === false ? "No" : "-"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded border bg-white overflow-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 border-b text-left">Phase</th>
              <th className="p-3 border-b text-left">Status</th>
              <th className="p-3 border-b text-left">Start</th>
              <th className="p-3 border-b text-left">Change Day</th>
              <th className="p-3 border-b text-left">End</th>
              <th className="p-3 border-b text-left">Working Days</th>
              <th className="p-3 border-b text-left">Change Day #</th>
            </tr>
          </thead>
          <tbody>
            {phases.map((phase) => (
              <tr key={phase.phase_id} className="hover:bg-gray-50">
                <td className="p-3 border-b">{phase.phase_name || phase.phase_id}</td>
                <td className="p-3 border-b">{String(phase.status || "").toUpperCase() || "-"}</td>
                <td className="p-3 border-b">{formatDate(phase.start_date)}</td>
                <td className="p-3 border-b">{formatDate(phase.change_day)}</td>
                <td className="p-3 border-b">{formatDate(phase.end_date)}</td>
                <td className="p-3 border-b">{phase.total_working_days ?? "-"}</td>
                <td className="p-3 border-b">{phase.change_day_number ?? "-"}</td>
              </tr>
            ))}

            {phases.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  No phases found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
