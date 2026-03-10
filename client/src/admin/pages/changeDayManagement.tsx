import { useEffect, useMemo, useState } from "react";
import {
  fetchCurrentPhase,
  fetchPhaseTargets,
  setPhaseTargets,
  updatePhaseChangeDay,
  updatePhaseSettings
} from "../../service/phase.api";

const TIERS = ["D", "C", "B", "A"];

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
      setSuccess("Targets updated successfully.");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to update targets");
    } finally {
      setSavingTargets(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl">
        <div className="py-10 text-center text-sm text-gray-400">Loading change-day management...</div>
      </div>
    );
  }

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition";

  return (
    <div className="p-6 max-w-6xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-900">Change Day Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Update change day and phase configuration settings for the active phase.
          </p>
        </div>
        <button
          onClick={load}
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors w-fit"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="px-4 py-2.5 rounded-lg border border-green-200 bg-green-50 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      {!currentPhase ? (
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-8 text-center text-sm text-gray-500">
          No active phase found.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Current Phase</p>
              <p className="mt-1 text-sm font-semibold text-gray-800 break-all">
                {currentPhase.phase_name || currentPhase.phase_id || "-"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Change Day Count</p>
              <p className="mt-1 text-xl font-bold text-blue-600">{currentPhase.change_day_number ?? "-"}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Change Day Date</p>
              <p className="mt-1 text-sm font-semibold text-gray-800">{formatDate(currentPhase.change_day)}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Phase End Date</p>
              <p className="mt-1 text-sm font-semibold text-gray-800">{formatDate(currentPhase.end_date)}</p>
            </div>
          </div>

          <section className="rounded-xl border border-gray-100 bg-white p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Update Change Day</h2>
              <p className="text-xs text-gray-500 mt-1">
                Pick a date within the allowed range. Change day count updates automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,260px)_1fr] gap-4 items-end">
              <label className="text-sm block">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Change Day Date
                </div>
                <input
                  type="date"
                  value={selectedChangeDay}
                  min={changeDayRange.min || undefined}
                  max={changeDayRange.max || undefined}
                  onChange={(e) => setSelectedChangeDay(e.target.value)}
                  disabled={!changeDayRange.hasWindow || savingChangeDay}
                  className={inputClass}
                />
              </label>

              <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-600">
                {changeDayRange.hasWindow ? (
                  <>
                    Valid range: <span className="font-medium">{formatDate(changeDayRange.min)}</span> to{" "}
                    <span className="font-medium">{formatDate(changeDayRange.max)}</span>
                  </>
                ) : (
                  <>No valid change-day range available for this phase.</>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onSaveChangeDay}
                disabled={savingChangeDay || !changeDayRange.hasWindow || !currentPhase?.phase_id}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {savingChangeDay ? "Saving..." : "Save Change Day"}
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-gray-100 bg-white p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Update Phase End & Time</h2>
              <p className="text-xs text-gray-500 mt-1">
                Update phase end date and start/end time for the current phase.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="text-sm">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  End Date
                </div>
                <input
                  type="date"
                  value={settingsForm.end_date}
                  min={minEndDate || undefined}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({
                      ...prev,
                      end_date: e.target.value
                    }))
                  }
                  className={inputClass}
                />
              </label>

              <label className="text-sm">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Start Time
                </div>
                <input
                  type="time"
                  value={settingsForm.start_time}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({
                      ...prev,
                      start_time: e.target.value
                    }))
                  }
                  className={inputClass}
                />
              </label>

              <label className="text-sm">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  End Time
                </div>
                <input
                  type="time"
                  value={settingsForm.end_time}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({
                      ...prev,
                      end_time: e.target.value
                    }))
                  }
                  className={inputClass}
                />
              </label>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onSavePhaseSettings}
                disabled={savingPhaseSettings || !currentPhase?.phase_id}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {savingPhaseSettings ? "Saving..." : "Save Phase Settings"}
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-gray-100 bg-white p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Update Targets</h2>
              <p className="text-xs text-gray-500 mt-1">
                Configure group target by tier and individual target for the active phase.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {targets.map((row) => (
                <label
                  key={row.tier}
                  className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Tier {row.tier}
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={row.group_target}
                    onChange={(e) => onTargetChange(row.tier, e.target.value)}
                    className={`${inputClass} mt-2`}
                  />
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,320px)_auto] gap-3 items-end">
              <label className="text-sm">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Individual Target (All Students)
                </div>
                <input
                  type="number"
                  min={0}
                  value={individualTarget}
                  onChange={(e) => setIndividualTarget(e.target.value)}
                  className={inputClass}
                />
              </label>

              <button
                type="button"
                onClick={onSaveTargets}
                disabled={savingTargets || !currentPhase?.phase_id}
                className="w-fit px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {savingTargets ? "Saving..." : "Save Targets"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
