import { inputClass } from "./groupManagement.constants";
import {
  AdminFilterBar,
  AdminFilterSelect,
  AdminSearchField
} from "../ui/AdminFilterControls";

export default function GroupManagementFilters({
  filteredCount,
  q,
  setQ,
  statsTotal,
  statusFilter,
  statusOptions,
  setStatusFilter,
  tierFilter,
  tierOptions,
  setTierFilter
}) {
  return (
    <AdminFilterBar>
      <AdminSearchField
        value={q}
        onChangeValue={setQ}
        inputClassName={inputClass}
        placeholder="Search by code, name, tier, status"
      />

      <div className="flex w-full items-center gap-3 md:w-auto">
        <AdminFilterSelect
          value={tierFilter}
          onChangeValue={setTierFilter}
          wrapperClassName="relative min-w-32"
          selectClassName={`${inputClass} min-w-32 appearance-none pr-10`}
        >
          <option value="ALL">All Tiers</option>
          {tierOptions.map((tier) => (
            <option key={tier} value={tier}>
              Tier {tier}
            </option>
          ))}
        </AdminFilterSelect>

        <AdminFilterSelect
          value={statusFilter}
          onChangeValue={setStatusFilter}
          wrapperClassName="relative min-w-32"
          selectClassName={`${inputClass} min-w-32 appearance-none pr-10`}
        >
          <option value="ALL">All Status</option>
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
