export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#0f6cbd] focus:ring-4 focus:ring-[#0f6cbd]/10";

export const selectClass = `${inputClass} appearance-none pr-10`;

export const EVENT_STATUSES = ["ACTIVE", "CLOSED", "INACTIVE", "ARCHIVED"];

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

export const filterEventRows = (rows, { query = "", statusFilter = "ALL" }) => {
  const normalizedQuery = String(query || "").trim().toLowerCase();

  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const status = String(row?.status || "").toUpperCase();

    if (statusFilter !== "ALL" && status !== statusFilter) return false;
    if (!normalizedQuery) return true;

    return [
      row?.event_id,
      row?.event_code,
      row?.event_name,
      row?.location,
      row?.registration_link,
      row?.registration_start_date,
      row?.registration_end_date,
      row?.start_date,
      row?.end_date,
      row?.min_members,
      row?.max_members,
      row?.status,
      row?.description,
      row?.team_count
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
