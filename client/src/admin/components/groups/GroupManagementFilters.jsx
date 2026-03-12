import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { inputClass } from "./groupManagement.constants";

export default function GroupManagementFilters({
  filteredCount,
  q,
  setQ,
  statsTotal,
  statusFilter,
  statusOptions,
  setStatusFilter,
  tierFilter,
  tierOptions,
  setTierFilter
}) {
  return (
    <section className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
      <div className="relative w-full md:flex-1">
        <SearchRoundedIcon
          sx={{ fontSize: 20 }}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={`${inputClass} pl-10`}
          placeholder="Search by code, name, tier, status"
        />
      </div>

      <div className="flex w-full items-center gap-3 md:w-auto">
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className={`${inputClass} min-w-32`}
        >
          <option value="ALL">All Tiers</option>
          {tierOptions.map((tier) => (
            <option key={tier} value={tier}>
              Tier {tier}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${inputClass} min-w-32`}
        >
          <option value="ALL">All Status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <p className="hidden whitespace-nowrap text-xs font-medium text-slate-500 lg:block">
          Showing {filteredCount} of {statsTotal}
        </p>
      </div>
    </section>
  );
}
