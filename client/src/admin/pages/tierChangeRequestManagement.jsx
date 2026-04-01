import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TierChangeManagementDesktopTable from "../components/tierChangeManagement/TierChangeManagementDesktopTable";
import TierChangeManagementFilters from "../components/tierChangeManagement/TierChangeManagementFilters";
import TierChangeManagementHeader from "../components/tierChangeManagement/TierChangeManagementHeader";
import TierChangeManagementMobileCards from "../components/tierChangeManagement/TierChangeManagementMobileCards";
import AdminPaginationBar from "../components/ui/AdminPaginationBar";
import useClientPagination from "../../hooks/useClientPagination";
import {
  getInitialAction,
  getResolvedAction,
  normalizeStatus,
  toEligibleLabel
} from "../components/tierChangeManagement/tierChangeManagement.utils";
import { fetchAllPhases } from "../../service/phase.api";
import {
  applyTeamChangeTier,
  fetchPhaseTierChangePreview,
  fetchPhaseWiseTeamChangeTier
} from "../../service/teamChangeTier.api";

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

  const {
    limit,
    page,
    pageCount,
    pagedItems: pagedRows,
    setLimit,
    setPage
  } = useClientPagination(filteredRows);

  useEffect(() => {
    setPage(1);
  }, [actionFilter, q, selectedPhaseId, setPage, statusFilter]);

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

  const onActionChange = (groupId, action) => {
    setSelectedActions((prev) => ({
      ...prev,
      [String(groupId)]: action
    }));
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 font-[Inter] md:px-6">
      <TierChangeManagementHeader
        filteredCount={filteredRows.length}
        headerSummary={headerSummary}
        loadingData={loadingData}
        loadingPhases={loadingPhases}
        onRefreshData={() => loadPhaseTierData(selectedPhaseId)}
        onRefreshPhases={loadPhases}
        previewMeta={previewMeta}
        selectedPhaseId={selectedPhaseId}
        stats={stats}
      />

      <TierChangeManagementFilters
        actionFilter={actionFilter}
        onActionFilterChange={setActionFilter}
        onPhaseChange={setSelectedPhaseId}
        onSearchChange={setQ}
        onStatusFilterChange={setStatusFilter}
        phases={phases}
        q={q}
        selectedPhaseId={selectedPhaseId}
        statusFilter={statusFilter}
        statusOptions={statusOptions}
        totalCount={stats.total}
        visibleCount={filteredRows.length}
      />

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
          <TierChangeManagementMobileCards
            applyBusyKey={applyBusyKey}
            onActionChange={onActionChange}
            onApply={onApply}
            onViewGroup={(groupId) => navigate(`/groups/${groupId}`)}
            rows={pagedRows}
            selectedActions={selectedActions}
            selectedPhaseId={selectedPhaseId}
          />

          <TierChangeManagementDesktopTable
            applyBusyKey={applyBusyKey}
            onActionChange={onActionChange}
            onApply={onApply}
            onViewGroup={(groupId) => navigate(`/groups/${groupId}`)}
            rows={pagedRows}
            selectedActions={selectedActions}
            selectedPhaseId={selectedPhaseId}
          />
        </>
      )}

      <AdminPaginationBar
        itemLabel="groups"
        limit={limit}
        loading={loadingData}
        onLimitChange={setLimit}
        onPageChange={setPage}
        page={page}
        pageCount={pageCount}
        shownCount={pagedRows.length}
        totalCount={filteredRows.length}
      />
    </div>
  );
}
