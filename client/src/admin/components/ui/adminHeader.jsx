import { useEffect, useMemo, useState } from "react";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import Icons from "../../../assets/Icons";
import { useAuth } from "../../../utils/AuthContext";
import { fetchCurrentPhase, fetchPhaseTargets } from "../../../service/phase.api";
import { getProfile } from "../../../service/joinRequests.api";

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

const AdminHeader = () => {
  const { user } = useAuth();

  const [phase, setPhase] = useState(null);
  const [phaseTargets, setPhaseTargets] = useState(null);
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  // =========================
  // Load Phase
  // =========================
  useEffect(() => {
    let mounted = true;

    const loadPhase = async () => {
      try {
        const data = await fetchCurrentPhase();
        let targetData = null;

        if (data?.phase_id) {
          targetData = await fetchPhaseTargets(data.phase_id).catch(
            () => null
          );
        }

        if (!mounted) return;
        setPhase(data || null);
        setPhaseTargets(targetData);
      } catch {
        if (!mounted) return;
        setPhase(null);
        setPhaseTargets(null);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    loadPhase();
    const intervalId = setInterval(loadPhase, 60000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // =========================
  // Load Profile (NEW)
  // =========================
  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!user) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);

      try {
        const data = await getProfile(); // ✅ no userId
        if (!mounted) return;
        setProfile(data);
      } catch {
        if (!mounted) return;
        setProfile(null);
      } finally {
        if (!mounted) return;
        setProfileLoading(false);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  // =========================
  // Phase Derived
  // =========================
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

  const targetSummaryText = useMemo(() => {
    if (loading) return "Loading targets...";
    if (!phase?.phase_id) return "No phase target";
    if (!phaseTargets) return "Target unavailable";

    const rows = Array.isArray(phaseTargets?.targets)
      ? phaseTargets.targets
      : [];

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

    if (individualTarget && tierText)
      return `Ind: ${individualTarget} | ${tierText}`;
    if (individualTarget) return `Ind: ${individualTarget}`;
    if (tierText) return tierText;

    return "No phase target";
  }, [loading, phase, phaseTargets]);

  // =========================
  // Profile Derived (UPDATED)
  // =========================
  const userName = profile?.name || user?.name || "Admin";
  const roleLabel = formatRoleLabel(profile?.role || user?.role);
  const adminId = profile?.adminId || null;

  const profileSubtitle = profileLoading
    ? "Loading profile..."
    : adminId
    ? `${roleLabel} ID: ${adminId}`
    : `${roleLabel} ID unavailable`;

  const initials = getInitials(userName);

  // =========================
  // UI
  // =========================

  return (
    <div className="flex w-full items-center justify-between gap-3">
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <button className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden">
          <MenuRoundedIcon fontSize="small" />
        </button>

        <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#3211d4] text-white">
          <Icons.School fontSize="small" />
        </div>

        <div className="hidden sm:block">
          <h1 className="text-lg font-bold text-slate-900">
            UniPortal
          </h1>
          <p className="text-[10px] font-semibold uppercase text-slate-500">
            Admin Console
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">

        <div className="hidden sm:flex text-xs font-bold text-[#3211d4]">
          {remainingText}
        </div>

        <div className="hidden xl:flex text-xs">
          Current Phase:{" "}
          <span className="font-bold ml-1">
            {phaseSummaryText}
          </span>
        </div>

        <div className="hidden xl:flex text-xs">
          Targets:{" "}
          <span className="font-bold ml-1">
            {targetSummaryText}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:block text-right">
            <p className="text-sm font-bold text-slate-900">
              {userName}
            </p>
            <p className="text-[10px] text-slate-500">
              {profileSubtitle}
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

export default AdminHeader;
