import { EVENT_STATUSES } from "./eventManagement.constants";
import {
  AdminFilterBar,
  AdminFilterSelect,
  AdminSearchField
} from "../ui/AdminFilterControls";

const compactInputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none transition focus:border-[#0f6cbd] focus:ring-4 focus:ring-[#0f6cbd]/10";

const compactSelectClass = `${compactInputClass} appearance-none pr-9`;

export default function EventManagementFilters({
  applyByStudentFilter,
  categoryFilter,
  categoryOptions,
  hasActiveFilters,
  levelFilter,
  levelOptions,
  onResetFilters,
  query,
  setApplyByStudentFilter,
  setCategoryFilter,
  setLevelFilter,
  setQuery,
  setStatusFilter,
  statusFilter
}) {
  return (
    <AdminFilterBar className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:flex-wrap md:items-center">
      <AdminSearchField
        value={query}
        onChangeValue={setQuery}
        placeholder="Search by code, event, organizer, category, location, or date"
        inputClassName={compactInputClass}
        wrapperClassName="relative w-full lg:min-w-[320px] lg:flex-1"
      />

      <AdminFilterSelect
        value={statusFilter}
        onChangeValue={setStatusFilter}
        wrapperClassName="relative w-full sm:w-[170px]"
        selectClassName={compactSelectClass}
      >
        <option value="ALL">All statuses</option>
        {EVENT_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </AdminFilterSelect>

      <AdminFilterSelect
        value={categoryFilter}
        onChangeValue={setCategoryFilter}
        wrapperClassName="relative w-full sm:w-[180px]"
        selectClassName={compactSelectClass}
      >
        <option value="ALL">All categories</option>
        {categoryOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </AdminFilterSelect>

      <AdminFilterSelect
        value={levelFilter}
        onChangeValue={setLevelFilter}
        wrapperClassName="relative w-full sm:w-[170px]"
        selectClassName={compactSelectClass}
      >
        <option value="ALL">All levels</option>
        {levelOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </AdminFilterSelect>

      <AdminFilterSelect
        value={applyByStudentFilter}
        onChangeValue={setApplyByStudentFilter}
        wrapperClassName="relative w-full sm:w-[190px]"
        selectClassName={compactSelectClass}
      >
        <option value="ALL">All student access</option>
        <option value="true">Apply by student: Yes</option>
        <option value="false">Apply by student: No</option>
      </AdminFilterSelect>

      <button
        type="button"
        onClick={onResetFilters}
        disabled={!hasActiveFilters}
        className="inline-flex min-h-[38px] w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        Clear Filters
      </button>
    </AdminFilterBar>
  );
}
