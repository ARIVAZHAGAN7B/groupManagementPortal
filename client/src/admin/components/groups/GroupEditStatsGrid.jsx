import {
  formatGroupPoints,
  getStatusConfig,
  getTierBadgeClass
} from "./groupManagement.constants";

function SummaryCard({ extra, label, value, valueClassName = "" }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-1 text-sm font-medium text-slate-500">{label}</p>
      <div className={valueClassName || "text-2xl font-bold text-slate-900"}>{value}</div>
      {extra ? <p className="mt-2 text-[11px] font-medium text-slate-500">{extra}</p> : null}
    </article>
  );
}

export default function GroupEditStatsGrid({ group }) {
  const statusConfig = getStatusConfig(group?.status);
  const tier = String(group?.tier || "-").toUpperCase();

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        label="Group Name"
        value={group?.group_name || "-"}
        valueClassName="text-lg font-bold text-slate-900"
      />

      <SummaryCard
        label="Current Tier"
        value={
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${getTierBadgeClass(tier)}`}
          >
            Tier {tier}
          </span>
        }
        valueClassName=""
      />

      <SummaryCard
        label="Status"
        value={
          <span className={`inline-flex items-center gap-2 text-sm font-bold ${statusConfig.text}`}>
            <span className={`h-2 w-2 rounded-full ${statusConfig.dot}`} />
            {statusConfig.label}
          </span>
        }
        valueClassName=""
      />

      <SummaryCard
        label="Total Points"
        value={formatGroupPoints(group)}
      />
    </section>
  );
}
