import { useEffect, useMemo, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import GroupManagementActionModal from "../components/groups/GroupManagementActionModal";
import { inputClass } from "../components/groups/groupManagement.constants";
import ChangeDayManagementSectionShell from "../components/ChangeDayManagementSectionShell";
import IncubationConfigurationPolicySection from "../components/incubation/IncubationConfigurationPolicySection";
import IncubationConfigurationToggleCard from "../components/incubation/IncubationConfigurationToggleCard";
import {
  fetchCurrentPhase,
  fetchPhaseTargets,
  setPhaseTargets,
  updatePhaseChangeDay,
  updatePhaseSettings
} from "../../service/phase.api";
import {
  createHoliday,
  deleteHoliday,
  fetchHolidayById,
  fetchHolidays,
  fetchOperationalPolicy,
  updateHoliday,
  updateOperationalPolicy
} from "../../service/systemConfig.api";

const TIERS = ["A", "B", "C", "D"];

const DEFAULT_POLICY_FORM = {
  incubation_duration_days: 1,
  enforce_change_day_for_leave: true,
  min_group_members: 9,
  max_group_members: 11,
  allow_student_group_creation: false,
  require_leadership_for_activation: true
};

const DEFAULT_PHASE_SETTINGS = {
  end_date: "",
  start_time: "08:00",
  end_time: "19:00"
};

const DEFAULT_HOLIDAY_FORM = {
  holiday_date: "",
  holiday_name: "",
  description: ""
};

const defaultTargets = () =>
  TIERS.map((tier) => ({
    tier,
    group_target: ""
  }));

const toBool = (value) => Boolean(value);

const normalizePolicyForm = (data) => ({
  incubation_duration_days: Number(
    data?.incubation_duration_days ?? DEFAULT_POLICY_FORM.incubation_duration_days
  ),
  enforce_change_day_for_leave: toBool(data?.enforce_change_day_for_leave),
  min_group_members: Number(data?.min_group_members ?? DEFAULT_POLICY_FORM.min_group_members),
  max_group_members: Number(data?.max_group_members ?? DEFAULT_POLICY_FORM.max_group_members),
  allow_student_group_creation: toBool(data?.allow_student_group_creation),
  require_leadership_for_activation: toBool(data?.require_leadership_for_activation)
});

const pad2 = (value) => String(value).padStart(2, "0");

const toDateOnlyLocal = (value = new Date()) => {
  const year = value.getFullYear();
  const month = pad2(value.getMonth() + 1);
  const day = pad2(value.getDate());
  return `${year}-${month}-${day}`;
};

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
  const date = parseDateValue(value);
  if (!date) return value || "-";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  });
};

const toDateInput = (value) => {
  const date = parseDateValue(value);
  if (!date) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

const toTimeInput = (value) => {
  const match = /^(\d{2}):(\d{2})/.exec(String(value || "").trim());
  if (!match) return "";
  return `${match[1]}:${match[2]}`;
};

const addDays = (date, days) => {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
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

function StatusBanner({ message, tone }) {
  const toneClass =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClass}`}>{message}</div>;
}

function StatPill({ accentClass, detail, label, value }) {
  return (
    <article className="rounded-xl border border-white/80 bg-white/90 px-3 py-3 shadow-sm">
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

function SettingsHero({ loading, onRefresh, stats }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#1754cf]/10 bg-[#1754cf]/5 p-4 md:p-5">
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
              Admin Workspace
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
            </div>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
          >
            <RefreshRoundedIcon sx={{ fontSize: 18 }} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          <StatPill
            accentClass="bg-[#1754cf]"
            detail="Editable global policy controls"
            label="Policy Toggles"
            value={`${stats.enabledPolicyCount}/${stats.totalPolicyCount}`}
          />
          <StatPill
            accentClass="bg-emerald-500"
            detail="Current phase in settings workspace"
            label="Active Phase"
            value={stats.activePhaseLabel}
          />
          <StatPill
            accentClass="bg-amber-500"
            detail="Calendar dates excluded from working days"
            label="Holidays"
            value={stats.holidayCount}
          />
          <StatPill
            accentClass="bg-sky-500"
            detail="Current group size policy window"
            label="Member Window"
            value={stats.memberWindowLabel}
          />
        </div>
      </div>

      <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-[#1754cf]/10 blur-3xl" />
    </section>
  );
}

function NumberField({ label, max, min, onChange, value }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-900">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        className={inputClass}
        value={value}
        onChange={onChange}
      />
    </label>
  );
}

function HolidayFormModal({ busy, form, onCancel, onChange, onSubmit, open }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 p-4">
      <button
        type="button"
        aria-label="Close holiday editor"
        onClick={busy ? undefined : onCancel}
        className="absolute inset-0"
      />

      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_70px_rgba(15,23,42,0.24)]">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-5">
          <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-[#1754cf]">
            Holiday Form
          </span>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900">Update holiday</h3>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-6 py-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-900">Holiday Date</span>
            <input
              type="date"
              className={inputClass}
              value={form.holiday_date}
              onChange={(event) => onChange("holiday_date", event.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-900">Holiday Name</span>
            <input
              type="text"
              className={inputClass}
              value={form.holiday_name}
              onChange={(event) => onChange("holiday_name", event.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-900">Description</span>
            <textarea
              className={`${inputClass} min-h-24 resize-y py-3`}
              value={form.description}
              onChange={(event) => onChange("description", event.target.value)}
            />
          </label>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1754cf] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#1754cf]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            >
              <SaveRoundedIcon sx={{ fontSize: 18 }} />
              {busy ? "Saving..." : "Update Holiday"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HolidayRow({ deleteBusy, editBusy, holiday, onDelete, onEdit }) {
  return (
    <tr className="hover:bg-slate-50/80">
      <td className="px-5 py-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#1754cf]/10 px-2.5 py-1 text-xs font-semibold text-[#1754cf]">
          <EventAvailableRoundedIcon sx={{ fontSize: 16 }} />
          {formatDate(holiday.holiday_date)}
        </div>
      </td>
      <td className="px-5 py-4 text-sm font-semibold text-slate-900">{holiday.holiday_name}</td>
      <td className="px-5 py-4 text-sm text-slate-600">{holiday.description || "-"}</td>
      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(holiday)}
            disabled={editBusy || deleteBusy}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
          >
            <EditRoundedIcon sx={{ fontSize: 16 }} />
            {editBusy ? "Loading..." : "Edit"}
          </button>

          <button
            type="button"
            onClick={() => onDelete(holiday)}
            disabled={deleteBusy || editBusy}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-wait disabled:opacity-70"
          >
            <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function SettingsPage() {
  const [policyForm, setPolicyForm] = useState(DEFAULT_POLICY_FORM);
  const [lastSavedPolicyForm, setLastSavedPolicyForm] = useState(DEFAULT_POLICY_FORM);
  const [currentPhase, setCurrentPhase] = useState(null);
  const [selectedChangeDay, setSelectedChangeDay] = useState("");
  const [phaseSettingsForm, setPhaseSettingsForm] = useState(DEFAULT_PHASE_SETTINGS);
  const [targets, setTargets] = useState(defaultTargets());
  const [individualTarget, setIndividualTarget] = useState("");
  const [holidays, setHolidays] = useState([]);
  const [holidayQuery, setHolidayQuery] = useState("");
  const [holidayForm, setHolidayForm] = useState({
    ...DEFAULT_HOLIDAY_FORM,
    holiday_date: toDateOnlyLocal()
  });
  const [editState, setEditState] = useState({
    open: false,
    holidayId: null,
    form: DEFAULT_HOLIDAY_FORM
  });
  const [deleteState, setDeleteState] = useState({
    open: false,
    holiday: null
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [savingChangeDay, setSavingChangeDay] = useState(false);
  const [savingPhaseSettings, setSavingPhaseSettings] = useState(false);
  const [savingTargets, setSavingTargets] = useState(false);
  const [savingHoliday, setSavingHoliday] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalLoadingId, setModalLoadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hydrateTargets = (targetResponse) => {
    const rows = Array.isArray(targetResponse?.targets) ? targetResponse.targets : [];
    setTargets(
      TIERS.map((tier) => {
        const row = rows.find((item) => String(item.tier).toUpperCase() === tier);
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

  const loadPolicy = async () => {
    const data = await fetchOperationalPolicy();
    const nextForm = normalizePolicyForm(data);
    setPolicyForm(nextForm);
    setLastSavedPolicyForm(nextForm);
  };

  const loadPhase = async () => {
    const active = await fetchCurrentPhase();
    setCurrentPhase(active || null);
    setSelectedChangeDay(toDateInput(active?.change_day));
    setPhaseSettingsForm({
      end_date: toDateInput(active?.end_date),
      start_time: toTimeInput(active?.start_time) || DEFAULT_PHASE_SETTINGS.start_time,
      end_time: toTimeInput(active?.end_time) || DEFAULT_PHASE_SETTINGS.end_time
    });

    if (active?.phase_id) {
      const targetData = await fetchPhaseTargets(active.phase_id);
      hydrateTargets(targetData);
    } else {
      setTargets(defaultTargets());
      setIndividualTarget("");
    }
  };

  const loadHolidays = async () => {
    const data = await fetchHolidays();
    setHolidays(Array.isArray(data) ? data : []);
  };

  const loadAll = async ({ background = false, preserveSuccess = false } = {}) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");
    if (!preserveSuccess) {
      setSuccess("");
    }

    try {
      await Promise.all([loadPolicy(), loadPhase(), loadHolidays()]);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.response?.data?.error || "Failed to load settings"
      );
    } finally {
      if (background) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const policyIsDirty = useMemo(
    () => JSON.stringify(policyForm) !== JSON.stringify(lastSavedPolicyForm),
    [policyForm, lastSavedPolicyForm]
  );

  const policyCanSave = useMemo(() => {
    const min = Number(policyForm.min_group_members);
    const max = Number(policyForm.max_group_members);
    const incubation = Number(policyForm.incubation_duration_days);
    return (
      Number.isInteger(min) &&
      Number.isInteger(max) &&
      Number.isInteger(incubation) &&
      min >= 1 &&
      max >= min &&
      incubation >= 0 &&
      incubation <= 30
    );
  }, [policyForm]);

  const changeDayRange = useMemo(() => getValidChangeDayRange(currentPhase), [currentPhase]);

  const minEndDate = useMemo(() => {
    const startDate = parseDateValue(currentPhase?.start_date);
    if (!startDate) return "";
    return toDateInput(addDays(startDate, 1));
  }, [currentPhase]);

  const targetConfiguredCount = useMemo(() => {
    const groupTargets = targets.filter((row) => String(row.group_target).trim() !== "").length;
    return groupTargets + (String(individualTarget || "").trim() ? 1 : 0);
  }, [targets, individualTarget]);

  const settingsStats = useMemo(() => {
    const enabledPolicyCount = [
      policyForm.enforce_change_day_for_leave,
      policyForm.allow_student_group_creation,
      policyForm.require_leadership_for_activation
    ].filter(Boolean).length;

    return {
      enabledPolicyCount,
      totalPolicyCount: 3,
      activePhaseLabel: currentPhase?.phase_name || currentPhase?.phase_id || "No active phase",
      holidayCount: holidays.length,
      memberWindowLabel: `${Number(policyForm.min_group_members) || 0}-${Number(policyForm.max_group_members) || 0}`
    };
  }, [currentPhase, holidays.length, policyForm]);

  const filteredHolidays = useMemo(() => {
    const query = String(holidayQuery || "").trim().toLowerCase();
    if (!query) return holidays;

    return holidays.filter((holiday) =>
      [holiday.holiday_date, holiday.holiday_name, holiday.description]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(query))
    );
  }, [holidayQuery, holidays]);

  const savePolicy = async () => {
    if (!policyCanSave) {
      setError("Please enter valid policy values.");
      return;
    }

    setSavingPolicy(true);
    setError("");
    setSuccess("");

    try {
      await updateOperationalPolicy({
        incubation_duration_days: Number(policyForm.incubation_duration_days),
        enforce_change_day_for_leave: Boolean(policyForm.enforce_change_day_for_leave),
        min_group_members: Number(policyForm.min_group_members),
        max_group_members: Number(policyForm.max_group_members),
        allow_student_group_creation: Boolean(policyForm.allow_student_group_creation),
        require_leadership_for_activation: Boolean(
          policyForm.require_leadership_for_activation
        )
      });
      await loadPolicy();
      setSuccess("Operational policy updated.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save operational policy");
    } finally {
      setSavingPolicy(false);
    }
  };

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

    if (selectedChangeDay < changeDayRange.min || selectedChangeDay > changeDayRange.max) {
      setError(`Change day must be between ${changeDayRange.min} and ${changeDayRange.max}.`);
      return;
    }

    setSavingChangeDay(true);
    setError("");
    setSuccess("");

    try {
      await updatePhaseChangeDay(currentPhase.phase_id, selectedChangeDay);
      await loadPhase();
      setSuccess("Change day updated.");
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

    if (!phaseSettingsForm.end_date) {
      setError("End date is required.");
      return;
    }

    if (minEndDate && phaseSettingsForm.end_date < minEndDate) {
      setError(`End date must be on or after ${minEndDate}.`);
      return;
    }

    if (!phaseSettingsForm.start_time || !phaseSettingsForm.end_time) {
      setError("Start time and end time are required.");
      return;
    }

    setSavingPhaseSettings(true);
    setError("");
    setSuccess("");

    try {
      await updatePhaseSettings(currentPhase.phase_id, {
        end_date: phaseSettingsForm.end_date,
        start_time: phaseSettingsForm.start_time,
        end_time: phaseSettingsForm.end_time
      });
      await loadPhase();
      setSuccess("Active phase settings updated.");
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

    const payload = targets.map((row) => ({
      tier: row.tier,
      group_target: Number(row.group_target)
    }));
    const parsedIndividualTarget = Number(individualTarget);

    if (
      payload.some((row) => Number.isNaN(row.group_target) || row.group_target < 0) ||
      Number.isNaN(parsedIndividualTarget) ||
      parsedIndividualTarget < 0
    ) {
      setError("All group targets and the individual target must be valid numbers.");
      return;
    }

    setSavingTargets(true);
    setError("");
    setSuccess("");

    try {
      await setPhaseTargets(currentPhase.phase_id, payload, parsedIndividualTarget);
      await loadPhase();
      setSuccess("Active phase targets updated.");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to update phase targets");
    } finally {
      setSavingTargets(false);
    }
  };

  const onCreateHoliday = async (event) => {
    event.preventDefault();

    if (!holidayForm.holiday_date || !String(holidayForm.holiday_name || "").trim()) {
      setError("Holiday date and name are required.");
      return;
    }

    setSavingHoliday(true);
    setError("");
    setSuccess("");

    try {
      await createHoliday({
        holiday_date: holidayForm.holiday_date,
        holiday_name: String(holidayForm.holiday_name || "").trim(),
        description: String(holidayForm.description || "").trim()
      });
      await loadHolidays();
      setHolidayForm({
        ...DEFAULT_HOLIDAY_FORM,
        holiday_date: toDateOnlyLocal()
      });
      setSuccess("Holiday added.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save holiday");
    } finally {
      setSavingHoliday(false);
    }
  };

  const openEditModal = async (holiday) => {
    setError("");
    setSuccess("");
    setModalLoadingId(holiday.holiday_id);

    try {
      const latestHoliday = await fetchHolidayById(holiday.holiday_id);
      setEditState({
        open: true,
        holidayId: holiday.holiday_id,
        form: {
          holiday_date: latestHoliday?.holiday_date || holiday.holiday_date || "",
          holiday_name: latestHoliday?.holiday_name || holiday.holiday_name || "",
          description: latestHoliday?.description || holiday.description || ""
        }
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load holiday details");
    } finally {
      setModalLoadingId(null);
    }
  };

  const closeEditModal = (force = false) => {
    if (modalSaving && !force) return;
    setEditState({
      open: false,
      holidayId: null,
      form: DEFAULT_HOLIDAY_FORM
    });
  };

  const onEditFieldChange = (field, value) => {
    setEditState((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        [field]: value
      }
    }));
  };

  const onEditSubmit = async (event) => {
    event.preventDefault();
    if (!editState.holidayId) return;

    if (!editState.form.holiday_date || !String(editState.form.holiday_name || "").trim()) {
      setError("Holiday date and name are required.");
      return;
    }

    setModalSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateHoliday(editState.holidayId, {
        holiday_date: editState.form.holiday_date,
        holiday_name: String(editState.form.holiday_name || "").trim(),
        description: String(editState.form.description || "").trim()
      });
      await loadHolidays();
      closeEditModal(true);
      setSuccess("Holiday updated.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update holiday");
    } finally {
      setModalSaving(false);
    }
  };

  const openDeleteModal = (holiday) => {
    setDeleteState({
      open: true,
      holiday
    });
    setError("");
    setSuccess("");
  };

  const closeDeleteModal = (force = false) => {
    if (deletingId && !force) return;
    setDeleteState({
      open: false,
      holiday: null
    });
  };

  const onDeleteConfirm = async () => {
    const holiday = deleteState.holiday;
    if (!holiday?.holiday_id) return;

    setDeletingId(holiday.holiday_id);
    setError("");
    setSuccess("");

    try {
      await deleteHoliday(holiday.holiday_id);
      await loadHolidays();
      closeDeleteModal(true);
      if (editState.holidayId === holiday.holiday_id) {
        closeEditModal(true);
      }
      setSuccess("Holiday deleted.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete holiday");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6">
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-500 shadow-sm">
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 font-[Inter] text-slate-900 md:px-6">
      <SettingsHero
        loading={refreshing}
        onRefresh={() => loadAll({ background: true })}
        stats={settingsStats}
      />

      {error ? <StatusBanner tone="error" message={error} /> : null}
      {success ? <StatusBanner tone="success" message={success} /> : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <div className="space-y-6">
          <IncubationConfigurationPolicySection
            eyebrow="System Policy"
            title="Operational controls"
          >
            <div className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <NumberField
                    label="Minimum Active Members"
                    max={200}
                    min={1}
                    onChange={(event) =>
                      setPolicyForm((prev) => ({
                        ...prev,
                        min_group_members: Number(event.target.value)
                      }))
                    }
                    value={policyForm.min_group_members}
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <NumberField
                    label="Maximum Active Members"
                    max={200}
                    min={1}
                    onChange={(event) =>
                      setPolicyForm((prev) => ({
                        ...prev,
                        max_group_members: Number(event.target.value)
                      }))
                    }
                    value={policyForm.max_group_members}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                <NumberField
                  label="Incubation Duration (days)"
                  max={30}
                  min={0}
                  onChange={(event) =>
                    setPolicyForm((prev) => ({
                      ...prev,
                      incubation_duration_days: Number(event.target.value)
                    }))
                  }
                  value={policyForm.incubation_duration_days}
                />
              </div>

              <IncubationConfigurationToggleCard
                checked={policyForm.enforce_change_day_for_leave}
                label="Enforce Change Day for Leave"
                onChange={(event) =>
                  setPolicyForm((prev) => ({
                    ...prev,
                    enforce_change_day_for_leave: event.target.checked
                  }))
                }
              />

              <IncubationConfigurationToggleCard
                checked={policyForm.require_leadership_for_activation}
                label="Require 4 leadership roles before activation"
                onChange={(event) =>
                  setPolicyForm((prev) => ({
                    ...prev,
                    require_leadership_for_activation: event.target.checked
                  }))
                }
              />

              <IncubationConfigurationToggleCard
                checked={policyForm.allow_student_group_creation}
                label="Allow Student Group Creation"
                onChange={(event) =>
                  setPolicyForm((prev) => ({
                    ...prev,
                    allow_student_group_creation: event.target.checked
                  }))
                }
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Policy status</p>
                <p
                  className={`mt-1 text-xs font-medium ${
                    !policyCanSave
                      ? "text-red-600"
                      : policyIsDirty
                        ? "text-amber-600"
                        : "text-slate-500"
                  }`}
                >
                  {!policyCanSave
                    ? "Enter valid values to save."
                    : policyIsDirty
                      ? "Unsaved changes"
                      : "No pending changes"}
                </p>
              </div>

              <button
                type="button"
                onClick={savePolicy}
                disabled={savingPolicy || !policyCanSave || !policyIsDirty}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1754cf] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#1754cf]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                <SaveRoundedIcon sx={{ fontSize: 18 }} />
                {savingPolicy ? "Saving..." : "Save Policy"}
              </button>
            </div>
          </IncubationConfigurationPolicySection>

          <IncubationConfigurationPolicySection
            eyebrow="Active Phase"
            title="Phase window and targets"
          >
            {!currentPhase ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                No active phase found.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Phase
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {currentPhase.phase_name || currentPhase.phase_id}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Window
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {formatDate(currentPhase.start_date)} to {formatDate(currentPhase.end_date)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Targets
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {targetConfiguredCount}/5 configured
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <ChangeDayManagementSectionShell
                    title="Update Change Day"
                    description={
                      changeDayRange.hasWindow
                        ? `Allowed range: ${formatDate(changeDayRange.min)} - ${formatDate(changeDayRange.max)}`
                        : "No valid change-day range available for this phase."
                    }
                    action={
                      <button
                        type="button"
                        onClick={onSaveChangeDay}
                        disabled={savingChangeDay || !changeDayRange.hasWindow}
                        className="rounded-lg bg-[#1754cf] px-5 py-2.5 text-sm font-bold text-white shadow-[0_18px_40px_rgba(23,84,207,0.22)] transition-all hover:bg-[#154ab4] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                      >
                        {savingChangeDay ? "Saving..." : "Save Change Day"}
                      </button>
                    }
                  >
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        Change Day Date
                      </span>
                      <input
                        type="date"
                        value={selectedChangeDay}
                        min={changeDayRange.min || undefined}
                        max={changeDayRange.max || undefined}
                        onChange={(event) => setSelectedChangeDay(event.target.value)}
                        disabled={!changeDayRange.hasWindow || savingChangeDay}
                        className={inputClass}
                      />
                    </label>
                  </ChangeDayManagementSectionShell>

                  <ChangeDayManagementSectionShell
                    title="Update Phase End and Time"
                    description="Adjust the current phase timing controls."
                    action={
                      <button
                        type="button"
                        onClick={onSavePhaseSettings}
                        disabled={savingPhaseSettings}
                        className="rounded-lg bg-[#1754cf] px-5 py-2.5 text-sm font-bold text-white shadow-[0_18px_40px_rgba(23,84,207,0.22)] transition-all hover:bg-[#154ab4] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                      >
                        {savingPhaseSettings ? "Saving..." : "Save Phase Settings"}
                      </button>
                    }
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700">
                          End Date
                        </span>
                        <input
                          type="date"
                          value={phaseSettingsForm.end_date}
                          min={minEndDate || undefined}
                          onChange={(event) =>
                            setPhaseSettingsForm((prev) => ({
                              ...prev,
                              end_date: event.target.value
                            }))
                          }
                          className={inputClass}
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700">
                          Start Time
                        </span>
                        <input
                          type="time"
                          value={phaseSettingsForm.start_time}
                          onChange={(event) =>
                            setPhaseSettingsForm((prev) => ({
                              ...prev,
                              start_time: event.target.value
                            }))
                          }
                          className={inputClass}
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700">
                          End Time
                        </span>
                        <input
                          type="time"
                          value={phaseSettingsForm.end_time}
                          onChange={(event) =>
                            setPhaseSettingsForm((prev) => ({
                              ...prev,
                              end_time: event.target.value
                            }))
                          }
                          className={inputClass}
                        />
                      </label>
                    </div>
                  </ChangeDayManagementSectionShell>

                  <ChangeDayManagementSectionShell
                    title="Update Targets"
                    description="Configure group tiers and the individual target for the active phase."
                    border={false}
                    action={
                      <button
                        type="button"
                        onClick={onSaveTargets}
                        disabled={savingTargets}
                        className="rounded-lg bg-[#1754cf] px-5 py-2.5 text-sm font-bold text-white shadow-[0_18px_40px_rgba(23,84,207,0.22)] transition-all hover:bg-[#154ab4] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                      >
                        {savingTargets ? "Saving..." : "Save Targets"}
                      </button>
                    }
                  >
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                      {targets.map((row) => (
                        <label
                          key={row.tier}
                          className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                            Tier {row.tier}
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={row.group_target}
                            onChange={(event) => onTargetChange(row.tier, event.target.value)}
                            className="w-full border-none bg-transparent p-0 text-lg font-bold text-slate-900 outline-none focus:ring-0"
                          />
                        </label>
                      ))}
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        Individual Target
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={individualTarget}
                        onChange={(event) => setIndividualTarget(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 text-2xl font-black text-slate-900 outline-none transition focus:border-[#1754cf] focus:ring-4 focus:ring-[#1754cf]/10"
                      />
                    </label>
                  </ChangeDayManagementSectionShell>
                </div>
              </div>
            )}
          </IncubationConfigurationPolicySection>
        </div>

        <div className="space-y-6">
          <IncubationConfigurationPolicySection
            eyebrow="Holiday Calendar"
            title="Manage excluded dates"
          >
            <form onSubmit={onCreateHoliday} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-900">
                    Holiday Date
                  </span>
                  <input
                    type="date"
                    className={inputClass}
                    value={holidayForm.holiday_date}
                    onChange={(event) =>
                      setHolidayForm((prev) => ({
                        ...prev,
                        holiday_date: event.target.value
                      }))
                    }
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-900">
                    Holiday Name
                  </span>
                  <input
                    type="text"
                    className={inputClass}
                    value={holidayForm.holiday_name}
                    onChange={(event) =>
                      setHolidayForm((prev) => ({
                        ...prev,
                        holiday_name: event.target.value
                      }))
                    }
                    placeholder="e.g. Republic Day"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-900">
                  Description
                </span>
                <textarea
                  className={`${inputClass} min-h-24 resize-y py-3`}
                  value={holidayForm.description}
                  onChange={(event) =>
                    setHolidayForm((prev) => ({
                      ...prev,
                      description: event.target.value
                    }))
                  }
                  placeholder="Optional note"
                />
              </label>

              <button
                type="submit"
                disabled={savingHoliday}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1754cf] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#1754cf]/20 transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
              >
                <AddRoundedIcon sx={{ fontSize: 18 }} />
                {savingHoliday ? "Saving..." : "Add Holiday"}
              </button>
            </form>
          </IncubationConfigurationPolicySection>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1754cf]/10 text-[#1754cf]">
                    <TuneRoundedIcon sx={{ fontSize: 22 }} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Holiday List</p>
                    <p className="text-xs text-slate-500">
                      {filteredHolidays.length} visible dates
                    </p>
                  </div>
                </div>

                <div className="relative w-full sm:w-72">
                  <SearchRoundedIcon
                    sx={{ fontSize: 20 }}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={holidayQuery}
                    onChange={(event) => setHolidayQuery(event.target.value)}
                    className={`${inputClass} pl-10`}
                    placeholder="Search holidays"
                  />
                </div>
              </div>
            </div>

            {filteredHolidays.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500">
                No holidays found.
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="min-w-[720px] w-full border-collapse text-left">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        Date
                      </th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        Holiday
                      </th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        Description
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredHolidays.map((holiday) => (
                      <HolidayRow
                        key={holiday.holiday_id}
                        holiday={holiday}
                        onDelete={openDeleteModal}
                        onEdit={openEditModal}
                        deleteBusy={deletingId === holiday.holiday_id}
                        editBusy={modalLoadingId === holiday.holiday_id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>
      </div>

      <HolidayFormModal
        busy={modalSaving}
        form={editState.form}
        onCancel={closeEditModal}
        onChange={onEditFieldChange}
        onSubmit={onEditSubmit}
        open={editState.open}
      />

      <GroupManagementActionModal
        busy={Boolean(deletingId)}
        cancelLabel="Cancel"
        confirmLabel="Delete Holiday"
        message={
          deleteState.holiday
            ? `Delete ${deleteState.holiday.holiday_name} on ${formatDate(deleteState.holiday.holiday_date)}?`
            : ""
        }
        mode="confirm"
        onCancel={closeDeleteModal}
        onConfirm={onDeleteConfirm}
        open={deleteState.open}
        title="Delete holiday?"
        tone="danger"
      />
    </section>
  );
}
