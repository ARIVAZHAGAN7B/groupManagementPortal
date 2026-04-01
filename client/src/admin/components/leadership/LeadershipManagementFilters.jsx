import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { getGroupOptionLabel, inputClass } from "./leadership.constants";

function FilterSelect({ children, onChange, value }) {
  return (
    <div className="relative min-w-32">
      <select
        value={value}
        onChange={onChange}
        className={`${inputClass} min-w-32 appearance-none pr-10`}
      >
        {children}
      </select>

      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
        <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20 }} />
      </span>
    </div>
  );
}

export default function LeadershipManagementFilters({
  filteredCount,
  groupFilter,
  groups,
  q,
  requestedRoleFilter,
  requestedRoleOptions,
  setGroupFilter,
  setQ,
  setRequestedRoleFilter,
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
          value={q}
          onChange={(event) => setQ(event.target.value)}
          className={`${inputClass} pl-10`}
          placeholder="Search by group, student, role, request"
        />
      </div>

      <div className="flex w-full items-center gap-3 md:w-auto">
        <FilterSelect
          value={groupFilter}
          onChange={(event) => setGroupFilter(event.target.value)}
        >
          <option value="">All Groups</option>
          {groups.map((group) => (
            <option key={group.group_id} value={group.group_id}>
              {getGroupOptionLabel(group)}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={requestedRoleFilter}
          onChange={(event) => setRequestedRoleFilter(event.target.value)}
        >
          <option value="">All Roles</option>
          {requestedRoleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </FilterSelect>

      </div>
    </section>
  );
}
