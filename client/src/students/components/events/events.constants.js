import { formatLabel, formatShortDate, normalizeValue } from "../teams/teamPage.utils";

export const EVENT_STATUS_OPTIONS = ["ACTIVE", "CLOSED", "INACTIVE", "ARCHIVED"];
export const EVENT_REGISTRATION_OPTIONS = ["OPEN", "UPCOMING", "CLOSED"];
export const EVENT_REGISTRATION_MODE_OPTIONS = ["TEAM", "INDIVIDUAL"];
export const EVENT_GROUP_STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "FROZEN", "ARCHIVED"];
export const EVENT_GROUP_REQUEST_STATE_OPTIONS = [
  "ACTIVE_MEMBER",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "NO_REQUEST"
];

export const EMPTY_EVENT_GROUP_FORM = {
  team_code: "",
  team_name: "",
  description: ""
};

const normalizeBooleanLike = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n"].includes(normalized)) return false;
  }

  return Boolean(value);
};

export const getEventLocationLabel = (event) =>
  event?.location || event?.venue || event?.place || "-";

export const getEventRegistrationMode = (event) => {
  const normalized = String(event?.registration_mode || "")
    .trim()
    .toUpperCase();
  return normalized === "INDIVIDUAL" ? "INDIVIDUAL" : "TEAM";
};

export const isEventIndividualRegistration = (event) =>
  getEventRegistrationMode(event) === "INDIVIDUAL";

export const getEventRegistrationModeLabel = (event) =>
  isEventIndividualRegistration(event) ? "Individual Direct" : "Team";

export const getEventOrganizerLabel = (event) =>
  String(event?.event_organizer || "").trim() || "-";

export const getEventCategoryLabel = (event) =>
  String(event?.event_category || "").trim() || "-";

export const getEventLevelLabel = (event) =>
  String(event?.event_level || "").trim() || "-";

export const getEventDateRangeLabel = (event) => {
  const values = [formatShortDate(event?.start_date), formatShortDate(event?.end_date)].filter(
    (value) => value && value !== "-"
  );
  return values.length > 0 ? values.join(" to ") : "-";
};

export const formatEventDate = (value) => {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleDateString();
};

export const getEventRegistrationDateRangeLabel = (event) => {
  const values = [
    formatShortDate(event?.registration_start_date),
    formatShortDate(event?.registration_end_date)
  ].filter((value) => value && value !== "-");

  return values.length > 0 ? values.join(" to ") : "Not configured";
};

export const getEventMemberLimitLabel = (event) => {
  if (isEventIndividualRegistration(event)) {
    return "Individual only";
  }

  const minMembers = Number(event?.min_members);
  const maxMembers = Number(event?.max_members);
  const hasMin = Number.isInteger(minMembers) && minMembers > 0;
  const hasMax = Number.isInteger(maxMembers) && maxMembers > 0;

  if (hasMin && hasMax) return `${minMembers} - ${maxMembers} members`;
  if (hasMin) return `At least ${minMembers} members`;
  if (hasMax) return `Up to ${maxMembers} members`;
  return "Not configured";
};

export const formatEventCountValue = (value) => {
  if (value === undefined || value === null || value === "") return "-";

  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : "-";
};

export const getEventBalanceCount = (maximumCount, appliedCount) => {
  const maxValue = Number(maximumCount);
  if (!Number.isFinite(maxValue)) return "-";

  const appliedValue = Number(appliedCount);
  if (!Number.isFinite(appliedValue)) return String(maxValue);

  return String(Math.max(0, maxValue - appliedValue));
};

export const formatEventDurationDays = (start, end, fallback = null) => {
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

export const getNormalizedExternalUrl = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return `https://${normalized}`;
};

export const isEventStudentApplicationEnabled = (event) =>
  normalizeBooleanLike(event?.apply_by_student, true);

export const getEventStudentApplyLabel = (event) =>
  isEventStudentApplicationEnabled(event) ? "Yes" : "No";

export const getEventAllowedHubRows = (event) =>
  Array.isArray(event?.allowed_hubs) ? event.allowed_hubs : [];

export const isEventHubRestricted = (event) => getEventAllowedHubRows(event).length > 0;

export const getEventAllowedHubNames = (event) =>
  getEventAllowedHubRows(event)
    .map((hub) => String(hub?.team_name || hub?.team_code || "").trim())
    .filter(Boolean);

export const getEventAllowedHubSummary = (event) => {
  const names = getEventAllowedHubNames(event);
  if (names.length === 0) {
    return "Any student who meets the hub quota can participate.";
  }

  return names.join(", ");
};

export const getEventHubRestrictionLabel = (event) =>
  isEventHubRestricted(event)
    ? `Restricted to ${getEventAllowedHubRows(event).length} hub${getEventAllowedHubRows(event).length === 1 ? "" : "s"}`
    : "All eligible hubs";

export const getEventRegistrationStatus = (event) => {
  const start = event?.registration_start_date ? new Date(event.registration_start_date) : null;
  const end = event?.registration_end_date ? new Date(event.registration_end_date) : null;
  const now = new Date();

  if (start instanceof Date && !Number.isNaN(start.getTime())) {
    const startOfDay = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
      0,
      0,
      0,
      0
    );
    if (now < startOfDay) {
      return { key: "UPCOMING", label: "Registration Upcoming", isOpen: false };
    }
  }

  if (end instanceof Date && !Number.isNaN(end.getTime())) {
    const endOfDay = new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate(),
      23,
      59,
      59,
      999
    );
    if (now > endOfDay) {
      return { key: "CLOSED", label: "Registration Closed", isOpen: false };
    }
  }

  if (
    (!start || Number.isNaN(start.getTime())) &&
    (!end || Number.isNaN(end.getTime()))
  ) {
    return { key: "OPEN", label: "Registration Open", isOpen: true };
  }

  return { key: "OPEN", label: "Registration Open", isOpen: true };
};

export const getEventRegistrationFilterValue = (event) => getEventRegistrationStatus(event).key;

export const getEventGroupRequestStatus = ({ latestRequestByTeamId, myTeamIdSet, teamId }) => {
  const normalizedTeamId = Number(teamId);

  if (myTeamIdSet?.has(normalizedTeamId)) {
    return { key: "ACTIVE_MEMBER", label: "Active Member" };
  }

  const latestRequest = latestRequestByTeamId?.get(normalizedTeamId);
  if (latestRequest?.status) {
    return {
      key: normalizeValue(latestRequest.status),
      label: formatLabel(latestRequest.status)
    };
  }

  return { key: "NO_REQUEST", label: "No Request" };
};

export const resolveEventGroupJoinAction = ({
  busyTeamId,
  eventActive,
  myActiveMembershipInEvent,
  myTeamIdSet,
  pendingRequestTeamIdSet,
  team
}) => {
  const teamId = Number(team?.team_id);
  const isJoined = myTeamIdSet?.has(teamId);
  const hasPending = pendingRequestTeamIdSet?.has(teamId);
  const isActiveTeam = normalizeValue(team?.status) === "ACTIVE";
  const isBusy = busyTeamId === teamId;

  if (isBusy) {
    return {
      disabled: true,
      label: "Sending...",
      title: "Sending join request"
    };
  }

  if (myActiveMembershipInEvent) {
    return {
      disabled: true,
      label: isJoined ? "Joined" : "Request Join",
      title: "You already belong to a team in this event"
    };
  }

  if (isJoined) {
    return {
      disabled: true,
      label: "Joined",
      title: "Already an active member"
    };
  }

  if (hasPending) {
    return {
      disabled: true,
      label: "Requested",
      title: "Request already pending"
    };
  }

  if (!eventActive) {
    return {
      disabled: true,
      label: "Request Join",
      title: "The selected event is not active"
    };
  }

  if (!isActiveTeam) {
    return {
      disabled: true,
      label: "Request Join",
      title: "Only active teams can accept requests"
    };
  }

  return {
    disabled: false,
    label: "Request Join",
    title: "Send join request"
  };
};
