import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { inputClass } from "../groups/groupManagement.constants";
import { FilterSelect } from "./TierChangeManagementShared";

export default function TierChangeManagementFilters({
  actionFilter,
  onActionFilterChange,
  onPhaseChange,
  onSearchChange,
  onStatusFilterChange,
  phases,
  q,
  selectedPhaseId,
  statusFilter,
  statusOptions,
  totalCount,
  visibleCount
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center">
      <div className="relative w-full xl:flex-1">
        <SearchRoundedIcon
          sx={{ fontSize: 20 }}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={q}
          onChange={(event) => onSearchChange(event.target.value)}
          className={`${inputClass} pl-10`}
          placeholder="Search by group, code, tier, status, action"
        />
      </div>

      <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-3">
        <FilterSelect value={selectedPhaseId} onChange={(event) => onPhaseChange(event.target.value)}>
          {phases.length === 0 ? (
            <option value="">No phases available</option>
          ) : (
            phases.map((phase) => (
              <option key={phase.phase_id} value={phase.phase_id}>
                {phase.phase_name || phase.phase_id}
              </option>
            ))
          )}
        </FilterSelect>

        <FilterSelect value={actionFilter} onChange={(event) => onActionFilterChange(event.target.value)}>
          <option value="ALL">All Actions</option>
          <option value="PROMOTE">Promote</option>
          <option value="DEMOTE">Demote</option>
          <option value="APPLIED">Applied</option>
        </FilterSelect>

        <FilterSelect value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)}>
          <option value="ALL">All Status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </FilterSelect>
      </div>
    </section>
  );
}
