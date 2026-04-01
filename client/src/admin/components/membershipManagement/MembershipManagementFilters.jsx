import {
  MEMBERSHIP_STATUS_OPTIONS,
  inputClass,
  selectClass
} from "./membershipManagement.constants";
import {
  AdminFilterBar,
  AdminFilterSelect,
  AdminSearchField
} from "../ui/AdminFilterControls";

export default function MembershipManagementFilters({
  query,
  roleFilter,
  roleOptions,
  setQuery,
  setRoleFilter,
  setStatusFilter,
  setYearFilter,
  statusFilter,
  yearFilter,
  yearOptions
}) {
  return (
    <AdminFilterBar>
      <AdminSearchField
        value={query}
        onChangeValue={setQuery}
        inputClassName={inputClass}
        placeholder="Search by student, email, group, role, or status"
      />

      <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
        <AdminFilterSelect
          value={roleFilter}
          onChangeValue={setRoleFilter}
          wrapperClassName="relative min-w-32"
          selectClassName={`${selectClass} min-w-32`}
        >
          <option value="ALL">All Roles</option>
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role.replaceAll("_", " ")}
            </option>
          ))}
        </AdminFilterSelect>

        <AdminFilterSelect
          value={yearFilter}
          onChangeValue={setYearFilter}
          wrapperClassName="relative min-w-32"
          selectClassName={`${selectClass} min-w-32`}
        >
          <option value="ALL">All Years</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              Year {year}
            </option>
          ))}
        </AdminFilterSelect>

        <AdminFilterSelect
          value={statusFilter}
          onChangeValue={setStatusFilter}
          wrapperClassName="relative min-w-32"
          selectClassName={`${selectClass} min-w-32`}
        >
          {MEMBERSHIP_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </AdminFilterSelect>
      </div>
    </AdminFilterBar>
  );
}
