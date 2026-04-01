import {
  inputClass,
  selectClass
} from "./teamMembershipManagement.constants";
import {
  AdminFilterBar,
  AdminFilterSelect,
  AdminSearchField
} from "../ui/AdminFilterControls";

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
    <AdminFilterBar>
      <AdminSearchField
        value={query}
        onChangeValue={setQuery}
        inputClassName={inputClass}
        placeholder={`Search by student, ${scopeConfig?.scopeSearchLabel || "team"}, role, or status${
          scopeConfig?.scope === "EVENT_GROUP" ? ", or event" : ""
        }`}
      />

      <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
        <AdminFilterSelect
          value={statusFilter}
          onChangeValue={setStatusFilter}
          wrapperClassName="relative min-w-32"
          selectClassName={`${selectClass} min-w-32`}
        >
          <option value="ALL">All Statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </AdminFilterSelect>
      </div>
    </AdminFilterBar>
  );
}
