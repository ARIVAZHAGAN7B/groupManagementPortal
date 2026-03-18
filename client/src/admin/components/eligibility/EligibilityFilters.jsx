import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  getPhaseOptionLabel,
  inputClass,
  VIEW_OPTIONS
} from "./eligibility.constants";

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

export default function EligibilityFilters({
  filteredCount,
  phases,
  q,
  selectedPhaseId,
  setQ,
  setSelectedPhaseId,
  setViewMode,
  totalCount,
  viewMode
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
          placeholder={
            viewMode === "individual"
              ? "Search student, ID, department, reason"
              : "Search group, code, tier, reason"
          }
        />
      </div>

      <div className="flex w-full items-center gap-3 md:w-auto">
        <FilterSelect
          value={selectedPhaseId}
          onChange={(event) => setSelectedPhaseId(event.target.value)}
        >
          {phases.length === 0 ? (
            <option value="">No phases</option>
          ) : null}
          {phases.map((phase) => (
            <option key={phase.phase_id} value={phase.phase_id}>
              {getPhaseOptionLabel(phase)}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={viewMode}
          onChange={(event) => setViewMode(event.target.value)}
        >
          {VIEW_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
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
