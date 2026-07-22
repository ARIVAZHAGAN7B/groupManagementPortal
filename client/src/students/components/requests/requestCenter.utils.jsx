export const inputClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0f6cbd] focus:ring-4 focus:ring-[#0f6cbd]/10";

export const selectClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none transition focus:border-[#0f6cbd] focus:ring-4 focus:ring-[#0f6cbd]/10";

export const REQUEST_TYPE_META = {
  GROUP_JOIN: {
    badgeClass: "border-[#1754cf]/15 bg-[#1754cf]/10 text-[#1754cf]",
    detailLabel: "Request",
    label: "Group Join"
  },
  LEADERSHIP_ROLE: {
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    detailLabel: "Requested Role",
    label: "Leadership Role"
  },
  GROUP_TIER_CHANGE: {
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    detailLabel: "Tier Change",
    label: "Group Tier Change"
  },
  EVENT_GROUP_JOIN: {
    badgeClass: "border-sky-200 bg-sky-50 text-sky-700",
    detailLabel: "Request",
    label: "Event Group Join"
  }
};

export const safeArray = (value) => (Array.isArray(value) ? value : []);

export const parseTimestamp = (value) => {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
};

export const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || fallback;

export const isAccessDenied = (error) => {
  const status = Number(error?.response?.status);
  return status === 401 || status === 403;
};

export const safeMemberships = async (loader) => {
  try {
    const data = await loader();
    return safeArray(data?.memberships);
  } catch {
    return [];
  }
};

export function RequestTypePill({ typeKey }) {
  const meta = REQUEST_TYPE_META[typeKey] || REQUEST_TYPE_META.GROUP_JOIN;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.badgeClass}`}
    >
      {meta.label}
    </span>
  );
}

export const buildGroupLabel = (groupMap, groupId) => {
  const group = groupMap.get(String(groupId)) || null;

  return {
    group,
    subtitle:
      [
        group?.group_code || null,
        group?.tier ? `Tier ${String(group.tier).toUpperCase()}` : null
      ]
        .filter(Boolean)
        .join(" | "),
    title: group?.group_name || group?.group_code || "Group"
  };
};

export const buildMyRequestRows = ({
  eventJoinRequests,
  formatLabel,
  groupJoinRequests,
  groupMap,
  groupTierRequests,
  leadershipRequests,
  normalizeValue
}) => {
  const rows = [];

  for (const row of safeArray(groupJoinRequests)) {
    const groupInfo = buildGroupLabel(groupMap, row?.group_id);

    rows.push({
      decisionBy:
        normalizeValue(row?.status) === "PENDING"
          ? "Pending review"
          : row?.decision_by
            ? `Reviewed by ${row.decision_by}`
            : "Processed",
      decisionReason: row?.decision_reason || "",
      detailValue: "Join as member",
      id: `group-join-${row.request_id}`,
      requestDate: row?.request_date,
      scopeLabel: "Group",
      searchText: [
        REQUEST_TYPE_META.GROUP_JOIN.label,
        groupInfo.title,
        groupInfo.subtitle,
        row?.status,
        row?.decision_reason
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
      status: normalizeValue(row?.status) || "UNKNOWN",
      subtitle: groupInfo.subtitle,
      title: groupInfo.title,
      typeKey: "GROUP_JOIN"
    });
  }

  for (const row of safeArray(leadershipRequests)) {
    const groupInfo = buildGroupLabel(groupMap, row?.group_id);

    rows.push({
      decisionBy:
        normalizeValue(row?.status) === "PENDING" ? "Pending review" : "Admin review",
      decisionReason: row?.decision_reason || "",
      detailValue: formatLabel(row?.requested_role, "Leadership role"),
      id: `leadership-${row.leadership_request_id}`,
      requestDate: row?.request_date,
      scopeLabel: "Group",
      searchText: [
        REQUEST_TYPE_META.LEADERSHIP_ROLE.label,
        groupInfo.title,
        groupInfo.subtitle,
        row?.requested_role,
        row?.status,
        row?.decision_reason
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
      status: normalizeValue(row?.status) || "UNKNOWN",
      subtitle: groupInfo.subtitle,
      title: groupInfo.title,
      typeKey: "LEADERSHIP_ROLE"
    });
  }

  for (const row of safeArray(groupTierRequests)) {
    const groupInfo = buildGroupLabel(groupMap, row?.group_id);

    rows.push({
      decisionBy:
        normalizeValue(row?.status) === "PENDING" ? "Pending review" : "Admin review",
      decisionReason: row?.decision_reason || "",
      detailValue: `${formatLabel(row?.current_tier, "Current")} -> ${formatLabel(row?.requested_tier, "Requested")}`,
      id: `group-tier-${row.tier_change_request_id}`,
      requestDate: row?.request_date,
      scopeLabel: "Group",
      searchText: [
        REQUEST_TYPE_META.GROUP_TIER_CHANGE.label,
        groupInfo.title,
        groupInfo.subtitle,
        row?.current_tier,
        row?.requested_tier,
        row?.status,
        row?.decision_reason
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
      status: normalizeValue(row?.status) || "UNKNOWN",
      subtitle: groupInfo.subtitle,
      title: groupInfo.title,
      typeKey: "GROUP_TIER_CHANGE"
    });
  }

  for (const row of safeArray(eventJoinRequests)) {
    rows.push({
      decisionBy:
        normalizeValue(row?.status) === "PENDING"
          ? "Pending review"
          : formatLabel(row?.decision_by_role, "Processed"),
      decisionReason: row?.decision_reason || "",
      detailValue: `Join ${row?.event_name || "event group"} as member`,
      id: `event-group-join-${row.event_request_id}`,
      requestDate: row?.request_date,
      scopeLabel: "Event Group",
      searchText: [
        REQUEST_TYPE_META.EVENT_GROUP_JOIN.label,
        row?.event_name,
        row?.event_code,
        row?.team_name,
        row?.team_code,
        row?.status,
        row?.decision_reason,
        row?.decision_by_role
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
      status: normalizeValue(row?.status) || "UNKNOWN",
      subtitle: row?.event_name || row?.event_code || "",
      title: row?.team_name || row?.team_code || "Event Group",
      typeKey: "EVENT_GROUP_JOIN"
    });
  }

  return rows.sort((left, right) => parseTimestamp(right.requestDate) - parseTimestamp(left.requestDate));
};
