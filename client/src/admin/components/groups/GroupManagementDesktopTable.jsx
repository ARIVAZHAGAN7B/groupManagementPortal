import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  formatGroupMeta,
  formatGroupPoints,
  getStatusConfig,
  getTierBadgeClass
} from "./groupManagement.constants";

function TierBadge({ tier }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getTierBadgeClass(tier)}`}
    >
      Tier {String(tier || "-").toUpperCase()}
    </span>
  );
}

function StatusBadge({ status }) {
  const config = getStatusConfig(status);

  return (
    <span className={`flex items-center gap-1.5 text-[10px] font-bold ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function ActionIconButton({ className = "", label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`rounded-lg p-1.5 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

function ActionTextButton({ className = "", label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${className}`}
    >
      {label}
    </button>
  );
}

export default function GroupManagementDesktopTable({
  groups,
  onActivate,
  onDelete,
  onEdit,
  onFreeze,
  onView,
  totalCount
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[880px] w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4 text-center">Points</th>
              <th className="px-6 py-4 text-center">Tier</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {groups.length > 0 ? (
              groups.map((group) => {
                const normalizedStatus = String(group?.status || "").toUpperCase();
                const canFreeze = normalizedStatus === "ACTIVE";

                return (
                  <tr key={group.group_id} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-mono font-bold text-[#1754cf]">
                      {group.group_code}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">{group.group_name}</div>
                      <div className="text-[10px] text-slate-400">{formatGroupMeta(group)}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-slate-900">
                        {formatGroupPoints(group)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <TierBadge tier={group.tier} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={group.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ActionIconButton
                          label="View"
                          onClick={() => onView(group.group_id)}
                          className="hover:bg-slate-100"
                        >
                          <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                        </ActionIconButton>

                        <ActionTextButton
                          label="Edit"
                          onClick={() => onEdit(group.group_id)}
                          className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        />

                        {canFreeze ? (
                          <ActionTextButton
                            label="Freeze"
                            onClick={() => onFreeze(group.group_id)}
                            className="border border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100"
                          />
                        ) : (
                          <ActionTextButton
                            label="Activate"
                            onClick={() => onActivate(group.group_id)}
                            className="border border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                          />
                        )}

                        <ActionTextButton
                          label="Inactive"
                          onClick={() => onDelete(group.group_id)}
                          className="border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                  No groups found for current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between bg-slate-50 px-6 py-4">
        <p className="text-xs font-medium text-slate-500">
          Showing {groups.length} of {totalCount} groups
        </p>
        <p className="text-xs font-medium text-slate-500">All matching groups are listed</p>
      </div>
    </section>
  );
}
