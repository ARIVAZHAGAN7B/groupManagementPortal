import { formatLabel, formatShortDate, normalizeValue } from "../teams/teamPage.utils";

export const EVENT_STATUS_OPTIONS = ["ACTIVE", "CLOSED", "INACTIVE", "ARCHIVED"];
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

export const getEventLocationLabel = (event) =>
  event?.location || event?.venue || event?.place || "-";

export const getEventDateRangeLabel = (event) => {
  const values = [formatShortDate(event?.start_date), formatShortDate(event?.end_date)].filter(
    (value) => value && value !== "-"
  );
  return values.length > 0 ? values.join(" to ") : "-";
};

export const getEventRegistrationDateRangeLabel = (event) => {
  const values = [
    formatShortDate(event?.registration_start_date),
    formatShortDate(event?.registration_end_date)
  ].filter((value) => value && value !== "-");

  return values.length > 0 ? values.join(" to ") : "Not configured";
};

export const getEventMemberLimitLabel = (event) => {
  const minMembers = Number(event?.min_members);
  const maxMembers = Number(event?.max_members);
  const hasMin = Number.isInteger(minMembers) && minMembers > 0;
  const hasMax = Number.isInteger(maxMembers) && maxMembers > 0;

  if (hasMin && hasMax) return `${minMembers} - ${maxMembers} members`;
  if (hasMin) return `At least ${minMembers} members`;
  if (hasMax) return `Up to ${maxMembers} members`;
  return "Not configured";
};

export const getNormalizedExternalUrl = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return `https://${normalized}`;
};

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
      title: "You already belong to an event group in this event"
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
      title: "Only active event groups can accept requests"
    };
  }

  return {
    disabled: false,
    label: "Request Join",
    title: "Send join request"
  };
};
