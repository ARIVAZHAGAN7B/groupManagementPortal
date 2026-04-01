import { inputClass } from "../groups/groupManagement.constants";
import {
  AdminFilterBar,
  AdminFilterSelect,
  AdminSearchField
} from "../ui/AdminFilterControls";

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
    <AdminFilterBar>
      <AdminSearchField
        value={q}
        onChangeValue={setQ}
        inputClassName={inputClass}
        placeholder="Search by student, email, group, tier, role"
      />

      <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
        <AdminFilterSelect
          value={groupFilter}
          onChangeValue={setGroupFilter}
          wrapperClassName="relative min-w-36"
          selectClassName={`${inputClass} min-w-36 appearance-none pr-10`}
        >
          <option value="ALL">All Students</option>
          <option value="IN_GROUP">In Groups</option>
          <option value="UNGROUPED">Ungrouped</option>
        </AdminFilterSelect>

        <AdminFilterSelect
          value={yearFilter}
          onChangeValue={setYearFilter}
          wrapperClassName="relative min-w-36"
          selectClassName={`${inputClass} min-w-36 appearance-none pr-10`}
        >
          <option value="ALL">All Years</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              Year {year}
            </option>
          ))}
        </AdminFilterSelect>
      </div>
    </AdminFilterBar>
  );
}
