import { useEffect, useMemo, useState } from "react";
import { useRealtimeEvents } from "../../hooks/useRealtimeEvents";
import { REALTIME_EVENTS } from "../../lib/realtime";
import { sharedApi } from "../../store/api/sharedApi";
import { useAppDispatch } from "../../store/hooks";
import { loadPhaseContext } from "../../store/slices/phaseSlice";
import {
  fetchCurrentPhase,
  fetchPhaseTargets,
  setPhaseTargets,
  updatePhaseChangeDay,
  updatePhaseSettings
} from "../../service/phase.api";
import ChangeDayManagementChangeDaySection from "../components/ChangeDayManagementChangeDaySection";
import ChangeDayManagementOverviewCards from "../components/ChangeDayManagementOverviewCards";
import ChangeDayManagementPageHeader from "../components/ChangeDayManagementPageHeader";
import ChangeDayManagementPhaseSettingsSection from "../components/ChangeDayManagementPhaseSettingsSection";
import ChangeDayManagementStatusBanner from "../components/ChangeDayManagementStatusBanner";
import ChangeDayManagementTargetsSection from "../components/ChangeDayManagementTargetsSection";

const TIERS = ["A", "B", "C", "D"];

const defaultTargets = () =>
  TIERS.map((tier) => ({
    tier,
    group_target: ""
  }));

const pad2 = (value) => String(value).padStart(2, "0");

const parseDateValue = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value).trim());
  if (dateOnlyMatch) {
    return new Date(
      Number(dateOnlyMatch[1]),
      Number(dateOnlyMatch[2]) - 1,
      Number(dateOnlyMatch[3])
    );
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const formatDate = (value) => {
  const d = parseDateValue(value);
  if (!d) return "-";
  return d.toLocaleDateString();
};

const toDateInput = (value) => {
  const d = parseDateValue(value);
  if (!d) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const toTimeInput = (value) => {
  const match = /^(\d{2}):(\d{2})/.exec(String(value || "").trim());
  if (!match) return "";
  return `${match[1]}:${match[2]}`;
};

const addDays = (date, days) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
};

const getValidChangeDayRange = (phase) => {
  const startDate = parseDateValue(phase?.start_date);
  const endDate = parseDateValue(phase?.end_date);
  const today = parseDateValue(new Date());

  if (!startDate || !endDate || !today) {
    return { min: "", max: "", hasWindow: false };
  }

  const minDate = addDays(startDate, 1);
  const endMinusOne = addDays(endDate, -1);
  const maxDate = today < endMinusOne ? today : endMinusOne;

  return {
    min: toDateInput(minDate),
    max: toDateInput(maxDate),
    hasWindow: minDate <= maxDate
  };
};

export default function ChangeDayManagement() {
  const dispatch = useAppDispatch();
  const [currentPhase, setCurrentPhase] = useState(null);
  const [selectedChangeDay, setSelectedChangeDay] = useState("");
  const [settingsForm, setSettingsForm] = useState({
    end_date: "",
    start_time: "08:00",
    end_time: "19:00"
  });
  const [targets, setTargets] = useState(defaultTargets());
  const [individualTarget, setIndividualTarget] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingChangeDay, setSavingChangeDay] = useState(false);
  const [savingPhaseSettings, setSavingPhaseSettings] = useState(false);
  const [savingTargets, setSavingTargets] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const changeDayRange = useMemo(
    () => getValidChangeDayRange(currentPhase),
    [currentPhase]
  );

  const minEndDate = useMemo(() => {
    const startDate = parseDateValue(currentPhase?.start_date);
    if (!startDate) return "";
    return toDateInput(addDays(startDate, 1));
  }, [currentPhase]);

  const hydrateTargets = (targetResponse) => {
    const rows = Array.isArray(targetResponse?.targets) ? targetResponse.targets : [];
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
      targetResponse?.individual_target === null || targetResponse?.individual_target === undefined
        ? ""
        : String(targetResponse.individual_target)
    );
  };

  const load = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const active = await fetchCurrentPhase();
      setCurrentPhase(active || null);
      setSelectedChangeDay(toDateInput(active?.change_day));
      setSettingsForm({
        end_date: toDateInput(active?.end_date),
        start_time: toTimeInput(active?.start_time) || "08:00",
        end_time: toTimeInput(active?.end_time) || "19:00"
      });

      if (active?.phase_id) {
        const targetData = await fetchPhaseTargets(active.phase_id);
        hydrateTargets(targetData);
      } else {
        setTargets(defaultTargets());
        setIndividualTarget("");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load phase settings");
      setCurrentPhase(null);
      setSelectedChangeDay("");
      setSettingsForm({
        end_date: "",
        start_time: "08:00",
        end_time: "19:00"
      });
      setTargets(defaultTargets());
      setIndividualTarget("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useRealtimeEvents(REALTIME_EVENTS.PHASE, () => {
    void load();
  });

  const onSaveChangeDay = async () => {
    if (!currentPhase?.phase_id) {
      setError("No active phase found.");
      return;
    }

    if (!changeDayRange.hasWindow) {
      setError("No valid change day range available for this phase.");
      return;
    }

    if (!selectedChangeDay) {
      setError("Select a change day date.");
      return;
    }

    if (
      selectedChangeDay < changeDayRange.min ||
      selectedChangeDay > changeDayRange.max
    ) {
      setError(
        `Change day must be between ${changeDayRange.min} and ${changeDayRange.max}.`
      );
      return;
    }

    setSavingChangeDay(true);
    setError("");
    setSuccess("");
    try {
      const res = await updatePhaseChangeDay(currentPhase.phase_id, selectedChangeDay);
      const updatedPhase = res?.phase || null;
      setCurrentPhase(updatedPhase);
      setSelectedChangeDay(toDateInput(updatedPhase?.change_day || selectedChangeDay));
      setSettingsForm((prev) => ({
        ...prev,
        end_date: toDateInput(updatedPhase?.end_date || prev.end_date),
        start_time: toTimeInput(updatedPhase?.start_time) || prev.start_time,
        end_time: toTimeInput(updatedPhase?.end_time) || prev.end_time
      }));
      dispatch(loadPhaseContext({ force: true }));
      dispatch(sharedApi.util.invalidateTags([{ type: "PhaseContext", id: "CURRENT" }]));
      setSuccess(res?.message || "Change day updated successfully.");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to update change day");
    } finally {
      setSavingChangeDay(false);
    }
  };

  const onSavePhaseSettings = async () => {
    if (!currentPhase?.phase_id) {
      setError("No active phase found.");
      return;
    }

    if (!settingsForm.end_date) {
      setError("End date is required.");
      return;
    }

    if (minEndDate && settingsForm.end_date < minEndDate) {
      setError(`End date must be on or after ${minEndDate}.`);
      return;
    }

    if (!settingsForm.start_time || !settingsForm.end_time) {
      setError("Start time and end time are required.");
      return;
    }

    setSavingPhaseSettings(true);
    setError("");
    setSuccess("");
    try {
      const res = await updatePhaseSettings(currentPhase.phase_id, {
        end_date: settingsForm.end_date,
        start_time: settingsForm.start_time,
        end_time: settingsForm.end_time
      });

      const updatedPhase = res?.phase || null;
      setCurrentPhase(updatedPhase);
      setSettingsForm({
        end_date: toDateInput(updatedPhase?.end_date || settingsForm.end_date),
        start_time: toTimeInput(updatedPhase?.start_time) || settingsForm.start_time,
        end_time: toTimeInput(updatedPhase?.end_time) || settingsForm.end_time
      });
      setSelectedChangeDay((prev) =>
        toDateInput(updatedPhase?.change_day || prev)
      );
      dispatch(loadPhaseContext({ force: true }));
      dispatch(sharedApi.util.invalidateTags([{ type: "PhaseContext", id: "CURRENT" }]));
      setSuccess(res?.message || "Phase settings updated successfully.");
    } catch (err) { 
      setError(err?.response?.data?.error || "Failed to update phase settings");
    } finally {
      setSavingPhaseSettings(false);
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
    if (!currentPhase?.phase_id) {
      setError("No active phase found.");
      return;
    }

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

    setSavingTargets(true);
    setError("");
    setSuccess("");
    try {
      await setPhaseTargets(currentPhase.phase_id, payload, parsedIndividualTarget);
      dispatch(loadPhaseContext({ force: true }));
      dispatch(sharedApi.util.invalidateTags([{ type: "PhaseContext", id: "CURRENT" }]));
      setSuccess("Targets updated successfully.");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to update targets");
    } finally {
      setSavingTargets(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-500 shadow-sm">
        Loading change-day management...
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 font-[Inter] text-slate-900">
      <ChangeDayManagementPageHeader loading={loading} onRefresh={load} />

      {error ? (
        <ChangeDayManagementStatusBanner tone="error" message={error} />
      ) : null}

      {success ? (
        <ChangeDayManagementStatusBanner tone="success" message={success} />
      ) : null}

      {!currentPhase ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
          No active phase found.
        </div>
      ) : (
        <>
          <ChangeDayManagementOverviewCards
            currentPhase={currentPhase}
            formatDate={formatDate}
          />

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <ChangeDayManagementChangeDaySection
              changeDayRange={changeDayRange}
              formatDate={formatDate}
              onSave={onSaveChangeDay}
              saving={savingChangeDay || !currentPhase?.phase_id}
              selectedChangeDay={selectedChangeDay}
              setSelectedChangeDay={setSelectedChangeDay}
            />

            <ChangeDayManagementPhaseSettingsSection
              minEndDate={minEndDate}
              onSave={onSavePhaseSettings}
              saving={savingPhaseSettings || !currentPhase?.phase_id}
              setSettingsForm={setSettingsForm}
              settingsForm={settingsForm}
            />

            <ChangeDayManagementTargetsSection
              individualTarget={individualTarget}
              onSave={onSaveTargets}
              onTargetChange={onTargetChange}
              saving={savingTargets || !currentPhase?.phase_id}
              setIndividualTarget={setIndividualTarget}
              targets={targets}
            />
          </div>
        </>
      )}

      <footer className="pt-2 text-center text-sm text-slate-400">
        © 2024 Student Portal Management System. All rights reserved.
      </footer>
    </section>
  );
}
