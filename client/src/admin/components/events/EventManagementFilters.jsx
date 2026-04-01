import { EVENT_STATUSES, inputClass, selectClass } from "./eventManagement.constants";
import { AdminFilterBar, AdminFilterSelect, AdminSearchField } from "../ui/AdminFilterControls";

export default function EventManagementFilters({
  filteredCount,
  query,
  setQuery,
  setStatusFilter,
  statusFilter,
  totalCount
}) {
  return (
    <AdminFilterBar>
      <AdminSearchField
        value={query}
        onChangeValue={setQuery}
        placeholder="Search by code, event, location, registration dates, capacity, or status"
        inputClassName={inputClass}
      />

      <AdminFilterSelect
        value={statusFilter}
        onChangeValue={setStatusFilter}
        wrapperClassName="relative w-full md:w-[220px]"
        selectClassName={selectClass}
      >
        <option value="ALL">All statuses</option>
        {EVENT_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </AdminFilterSelect>

      <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 md:w-auto md:min-w-[220px] md:justify-end">
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Visible Events
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            {filteredCount} of {totalCount}
          </p>
        </div>
      </div>
    </AdminFilterBar>
  );
}
