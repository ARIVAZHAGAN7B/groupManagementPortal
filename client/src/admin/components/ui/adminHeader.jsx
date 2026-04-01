import { useMemo, useState } from "react";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { useNavigate } from "react-router-dom";
import Image from "../../../assets/Image";
import { useDebouncedCallback } from "../../../hooks/useDebouncedCallback";
import ThemeModeControl from "../../../shared/components/theme/ThemeModeControl";
import {
  useGetAdminNotificationsQuery,
  useGetPhaseContextQuery,
  useGetProfileQuery
} from "../../../store/api/sharedApi";
import { useAuth } from "../../../utils/AuthContext";
import { useRealtimeEvents } from "../../../hooks/useRealtimeEvents";
import { REALTIME_EVENTS } from "../../../lib/realtime";

const TARGET_TIER_ORDER = ["D", "C", "B", "A"];
const PHASE_END_HOUR = 18;

const formatShortDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
};

const toPhaseEndDateTime = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    PHASE_END_HOUR,
    0,
    0,
    0
  );
};

const getInitials = (name) => {
  if (!name) return "AD";
  return name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
};

const formatRoleLabel = (role) => {
  if (!role) return "Admin";
  return String(role)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const formatCountLabel = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

const getMissingRoleLabels = (group) => {
  const missingRoles = [];

  if ((Number(group?.captain_count) || 0) === 0) missingRoles.push("Captain");
  if ((Number(group?.vice_captain_count) || 0) === 0) missingRoles.push("Vice Captain");
  if ((Number(group?.strategist_count) || 0) === 0) missingRoles.push("Strategist");
  if ((Number(group?.manager_count) || 0) === 0) missingRoles.push("Manager");

  return missingRoles;
};

function NotificationModal({ items, onClose, onItemClick, open, totalCount }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 p-4">
      <button
        type="button"
        aria-label="Close notifications dialog"
        onClick={onClose}
        className="absolute inset-0"
      />

      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_70px_rgba(15,23,42,0.24)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Notifications
            </p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">
              {totalCount > 0
                ? `${formatCountLabel(totalCount, "active alert")}`
                : "No active alerts"}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Review why the navbar notification is active.
            </p>
          </div>

          <button
            type="button"
            aria-label="Close notifications dialog"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
          >
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </button>
        </div>

        <div className="space-y-3 px-6 py-5">
          {items.length > 0 ? (
            items.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onItemClick?.(item)}
                className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition ${
                  item.to ? "hover:border-slate-300 hover:bg-slate-100" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white">
                      {item.count}
                    </span>
                    {item.to ? (
                      <span className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-500">
                        <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
                      </span>
                    ) : null}
                  </div>
                </div>

                {item.details?.length ? (
                  <div className="mt-3 space-y-2">
                    {item.details.map((detail) => (
                      <div
                        key={detail}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                      >
                        {detail}
                      </div>
                    ))}
                  </div>
                ) : null}
              </button>
            ))
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No notifications are active right now.
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const AdminHeader = ({ onMenuClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const phaseQuery = useGetPhaseContextQuery(undefined, {
    skip: !user?.userId
  });
  const profileQuery = useGetProfileQuery(
    { userId: user?.userId },
    { skip: !user?.userId }
  );
  const notificationsQuery = useGetAdminNotificationsQuery(
    { userId: user?.userId, userRole: user?.role },
    { skip: !user?.userId }
  );
  const phase = phaseQuery.data?.phase || null;
  const phaseTargets = phaseQuery.data?.phaseTargets || null;
  const profile = profileQuery.data || null;
  const leadershipNotifications = notificationsQuery.data?.leadership || null;
  const groupTierNotifications = notificationsQuery.data?.groupTier || null;
  const loading = phaseQuery.isLoading && !phaseQuery.data;
  const profileLoading = Boolean(user?.userId) && profileQuery.isFetching && !profileQuery.data;
  const handlePhaseRefresh = useDebouncedCallback(() => {
    void phaseQuery.refetch();
  }, 250);
  const handleNotificationRefresh = useDebouncedCallback(() => {
    if (!user?.userId) return;

    void notificationsQuery.refetch();
  }, 250);

  useRealtimeEvents(REALTIME_EVENTS.PHASE, handlePhaseRefresh);
  useRealtimeEvents(REALTIME_EVENTS.ADMIN_NOTIFICATIONS, handleNotificationRefresh);

  const remainingText = useMemo(() => {
    if (loading) return "Loading phase...";
    if (!phase?.end_date) return "No active phase";

    const endDate = toPhaseEndDateTime(phase.end_date);
    if (endDate && new Date() > endDate) return "Phase ended";

    const days = Number(phase?.remaining_working_days);

    if (!Number.isNaN(days)) {
      if (days <= 0) return "Phase ended";
      if (days === 1) return "1 Day Remaining";
      return `${days} Days Remaining`;
    }

    return "Ongoing";
  }, [loading, phase]);

  const phaseSummaryText = useMemo(() => {
    if (loading) return "Loading current phase...";
    if (!phase?.phase_id) return "No active phase";

    const start = formatShortDate(phase.start_date);
    const end = formatShortDate(phase.end_date);

    if (start && end) {
      const phasePrefix = phase?.phase_name ? `${phase.phase_name} | ` : "";
      return `${phasePrefix}${start} - ${end} | 6:00 PM`;
    }

    return phase?.phase_name || `ID ${String(phase.phase_id).slice(0, 8)}`;
  }, [loading, phase]);

  const changeDateText = useMemo(() => {
    if (loading) return "Loading...";
    if (!phase?.change_day) return "Unavailable";

    return formatShortDate(phase.change_day) || "Unavailable";
  }, [loading, phase]);

  const targetSummaryText = useMemo(() => {
    if (loading) return "Loading targets...";
    if (!phase?.phase_id) return "No phase target";
    if (!phaseTargets) return "Target unavailable";

    const rows = Array.isArray(phaseTargets?.targets) ? phaseTargets.targets : [];

    const targetsByTier = rows.reduce((acc, row) => {
      const tier = String(row?.tier || "").toUpperCase();
      if (tier) acc[tier] = row?.group_target;
      return acc;
    }, {});

    const tierText = TARGET_TIER_ORDER
      .filter((tier) => targetsByTier[tier] !== undefined)
      .map((tier) => `${tier}: ${targetsByTier[tier]}`)
      .join(" | ");

    const individualTarget = phaseTargets?.individual_target;

    if (individualTarget && tierText) return `Ind: ${individualTarget} | ${tierText}`;
    if (individualTarget) return `Ind: ${individualTarget}`;
    if (tierText) return tierText;

    return "No phase target";
  }, [loading, phase, phaseTargets]);

  const userName = profile?.name || user?.name || "Admin";
  const roleLabel = formatRoleLabel(profile?.role || user?.role);
  const adminId = profile?.adminId || null;

  const profileSubtitle = profileLoading
    ? "Loading profile..."
    : adminId
      ? `${roleLabel} ID: ${adminId}`
      : `${roleLabel} ID unavailable`;

  const initials = getInitials(userName);
  const leadershipAttentionCount = Number(leadershipNotifications?.total_attention_count) || 0;
  const groupsWithMissingLeadershipCount =
    Number(
      leadershipNotifications?.groups_with_missing_leadership_count ??
        leadershipNotifications?.groups_without_leadership_count
    ) || 0;
  const pendingLeadershipRequestCount = Number(leadershipNotifications?.pending_request_count) || 0;
  const pendingTierRequestCount = Number(groupTierNotifications?.pending_request_count) || 0;
  const groupsWithMissingLeadership = Array.isArray(
    leadershipNotifications?.groups_with_missing_leadership ||
      leadershipNotifications?.groups_without_leadership
  )
    ? leadershipNotifications.groups_with_missing_leadership ||
      leadershipNotifications.groups_without_leadership
    : [];
  const totalNotificationCount = leadershipAttentionCount + pendingTierRequestCount;

  const notificationItems = useMemo(() => {
    const items = [];

    if (groupsWithMissingLeadershipCount > 0) {
      items.push({
        key: "missing-leadership",
        title: "Groups missing leadership roles",
        count: groupsWithMissingLeadershipCount,
        to: "/leadership-management",
        description: `${formatCountLabel(
          groupsWithMissingLeadershipCount,
          "group"
        )} still need one or more required leadership roles filled.`,
        details: groupsWithMissingLeadership.slice(0, 4).map((group) => {
          const label = group?.group_code || group?.group_name || `Group ${group?.group_id || "-"}`;
          const missingRoles = getMissingRoleLabels(group);
          const missingRoleText = missingRoles.length
            ? `Missing ${missingRoles.join(", ")}`
            : `${Number(group?.missing_role_count) || 0} roles missing`;
          const pendingText =
            Number(group?.pending_request_count) > 0
              ? ` | ${formatCountLabel(Number(group.pending_request_count), "pending request")}`
              : "";

          return `${label}: ${missingRoleText}${pendingText}`;
        })
      });
    }

    if (pendingLeadershipRequestCount > 0) {
      items.push({
        key: "pending-leadership-requests",
        title: "Pending leadership requests",
        count: pendingLeadershipRequestCount,
        to: "/leadership-management",
        description: `${formatCountLabel(
          pendingLeadershipRequestCount,
          "leadership request"
        )} are waiting for admin review.`
      });
    }

    if (pendingTierRequestCount > 0) {
      items.push({
        key: "pending-tier-requests",
        title: "Pending tier change requests",
        count: pendingTierRequestCount,
        to: "/tier-management",
        description: `${formatCountLabel(
          pendingTierRequestCount,
          "tier change request"
        )} are waiting for admin review.`
      });
    }

    return items;
  }, [
    groupsWithMissingLeadership,
    groupsWithMissingLeadershipCount,
    pendingLeadershipRequestCount,
    pendingTierRequestCount
  ]);

  return (
    <>
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Open navigation menu"
            onClick={() => onMenuClick?.()}
            className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <MenuRoundedIcon fontSize="small" />
          </button>

        <img
          src={Image.GMPLogo}
          alt="GM Portal logo"
          width="40"
          height="40"
          decoding="async"
          className="h-10 w-10 rounded-lg object-contain"
        />

          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-slate-900">GM Portal</h1>
            <p className="text-[10px] font-semibold uppercase text-slate-500">Admin Console</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex text-xs font-bold text-[#3211d4]">{remainingText}</div>

          <div className="hidden xl:flex text-xs">
            Current Phase: <span className="ml-1 font-bold">{phaseSummaryText}</span>
          </div>

          <div className="hidden xl:flex text-xs">
            Change Date: <span className="ml-1 font-bold">{changeDateText}</span>
          </div>

          <div className="hidden xl:flex text-xs">
            Targets: <span className="ml-1 font-bold">{targetSummaryText}</span>
          </div>

          <ThemeModeControl />

          <button
            type="button"
            onClick={() => setNotificationModalOpen(true)}
            aria-label={
              totalNotificationCount > 0
                ? `${formatCountLabel(totalNotificationCount, "notification")}`
                : "Notifications"
            }
            title={
              totalNotificationCount > 0
                ? `${formatCountLabel(totalNotificationCount, "notification")} need attention`
                : "Notifications"
            }
            className="relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <NotificationsNoneRoundedIcon sx={{ fontSize: 20 }} />
            {totalNotificationCount > 0 ? (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            ) : null}
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden lg:block text-right">
              <p className="text-sm font-bold text-slate-900">{userName}</p>
              <p className="text-[10px] text-slate-500">{profileSubtitle}</p>
            </div>

            <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
              {initials}
            </div>
          </div>
        </div>
      </div>

      <NotificationModal
        items={notificationItems}
        onClose={() => setNotificationModalOpen(false)}
        onItemClick={(item) => {
          if (!item?.to) return;
          setNotificationModalOpen(false);
          navigate(item.to);
        }}
        open={notificationModalOpen}
        totalCount={totalNotificationCount}
      />
    </>
  );
};

export default AdminHeader;
