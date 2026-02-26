import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminGroupEligibility,
  fetchAdminIndividualEligibility,
  overrideGroupEligibility,
  overrideIndividualEligibility
} from "../../service/eligibility.api";
import { fetchAllPhases } from "../../service/phase.api";

const TABS = [
  { key: "individual", label: "Students" },
  { key: "group", label: "Groups" }
];

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const formatEligible = (value) => {
  if (value === null || value === undefined) return "Not available";
  return value ? "Yes" : "No";
};

const getPhaseLabel = (phase) => phase?.phase_name || phase?.phase_id || "-";

export default function EligibilityManagement() {
  const [activeTab, setActiveTab] = useState("individual");
  const [phases, setPhases] = useState([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState("");
  const [individualRows, setIndividualRows] = useState([]);
  const [groupRows, setGroupRows] = useState([]);
  const [loadingPhases, setLoadingPhases] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState("");
  const [overrideBusyKey, setOverrideBusyKey] = useState("");

  const selectedPhase = useMemo(
    () => phases.find((phase) => String(phase.phase_id) === String(selectedPhaseId)) || null,
    [phases, selectedPhaseId]
  );

  const loadPhases = async () => {
    setLoadingPhases(true);
    setError("");
    try {
      const rows = await fetchAllPhases();
      const normalized = Array.isArray(rows) ? rows : [];
      setPhases(normalized);

      if (normalized.length === 0) {
        setSelectedPhaseId("");
        setIndividualRows([]);
        setGroupRows([]);
        return;
      }

      setSelectedPhaseId((prev) => {
        if (prev && normalized.some((row) => String(row.phase_id) === String(prev))) {
          return prev;
        }
        const active = normalized.find(
          (row) => String(row.status || "").toUpperCase() === "ACTIVE"
        );
        return String((active || normalized[0]).phase_id);
      });
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load phases");
      setPhases([]);
      setSelectedPhaseId("");
      setIndividualRows([]);
      setGroupRows([]);
    } finally {
      setLoadingPhases(false);
    }
  };

  const loadEligibility = async (phaseId) => {
    if (!phaseId) {
      setIndividualRows([]);
      setGroupRows([]);
      return;
    }

    setLoadingRows(true);
    setError("");
    try {
      const [individual, groups] = await Promise.all([
        fetchAdminIndividualEligibility(phaseId),
        fetchAdminGroupEligibility(phaseId)
      ]);

      setIndividualRows(Array.isArray(individual) ? individual : []);
      setGroupRows(Array.isArray(groups) ? groups : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load eligibility data");
      setIndividualRows([]);
      setGroupRows([]);
    } finally {
      setLoadingRows(false);
    }
  };

  useEffect(() => {
    loadPhases();
  }, []);

  useEffect(() => {
    if (!selectedPhaseId) return;
    loadEligibility(selectedPhaseId);
  }, [selectedPhaseId]);

  const visibleRows = activeTab === "individual" ? individualRows : groupRows;
  const eligibleCount = useMemo(
    () => visibleRows.filter((row) => row?.is_eligible === true || row?.is_eligible === 1).length,
    [visibleRows]
  );

  const onOverride = async (type, row, isEligible) => {
    if (!selectedPhaseId) return;

    const defaultReason = isEligible
      ? type === "individual"
        ? "ADMIN_OVERRIDE_ELIGIBLE"
        : "ADMIN_OVERRIDE_GROUP_ELIGIBLE"
      : type === "individual"
        ? "ADMIN_OVERRIDE_NOT_ELIGIBLE"
        : "ADMIN_OVERRIDE_GROUP_NOT_ELIGIBLE";

    const input = window.prompt(
      "Enter override reason code (3-50 chars).",
      defaultReason
    );
    if (input === null) return;

    const reason_code = String(input || "").trim();
    if (reason_code.length < 3) {
      setError("Override reason code must be at least 3 characters.");
      return;
    }

    const targetId = type === "individual" ? row.student_id : row.group_id;
    const busyKey = `${type}:${selectedPhaseId}:${targetId}`;

    setOverrideBusyKey(busyKey);
    setError("");
    try {
      if (type === "individual") {
        await overrideIndividualEligibility(selectedPhaseId, row.student_id, {
          is_eligible: isEligible,
          reason_code
        });
      } else {
        await overrideGroupEligibility(selectedPhaseId, row.group_id, {
          is_eligible: isEligible,
          reason_code
        });
      }

      await loadEligibility(selectedPhaseId);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to override eligibility");
    } finally {
      setOverrideBusyKey("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Eligibility</h1>
          <p className="text-sm text-gray-600">
            View evaluated student and group eligibility by phase.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadPhases}
            className="px-3 py-2 rounded border"
            disabled={loadingPhases}
          >
            {loadingPhases ? "Loading..." : "Refresh Phases"}
          </button>
          <button
            type="button"
            onClick={() => loadEligibility(selectedPhaseId)}
            className="px-3 py-2 rounded border"
            disabled={!selectedPhaseId || loadingRows}
          >
            {loadingRows ? "Loading..." : "Refresh Data"}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="w-full md:max-w-md">
          <label className="block text-sm font-medium mb-1">Phase</label>
          <select
            className="w-full border rounded px-3 py-2 bg-white"
            value={selectedPhaseId}
            onChange={(e) => setSelectedPhaseId(e.target.value)}
            disabled={loadingPhases || phases.length === 0}
          >
            {phases.length === 0 ? <option value="">No phases available</option> : null}
            {phases.map((phase) => (
              <option key={phase.phase_id} value={phase.phase_id}>
                {getPhaseLabel(phase)} | {formatDate(phase.start_date)} - {formatDate(phase.end_date)} |{" "}
                {phase.status}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-600">
          {selectedPhase ? (
            <div className="rounded border bg-gray-50 px-3 py-2">
              <span className="font-semibold text-gray-800 mr-2">Selected Phase:</span>
              {getPhaseLabel(selectedPhase)} ({formatDate(selectedPhase.start_date)} -{" "}
              {formatDate(selectedPhase.end_date)}) | Status: {selectedPhase.status}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded border bg-gray-50">
          <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">
            Students
          </div>
          <div className="text-lg font-semibold">{individualRows.length}</div>
        </div>
        <div className="p-3 rounded border bg-gray-50">
          <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">
            Groups
          </div>
          <div className="text-lg font-semibold">{groupRows.length}</div>
        </div>
        <div className="p-3 rounded border bg-gray-50">
          <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">
            Eligible ({activeTab === "individual" ? "Current Tab: Students" : "Current Tab: Groups"})
          </div>
          <div className="text-lg font-semibold">{eligibleCount}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded border text-sm font-semibold ${
              activeTab === tab.key
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : "bg-white text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700">{error}</div>
      ) : null}

      {loadingRows ? (
        <div className="p-3 rounded border">Loading eligibility...</div>
      ) : activeTab === "individual" ? (
        <div className="overflow-auto border rounded">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 border-b">Student</th>
                <th className="text-left p-3 border-b">Department</th>
                <th className="text-left p-3 border-b">Year</th>
                <th className="text-left p-3 border-b">Phase</th>
                <th className="text-left p-3 border-b">Earned</th>
                <th className="text-left p-3 border-b">Eligible</th>
                <th className="text-left p-3 border-b">Reason</th>
                <th className="text-left p-3 border-b">Evaluated At</th>
                <th className="text-left p-3 border-b">Override</th>
              </tr>
            </thead>
            <tbody>
              {individualRows.map((row) => (
                <tr key={row.eligibility_id || `${row.phase_id}-${row.student_id}`} className="hover:bg-gray-50">
                  <td className="p-3 border-b">
                    <div className="font-medium">{row.student_name || "-"}</div>
                    <div className="text-xs text-gray-500">ID: {row.student_id || "-"}</div>
                  </td>
                  <td className="p-3 border-b">{row.department || "-"}</td>
                  <td className="p-3 border-b">{row.year ?? "-"}</td>
                  <td className="p-3 border-b">{getPhaseLabel(row)}</td>
                  <td className="p-3 border-b font-semibold text-blue-700">
                    {Number(row.this_phase_base_points || 0).toLocaleString()}
                  </td>
                  <td className="p-3 border-b">{formatEligible(row.is_eligible)}</td>
                  <td className="p-3 border-b">{row.reason_code || "-"}</td>
                  <td className="p-3 border-b">{formatDateTime(row.evaluated_at)}</td>
                  <td className="p-3 border-b">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onOverride("individual", row, true)}
                        disabled={overrideBusyKey === `individual:${selectedPhaseId}:${row.student_id}`}
                        className="px-2 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold disabled:opacity-60"
                      >
                        Mark Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => onOverride("individual", row, false)}
                        disabled={overrideBusyKey === `individual:${selectedPhaseId}:${row.student_id}`}
                        className="px-2 py-1 rounded border border-red-200 bg-red-50 text-red-700 text-xs font-semibold disabled:opacity-60"
                      >
                        Mark No
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {individualRows.length === 0 ? (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={9}>
                    No individual eligibility data found for this phase. Run phase evaluation first.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-auto border rounded">
          <table className="min-w-[1000px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 border-b">Group</th>
                <th className="text-left p-3 border-b">Tier</th>
                <th className="text-left p-3 border-b">Phase</th>
                <th className="text-left p-3 border-b">Earned</th>
                <th className="text-left p-3 border-b">Eligible</th>
                <th className="text-left p-3 border-b">Reason</th>
                <th className="text-left p-3 border-b">Evaluated At</th>
                <th className="text-left p-3 border-b">Override</th>
              </tr>
            </thead>
            <tbody>
              {groupRows.map((row) => (
                <tr key={row.eligibility_id || `${row.phase_id}-${row.group_id}`} className="hover:bg-gray-50">
                  <td className="p-3 border-b">
                    <div className="font-medium">{row.group_name || "-"}</div>
                    <div className="text-xs text-gray-500">
                      {row.group_code || "-"} | ID: {row.group_id || "-"}
                    </div>
                  </td>
                  <td className="p-3 border-b">{row.tier || "-"}</td>
                  <td className="p-3 border-b">{getPhaseLabel(row)}</td>
                  <td className="p-3 border-b font-semibold text-blue-700">
                    {Number(row.this_phase_group_points || 0).toLocaleString()}
                  </td>
                  <td className="p-3 border-b">{formatEligible(row.is_eligible)}</td>
                  <td className="p-3 border-b">{row.reason_code || "-"}</td>
                  <td className="p-3 border-b">{formatDateTime(row.evaluated_at)}</td>
                  <td className="p-3 border-b">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onOverride("group", row, true)}
                        disabled={overrideBusyKey === `group:${selectedPhaseId}:${row.group_id}`}
                        className="px-2 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold disabled:opacity-60"
                      >
                        Mark Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => onOverride("group", row, false)}
                        disabled={overrideBusyKey === `group:${selectedPhaseId}:${row.group_id}`}
                        className="px-2 py-1 rounded border border-red-200 bg-red-50 text-red-700 text-xs font-semibold disabled:opacity-60"
                      >
                        Mark No
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {groupRows.length === 0 ? (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={8}>
                    No group eligibility data found for this phase. Run phase evaluation first.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
