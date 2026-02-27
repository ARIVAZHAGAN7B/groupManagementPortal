import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllPhases } from "../../service/phase.api";
import {
  applyTeamChangeTier,
  fetchPhaseTierChangePreview,
  fetchPhaseWiseTeamChangeTier
} from "../../service/teamChangeTier.api";

const BADGE_STYLES = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-gray-100 text-gray-600 border-gray-200",
  FROZEN: "bg-blue-50 text-blue-700 border-blue-200",
  PROMOTE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DEMOTE: "bg-red-50 text-red-700 border-red-200",
  SAME: "bg-gray-100 text-gray-700 border-gray-200",
  A: "bg-blue-50 text-blue-700 border-blue-200",
  B: "bg-purple-50 text-purple-700 border-purple-200",
  C: "bg-orange-50 text-orange-700 border-orange-200",
  D: "bg-gray-100 text-gray-700 border-gray-200",
  YES: "bg-emerald-50 text-emerald-700 border-emerald-200",
  NO: "bg-red-50 text-red-700 border-red-200",
  NOT_EVALUATED: "bg-gray-100 text-gray-600 border-gray-200"
};

const Badge = ({ value, fallback = "-" }) => {
  const text = String(value ?? fallback);
  const key = text.toUpperCase().replace(/\s+/g, "_");
  const cls = BADGE_STYLES[key] || "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {text}
    </span>
  );
};

const StatCard = ({ label, value, tone = "text-gray-900", subtext = null }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
    <div className={`mt-2 text-lg font-bold ${tone}`}>{value}</div>
    {subtext ? <div className="mt-1 text-xs text-gray-500">{subtext}</div> : null}
  </div>
);

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

const toEligibleLabel = (value) => {
  if (value === true || value === 1) return "Yes";
  if (value === false || value === 0) return "No";
  return "Not Evaluated";
};

export default function TierChangeRequestManagement() {
  const navigate = useNavigate();
  const [phases, setPhases] = useState([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState("");
  const [previewRows, setPreviewRows] = useState([]);
  const [savedRows, setSavedRows] = useState([]);
  const [previewMeta, setPreviewMeta] = useState({ phase: null, previous_phase: null });
  const [loadingPhases, setLoadingPhases] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [applyBusyKey, setApplyBusyKey] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const loadPhases = async () => {
    setLoadingPhases(true);
    setError("");
    try {
      const rows = await fetchAllPhases();
      const normalized = Array.isArray(rows) ? rows : [];
      setPhases(normalized);
      setSelectedPhaseId((prev) => {
        if (prev && normalized.some((row) => String(row.phase_id) === String(prev))) {
          return prev;
        }
        const completed = normalized.find(
          (row) => String(row.status || "").toUpperCase() === "COMPLETED"
        );
        const active = normalized.find(
          (row) => String(row.status || "").toUpperCase() === "ACTIVE"
        );
        return String((completed || active || normalized[0] || {}).phase_id || "");
      });
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || "Failed to load phases");
      setPhases([]);
      setSelectedPhaseId("");
    } finally {
      setLoadingPhases(false);
    }
  };

  const loadPhaseTierData = async (phaseId) => {
    if (!phaseId) {
      setPreviewRows([]);
      setSavedRows([]);
      setPreviewMeta({ phase: null, previous_phase: null });
      return;
    }

    setLoadingData(true);
    setError("");
    try {
      const [preview, saved] = await Promise.all([
        fetchPhaseTierChangePreview(phaseId),
        fetchPhaseWiseTeamChangeTier(phaseId).catch(() => ({ phase: null, rows: [] }))
      ]);

      setPreviewRows(Array.isArray(preview?.rows) ? preview.rows : []);
      setSavedRows(Array.isArray(saved?.rows) ? saved.rows : []);
      setPreviewMeta({
        phase: preview?.phase || null,
        previous_phase: preview?.previous_phase || null
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load phase-wise tier management data");
      setPreviewRows([]);
      setSavedRows([]);
      setPreviewMeta({ phase: null, previous_phase: null });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadPhases();
  }, []);

  useEffect(() => {
    if (!selectedPhaseId) return;
    loadPhaseTierData(selectedPhaseId);
  }, [selectedPhaseId]);

  const savedByGroup = useMemo(
    () =>
      new Map((Array.isArray(savedRows) ? savedRows : []).map((row) => [String(row.group_id), row])),
    [savedRows]
  );

  const mergedRows = useMemo(
    () =>
      (Array.isArray(previewRows) ? previewRows : []).map((row) => ({
        ...row,
        team_change_tier: row.team_change_tier || savedByGroup.get(String(row.group_id)) || null
      })),
    [previewRows, savedByGroup]
  );

  const filteredRows = useMemo(() => {
    if (!actionFilter) return mergedRows;
    return mergedRows.filter(
      (row) => String(row?.change_action || "").toUpperCase() === String(actionFilter).toUpperCase()
    );
  }, [mergedRows, actionFilter]);

  const stats = useMemo(() => {
    const rows = mergedRows;
    return {
      total: rows.length,
      promote: rows.filter((r) => r.change_action === "PROMOTE").length,
      demote: rows.filter((r) => r.change_action === "DEMOTE").length,
      same: rows.filter((r) => r.change_action === "SAME").length,
      applied: rows.filter((r) => Boolean(r.team_change_tier)).length
    };
  }, [mergedRows]);

  const onApply = async (row) => {
    if (!selectedPhaseId || !row?.group_id) return;

    const busyKey = `${selectedPhaseId}:${row.group_id}`;
    setApplyBusyKey(busyKey);
    setError("");
    try {
      await applyTeamChangeTier(selectedPhaseId, row.group_id);
      await loadPhaseTierData(selectedPhaseId);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to apply tier change");
    } finally {
      setApplyBusyKey("");
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-screen-2xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-900">Tier Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Phase-wise tier changes from eligibility:
            {" "}
            last phase eligible = promote, last two phases not eligible = demote, otherwise same tier.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadPhases}
            disabled={loadingPhases}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {loadingPhases ? "Loading..." : "Refresh Phases"}
          </button>
          <button
            type="button"
            onClick={() => loadPhaseTierData(selectedPhaseId)}
            disabled={!selectedPhaseId || loadingData}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {loadingData ? "Loading..." : "Refresh Data"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-[320px_220px_1fr] gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Phase
            </label>
            <select
              value={selectedPhaseId}
              onChange={(e) => setSelectedPhaseId(e.target.value)}
              disabled={loadingPhases || phases.length === 0}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              {phases.length === 0 && <option value="">No phases available</option>}
              {phases.map((phase) => (
                <option key={phase.phase_id} value={phase.phase_id}>
                  {phase.phase_name || phase.phase_id} | {formatDate(phase.start_date)} - {formatDate(phase.end_date)} | {phase.status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Action Filter
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              disabled={loadingData}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="PROMOTE">Promote</option>
              <option value="DEMOTE">Demote</option>
              <option value="SAME">Same Tier</option>
            </select>
          </div>

          <div className="text-xs text-gray-600">
            {previewMeta.phase ? (
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                <span className="font-semibold text-gray-800">Selected:</span>{" "}
                {previewMeta.phase.phase_name || previewMeta.phase.phase_id}
                {" | "}
                {formatDate(previewMeta.phase.start_date)} - {formatDate(previewMeta.phase.end_date)}
                {previewMeta.previous_phase ? (
                  <>
                    <span className="mx-2 text-gray-300">|</span>
                    <span className="font-semibold text-gray-800">Previous:</span>{" "}
                    {previewMeta.previous_phase.phase_name || previewMeta.previous_phase.phase_id}
                  </>
                ) : (
                  <>
                    <span className="mx-2 text-gray-300">|</span>
                    No previous phase
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <StatCard label="Groups" value={stats.total} />
        <StatCard label="Promote" value={stats.promote} tone="text-emerald-700" />
        <StatCard label="Demote" value={stats.demote} tone="text-red-700" />
        <StatCard label="Same Tier" value={stats.same} tone="text-gray-700" />
        <StatCard label="Applied (team_change_tier)" value={stats.applied} tone="text-blue-700" />
      </div>

      {error ? (
        <div className="px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-auto rounded-xl border border-gray-100">
        <table className="min-w-[1560px] w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {[
                "Group",
                "Status",
                "Current Tier",
                "Last Phase Eligible",
                "Previous Phase Eligible",
                "Recommended Action",
                "Recommended Tier",
                "Rule",
                "team_change_tier",
                "Actions"
              ].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loadingData ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-400">
                  Loading phase-wise tier changes...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-400">
                  No rows for the selected phase/filter.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const saved = row.team_change_tier || null;
                const busyKey = `${selectedPhaseId}:${row.group_id}`;
                return (
                  <tr key={row.group_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{row.group_name || "-"}</div>
                      <div className="text-xs text-gray-500">
                        {row.group_code || "-"} | ID: {row.group_id}
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/groups/${row.group_id}`)}
                        className="mt-1 text-xs text-blue-600 hover:underline"
                      >
                        Open Group
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge value={row.group_status || "-"} />
                        <span className="text-xs text-gray-500">{Number(row.active_member_count || 0)} members</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={row.current_tier || "-"} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={toEligibleLabel(row.last_phase_eligible)} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={toEligibleLabel(row.previous_phase_eligible)} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={row.change_action || "-"} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={row.recommended_tier || "-"} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {row.rule_code || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {saved ? (
                        <div>
                          <div className="font-semibold text-blue-700">
                            ID: {saved.team_change_tier_id}
                          </div>
                          <div>
                            {saved.current_tier} to {saved.recommended_tier} ({saved.change_action})
                          </div>
                          <div>{formatDateTime(saved.applied_at)}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not applied</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onApply(row)}
                        disabled={Boolean(saved) || applyBusyKey === busyKey}
                        className="px-3 py-1 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {applyBusyKey === busyKey ? "Applying..." : saved ? "Applied" : "Apply"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

