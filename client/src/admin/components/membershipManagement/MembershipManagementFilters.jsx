import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  MEMBERSHIP_STATUS_OPTIONS,
  inputClass,
  selectClass
} from "./membershipManagement.constants";

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

export default function MembershipManagementFilters({
  filteredCount,
  query,
  roleFilter,
  roleOptions,
  setQuery,
  setRoleFilter,
  setStatusFilter,
  statusFilter,
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
          onChange={(e) => setQuery(e.target.value)}
          className={`${inputClass} pl-10`}
          placeholder="Search by student, email, group, role, or status"
        />
      </div>

      <div className="flex w-full items-center gap-3 md:w-auto">
        <FilterSelect value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="ALL">All Roles</option>
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role.replaceAll("_", " ")}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {MEMBERSHIP_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </FilterSelect>

        <p className="hidden whitespace-nowrap text-xs font-medium text-slate-500 lg:block">
          Showing {filteredCount} of {totalCount}
        </p>
      </div>
    </section>
  );
}
