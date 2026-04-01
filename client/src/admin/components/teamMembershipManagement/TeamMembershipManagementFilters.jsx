import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  inputClass,
  selectClass
} from "./teamMembershipManagement.constants";

function FilterSelect({ children, onChange, value }) {
  return (
    <div className="relative min-w-32">
      <select value={value} onChange={onChange} className={`${selectClass} min-w-32`}>
        {children}
      </select>

      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
        <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20 }} />
      </span>
    </div>
  );
}

export default function TeamMembershipManagementFilters({
  filteredCount,
  query,
  scopeConfig,
  setQuery,
  setStatusFilter,
  statusFilter,
  statusOptions,
  totalCount
}) {
  return (
    <section className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
      <div className="relative w-full md:flex-1">
        <SearchRoundedIcon
          sx={{ fontSize: 20 }}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={`${inputClass} pl-10`}
          placeholder={`Search by student, ${scopeConfig?.scopeSearchLabel || "team"}, role, or status${
            scopeConfig?.scope === "EVENT_GROUP" ? ", or event" : ""
          }`}
        />
      </div>

      <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
        <FilterSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="ALL">All Statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </FilterSelect>

      </div>
    </section>
  );
}
