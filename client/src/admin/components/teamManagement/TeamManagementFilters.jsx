import {
  TEAM_STATUSES,
  inputClass,
  selectClass
} from "./teamManagement.constants";
import {
  AdminFilterBar,
  AdminFilterSelect,
  AdminSearchField
} from "../ui/AdminFilterControls";

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
    <AdminFilterBar className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
      <AdminSearchField
        value={query}
        onChangeValue={setQuery}
        inputClassName={inputClass}
        placeholder={scopeConfig.searchPlaceholder}
        wrapperClassName="relative flex-1"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <AdminFilterSelect
          value={statusFilter}
          onChangeValue={setStatusFilter}
          wrapperClassName="relative min-w-40"
          selectClassName={selectClass}
        >
          <option value="ALL">All Statuses</option>
          {TEAM_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </AdminFilterSelect>
      </div>
    </AdminFilterBar>
  );
}
