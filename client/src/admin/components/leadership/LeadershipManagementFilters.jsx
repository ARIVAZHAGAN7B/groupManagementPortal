import { getGroupOptionLabel, inputClass } from "./leadership.constants";
import {
  AdminFilterBar,
  AdminFilterSelect,
  AdminSearchField
} from "../ui/AdminFilterControls";

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
    <AdminFilterBar>
      <AdminSearchField
        value={q}
        onChangeValue={setQ}
        inputClassName={inputClass}
        placeholder="Search by group, student, role, request"
      />

      <div className="flex w-full items-center gap-3 md:w-auto">
        <AdminFilterSelect
          value={groupFilter}
          onChangeValue={setGroupFilter}
          wrapperClassName="relative min-w-32"
          selectClassName={`${inputClass} min-w-32 appearance-none pr-10`}
        >
          <option value="">All Groups</option>
          {groups.map((group) => (
            <option key={group.group_id} value={group.group_id}>
              {getGroupOptionLabel(group)}
            </option>
          ))}
        </AdminFilterSelect>

        <AdminFilterSelect
          value={requestedRoleFilter}
          onChangeValue={setRequestedRoleFilter}
          wrapperClassName="relative min-w-32"
          selectClassName={`${inputClass} min-w-32 appearance-none pr-10`}
        >
          <option value="">All Roles</option>
          {requestedRoleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </AdminFilterSelect>
      </div>
    </AdminFilterBar>
  );
}
