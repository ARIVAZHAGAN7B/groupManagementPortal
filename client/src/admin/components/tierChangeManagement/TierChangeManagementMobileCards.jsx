import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  AdminMobileCard,
  AdminMobileCardList
} from "../ui/AdminMobileCards";
import {
  ActionSelector,
  MobileValueRow,
  StatusBadge,
  TierBadge,
  ToneBadge
} from "./TierChangeManagementShared";
import {
  getDisplayedTargetTier,
  getResolvedAction,
  toEligibleLabel
} from "./tierChangeManagement.utils";

export default function TierChangeManagementMobileCards({
  applyBusyKey,
  onActionChange,
  onApply,
  onViewGroup,
  rows,
  selectedActions,
  selectedPhaseId
}) {
  return (
    <AdminMobileCardList
      items={rows}
      emptyMessage="No groups found for current filters."
      emptyClassName="lg:hidden"
      renderItem={(row) => {
        const saved = row.team_change_tier || null;
        const busyKey = `${selectedPhaseId}:${row.group_id}`;
        const resolvedAction = getResolvedAction(row, selectedActions);
        const targetTier = getDisplayedTargetTier(row, selectedActions);

        return (
          <AdminMobileCard key={row.group_id} className="rounded-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-900">{row.group_name || "-"}</h4>
                <p className="mt-1 text-xs font-mono font-bold uppercase text-[#1754cf]">
                  {row.group_code || "-"}
                </p>
              </div>

              <TierBadge tier={row.current_tier} />
            </div>

            <MobileValueRow label="Status">
              <StatusBadge status={row.group_status} />
            </MobileValueRow>

            <MobileValueRow label="Last Phase">
              <ToneBadge value={toEligibleLabel(row.last_phase_eligible)} />
            </MobileValueRow>

            <MobileValueRow label="Previous Phase">
              <ToneBadge value={toEligibleLabel(row.previous_phase_eligible)} />
            </MobileValueRow>

            <MobileValueRow label="Action">
              <div className="max-w-[220px]">
                <ActionSelector
                  disabled={Boolean(saved)}
                  onChange={(action) => onActionChange(row.group_id, action)}
                  resolvedAction={resolvedAction}
                  row={row}
                />
              </div>
            </MobileValueRow>

            <MobileValueRow label="Next Tier">
              <TierBadge tier={targetTier} />
            </MobileValueRow>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => onViewGroup(row.group_id)}
                className="flex items-center justify-center gap-2 rounded-lg bg-slate-50 p-2 text-xs font-semibold text-slate-700"
              >
                <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                View
              </button>

              <button
                type="button"
                onClick={() => onApply(row)}
                disabled={Boolean(saved) || applyBusyKey === busyKey}
                className="flex items-center justify-center rounded-lg bg-[#1754cf] p-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {applyBusyKey === busyKey ? "Applying..." : saved ? "Applied" : "Apply"}
              </button>
            </div>
          </AdminMobileCard>
        );
      }}
    />
  );
}
