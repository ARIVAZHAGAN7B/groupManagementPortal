import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import { getRatioPercent } from "../groups/groupManagement.constants";

function MetricCard({ Icon, accentClass, caption, detail, value }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-sm font-medium text-slate-500">{caption}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <span className={`rounded-xl p-2 ${accentClass}`}>
          <Icon sx={{ fontSize: 18 }} />
        </span>
      </div>
      <p className="mt-3 text-[11px] font-medium leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

function PolicyCoverageCard({ enabledPolicyCount, totalPolicyCount }) {
  const percent = getRatioPercent(enabledPolicyCount, totalPolicyCount);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-sm font-medium text-slate-500">Enabled Safeguards</p>
          <p className="text-2xl font-bold text-slate-900">
            {enabledPolicyCount}/{totalPolicyCount}
          </p>
        </div>
        <span className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
          <ShieldRoundedIcon sx={{ fontSize: 18 }} />
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100">
        <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-[11px] font-medium text-slate-500">
        Active policy controls across switching, membership, and activation
      </p>
    </article>
  );
}

export default function IncubationConfigurationStatsGrid({ stats }) {
  const incubationLabel = `${stats.incubationDays} day${stats.incubationDays === 1 ? "" : "s"}`;
  const seatSpan = Math.max(stats.maxMembers - stats.minMembers + 1, 0);

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        Icon={HourglassTopRoundedIcon}
        accentClass="bg-[#1754cf]/10 text-[#1754cf]"
        caption="Incubation Window"
        detail="Stored against switched memberships as incubation end date"
        value={incubationLabel}
      />
      <MetricCard
        Icon={Groups2RoundedIcon}
        accentClass="bg-sky-50 text-sky-600"
        caption="Member Capacity"
        detail={`${seatSpan} seat${seatSpan === 1 ? "" : "s"} available across the active range`}
        value={stats.memberWindowLabel}
      />
      <MetricCard
        Icon={TuneRoundedIcon}
        accentClass="bg-amber-50 text-amber-600"
        caption="Leadership Activation"
        detail={
          stats.requireLeadership
            ? "Captain, vice captain, strategist, and manager are required"
            : "Leadership completeness is optional for activation"
        }
        value={stats.requireLeadership ? "Required" : "Optional"}
      />
      <PolicyCoverageCard
        enabledPolicyCount={stats.enabledPolicyCount}
        totalPolicyCount={stats.totalPolicyCount}
      />
    </section>
  );
}
