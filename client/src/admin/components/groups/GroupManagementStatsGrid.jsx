import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { formatPercentLabel, getRatioPercent } from "./groupManagement.constants";

function ProgressCard({ label, tone, value, total }) {
  const percent = getRatioPercent(value, total);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-1 text-sm font-medium text-slate-500">{label}</p>
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
      <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100">
        <div className={`h-1.5 rounded-full ${tone.replace("text-", "bg-")}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-[11px] font-medium text-slate-500">{formatPercentLabel(value, total)}</p>
    </article>
  );
}

export default function GroupManagementStatsGrid({ stats }) {
  return (
    <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-1 text-sm font-medium text-slate-500">Total Groups</p>
        <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        <p className="mt-2 flex items-center gap-1 text-xs font-medium text-green-600">
          <TrendingUpRoundedIcon sx={{ fontSize: 14 }} />
          Across all group statuses
        </p>
      </article>

      <ProgressCard label="Active" tone="text-green-600" value={stats.active} total={stats.total} />
      <ProgressCard label="Frozen" tone="text-sky-500" value={stats.frozen} total={stats.total} />
      <ProgressCard
        label="Inactive"
        tone="text-slate-400"
        value={stats.inactive}
        total={stats.total}
      />
    </section>
  );
}
