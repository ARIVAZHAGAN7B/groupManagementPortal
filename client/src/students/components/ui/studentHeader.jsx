import { useMemo } from "react";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import Image from "../../../assets/Image";
import { useAdaptiveNow } from "../../../hooks/useAdaptiveNow";
import { useDebouncedCallback } from "../../../hooks/useDebouncedCallback";
import { useRealtimeEvents } from "../../../hooks/useRealtimeEvents";
import { REALTIME_EVENTS } from "../../../lib/realtime";
import ThemeModeControl from "../../../shared/components/theme/ThemeModeControl";
import {
  useGetPhaseContextQuery,
  useGetProfileQuery,
  useGetStudentMembershipQuery
} from "../../../store/api/sharedApi";
import { useAuth } from "../../../utils/AuthContext";

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

const formatCountdown = (ms) => {
  if (!Number.isFinite(ms)) return "Unavailable";
  if (ms <= 0) return "Expired";

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const getInitials = (name) => {
  if (!name) return "ST";
  return name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
};

const StudentHeader = ({ onMenuClick }) => {
  const { user } = useAuth();
  const phaseQuery = useGetPhaseContextQuery(undefined, {
    skip: !user?.userId
  });
  const membershipQuery = useGetStudentMembershipQuery(
    { userId: user?.userId },
    { skip: !user?.userId }
  );
  const profileQuery = useGetProfileQuery(
    { userId: user?.userId },
    { skip: !user?.userId }
  );
  const phase = phaseQuery.data?.phase || null;
  const phaseTargets = phaseQuery.data?.phaseTargets || null;
  const myGroup = membershipQuery.data?.group || null;
  const rejoinDeadline = membershipQuery.data?.rejoinDeadline || null;
  const profile = profileQuery.data || null;
  const loading = phaseQuery.isLoading && !phaseQuery.data;
  const profileLoading = Boolean(user?.userId) && profileQuery.isFetching && !profileQuery.data;
  const rejoinTargetTimeMs = useMemo(() => {
    if (myGroup || !rejoinDeadline?.has_rejoin_deadline) return NaN;
    return Date.parse(rejoinDeadline.rejoin_deadline_at);
  }, [myGroup, rejoinDeadline]);
  const nowMs = useAdaptiveNow(rejoinTargetTimeMs);
  const handleRealtimeRefresh = useDebouncedCallback(() => {
    if (!user?.userId) return;

    void phaseQuery.refetch();
    void membershipQuery.refetch();
  }, 250);

  useRealtimeEvents(
    [
      REALTIME_EVENTS.PHASE,
      REALTIME_EVENTS.MEMBERSHIPS,
      REALTIME_EVENTS.POINTS,
      REALTIME_EVENTS.ELIGIBILITY
    ],
    handleRealtimeRefresh
  );

  const studentName = useMemo(() => {
    return profile?.name || user?.name || "Student";
  }, [profile, user]);

  const studentId = useMemo(() => {
    return profile?.studentId || "";
  }, [profile]);

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

  const changeDateText = useMemo(() => {
    if (loading) return "Loading...";
    if (!phase?.change_day) return "Unavailable";

    return formatShortDate(phase.change_day) || "Unavailable";
  }, [loading, phase]);

  const eligibilityTargetText = useMemo(() => {
    if (loading) return "Loading...";
    if (!phase?.phase_id) return "No phase";

    return phaseTargets?.individual_target
      ? `${phaseTargets.individual_target} pts`
      : "Not set";
  }, [loading, phase, phaseTargets]);

  const groupTierWidget = useMemo(() => {
    if (!myGroup?.tier || !phase?.phase_id) {
      return { label: "Group Target", value: "Unavailable" };
    }

    const tier = myGroup.tier.toUpperCase();
    const rows = Array.isArray(phaseTargets?.targets)
      ? phaseTargets.targets
      : [];

    const row = rows.find(
      (item) => item?.tier?.toUpperCase() === tier
    );

    if (!row?.group_target) {
      return { label: `${tier} Tier`, value: "Not set" };
    }

    return {
      label: `${tier} Tier`,
      value: `${row.group_target} pts`,
    };
  }, [myGroup, phase, phaseTargets]);

  const rejoinDeadlineWidget = useMemo(() => {
    if (myGroup) return null;
    if (!rejoinDeadline?.has_rejoin_deadline) return null;

    const deadline = new Date(rejoinDeadline.rejoin_deadline_at);
    if (Number.isNaN(deadline.getTime())) {
      return {
        visible: true,
        text: "Unavailable",
        toneClass: "text-gray-600",
        title: "Join deadline unavailable"
      };
    }

    const remainingMs = deadline.getTime() - nowMs;
    const expired = remainingMs <= 0 || rejoinDeadline?.is_expired === true;

    return {
      visible: true,
      text: expired ? "Expired" : `${formatCountdown(remainingMs)} left`,
      toneClass: expired ? "text-red-700" : "text-amber-700",
      title: `Join another group by ${deadline.toLocaleString()} (next working day deadline)`
    };
  }, [myGroup, rejoinDeadline, nowMs]);

  const initials = getInitials(studentName);

  // =========================
  // UI
  // =========================

  return (
    <div className="flex w-full items-center justify-between gap-3">

      {/* Left */}
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
          <p className="text-[10px] font-semibold uppercase text-slate-500">
            Student Portal
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">

        <div className="hidden sm:flex text-xs font-bold text-[#3211d4]">
          {remainingText}
        </div>

        <div className="hidden lg:flex text-xs">
          Change Date:{" "}
          <span className="font-bold ml-1">
            {changeDateText}
          </span>
        </div>

        <div className="hidden md:flex text-xs">
          Eligibility:{" "}
          <span className="font-bold ml-1">
            {eligibilityTargetText}
          </span>
        </div>

        <div className="hidden md:flex text-xs">
          {groupTierWidget.label}:{" "}
          <span className="font-bold ml-1">
            {groupTierWidget.value}
          </span>
        </div>

        {rejoinDeadlineWidget?.visible && (
          <div className="hidden lg:flex text-xs" title={rejoinDeadlineWidget.title}>
            Join Deadline:{" "}
            <span className={`font-bold ml-1 ${rejoinDeadlineWidget.toneClass}`}>
              {rejoinDeadlineWidget.text}
            </span>
          </div>
        )}

        <ThemeModeControl />

        <div className="flex items-center gap-3">
          <div className="hidden lg:block text-right">
            <p className="text-sm font-bold text-slate-900">
              {studentName}
            </p>
            <p className="text-[10px] text-slate-500">
              {profileLoading
                ? "Loading profile..."
                : studentId
                ? `${studentId}`
                : "Student ID unavailable"}
            </p>
          </div>

          <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
            {initials}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHeader;
