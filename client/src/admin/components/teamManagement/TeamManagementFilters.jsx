import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  TEAM_STATUSES,
  inputClass,
  selectClass
} from "./teamManagement.constants";

function FilterSelect({ children, onChange, value }) {
  return (
    <div className="relative min-w-40">
      <select value={value} onChange={onChange} className={selectClass}>
        {children}
      </select>

      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
        <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20 }} />
      </span>
    </div>
  );
}

export default function TeamManagementFilters({
  filteredCount,
  query,
  scopeConfig,
  setQuery,
  setStatusFilter,
  statusFilter,
  totalCount
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <SearchRoundedIcon
          sx={{ fontSize: 20 }}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${inputClass} pl-10`}
          placeholder={scopeConfig.searchPlaceholder}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All Statuses</option>
          {TEAM_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </FilterSelect>
      </div>
    </section>
  );
}
