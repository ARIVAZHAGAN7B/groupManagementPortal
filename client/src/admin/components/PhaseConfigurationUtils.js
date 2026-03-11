export const TIERS = ["A", "B", "C", "D"];

const pad2 = (value) => String(value).padStart(2, "0");

const parseDateValue = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value).trim());
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

export const createTargetRows = (fallbackValue = "") =>
  TIERS.map((tier) => ({
    tier,
    group_target: fallbackValue
  }));

export const defaultTargets = () => createTargetRows("");

export const addDaysToDateInput = (value, days) => {
  const date = parseDateValue(value);
  if (!date) return "";

  date.setDate(date.getDate() + Number(days || 0));
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

export const buildTargetRows = (targetData, fallbackValue = null) => {
  const rows = Array.isArray(targetData?.targets) ? targetData.targets : [];

  return TIERS.map((tier) => {
    const row = rows.find((item) => String(item?.tier || "").toUpperCase() === tier);
    return {
      tier,
      group_target: row?.group_target ?? fallbackValue
    };
  });
};

export const mapTargetInputs = (targetData) =>
  buildTargetRows(targetData, "").map((row) => ({
    ...row,
    group_target: row.group_target === "" ? "" : String(row.group_target)
  }));

export const getIndividualTargetInput = (targetData) => {
  const value = targetData?.individual_target;
  return value === null || value === undefined || value === "" ? "" : String(value);
};

export const collectPhaseGroups = (phases) => {
  const phaseList = Array.isArray(phases) ? phases : [];
  const recentPhases = phaseList.slice(0, 5);
  const recentPhaseIds = new Set(
    recentPhases
      .map((phase) => String(phase?.phase_id || "").trim())
      .filter(Boolean)
  );

  const additionalInactivePhases = phaseList.filter((phase) => {
    const phaseId = String(phase?.phase_id || "").trim();
    return (
      String(phase?.status || "").toUpperCase() === "INACTIVE" &&
      phaseId &&
      !recentPhaseIds.has(phaseId)
    );
  });

  return {
    recentPhases,
    additionalInactivePhases
  };
};

export const attachPhaseDetails = (phases, detailMap) =>
  (Array.isArray(phases) ? phases : []).map((phase) => ({
    ...phase,
    target_details: detailMap[String(phase?.phase_id || "").trim()] || null
  }));

export const mergeCurrentPhaseState = (phases, currentPhase) => {
  const currentPhaseId = String(currentPhase?.phase_id || "").trim();
  if (!currentPhaseId) return Array.isArray(phases) ? phases : [];

  return (Array.isArray(phases) ? phases : []).map((phase) =>
    String(phase?.phase_id || "").trim() === currentPhaseId
      ? { ...phase, ...currentPhase }
      : phase
  );
};

export const hasValue = (value) => value !== null && value !== undefined && value !== "";

export const formatDisplayValue = (value) => (hasValue(value) ? String(value) : "-");

export const formatTimeValue = (value) => {
  if (!hasValue(value)) return "-";
  const match = /^(\d{2}:\d{2})/.exec(String(value));
  return match ? match[1] : String(value);
};

export const formatLongDate = (value) => {
  const date = parseDateValue(value);
  if (!date) return "-";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  });
};

export const formatArchiveMonth = (value) => {
  const date = parseDateValue(value);
  if (!date) return "-";

  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric"
  });
};

export const formatPhaseDateRange = (phase) => {
  const start = formatLongDate(phase?.start_date);
  const end = formatLongDate(phase?.end_date);
  return `${start} - ${end}`;
};

export const formatStatusLabel = (status) => {
  const normalized = String(status || "").toLowerCase();
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "Unknown";
};

export const getStatusBadgeClass = (status) => {
  const normalizedStatus = String(status || "").toUpperCase();

  if (normalizedStatus === "ACTIVE") {
    return "bg-emerald-100 text-emerald-600";
  }

  if (normalizedStatus === "INACTIVE") {
    return "bg-amber-100 text-amber-600";
  }

  if (normalizedStatus === "COMPLETED") {
    return "bg-slate-100 text-slate-500";
  }

  return "bg-slate-100 text-slate-500";
};

export const getTargetSummaryItems = (phase) => {
  const targetRows = buildTargetRows(phase?.target_details, null)
    .filter((row) => hasValue(row.group_target))
    .map((row) => ({
      label: row.tier,
      value: row.group_target,
      accent: false
    }));

  if (hasValue(phase?.target_details?.individual_target)) {
    targetRows.push({
      label: "Ind",
      value: phase.target_details.individual_target,
      accent: true
    });
  }

  if (targetRows.length === 0 && phase?.target_details?.hasError) {
    return [
      {
        label: "Targets",
        value: "Unavailable",
        accent: false
      }
    ];
  }

  return targetRows;
};

export const getPhaseWorkingDaysLabel = (phase) => {
  const status = String(phase?.status || "").toUpperCase();
  const totalWorkingDays = Number(phase?.total_working_days);
  const changeDayNumber = phase?.change_day_number;

  if (status === "COMPLETED") {
    return Number.isFinite(totalWorkingDays) && totalWorkingDays >= 0
      ? `${totalWorkingDays}/${totalWorkingDays}`
      : "Completed";
  }

  if (status === "INACTIVE") {
    return Number.isFinite(totalWorkingDays) && totalWorkingDays >= 0
      ? `0/${totalWorkingDays}`
      : "Scheduled";
  }

  if (status === "ACTIVE") {
    if (Number.isFinite(totalWorkingDays) && totalWorkingDays >= 0) {
      const remainingWorkingDays = Number(phase?.remaining_working_days);
      const completedWorkingDays = Number.isFinite(remainingWorkingDays)
        ? Math.max(totalWorkingDays - remainingWorkingDays, 0)
        : null;

      if (completedWorkingDays !== null) {
        return hasValue(changeDayNumber)
          ? `${completedWorkingDays}/${totalWorkingDays} (Day ${changeDayNumber})`
          : `${completedWorkingDays}/${totalWorkingDays}`;
      }

      return hasValue(changeDayNumber)
        ? `${totalWorkingDays} Days (Day ${changeDayNumber})`
        : `${totalWorkingDays} Days`;
    }

    return hasValue(changeDayNumber) ? `Day ${changeDayNumber}` : "Ongoing";
  }

  return formatDisplayValue(totalWorkingDays);
};

export const getInactiveArchiveMeta = (phase) => {
  const status = String(phase?.status || "").toUpperCase();
  const archiveDate =
    status === "COMPLETED" ? formatArchiveMonth(phase?.end_date) : formatArchiveMonth(phase?.start_date);

  return status === "COMPLETED" ? `Ended ${archiveDate}` : `Starts ${archiveDate}`;
};
