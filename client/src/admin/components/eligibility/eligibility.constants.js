import {
  formatPercentLabel,
  getTierBadgeClass,
  inputClass
} from "../groups/groupManagement.constants";

export { formatPercentLabel, getTierBadgeClass, inputClass };

export const VIEW_OPTIONS = [
  { value: "individual", label: "Students" },
  { value: "group", label: "Groups" }
];

const ELIGIBILITY_STATUS_CONFIG = {
  ELIGIBLE: {
    dot: "bg-green-600",
    text: "text-green-600",
    pill: "border border-green-200 bg-green-50 text-green-600",
    label: "ELIGIBLE"
  },
  NOT_ELIGIBLE: {
    dot: "bg-red-500",
    text: "text-red-500",
    pill: "border border-red-200 bg-red-50 text-red-600",
    label: "NOT ELIGIBLE"
  },
  NOT_AVAILABLE: {
    dot: "bg-slate-400",
    text: "text-slate-400",
    pill: "border border-slate-200 bg-slate-50 text-slate-500",
    label: "NOT AVAILABLE"
  }
};

const PHASE_STATUS_PILL_CLASSES = {
  ACTIVE: "border border-green-200 bg-green-50 text-green-600",
  COMPLETED: "border border-slate-200 bg-slate-100 text-slate-600",
  UPCOMING: "border border-amber-200 bg-amber-50 text-amber-600",
  INACTIVE: "border border-slate-200 bg-slate-100 text-slate-500"
};

export const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
};

export const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

export const getPhaseLabel = (phase) => phase?.phase_name || phase?.phase_id || "-";

export const getPhaseOptionLabel = (phase) => {
  const label = getPhaseLabel(phase);
  const status = String(phase?.status || "").trim();
  return status ? `${label} | ${status}` : label;
};

export const isEligibleValue = (value) => value === true || value === 1;

export const isNotEligibleValue = (value) => value === false || value === 0;

export const getEligibilityStatusKey = (value) => {
  if (isEligibleValue(value)) return "ELIGIBLE";
  if (isNotEligibleValue(value)) return "NOT_ELIGIBLE";
  return "NOT_AVAILABLE";
};

export const getEligibilityStatusConfig = (value) =>
  ELIGIBILITY_STATUS_CONFIG[getEligibilityStatusKey(value)];

export const formatEligibleLabel = (value) =>
  getEligibilityStatusConfig(value).label;

export const getPhaseStatusPillClass = (status) =>
  PHASE_STATUS_PILL_CLASSES[String(status || "").toUpperCase()] ||
  "border border-slate-200 bg-slate-100 text-slate-500";

export const getViewLabel = (type) =>
  type === "individual" ? "students" : "groups";

export const getRowBusyKey = (type, phaseId, row) =>
  `${type}:${phaseId}:${type === "individual" ? row?.student_id : row?.group_id}`;

export const getRowKey = (type, row) =>
  row?.eligibility_id ||
  (type === "individual"
    ? `${row?.phase_id}-${row?.student_id}`
    : `${row?.phase_id}-${row?.group_id}`);

export const getEntityTitle = (type, row) =>
  type === "individual"
    ? row?.student_name || row?.student_id || "-"
    : row?.group_name || row?.group_code || row?.group_id || "-";

export const getEntityCode = (type, row) =>
  type === "individual"
    ? row?.student_id || "-"
    : row?.group_code || row?.group_id || "-";

export const getEntityMeta = (type, row) =>
  type === "individual"
    ? `${row?.department || "-"} | Year ${row?.year ?? "-"}`
    : `Tier ${String(row?.tier || "-").toUpperCase()} | ID ${row?.group_id || "-"}`;

export const getScoreValue = (type, row) =>
  Number(
    type === "individual"
      ? row?.this_phase_base_points || 0
      : row?.this_phase_group_points || 0
  ).toLocaleString();

export const getDefaultReasonCode = (type, isEligible) => {
  if (isEligible) {
    return type === "individual"
      ? "ADMIN_OVERRIDE_ELIGIBLE"
      : "ADMIN_OVERRIDE_GROUP_ELIGIBLE";
  }

  return type === "individual"
    ? "ADMIN_OVERRIDE_NOT_ELIGIBLE"
    : "ADMIN_OVERRIDE_GROUP_NOT_ELIGIBLE";
};

export const isOverrideReason = (reason) =>
  String(reason || "").trim().toUpperCase().includes("OVERRIDE");

export const getSearchText = (type, row) => {
  if (type === "individual") {
    return [
      row?.student_name,
      row?.student_id,
      row?.department,
      row?.year,
      row?.reason_code,
      row?.phase_name
    ]
      .map((value) => String(value || "").toLowerCase())
      .join(" ");
  }

  return [
    row?.group_name,
    row?.group_code,
    row?.group_id,
    row?.tier,
    row?.reason_code,
    row?.phase_name
  ]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");
};
