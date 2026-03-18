import { useEffect, useMemo, useState } from "react";
import {
  createPhase,
  fetchAllPhases,
  fetchCurrentPhase,
  fetchPhaseTargets,
  fetchWorkingDaysPreview,
  setPhaseTargets
} from "../../service/phase.api";
import PhaseConfigurationCreateCard from "../components/PhaseConfigurationCreateCard";
import PhaseConfigurationHistoryTable from "../components/PhaseConfigurationHistoryTable";
import PhaseConfigurationInactiveArchive from "../components/PhaseConfigurationInactiveArchive";
import PhaseConfigurationPageHeader from "../components/PhaseConfigurationPageHeader";
import PhaseConfigurationTargetsCard from "../components/PhaseConfigurationTargetsCard";
import {
  attachPhaseDetails,
  collectPhaseGroups,
  defaultTargets,
  formatPhaseDateRange,
  getIndividualTargetInput,
  mapTargetInputs,
  mergeCurrentPhaseState
} from "../components/PhaseConfigurationUtils";

const loadPhaseTargetDetails = async (phaseIds, seedDetails = {}) => {
  const detailMap = { ...seedDetails };
  const uniqueIds = [...new Set((Array.isArray(phaseIds) ? phaseIds : []).filter(Boolean))];
  const pendingIds = uniqueIds.filter((phaseId) => !detailMap[phaseId]);

  if (pendingIds.length === 0) {
    return detailMap;
  }

  const results = await Promise.allSettled(
    pendingIds.map((phaseId) => fetchPhaseTargets(phaseId))
  );

  pendingIds.forEach((phaseId, index) => {
    const result = results[index];
    if (result.status === "fulfilled") {
      detailMap[phaseId] = result.value;
      return;
    }

    detailMap[phaseId] = {
      targets: [],
      individual_target: null,
      hasError: true
    };
  });

  return detailMap;
};

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

export default function PhaseConfiguration() {
  const [phase, setPhase] = useState(null);
  const [targets, setTargets] = useState(defaultTargets());
  const [individualTarget, setIndividualTarget] = useState("");
  const [recentPhases, setRecentPhases] = useState([]);
  const [additionalInactivePhases, setAdditionalInactivePhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [workingDaysLoading, setWorkingDaysLoading] = useState(false);
  const [workingDaysAuto, setWorkingDaysAuto] = useState(false);
  const [workingDaysHolidayCount, setWorkingDaysHolidayCount] = useState(0);
  const [workingDaysError, setWorkingDaysError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    phase_name: "",
    start_date: "",
    end_date: "",
    total_working_days: 10,
    change_day_number: 5,
    start_time: "08:00",
    end_time: "19:00"
  });

  const loadPhaseConfiguration = async () => {
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
        setTargets(mapTargetInputs(currentPhaseTargets));
        setIndividualTarget(getIndividualTargetInput(currentPhaseTargets));
      } else {
        setTargets(defaultTargets());
        setIndividualTarget("");
      }

      const { recentPhases: latestPhases, additionalInactivePhases: inactivePhases } =
        collectPhaseGroups(allPhases);

      const phaseIds = [
        currentPhase?.phase_id,
        ...latestPhases.map((item) => String(item?.phase_id || "").trim()),
        ...inactivePhases.map((item) => String(item?.phase_id || "").trim())
      ];

      const detailMap = await loadPhaseTargetDetails(
        phaseIds,
        currentPhase?.phase_id ? { [currentPhase.phase_id]: currentPhaseTargets } : {}
      );

      setRecentPhases(
        attachPhaseDetails(mergeCurrentPhaseState(latestPhases, currentPhase), detailMap)
      );
      setAdditionalInactivePhases(attachPhaseDetails(inactivePhases, detailMap));
    } catch (e) {
      setPhase(null);
      setTargets(defaultTargets());
      setIndividualTarget("");
      setRecentPhases([]);
      setAdditionalInactivePhases([]);
      setError(e?.response?.data?.error || "Failed to load phase configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhaseConfiguration();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const syncWorkingDays = async () => {
      const startDate = String(form.start_date || "").trim();
      const endDate = String(form.end_date || "").trim();

      if (!startDate || !endDate) {
        if (!cancelled) {
          setWorkingDaysLoading(false);
          setWorkingDaysAuto(false);
          setWorkingDaysHolidayCount(0);
          setWorkingDaysError("");
        }
        return;
      }

      if (endDate <= startDate) {
        if (!cancelled) {
          setWorkingDaysLoading(false);
          setWorkingDaysAuto(true);
          setWorkingDaysHolidayCount(0);
          setWorkingDaysError("End date must be after start date.");
        }
        return;
      }

      setWorkingDaysLoading(true);
      setWorkingDaysAuto(true);
      setWorkingDaysError("");

      try {
        const preview = await fetchWorkingDaysPreview(startDate, endDate);
        if (cancelled) return;

        setForm((prev) => {
          if (prev.start_date !== startDate || prev.end_date !== endDate) {
            return prev;
          }

          return {
            ...prev,
            total_working_days:
              preview?.total_working_days === null || preview?.total_working_days === undefined
                ? ""
                : String(preview.total_working_days)
          };
        });
        setWorkingDaysHolidayCount(Number(preview?.holiday_count) || 0);
      } catch (e) {
        if (cancelled) return;
        setWorkingDaysError(
          e?.response?.data?.error || "Unable to calculate working days for the selected dates."
        );
      } finally {
        if (!cancelled) {
          setWorkingDaysLoading(false);
        }
      }
    };

    syncWorkingDays();

    return () => {
      cancelled = true;
    };
  }, [form.start_date, form.end_date]);

  const canCreate = useMemo(() => {
    const hasPhaseName = String(form.phase_name || "").trim().length > 0;
    const parsedChangeDayNumber = Number(form.change_day_number);
    const parsedTotalWorkingDays = Number(form.total_working_days);
    const hasValidDateInputs =
      form.start_date &&
      Number.isInteger(parsedChangeDayNumber) &&
      parsedChangeDayNumber > 0 &&
      (!form.end_date || String(form.end_date) > String(form.start_date));
    const hasValidWorkingDays =
      Number.isInteger(parsedTotalWorkingDays) &&
      parsedTotalWorkingDays > 0 &&
      parsedChangeDayNumber < parsedTotalWorkingDays;

    const hasValidTargets = targets.every((targetRow) => {
      const groupTarget = Number(targetRow.group_target);
      return Number.isFinite(groupTarget) && groupTarget >= 0;
    });

    const parsedIndividualTarget = Number(individualTarget);
    const hasValidIndividualTarget =
      Number.isFinite(parsedIndividualTarget) && parsedIndividualTarget >= 0;

    return (
      hasPhaseName &&
      hasValidDateInputs &&
      hasValidWorkingDays &&
      hasValidTargets &&
      hasValidIndividualTarget &&
      !workingDaysLoading
    );
  }, [form, targets, individualTarget, workingDaysLoading]);

  const configuredTargetCount = useMemo(() => {
    const groupTargets = targets.filter(
      (row) => String(row?.group_target ?? "").trim() !== ""
    ).length;

    return groupTargets + (String(individualTarget || "").trim() ? 1 : 0);
  }, [targets, individualTarget]);

  const headerStats = useMemo(
    () => ({
      activePhaseLabel: phase?.phase_name || phase?.phase_id || "No active phase",
      activePhaseDetail: phase?.phase_id ? formatPhaseDateRange(phase) : "Create your next phase",
      statusLabel: String(phase?.status || "inactive").toUpperCase(),
      statusDetail:
        phase?.total_working_days || phase?.total_working_days === 0
          ? `${phase.total_working_days} working days`
          : "No schedule configured",
      targetLabel: `${configuredTargetCount}/5`,
      targetDetail: "4 group tiers + 1 individual target",
      archiveLabel: additionalInactivePhases.length,
      archiveDetail: `${recentPhases.length} recent phase${recentPhases.length === 1 ? "" : "s"} shown`
    }),
    [additionalInactivePhases.length, configuredTargetCount, phase, recentPhases.length]
  );

  const onCreatePhase = async (e) => {
    e.preventDefault();
    if (!canCreate) return;

    setCreateLoading(true);
    setError("");
    setSuccess("");

    try {
      const normalizedTargets = targets.map((targetRow) => ({
        tier: targetRow.tier,
        group_target: Number(targetRow.group_target)
      }));
      const parsedIndividualTarget = Number(individualTarget);

      if (
        normalizedTargets.some(
          (targetRow) =>
            !Number.isFinite(targetRow.group_target) || targetRow.group_target < 0
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
        total_working_days: Number(form.total_working_days),
        change_day_number: Number(form.change_day_number),
        start_time: form.start_time,
        end_time: form.end_time,
        targets: normalizedTargets,
        individual_target: parsedIndividualTarget
      };

      if (form.end_date) {
        payload.end_date = form.end_date;
      }

      const response = await createPhase(payload);
      setPhase(response?.phase || null);
      await loadPhaseConfiguration();
      setSuccess("Phase created successfully.");
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to create phase");
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
      const payload = targets.map((targetRow) => ({
        tier: targetRow.tier,
        group_target: Number(targetRow.group_target)
      }));
      const parsedIndividualTarget = Number(individualTarget);

      if (
        payload.some(
          (targetRow) => Number.isNaN(targetRow.group_target) || targetRow.group_target < 0
        ) ||
        Number.isNaN(parsedIndividualTarget) ||
        parsedIndividualTarget < 0
      ) {
        setError("All group targets and individual target must be valid numbers.");
        return;
      }

      await setPhaseTargets(phase.phase_id, payload, parsedIndividualTarget);
      setSuccess("Targets saved successfully.");
      await loadPhaseConfiguration();
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to save targets");
    } finally {
      setTargetsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6">
        <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-500 shadow-sm">
          Loading phase configuration...
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 font-[Inter] text-slate-900 md:px-6">
      <PhaseConfigurationPageHeader
        stats={headerStats}
        loading={loading}
        onRefresh={loadPhaseConfiguration}
      />

      {error ? <StatusBanner tone="error" message={error} /> : null}
      {success ? <StatusBanner tone="success" message={success} /> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PhaseConfigurationCreateCard
          canCreate={canCreate}
          createLoading={createLoading}
          form={form}
          onSubmit={onCreatePhase}
          setForm={setForm}
          workingDaysAuto={workingDaysAuto}
          workingDaysError={workingDaysError}
          workingDaysHolidayCount={workingDaysHolidayCount}
          workingDaysLoading={workingDaysLoading}
        />

        <PhaseConfigurationTargetsCard
          individualTarget={individualTarget}
          onSaveTargets={onSaveTargets}
          onTargetChange={onTargetChange}
          phase={phase}
          setIndividualTarget={setIndividualTarget}
          targets={targets}
          targetsLoading={targetsLoading}
        />
      </div>

      <PhaseConfigurationHistoryTable recentPhases={recentPhases} />

      <PhaseConfigurationInactiveArchive
        additionalInactivePhases={additionalInactivePhases}
      />
    </section>
  );
}
