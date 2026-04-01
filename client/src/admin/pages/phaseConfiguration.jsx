import { useEffect, useMemo, useState } from "react";
import { useRealtimeEvents } from "../../hooks/useRealtimeEvents";
import { REALTIME_EVENTS } from "../../lib/realtime";
import { useAppDispatch } from "../../store/hooks";
import { sharedApi } from "../../store/api/sharedApi";
import {
  createPhase,
  fetchAllPhases,
  fetchCurrentPhase,
  fetchPhaseTargets,
  fetchWorkingDaysPreview
} from "../../service/phase.api";
import PhaseConfigurationCreateCard from "../components/PhaseConfigurationCreateCard";
import PhaseConfigurationPageHeader from "../components/PhaseConfigurationPageHeader";
import PhaseConfigurationTargetsCard from "../components/PhaseConfigurationTargetsCard";
import {
  defaultTargets,
  formatPhaseDateRange,
  getIndividualTargetInput,
  mapTargetInputs
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

export default function PhaseConfiguration() {
  const dispatch = useAppDispatch();
  const [phase, setPhase] = useState(null);
  const [targets, setTargets] = useState(defaultTargets());
  const [individualTarget, setIndividualTarget] = useState("");
  const [configuredPhaseCount, setConfiguredPhaseCount] = useState(0);
  const [inactivePhaseCount, setInactivePhaseCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
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
      setConfiguredPhaseCount(Array.isArray(allPhases) ? allPhases.length : 0);
      setInactivePhaseCount(
        (Array.isArray(allPhases) ? allPhases : []).filter(
          (item) => String(item?.status || "").toUpperCase() !== "ACTIVE"
        ).length
      );

      if (currentPhase?.phase_id) {
        const currentPhaseTargets = await fetchPhaseTargets(currentPhase.phase_id);
        setTargets(mapTargetInputs(currentPhaseTargets));
        setIndividualTarget(getIndividualTargetInput(currentPhaseTargets));
      } else {
        setTargets(defaultTargets());
        setIndividualTarget("");
      }
    } catch (e) {
      setPhase(null);
      setTargets(defaultTargets());
      setIndividualTarget("");
      setConfiguredPhaseCount(0);
      setInactivePhaseCount(0);
      setError(e?.response?.data?.error || "Failed to load phase creation workspace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhaseConfiguration();
  }, []);

  useRealtimeEvents(REALTIME_EVENTS.PHASE, () => {
    void loadPhaseConfiguration();
  });

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
    () => [
      {
        accentClass: "bg-[#1754cf]",
        detail: phase?.phase_id ? formatPhaseDateRange(phase) : "Create your next phase",
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
        detail: "4 group tiers + 1 individual target",
        label: "Targets",
        value: `${configuredTargetCount}/5`
      },
      {
        accentClass: "bg-slate-400",
        detail: `${inactivePhaseCount} inactive or completed phase${inactivePhaseCount === 1 ? "" : "s"}`,
        label: "Configured",
        value: configuredPhaseCount
      }
    ],
    [configuredPhaseCount, configuredTargetCount, inactivePhaseCount, phase]
  );

  const onCreatePhase = async (event) => {
    event.preventDefault();
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
      dispatch(sharedApi.util.invalidateTags([{ type: "PhaseContext", id: "CURRENT" }]));
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

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6">
        <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-500 shadow-sm">
          Loading phase creation workspace...
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 font-[Inter] text-slate-900 md:px-6">
      <PhaseConfigurationPageHeader
        description="Create a new phase and prepare the targets that will be saved with it."
        loading={loading}
        onRefresh={loadPhaseConfiguration}
        stats={headerStats}
        title="Phase Creation"
        workspaceLabel="Phase Workspace"
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
          hideAction
          individualTarget={individualTarget}
          onTargetChange={onTargetChange}
          phase={phase}
          setIndividualTarget={setIndividualTarget}
          targets={targets}
          targetsLoading={false}
          title="Phase Targets"
        />
      </div>
    </section>
  );
}
