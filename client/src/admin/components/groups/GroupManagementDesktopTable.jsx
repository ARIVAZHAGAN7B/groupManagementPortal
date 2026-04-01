import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  AdminBadge,
  AdminIconActionButton,
  AdminStatusDotBadge,
  AdminTextActionButton
} from "../ui/AdminUiPrimitives";
import {
  formatGroupMeta,
  formatGroupPoints,
  getGroupLifecycleActionKeys,
  getStatusConfig,
  getTierBadgeClass
} from "./groupManagement.constants";

function LeaderCell({ name, rollNumber }) {
  return (
    <div>
      <div className="text-sm font-medium text-slate-800">{name || "-"}</div>
      <div className="text-[10px] font-mono text-slate-400">
        {rollNumber || "No roll number"}
      </div>
    </div>
  );
}

export default function GroupManagementDesktopTable({
  groups,
  onActivate,
  onDelete,
  onEdit,
  onFreeze,
  onView
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4 text-center">Points</th>
              <th className="px-6 py-4 text-center">Tier</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Leader</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {groups.length > 0 ? (
              groups.map((group) => {
                const lifecycleActionMap = {
                  activate: {
                    label: "Activate",
                    onClick: () => onActivate(group.group_id),
                    className: "border border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                  },
                  freeze: {
                    label: "Freeze",
                    onClick: () => onFreeze(group.group_id),
                    className: "border border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100"
                  },
                  inactive: {
                    label: "Inactive",
                    onClick: () => onDelete(group.group_id),
                    className: "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                  }
                };
                const lifecycleActionKeys = getGroupLifecycleActionKeys(group.status);

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
                      <AdminBadge className={getTierBadgeClass(group.tier)}>
                        Tier {String(group.tier || "-").toUpperCase()}
                      </AdminBadge>
                    </td>
                    <td className="px-6 py-4">
                      <AdminStatusDotBadge config={getStatusConfig(group.status)} />
                    </td>
                    <td className="px-6 py-4">
                      <LeaderCell
                        name={group.leader_name}
                        rollNumber={group.leader_roll_number}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="ml-auto grid grid-cols-[2rem_3.75rem_5rem_4.75rem] items-center justify-end gap-2">
                        <AdminIconActionButton
                          label="View"
                          onClick={() => onView(group.group_id)}
                          className="hover:bg-slate-100"
                        >
                          <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                        </AdminIconActionButton>

                        <AdminTextActionButton
                          label="Edit"
                          onClick={() => onEdit(group.group_id)}
                          className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        />

                        {lifecycleActionKeys.map((actionKey) => (
                          <AdminTextActionButton
                            key={actionKey}
                            label={lifecycleActionMap[actionKey].label}
                            onClick={lifecycleActionMap[actionKey].onClick}
                            className={lifecycleActionMap[actionKey].className}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
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
