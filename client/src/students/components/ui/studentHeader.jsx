// src/ui/adminHeader.jsx
import { useEffect, useMemo, useState } from "react";
import Icons from "../../../assets/Icons";
import { fetchMyGroup } from "../../../service/membership.api";
import { fetchCurrentPhase, fetchPhaseTargets } from "../../../service/phase.api";

const PHASE_END_HOUR = 18;

const toPhaseEndDateTime = (value) => {
  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = Number(match[1]);
      const monthIndex = Number(match[2]) - 1;
      const day = Number(match[3]);
      return new Date(year, monthIndex, day, PHASE_END_HOUR, 0, 0, 0);
    }
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), PHASE_END_HOUR, 0, 0, 0);
};

const StudentHeader = () => {
  const [phase, setPhase] = useState(null);
  const [phaseTargets, setPhaseTargets] = useState(null);
  const [myGroup, setMyGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadPhase = async () => {
      try {
        const [data, myGroupRes] = await Promise.all([
          fetchCurrentPhase(),
          fetchMyGroup().catch(() => ({ group: null }))
        ]);
        let targetData = null;

        if (data?.phase_id) {
          try {
            targetData = await fetchPhaseTargets(data.phase_id);
          } catch {
            targetData = null;
          }
        }

        if (!mounted) return;
        setPhase(data || null);
        setPhaseTargets(targetData);
        setMyGroup(myGroupRes?.group ?? null);
      } catch {
        if (!mounted) return;
        setPhase(null);
        setPhaseTargets(null);
        setMyGroup(null);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    loadPhase();
    const intervalId = setInterval(loadPhase, 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const remainingText = useMemo(() => {
    if (loading) return "Loading phase...";
    if (!phase?.end_date) return "No active phase";

    const endDate = toPhaseEndDateTime(phase.end_date);
    const now = new Date();
    if (endDate && now > endDate) return "Phase ended";

    if (
      endDate &&
      now.getFullYear() === endDate.getFullYear() &&
      now.getMonth() === endDate.getMonth() &&
      now.getDate() === endDate.getDate()
    ) {
      return "Ends today at 6:00 PM";
    }

    const workingDays = Number(phase?.remaining_working_days);
    if (!Number.isNaN(workingDays)) {
      if (workingDays <= 0) return "Phase ended";
      if (workingDays === 1) return "1 Day Remaining";
      return `${workingDays} Days Remaining`;
    }
    if (!endDate) return "No active phase";

    const msPerDay = 24 * 60 * 60 * 1000;
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const diffDays = Math.ceil((endDate.getTime() - endOfToday.getTime()) / msPerDay);

    if (diffDays < 0) return "Phase ended";
    if (diffDays === 0) return "Ends today at 6:00 PM";
    if (diffDays === 1) return "1 Day Remaining";
    return `${diffDays} Days Remaining`;
  }, [loading, phase]);

  const eligibilityTargetText = useMemo(() => {
    if (loading) return "Loading target...";
    if (!phase?.phase_id) return "No active phase";

    const target = phaseTargets?.individual_target;
    if (target === undefined || target === null || target === "") {
      return "Target not set";
    }

    return `${target} points`;
  }, [loading, phase, phaseTargets]);

  const groupTierTargetText = useMemo(() => {
    if (!myGroup?.group_id || !myGroup?.tier) return "";
    if (!phase?.phase_id) return "";

    const tier = String(myGroup.tier).toUpperCase();
    const rows = Array.isArray(phaseTargets?.targets) ? phaseTargets.targets : [];
    const row = rows.find((item) => String(item?.tier || "").toUpperCase() === tier);

    if (!row || row.group_target === undefined || row.group_target === null || row.group_target === "") {
      return `Group (${tier}) target not set`;
    }

    return `Group (${tier}) target: ${row.group_target} points`;
  }, [myGroup, phase, phaseTargets]);

  return (
    <div className="w-full flex items-center justify-between">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-lg bg-blue-700 text-white flex items-center justify-center">
          <Icons.School fontSize="small" />
        </div>
        <div className="leading-tight">
          <h1 className="text-base font-bold text-gray-900">UniPortal</h1>
          <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
            Admin Console
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex flex-col px-3 py-2 rounded-lg border border-gray-200 bg-white">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Eligibility Target
          </span>
          <span className="text-xs font-semibold text-blue-700">
            {eligibilityTargetText}
          </span>
          {groupTierTargetText ? (
            <span className="text-[11px] text-gray-600">
              {groupTierTargetText}
            </span>
          ) : null}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-gray-600">
          <Icons.Timer fontSize="small" />
          <span className="text-sm font-semibold text-red-600">
            {remainingText}
          </span>
        </div>

        <div className="h-6 w-px bg-gray-200 hidden sm:block" />

        <button className="relative size-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-700">
          <Icons.Notifications fontSize="small" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-red-500 border-2 border-white" />
        </button>

        <div className="flex items-center gap-2 pl-2">
          <div className="size-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
            <Icons.Person fontSize="small" />
          </div>
          <div className="hidden md:block leading-tight">
            <p className="text-sm font-bold text-gray-900">Student</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHeader;
