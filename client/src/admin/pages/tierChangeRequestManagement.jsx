import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  formatPercentLabel,
  getStatusConfig,
  getTierBadgeClass,
  inputClass
} from "../components/groups/groupManagement.constants";
import { fetchAllPhases } from "../../service/phase.api";
import {
  applyTeamChangeTier,
  fetchPhaseTierChangePreview,
  fetchPhaseWiseTeamChangeTier
} from "../../service/teamChangeTier.api";

const TIERS = ["D", "C", "B", "A"];
const MANUAL_ACTIONS = ["PROMOTE", "DEMOTE"];
const ACTION_BADGE_STYLES = {
  PROMOTE: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  DEMOTE: "border border-red-200 bg-red-50 text-red-700",
  APPLIED: "border border-[#1754cf]/20 bg-[#1754cf]/10 text-[#1754cf]",
  AUTO_DEMOTE: "border border-red-200 bg-red-50 text-red-700",
  YES: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  NO: "border border-red-200 bg-red-50 text-red-700",
  NOT_EVALUATED: "border border-slate-200 bg-slate-100 text-slate-500"
};

function StatPill({ accentClass, detail, label, value }) {
  return (
    <article className="rounded-lg border border-white/80 bg-white/90 px-3 py-2.5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${accentClass}`} />
        <p className="text-sm font-semibold text-slate-700">
          {label}: <span className="text-slate-900">{value}</span>
        </p>
      </div>
      <p className="mt-1 pl-4 text-[11px] font-medium text-slate-500">{detail}</p>
    </article>
  );
}

function FilterSelect({ children, onChange, value }) {
  return (
    <div className="relative min-w-32">
      <select
        value={value}
        onChange={onChange}
        className={`${inputClass} min-w-32 appearance-none pr-10`}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
        <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20 }} />
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = getStatusConfig(status);

  return (
    <span className={`flex items-center gap-1.5 text-[10px] font-bold ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function TierBadge({ tier }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getTierBadgeClass(tier)}`}
    >
      Tier {String(tier || "-").toUpperCase()}
    </span>
  );
}

function ToneBadge({ value, fallback = "-" }) {
  const text = String(value ?? fallback);
  const key = text.toUpperCase().replace(/\s+/g, "_");
  const className =
    ACTION_BADGE_STYLES[key] || "border border-slate-200 bg-slate-100 text-slate-600";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${className}`}>
      {text}
    </span>
  );
}

function ActionSelector({ disabled, onChange, resolvedAction, row }) {
  const groupStatus = normalizeStatus(row?.group_status);
  const isActiveGroup = groupStatus === "ACTIVE";

  if (!isActiveGroup) {
    return (
      <div className="space-y-2">
        <ToneBadge value="Auto Demote" />
        <p className="text-[11px] font-medium text-slate-500">
          {groupStatus === "FROZEN"
            ? "Frozen groups always demote on apply."
            : "Inactive groups always demote on apply."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
        {MANUAL_ACTIONS.map((action) => {
          const isSelected = resolvedAction === action;

          return (
            <button
              key={action}
              type="button"
              onClick={() => onChange(action)}
              disabled={disabled}
              className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${getActionButtonClass(
                action,
                isSelected
              )}`}
            >
              {action === "PROMOTE" ? "Promote" : "Demote"}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] font-medium text-slate-500">
        Active groups can switch action before apply.
      </p>
    </div>
  );
}

function MobileValueRow({ children, label }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-slate-100 py-2 text-xs">
      <span className="text-slate-500">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

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

const formatPhaseLabel = (phase) => {
  if (!phase?.phase_id) return "No previous phase";
  return `${phase.phase_name || phase.phase_id} | ${formatDate(phase.start_date)} - ${formatDate(
    phase.end_date
  )}`;
};

const toEligibleLabel = (value) => {
  if (value === true || value === 1) return "Yes";
  if (value === false || value === 0) return "No";
  return "Not Evaluated";
};

const normalizeChangeAction = (value) => {
  const action = String(value || "")
    .trim()
    .toUpperCase();
  return MANUAL_ACTIONS.includes(action) ? action : "";
};

const normalizeStatus = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const getNextTier = (tier) => {
  const normalizedTier = String(tier || "")
    .trim()
    .toUpperCase();
  const idx = TIERS.indexOf(normalizedTier);
  if (idx < 0) return normalizedTier || "-";
  return TIERS[Math.min(idx + 1, TIERS.length - 1)];
};

const getPrevTier = (tier) => {
  const normalizedTier = String(tier || "")
    .trim()
    .toUpperCase();
  const idx = TIERS.indexOf(normalizedTier);
  if (idx < 0) return normalizedTier || "-";
  return TIERS[Math.max(idx - 1, 0)];
};

const getAllowedActions = (row) => {
  const status = normalizeStatus(row?.group_status);
  return status === "ACTIVE" ? MANUAL_ACTIONS : ["DEMOTE"];
};

const getInitialAction = (row) => {
  const allowedActions = getAllowedActions(row);
  const savedAction = normalizeChangeAction(row?.team_change_tier?.change_action);
  if (allowedActions.includes(savedAction)) return savedAction;
  const previewAction = normalizeChangeAction(row?.change_action);
  if (allowedActions.includes(previewAction)) return previewAction;
  return allowedActions[0] || "DEMOTE";
};

const getResolvedAction = (row, selectedActions = {}) => {
  const allowedActions = getAllowedActions(row);
  const selectedAction = normalizeChangeAction(selectedActions[String(row?.group_id)]);
  if (allowedActions.includes(selectedAction)) return selectedAction;
  return getInitialAction(row);
};

const getTargetTier = (currentTier, action) => {
  const normalizedAction = normalizeChangeAction(action);
  if (normalizedAction === "PROMOTE") return getNextTier(currentTier);
  if (normalizedAction === "DEMOTE") return getPrevTier(currentTier);
  return String(currentTier || "-").toUpperCase();
};

const getTierShiftLabel = (currentTier, targetTier, action) => {
  if (String(currentTier || "").toUpperCase() === String(targetTier || "").toUpperCase()) {
    return "No tier change at this boundary";
  }
  return action === "PROMOTE" ? "Moves up one tier" : "Moves down one tier";
};

const getActionButtonClass = (action, isSelected) => {
  if (isSelected && action === "PROMOTE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (isSelected && action === "DEMOTE") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  return "border-slate-200 bg-white text-slate-600 hover:bg-slate-50";
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
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [applyBusyKey, setApplyBusyKey] = useState("");
  const [selectedActions, setSelectedActions] = useState({});

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

  useEffect(() => {
    const nextSelections = {};
    mergedRows.forEach((row) => {
      nextSelections[String(row.group_id)] = getInitialAction(row);
    });
    setSelectedActions(nextSelections);
  }, [mergedRows]);

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(
          mergedRows
            .map((row) => normalizeStatus(row?.group_status))
            .filter(Boolean)
        )
      ).sort(),
    [mergedRows]
  );

  const filteredRows = useMemo(() => {
    const search = String(q || "").trim().toLowerCase();

    return mergedRows.filter((row) => {
      const resolvedAction = getResolvedAction(row, selectedActions);
      const status = normalizeStatus(row?.group_status);

      if (statusFilter !== "ALL" && status !== statusFilter) return false;
      if (actionFilter === "APPLIED" && !row.team_change_tier) return false;
      if (actionFilter !== "ALL" && actionFilter !== "APPLIED" && resolvedAction !== actionFilter) {
        return false;
      }

      if (!search) return true;

      return [
        row.group_code,
        row.group_name,
        row.current_tier,
        row.group_status,
        toEligibleLabel(row.last_phase_eligible),
        toEligibleLabel(row.previous_phase_eligible),
        resolvedAction
      ]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(search));
    });
  }, [actionFilter, mergedRows, q, selectedActions, statusFilter]);

  const stats = useMemo(() => {
    const all = Array.isArray(mergedRows) ? mergedRows : [];

    return {
      total: all.length,
      promote: all.filter((row) => getResolvedAction(row, selectedActions) === "PROMOTE").length,
      demote: all.filter((row) => getResolvedAction(row, selectedActions) === "DEMOTE").length,
      applied: all.filter((row) => Boolean(row.team_change_tier)).length
    };
  }, [mergedRows, selectedActions]);

  const headerSummary =
    filteredRows.length !== stats.total
      ? `Showing ${filteredRows.length} of ${stats.total} groups in this phase`
      : `${stats.total} groups in selected phase`;

  const onApply = async (row) => {
    if (!selectedPhaseId || !row?.group_id) return;

    const busyKey = `${selectedPhaseId}:${row.group_id}`;
    setApplyBusyKey(busyKey);
    setError("");
    try {
      await applyTeamChangeTier(selectedPhaseId, row.group_id, {
        change_action: getResolvedAction(row, selectedActions)
      });
      await loadPhaseTierData(selectedPhaseId);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to apply tier change");
    } finally {
      setApplyBusyKey("");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 font-[Inter] md:px-6">
      <section className="relative overflow-hidden rounded-2xl border border-[#1754cf]/10 bg-[#1754cf]/5 p-4 md:p-5">
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
                Tier Change Workspace
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Tier Change Management
                </h1>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-600">{headerSummary}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium text-slate-500">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  Selected: {previewMeta.phase ? formatPhaseLabel(previewMeta.phase) : "No phase selected"}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  Previous: {formatPhaseLabel(previewMeta.previous_phase)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => loadPhaseTierData(selectedPhaseId)}
                disabled={!selectedPhaseId || loadingData}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
              >
                <RefreshRoundedIcon sx={{ fontSize: 18 }} />
                {loadingData ? "Refreshing..." : "Refresh Data"}
              </button>

              <button
                type="button"
                onClick={loadPhases}
                disabled={loadingPhases}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1754cf] px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#1754cf]/20 transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
              >
                <RefreshRoundedIcon sx={{ fontSize: 18 }} />
                {loadingPhases ? "Refreshing..." : "Refresh Phases"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <StatPill
              accentClass="bg-[#1754cf]"
              detail={filteredRows.length !== stats.total ? `Visible ${filteredRows.length}` : "All groups"}
              label="Total"
              value={stats.total}
            />
            <StatPill
              accentClass="bg-emerald-500"
              detail={formatPercentLabel(stats.promote, stats.total)}
              label="Promote"
              value={stats.promote}
            />
            <StatPill
              accentClass="bg-red-500"
              detail={formatPercentLabel(stats.demote, stats.total)}
              label="Demote"
              value={stats.demote}
            />
            <StatPill
              accentClass="bg-[#1754cf]"
              detail={formatPercentLabel(stats.applied, stats.total)}
              label="Applied"
              value={stats.applied}
            />
          </div>
        </div>

        <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-[#1754cf]/10 blur-3xl" />
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center">
        <div className="relative w-full xl:flex-1">
          <SearchRoundedIcon
            sx={{ fontSize: 20 }}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={`${inputClass} pl-10`}
            placeholder="Search by group, code, tier, status, action"
          />
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-3">
          <FilterSelect
            value={selectedPhaseId}
            onChange={(e) => setSelectedPhaseId(e.target.value)}
          >
            {phases.length === 0 ? (
              <option value="">No phases available</option>
            ) : (
              phases.map((phase) => (
                <option key={phase.phase_id} value={phase.phase_id}>
                  {phase.phase_name || phase.phase_id}
                </option>
              ))
            )}
          </FilterSelect>

          <FilterSelect
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="ALL">All Actions</option>
            <option value="PROMOTE">Promote</option>
            <option value="DEMOTE">Demote</option>
            <option value="APPLIED">Applied</option>
          </FilterSelect>

          <FilterSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </FilterSelect>
        </div>

        <p className="hidden whitespace-nowrap text-xs font-medium text-slate-500 2xl:block">
          Showing {filteredRows.length} of {stats.total}
        </p>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loadingData ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
          Loading tier changes...
        </div>
      ) : (
        <>
          <section className="space-y-4 lg:hidden">
            {filteredRows.length > 0 ? (
              filteredRows.map((row) => {
                const saved = row.team_change_tier || null;
                const busyKey = `${selectedPhaseId}:${row.group_id}`;
                const resolvedAction = getResolvedAction(row, selectedActions);
                const targetTier = getTargetTier(row.current_tier, resolvedAction);

                return (
                  <article
                    key={row.group_id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-900">{row.group_name || "-"}</h4>
                        <p className="mt-1 text-xs font-mono font-bold uppercase text-[#1754cf]">
                          {row.group_code || "-"}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {Number(row.active_member_count || 0)} active member
                          {Number(row.active_member_count || 0) === 1 ? "" : "s"}
                        </p>
                      </div>

                      <TierBadge tier={row.current_tier} />
                    </div>

                    <MobileValueRow label="Status">
                      <StatusBadge status={row.group_status} />
                    </MobileValueRow>

                    <MobileValueRow label="Last Phase">
                      <ToneBadge value={toEligibleLabel(row.last_phase_eligible)} />
                    </MobileValueRow>

                    <MobileValueRow label="Previous Phase">
                      <ToneBadge value={toEligibleLabel(row.previous_phase_eligible)} />
                    </MobileValueRow>

                    <MobileValueRow label="Action">
                      <div className="max-w-[220px]">
                        <ActionSelector
                          disabled={Boolean(saved)}
                          onChange={(action) =>
                            setSelectedActions((prev) => ({
                              ...prev,
                              [String(row.group_id)]: action
                            }))
                          }
                          resolvedAction={resolvedAction}
                          row={row}
                        />
                      </div>
                    </MobileValueRow>

                    <MobileValueRow label="Next Tier">
                      <div className="space-y-1">
                        <TierBadge tier={targetTier} />
                        <p className="text-[11px] font-medium text-slate-500">
                          {getTierShiftLabel(row.current_tier, targetTier, resolvedAction)}
                        </p>
                      </div>
                    </MobileValueRow>

                    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/groups/${row.group_id}`)}
                        className="flex items-center justify-center gap-2 rounded-lg bg-slate-50 p-2 text-xs font-semibold text-slate-700"
                      >
                        <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() => onApply(row)}
                        disabled={Boolean(saved) || applyBusyKey === busyKey}
                        className="flex items-center justify-center rounded-lg bg-[#1754cf] p-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {applyBusyKey === busyKey ? "Applying..." : saved ? "Applied" : "Apply"}
                      </button>
                    </div>

                    <div className="mt-3 border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-500">
                      {saved
                        ? `${saved.change_action} applied on ${formatDateTime(saved.applied_at)}`
                        : `Ready to apply ${resolvedAction.toLowerCase()} for this group.`}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
                No groups found for current filters.
              </div>
            )}
          </section>

          <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-[1220px] w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    <th className="px-6 py-4">Group</th>
                    <th className="px-6 py-4 text-center">Tier</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Last Phase</th>
                    <th className="px-6 py-4">Previous Phase</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Next Tier</th>
                    <th className="px-6 py-4 text-right">Apply</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRows.length > 0 ? (
                    filteredRows.map((row) => {
                      const saved = row.team_change_tier || null;
                      const busyKey = `${selectedPhaseId}:${row.group_id}`;
                      const resolvedAction = getResolvedAction(row, selectedActions);
                      const targetTier = getTargetTier(row.current_tier, resolvedAction);

                      return (
                        <tr key={row.group_id} className="transition-colors hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-slate-900">
                              {row.group_name || "-"}
                            </div>
                            <div className="text-[10px] font-mono font-bold uppercase text-[#1754cf]">
                              {row.group_code || "-"}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {Number(row.active_member_count || 0)} active member
                              {Number(row.active_member_count || 0) === 1 ? "" : "s"}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <TierBadge tier={row.current_tier} />
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={row.group_status} />
                          </td>
                          <td className="px-6 py-4">
                            <ToneBadge value={toEligibleLabel(row.last_phase_eligible)} />
                          </td>
                          <td className="px-6 py-4">
                            <ToneBadge value={toEligibleLabel(row.previous_phase_eligible)} />
                          </td>
                          <td className="px-6 py-4">
                            <ActionSelector
                              disabled={Boolean(saved)}
                              onChange={(action) =>
                                setSelectedActions((prev) => ({
                                  ...prev,
                                  [String(row.group_id)]: action
                                }))
                              }
                              resolvedAction={resolvedAction}
                              row={row}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <TierBadge tier={targetTier} />
                              <p className="text-[11px] font-medium text-slate-500">
                                {getTierShiftLabel(row.current_tier, targetTier, resolvedAction)}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="ml-auto grid max-w-[15rem] grid-cols-[2rem_5rem] items-start justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => navigate(`/groups/${row.group_id}`)}
                                title="View"
                                aria-label="View"
                                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-slate-100"
                              >
                                <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                              </button>

                              <button
                                type="button"
                                onClick={() => onApply(row)}
                                disabled={Boolean(saved) || applyBusyKey === busyKey}
                                className="w-full whitespace-nowrap rounded-md bg-[#1754cf] px-2.5 py-1 text-center text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {applyBusyKey === busyKey ? "Applying..." : saved ? "Applied" : "Apply"}
                              </button>

                              <div className="col-span-2 text-right text-[11px] font-medium text-slate-500">
                                {saved
                                  ? `${saved.change_action} applied on ${formatDateTime(saved.applied_at)}`
                                  : `Ready to apply ${resolvedAction.toLowerCase()}.`}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
                        No groups found for current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between bg-slate-50 px-6 py-4">
              <p className="text-xs font-medium text-slate-500">
                Showing {filteredRows.length} of {stats.total} groups
              </p>
              <p className="text-xs font-medium text-slate-500">
                Active groups can switch action before apply
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
