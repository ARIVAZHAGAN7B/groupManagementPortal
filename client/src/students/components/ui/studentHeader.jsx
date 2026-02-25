import { useEffect, useMemo, useState } from "react";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import Icons from "../../../assets/Icons";
import { useAuth } from "../../../utils/AuthContext";
import { fetchMyGroup } from "../../../service/membership.api";
import { fetchCurrentPhase, fetchPhaseTargets } from "../../../service/phase.api";
import { getProfile } from "../../../service/joinRequests.api";

const PHASE_END_HOUR = 18;

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
  if (!name) return "ST";
  return name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
};

const StudentHeader = () => {
  const { user } = useAuth();

  const [phase, setPhase] = useState(null);
  const [phaseTargets, setPhaseTargets] = useState(null);
  const [myGroup, setMyGroup] = useState(null);

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  // =========================
  // Load Phase + Group
  // =========================
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [phaseRes, groupRes] = await Promise.all([
          fetchCurrentPhase(),
          fetchMyGroup().catch(() => ({ group: null })),
        ]);

        let targetRes = null;

        if (phaseRes?.phase_id) {
          targetRes = await fetchPhaseTargets(phaseRes.phase_id).catch(
            () => null
          );
        }

        if (!mounted) return;

        setPhase(phaseRes || null);
        setMyGroup(groupRes?.group ?? null);
        setPhaseTargets(targetRes);
      } catch {
        if (!mounted) return;
        setPhase(null);
        setMyGroup(null);
        setPhaseTargets(null);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // =========================
  // Load Profile
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
  // Derived Values
  // =========================

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

  const initials = getInitials(studentName);

  // =========================
  // UI
  // =========================

  return (
    <div className="flex w-full items-center justify-between gap-3">

      {/* Left */}
      <div className="flex items-center gap-3">
        <button className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden">
          <MenuRoundedIcon fontSize="small" />
        </button>

        <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#3211d4] text-white">
          <Icons.School fontSize="small" />
        </div>

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