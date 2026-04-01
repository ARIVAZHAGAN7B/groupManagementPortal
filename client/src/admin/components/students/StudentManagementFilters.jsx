import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { inputClass } from "../groups/groupManagement.constants";

function FilterSelect({ children, onChange, value }) {
  return (
    <div className="relative min-w-36">
      <select
        value={value}
        onChange={onChange}
        className={`${inputClass} min-w-36 appearance-none pr-10`}
      >
        {children}
      </select>

      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
        <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20 }} />
      </span>
    </div>
  );
}

export default function StudentManagementFilters({
  filteredCount,
  groupFilter,
  q,
  setGroupFilter,
  setQ,
  setYearFilter,
  totalCount,
  yearFilter,
  yearOptions
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
          placeholder="Search by student, email, group, tier, role"
        />
      </div>

      <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
        <FilterSelect value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}>
          <option value="ALL">All Students</option>
          <option value="IN_GROUP">In Groups</option>
          <option value="UNGROUPED">Ungrouped</option>
        </FilterSelect>

        <FilterSelect value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
          <option value="ALL">All Years</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              Year {year}
            </option>
          ))}
        </FilterSelect>

      </div>
    </section>
  );
}
