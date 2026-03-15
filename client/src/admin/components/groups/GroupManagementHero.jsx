import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { formatPercentLabel } from "./groupManagement.constants";

function StatPill({ accentClass, detail, label, value }) {
  return (
    <article className="rounded-lg border border-white/80 bg-white/90 px-3 py-2.5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${accentClass}`} />
        <p className="text-sm font-semibold text-slate-700">
          {label}: <span className="text-slate-900">{value}</span>
        </p>
      </div>
      <p className="mt-1 pl-4 text-[11px] font-medium text-slate-500">{detail}</p>
    </article>
  );
}

export default function GroupManagementHero({
  filteredCount,
  loading,
  onCreate,
  onRefresh,
  stats
}) {
  const total = Number(stats?.total) || 0;
  const active = Number(stats?.active) || 0;
  const frozen = Number(stats?.frozen) || 0;
  const inactive = Number(stats?.inactive) || 0;

  const headerSummary =
    typeof filteredCount === "number" && filteredCount !== total
      ? `Showing ${filteredCount} of ${total} groups`
      : `${total} groups in workspace`;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#1754cf]/10 bg-[#1754cf]/5 p-4 md:p-5">
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
              Group Workspace
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Group Management
              </h1>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-600">{headerSummary}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
            >
              <RefreshRoundedIcon sx={{ fontSize: 18 }} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1754cf] px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#1754cf]/20 transition-opacity hover:opacity-90"
            >
              <AddRoundedIcon sx={{ fontSize: 18 }} />
              Create Group
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <StatPill
            accentClass="bg-[#1754cf]"
            detail={typeof filteredCount === "number" && filteredCount !== total ? `Visible ${filteredCount}` : "All groups"}
            label="Total"
            value={total}
          />
          <StatPill
            accentClass="bg-green-500"
            detail={formatPercentLabel(active, total)}
            label="Active"
            value={active}
          />
          <StatPill
            accentClass="bg-sky-500"
            detail={formatPercentLabel(frozen, total)}
            label="Frozen"
            value={frozen}
          />
          <StatPill
            accentClass="bg-slate-400"
            detail={formatPercentLabel(inactive, total)}
            label="Inactive"
            value={inactive}
          />
        </div>
      </div>

      <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-[#1754cf]/10 blur-3xl" />
    </section>
  );
}
