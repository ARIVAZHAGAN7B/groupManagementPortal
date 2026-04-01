import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  ActionSelector,
  StatusBadge,
  TierBadge,
  ToneBadge
} from "./TierChangeManagementShared";
import {
  getDisplayedTargetTier,
  getResolvedAction,
  toEligibleLabel
} from "./tierChangeManagement.utils";

export default function TierChangeManagementDesktopTable({
  applyBusyKey,
  onActionChange,
  onApply,
  onViewGroup,
  rows,
  selectedActions,
  selectedPhaseId
}) {
  return (
    <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1140px] border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              <th className="px-6 py-4">Group</th>
              <th className="px-6 py-4 text-center">Tier</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Last Phase</th>
              <th className="px-6 py-4">Previous Phase</th>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Next Tier</th>
              <th className="px-6 py-4 text-right">Apply</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.length > 0 ? (
              rows.map((row) => {
                const saved = row.team_change_tier || null;
                const busyKey = `${selectedPhaseId}:${row.group_id}`;
                const resolvedAction = getResolvedAction(row, selectedActions);
                const targetTier = getDisplayedTargetTier(row, selectedActions);

                return (
                  <tr key={row.group_id} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {row.group_name || "-"}
                        </div>
                        <div className="text-[10px] font-mono font-bold uppercase text-[#1754cf]">
                          {row.group_code || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <TierBadge tier={row.current_tier} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={row.group_status} />
                    </td>
                    <td className="px-6 py-4">
                      <ToneBadge value={toEligibleLabel(row.last_phase_eligible)} />
                    </td>
                    <td className="px-6 py-4">
                      <ToneBadge value={toEligibleLabel(row.previous_phase_eligible)} />
                    </td>
                    <td className="px-6 py-4">
                      <ActionSelector
                        disabled={Boolean(saved)}
                        onChange={(action) => onActionChange(row.group_id, action)}
                        resolvedAction={resolvedAction}
                        row={row}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <TierBadge tier={targetTier} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="ml-auto flex max-w-[15rem] items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onViewGroup(row.group_id)}
                          title="View"
                          aria-label="View"
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-slate-100"
                        >
                          <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onApply(row)}
                          disabled={Boolean(saved) || applyBusyKey === busyKey}
                          className="w-full whitespace-nowrap rounded-md bg-[#1754cf] px-2.5 py-1 text-center text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {applyBusyKey === busyKey ? "Applying..." : saved ? "Applied" : "Apply"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
                  No groups found for current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
