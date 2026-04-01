import { useEffect, useMemo, useState } from "react";
import { useRealtimeEvents } from "../../hooks/useRealtimeEvents";
import { REALTIME_EVENTS } from "../../lib/realtime";
import {
  fetchAllPhases,
  fetchCurrentPhase,
  fetchPhaseTargets
} from "../../service/phase.api";
import PhaseConfigurationHistoryTable from "../components/PhaseConfigurationHistoryTable";
import PhaseConfigurationPageHeader from "../components/PhaseConfigurationPageHeader";
import {
  attachPhaseDetails,
  formatPhaseDateRange,
  loadPhaseTargetDetails,
  mergeCurrentPhaseState
} from "../components/PhaseConfigurationUtils";

function StatusBanner({ message, tone }) {
  const toneClass =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${toneClass}`}>
      {message}
    </div>
  );
}

export default function PhaseHistory() {
  const [phase, setPhase] = useState(null);
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPhaseHistory = async () => {
    setLoading(true);
    setError("");

    try {
      const [currentPhase, allPhases] = await Promise.all([
        fetchCurrentPhase(),
        fetchAllPhases()
      ]);

      setPhase(currentPhase || null);

      let currentPhaseTargets = null;
      if (currentPhase?.phase_id) {
        currentPhaseTargets = await fetchPhaseTargets(currentPhase.phase_id);
      }

      const phaseIds = [
        currentPhase?.phase_id,
        ...(Array.isArray(allPhases) ? allPhases : []).map((item) =>
          String(item?.phase_id || "").trim()
        )
      ];

      const detailMap = await loadPhaseTargetDetails(
        phaseIds,
        fetchPhaseTargets,
        currentPhase?.phase_id && currentPhaseTargets
          ? { [currentPhase.phase_id]: currentPhaseTargets }
          : {}
      );

      setPhases(
        attachPhaseDetails(
          mergeCurrentPhaseState(Array.isArray(allPhases) ? allPhases : [], currentPhase),
          detailMap
        )
      );
    } catch (e) {
      setPhase(null);
      setPhases([]);
      setError(e?.response?.data?.error || "Failed to load configured phases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhaseHistory();
  }, []);

  useRealtimeEvents(REALTIME_EVENTS.PHASE, () => {
    void loadPhaseHistory();
  });

  const inactivePhaseCount = useMemo(
    () =>
      phases.filter((item) => String(item?.status || "").toUpperCase() !== "ACTIVE").length,
    [phases]
  );

  const configuredTargetCount = useMemo(
    () =>
      phases.filter(
        (item) =>
          item?.target_details &&
          !item.target_details.hasError &&
          (Array.isArray(item.target_details.targets) ||
            item.target_details.individual_target !== null)
      ).length,
    [phases]
  );

  const headerStats = useMemo(
    () => [
      {
        accentClass: "bg-[#1754cf]",
        detail: phase?.phase_id ? formatPhaseDateRange(phase) : "No active phase available",
        label: "Active Phase",
        value: phase?.phase_name || phase?.phase_id || "No active phase"
      },
      {
        accentClass: "bg-emerald-500",
        detail:
          phase?.total_working_days || phase?.total_working_days === 0
            ? `${phase.total_working_days} working days`
            : "No schedule configured",
        label: "Status",
        value: String(phase?.status || "inactive").toUpperCase()
      },
      {
        accentClass: "bg-sky-500",
        detail: "Every configured phase loaded",
        label: "Loaded",
        value: phases.length
      },
      {
        accentClass: "bg-slate-400",
        detail: `${configuredTargetCount} phase${configuredTargetCount === 1 ? "" : "s"} with target snapshots`,
        label: "Inactive",
        value: inactivePhaseCount
      }
    ],
    [configuredTargetCount, inactivePhaseCount, phase, phases.length]
  );

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6">
        <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-500 shadow-sm">
          Loading configured phases...
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 font-[Inter] text-slate-900 md:px-6">
      <PhaseConfigurationPageHeader
        description="Review every configured phase, including the active one, from a single history view."
        loading={loading}
        onRefresh={loadPhaseHistory}
        stats={headerStats}
        title="All Phases"
        workspaceLabel="Phase Archive"
      />

      {error ? <StatusBanner tone="error" message={error} /> : null}

      <PhaseConfigurationHistoryTable
        helperText={`Showing all ${phases.length} configured phase${phases.length === 1 ? "" : "s"}`}
        phases={phases}
        title="Configured Phases"
      />
    </section>
  );
}
