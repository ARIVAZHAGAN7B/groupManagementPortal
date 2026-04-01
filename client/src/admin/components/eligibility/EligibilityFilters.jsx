import {
  getPhaseOptionLabel,
  inputClass,
  VIEW_OPTIONS
} from "./eligibility.constants";
import {
  AdminFilterBar,
  AdminFilterSelect,
  AdminSearchField
} from "../ui/AdminFilterControls";

export default function EligibilityFilters({
  phases,
  q,
  selectedPhaseId,
  setQ,
  setSelectedPhaseId,
  setViewMode,
  setYearFilter,
  viewMode,
  yearFilter,
  yearOptions
}) {
  return (
    <AdminFilterBar>
      <AdminSearchField
        value={q}
        onChangeValue={setQ}
        inputClassName={inputClass}
        placeholder={
          viewMode === "individual"
            ? "Search student, ID, department, reason"
            : "Search group, code, tier, reason"
        }
      />

      <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
        <AdminFilterSelect
          value={selectedPhaseId}
          onChangeValue={setSelectedPhaseId}
          wrapperClassName="relative min-w-32"
          selectClassName={`${inputClass} min-w-32 appearance-none pr-10`}
        >
          {phases.length === 0 ? (
            <option value="">No phases</option>
          ) : null}
          {phases.map((phase) => (
            <option key={phase.phase_id} value={phase.phase_id}>
              {getPhaseOptionLabel(phase)}
            </option>
          ))}
        </AdminFilterSelect>

        <AdminFilterSelect
          value={viewMode}
          onChangeValue={setViewMode}
          wrapperClassName="relative min-w-32"
          selectClassName={`${inputClass} min-w-32 appearance-none pr-10`}
        >
          {VIEW_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </AdminFilterSelect>

        {viewMode === "individual" ? (
          <AdminFilterSelect
            value={yearFilter}
            onChangeValue={setYearFilter}
            wrapperClassName="relative min-w-32"
            selectClassName={`${inputClass} min-w-32 appearance-none pr-10`}
          >
            <option value="ALL">All Years</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                Year {year}
              </option>
            ))}
          </AdminFilterSelect>
        ) : null}
      </div>
    </AdminFilterBar>
  );
}
