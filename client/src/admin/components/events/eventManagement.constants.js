export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#0f6cbd] focus:ring-4 focus:ring-[#0f6cbd]/10";

export const selectClass = `${inputClass} appearance-none pr-10`;

export const EVENT_STATUSES = ["ACTIVE", "CLOSED", "INACTIVE", "ARCHIVED"];

export const BOOLEAN_SELECT_OPTIONS = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" }
];

export const EVENT_CATEGORY_OPTIONS = [
  "Competition",
  "Paper-Presentation",
  "Project-Competition/Idea Submission",
  "Training Program",
  "Competition (Technical)"
];

export const EVENT_LEVEL_OPTIONS = [
  "Institution",
  "Inter College",
  "District",
  "State",
  "National",
  "International"
];

export const COUNTRY_OPTIONS = [
  "India",
  "Bangladesh",
  "Bhutan",
  "Canada",
  "France",
  "Germany",
  "Japan",
  "Malaysia",
  "Nepal",
  "Singapore",
  "Sri Lanka",
  "United Arab Emirates",
  "United Kingdom",
  "United States"
];

export const INDIA_STATE_OPTIONS = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

export const DEFAULT_YEAR_REWARD_VALUES = {
  first_year_reward: "400",
  second_year_reward: "400",
  third_year_reward: "600",
  fourth_year_reward: "600"
};

export const DEFAULT_REWARD_ALLOCATION =
  "I YEAR - 400; II YEAR - 400; III YEAR - 600; IV YEAR - 600";

export const STATUS_STYLES = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CLOSED: "border-slate-200 bg-slate-100 text-slate-700",
  INACTIVE: "border-rose-200 bg-rose-50 text-rose-700",
  ARCHIVED: "border-amber-200 bg-amber-50 text-amber-700"
};

export const REGISTRATION_STATE_STYLES = {
  OPEN: "border-[#1754cf]/20 bg-[#1754cf]/10 text-[#1754cf]",
  UPCOMING: "border-violet-200 bg-violet-50 text-violet-700",
  CLOSED: "border-slate-200 bg-slate-100 text-slate-600",
  NONE: "border-slate-200 bg-slate-100 text-slate-500"
};

const normalizeDate = (value) => {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const normalizeTextFilter = (value) => String(value ?? "").trim().toLowerCase();

const normalizeBooleanValue = (value) => {
  const normalized = normalizeTextFilter(value);

  if (!normalized) return "";
  if (["true", "1", "yes", "y"].includes(normalized)) return "true";
  if (["false", "0", "no", "n"].includes(normalized)) return "false";

  return "";
};

const normalizeRewardDigits = (value, fallback = "") => {
  const match = String(value ?? "").match(/\d+/);
  return match ? match[0] : fallback;
};

export const parseRewardAllocationValues = (value) => {
  const hasSource = Boolean(String(value ?? "").trim());

  return {
    first_year_reward:
      normalizeRewardDigits(
        String(value ?? "").match(/\bI\s*YEAR\s*-\s*(\d+)/i)?.[1],
        hasSource ? "" : DEFAULT_YEAR_REWARD_VALUES.first_year_reward
      ) || "",
    second_year_reward:
      normalizeRewardDigits(
        String(value ?? "").match(/\bII\s*YEAR\s*-\s*(\d+)/i)?.[1],
        hasSource ? "" : DEFAULT_YEAR_REWARD_VALUES.second_year_reward
      ) || "",
    third_year_reward:
      normalizeRewardDigits(
        String(value ?? "").match(/\bIII\s*YEAR\s*-\s*(\d+)/i)?.[1],
        hasSource ? "" : DEFAULT_YEAR_REWARD_VALUES.third_year_reward
      ) || "",
    fourth_year_reward:
      normalizeRewardDigits(
        String(value ?? "").match(/\bIV\s*YEAR\s*-\s*(\d+)/i)?.[1],
        hasSource ? "" : DEFAULT_YEAR_REWARD_VALUES.fourth_year_reward
      ) || ""
  };
};

export const formatRewardAllocationValue = ({
  first_year_reward = "",
  second_year_reward = "",
  third_year_reward = "",
  fourth_year_reward = ""
}) => {
  const entries = [
    ["I YEAR", normalizeRewardDigits(first_year_reward)],
    ["II YEAR", normalizeRewardDigits(second_year_reward)],
    ["III YEAR", normalizeRewardDigits(third_year_reward)],
    ["IV YEAR", normalizeRewardDigits(fourth_year_reward)]
  ].filter(([, reward]) => reward);

  return entries.length ? entries.map(([label, reward]) => `${label} - ${reward}`).join("; ") : "";
};

export const formatDate = (value) => {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleDateString();
};

export const formatDateRange = (start, end) => {
  const values = [formatDate(start), formatDate(end)].filter((value) => value && value !== "-");
  return values.length > 0 ? values.join(" to ") : "-";
};

export const formatMemberRange = (minValue, maxValue) => {
  const minMembers = Number(minValue);
  const maxMembers = Number(maxValue);
  const hasMin = Number.isInteger(minMembers) && minMembers > 0;
  const hasMax = Number.isInteger(maxMembers) && maxMembers > 0;

  if (hasMin && hasMax) return `${minMembers} - ${maxMembers}`;
  if (hasMin) return `Min ${minMembers}`;
  if (hasMax) return `Max ${maxMembers}`;
  return "-";
};

export const formatBooleanLabel = (value, truthyLabel = "Yes", falsyLabel = "No") => {
  if (value === undefined || value === null || value === "") return "-";

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) return truthyLabel;
    if (["false", "0", "no", "n"].includes(normalized)) return falsyLabel;
  }

  return value ? truthyLabel : falsyLabel;
};

export const formatCountValue = (value) => {
  if (value === undefined || value === null || value === "") return "-";

  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : "-";
};

export const getBalanceCount = (maximumCount, appliedCount) => {
  const maxValue = Number(maximumCount);
  if (!Number.isFinite(maxValue)) return "-";

  const appliedValue = Number(appliedCount);
  if (!Number.isFinite(appliedValue)) return String(maxValue);

  return String(Math.max(0, maxValue - appliedValue));
};

export const formatDurationDays = (start, end, fallback = null) => {
  if (fallback !== undefined && fallback !== null && fallback !== "") {
    const parsedFallback = Number(fallback);
    if (Number.isFinite(parsedFallback)) return String(parsedFallback);
  }

  if (!start || !end) return "-";

  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return "-";

  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay);
  if (diff < 0) return "-";

  return String(diff + 1);
};

export const getRegistrationState = (start, end) => {
  const today = normalizeDate(new Date());
  const startDate = normalizeDate(start);
  const endDate = normalizeDate(end);

  if (!startDate && !endDate) {
    return {
      key: "NONE",
      label: "No Window"
    };
  }

  if (startDate && today && today < startDate) {
    return {
      key: "UPCOMING",
      label: "Upcoming"
    };
  }

  if (endDate && today && today > endDate) {
    return {
      key: "CLOSED",
      label: "Closed"
    };
  }

  return {
    key: "OPEN",
    label: "Open Now"
  };
};

export const filterEventRows = (
  rows,
  {
    query = "",
    statusFilter = "ALL",
    categoryFilter = "ALL",
    levelFilter = "ALL",
    studentFilter = "ALL"
  }
) => {
  const normalizedQuery = normalizeTextFilter(query);
  const normalizedCategoryFilter = normalizeTextFilter(categoryFilter);
  const normalizedLevelFilter = normalizeTextFilter(levelFilter);
  const normalizedStudentFilter = normalizeBooleanValue(studentFilter);

  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const status = String(row?.status || "").toUpperCase();

    if (statusFilter !== "ALL" && status !== statusFilter) return false;
    if (
      categoryFilter !== "ALL" &&
      normalizeTextFilter(row?.event_category) !== normalizedCategoryFilter
    ) {
      return false;
    }
    if (levelFilter !== "ALL" && normalizeTextFilter(row?.event_level) !== normalizedLevelFilter) {
      return false;
    }
    if (
      studentFilter !== "ALL" &&
      normalizeBooleanValue(row?.apply_by_student) !== normalizedStudentFilter
    ) {
      return false;
    }
    if (!normalizedQuery) return true;

    return [
      row?.event_id,
      row?.event_code,
      row?.event_name,
      row?.event_organizer,
      row?.event_category,
      row?.location,
      row?.event_level,
      row?.state,
      row?.country,
      row?.selected_resources,
      row?.maximum_count,
      row?.applied_count,
      row?.balance_count,
      row?.registration_mode,
      row?.apply_by_student,
      row?.within_bit,
      row?.related_to_special_lab,
      row?.department,
      row?.competition_name,
      row?.total_level_of_competition,
      row?.eligible_for_rewards,
      row?.winner_rewards,
      row?.reward_allocation,
      row?.registration_link,
      row?.registration_start_date,
      row?.registration_end_date,
      row?.start_date,
      row?.end_date,
      row?.duration_days,
      row?.min_members,
      row?.max_members,
      row?.status,
      row?.description,
      row?.team_count,
      ...(Array.isArray(row?.allowed_hubs)
        ? row.allowed_hubs.flatMap((hub) => [hub?.team_code, hub?.team_name, hub?.hub_priority])
        : [])
    ]
      .map((value) => String(value ?? "").toLowerCase())
      .join(" ")
      .includes(normalizedQuery);
  });
};

export const getEventActionDisabledState = (status) => {
  const normalized = String(status || "").toUpperCase();

  return {
    activate: normalized === "ACTIVE",
    archive: normalized === "ARCHIVED",
    close: normalized === "CLOSED",
    inactive: normalized === "INACTIVE"
  };
};

export const getVisibleEventStatusActions = (status) => {
  const normalized = String(status || "").toUpperCase();

  switch (normalized) {
    case "ACTIVE":
      return {
        activate: false,
        archive: true,
        close: true
      };
    case "CLOSED":
      return {
        activate: true,
        archive: true,
        close: false
      };
    case "ARCHIVED":
      return {
        activate: true,
        archive: false,
        close: true
      };
    case "INACTIVE":
      return {
        activate: true,
        archive: true,
        close: false
      };
    default:
      return {
        activate: true,
        archive: true,
        close: true
      };
  }
};
