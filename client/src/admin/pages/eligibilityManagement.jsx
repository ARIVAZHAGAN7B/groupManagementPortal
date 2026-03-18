import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminGroupEligibility,
  fetchAdminIndividualEligibility,
  overrideGroupEligibility,
  overrideIndividualEligibility
} from "../../service/eligibility.api";
import { fetchAllPhases } from "../../service/phase.api";
import EligibilityDesktopTable from "../components/eligibility/EligibilityDesktopTable";
import EligibilityFilters from "../components/eligibility/EligibilityFilters";
import EligibilityHero from "../components/eligibility/EligibilityHero";
import EligibilityMobileCards from "../components/eligibility/EligibilityMobileCards";
import EligibilityOverrideModal from "../components/eligibility/EligibilityOverrideModal";
import {
  getDefaultReasonCode,
  getSearchText,
  getViewLabel,
  isEligibleValue,
  isNotEligibleValue,
  isOverrideReason
} from "../components/eligibility/eligibility.constants";

const getNextSelectedPhaseId = (rows, previousPhaseId) => {
  if (!Array.isArray(rows) || rows.length === 0) return "";

  if (previousPhaseId && rows.some((row) => String(row.phase_id) === String(previousPhaseId))) {
    return String(previousPhaseId);
  }

  const activePhase = rows.find(
    (row) => String(row?.status || "").toUpperCase() === "ACTIVE"
  );

  return String((activePhase || rows[0]).phase_id);
};

export default function EligibilityManagement() {
  const [viewMode, setViewMode] = useState("individual");
  const [phases, setPhases] = useState([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState("");
  const [individualRows, setIndividualRows] = useState([]);
  const [groupRows, setGroupRows] = useState([]);
  const [loadingPhases, setLoadingPhases] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [overrideBusyKey, setOverrideBusyKey] = useState("");
  const [overrideState, setOverrideState] = useState({
    open: false,
    type: "individual",
    row: null,
    isEligible: true,
    reasonCode: "",
    error: ""
  });

  const selectedPhase = useMemo(
    () => phases.find((phase) => String(phase.phase_id) === String(selectedPhaseId)) || null,
    [phases, selectedPhaseId]
  );

  const loadPhases = async () => {
    setLoadingPhases(true);
    setError("");

    try {
      const data = await fetchAllPhases();
      const rows = Array.isArray(data) ? data : [];
      const nextSelectedPhaseId = getNextSelectedPhaseId(rows, selectedPhaseId);

      setPhases(rows);
      setSelectedPhaseId(nextSelectedPhaseId);

      if (!nextSelectedPhaseId) {
        setIndividualRows([]);
        setGroupRows([]);
      }

      return nextSelectedPhaseId;
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load phases");
      setPhases([]);
      setSelectedPhaseId("");
      setIndividualRows([]);
      setGroupRows([]);
      return "";
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

  const refreshAll = async () => {
    const previousPhaseId = selectedPhaseId;
    const nextPhaseId = await loadPhases();

    if (nextPhaseId && String(nextPhaseId) === String(previousPhaseId)) {
      await loadEligibility(nextPhaseId);
    }
  };

  useEffect(() => {
    loadPhases();
  }, []);

  useEffect(() => {
    if (!selectedPhaseId) return;
    loadEligibility(selectedPhaseId);
  }, [selectedPhaseId]);

  useEffect(() => {
    setOverrideState((prev) => ({
      ...prev,
      open: false,
      row: null,
      error: ""
    }));
  }, [selectedPhaseId]);

  const sourceRows = viewMode === "individual" ? individualRows : groupRows;

  const filteredRows = useMemo(() => {
    const query = String(q || "").trim().toLowerCase();
    if (!query) return sourceRows;

    return sourceRows.filter((row) => getSearchText(viewMode, row).includes(query));
  }, [q, sourceRows, viewMode]);

  const stats = useMemo(() => {
    const rows = Array.isArray(sourceRows) ? sourceRows : [];

    return {
      total: rows.length,
      eligible: rows.filter((row) => isEligibleValue(row?.is_eligible)).length,
      notEligible: rows.filter((row) => isNotEligibleValue(row?.is_eligible)).length,
      overrides: rows.filter((row) => isOverrideReason(row?.reason_code)).length
    };
  }, [sourceRows]);

  const openOverride = (type, row, isEligible) => {
    if (!selectedPhaseId) return;

    setOverrideState({
      open: true,
      type,
      row,
      isEligible,
      reasonCode: getDefaultReasonCode(type, isEligible),
      error: ""
    });
  };

  const closeOverride = () => {
    if (overrideBusyKey) return;

    setOverrideState((prev) => ({
      ...prev,
      open: false,
      row: null,
      error: ""
    }));
  };

  const updateOverrideReason = (reasonCode) => {
    setOverrideState((prev) => ({
      ...prev,
      reasonCode,
      error: ""
    }));
  };

  const handleOverrideSubmit = async (event) => {
    event.preventDefault();

    if (!overrideState.open || !overrideState.row || !selectedPhaseId) return;

    const reasonCode = String(overrideState.reasonCode || "").trim();
    if (reasonCode.length < 3) {
      setOverrideState((prev) => ({
        ...prev,
        error: "Reason code must be at least 3 characters."
      }));
      return;
    }

    const targetId =
      overrideState.type === "individual"
        ? overrideState.row.student_id
        : overrideState.row.group_id;
    const busyKey = `${overrideState.type}:${selectedPhaseId}:${targetId}`;

    setOverrideBusyKey(busyKey);
    setError("");

    try {
      if (overrideState.type === "individual") {
        await overrideIndividualEligibility(selectedPhaseId, overrideState.row.student_id, {
          is_eligible: overrideState.isEligible,
          reason_code: reasonCode
        });
      } else {
        await overrideGroupEligibility(selectedPhaseId, overrideState.row.group_id, {
          is_eligible: overrideState.isEligible,
          reason_code: reasonCode
        });
      }

      await loadEligibility(selectedPhaseId);
      setOverrideState((prev) => ({
        ...prev,
        open: false,
        row: null,
        error: ""
      }));
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to override eligibility";

      setError(message);
      setOverrideState((prev) => ({
        ...prev,
        error: message
      }));
    } finally {
      setOverrideBusyKey("");
    }
  };

  const viewLabel = getViewLabel(viewMode);

  return (
    <>
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 font-[Inter] md:px-6">
        <EligibilityHero
          filteredCount={filteredRows.length}
          loading={loadingPhases || loadingRows}
          onRefresh={refreshAll}
          phase={selectedPhase}
          stats={stats}
          viewMode={viewMode}
        />

        <EligibilityFilters
          filteredCount={filteredRows.length}
          phases={phases}
          q={q}
          selectedPhaseId={selectedPhaseId}
          setQ={setQ}
          setSelectedPhaseId={setSelectedPhaseId}
          setViewMode={setViewMode}
          totalCount={stats.total}
          viewMode={viewMode}
        />

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loadingPhases && !selectedPhaseId ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
            Loading phases...
          </div>
        ) : loadingRows && selectedPhaseId ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
            Loading {viewLabel}...
          </div>
        ) : !selectedPhaseId ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
            No phase selected.
          </div>
        ) : (
          <>
            <EligibilityMobileCards
              overrideBusyKey={overrideBusyKey}
              onOverride={openOverride}
              rows={filteredRows}
              selectedPhaseId={selectedPhaseId}
              type={viewMode}
            />

            <div className="hidden lg:block">
              <EligibilityDesktopTable
                overrideBusyKey={overrideBusyKey}
                onOverride={openOverride}
                rows={filteredRows}
                selectedPhaseId={selectedPhaseId}
                totalCount={stats.total}
                type={viewMode}
              />
            </div>
          </>
        )}
      </div>

      <EligibilityOverrideModal
        busy={!!overrideBusyKey}
        onClose={closeOverride}
        onReasonChange={updateOverrideReason}
        onSubmit={handleOverrideSubmit}
        open={overrideState.open}
        override={overrideState}
      />
    </>
  );
}
