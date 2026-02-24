// src/ui/adminHeader.jsx
import { useEffect, useMemo, useState } from "react";
import Icons from "../../../assets/Icons";
import { fetchCurrentPhase, fetchPhaseTargets } from "../../../service/phase.api";

const TARGET_TIER_ORDER = ["D", "C", "B", "A"];
const PHASE_END_HOUR = 18;

const formatShortDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
};

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

const AdminHeader = () => {
  const [phase, setPhase] = useState(null);
  const [phaseTargets, setPhaseTargets] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadPhase = async () => {
      try {
        const data = await fetchCurrentPhase();
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

  const phaseSummaryText = useMemo(() => {
    if (loading) return "Loading current phase...";
    if (!phase?.phase_id) return "No active phase";

    const start = formatShortDate(phase.start_date);
    const end = formatShortDate(phase.end_date);
    if (start && end) return `${start} – ${end} · 6:00 PM`;

    return `ID ${String(phase.phase_id).slice(0, 8)}`;
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
      .filter((tier) => targetsByTier[tier] !== undefined && targetsByTier[tier] !== null)
      .map((tier) => `${tier}: ${targetsByTier[tier]}`)
      .join("  ·  ");

    const individualTarget = phaseTargets?.individual_target;
    const hasIndividual =
      individualTarget !== undefined && individualTarget !== null && individualTarget !== "";

    if (hasIndividual && tierText) return `Ind: ${individualTarget}  ·  ${tierText}`;
    if (hasIndividual) return `Ind: ${individualTarget}`;
    if (tierText) return tierText;
    return "No phase target";
  }, [loading, phase, phaseTargets]);

  return (
    <div className="w-full flex items-center justify-between">
      {/* Left – Brand */}
      <div className="flex items-center gap-2.5">
        <div className="size-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
          <Icons.School fontSize="small" />
        </div>
        <div className="leading-tight">
          <h1 className="text-sm font-bold tracking-tight text-gray-900">GMP Portal</h1>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
            Admin Console
          </p>
        </div>
      </div>

      {/* Right – Meta + Actions */}
      <div className="flex items-center gap-2">

        {/* Phase Info Card */}
        <div
          className="hidden lg:flex flex-col px-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50 max-w-[400px]"
          title={`Current Phase: ${phaseSummaryText}\nTarget: ${targetSummaryText}`}
        >
          <span className="text-[9.5px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
            Current Phase
          </span>
          <span className="text-[11.5px] font-semibold text-gray-700 truncate leading-tight">
            {phaseSummaryText}
          </span>
          <span className="text-[10.5px] text-blue-600 truncate leading-tight mt-0.5">
            {targetSummaryText}
          </span>
        </div>

        {/* Countdown */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-100">
          <Icons.Timer fontSize="small" className="text-red-400" />
          <span className="text-xs font-semibold text-red-500 whitespace-nowrap">
            {remainingText}
          </span>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-gray-200 hidden sm:block mx-0.5" />

        {/* Notifications */}
        <button className="relative size-9 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-500 transition-colors">
          <Icons.Notifications fontSize="small" />
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-red-500" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2 pl-1">
          <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Icons.Person fontSize="small" />
          </div>
          <div className="hidden md:block leading-tight">
            <p className="text-xs font-semibold text-gray-800">Admin</p>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
              Control Panel
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminHeader;