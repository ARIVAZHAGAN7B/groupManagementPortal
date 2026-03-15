import AcUnitRoundedIcon from "@mui/icons-material/AcUnitRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  formatGroupMeta,
  formatGroupPoints,
  getGroupLifecycleActionKeys,
  getStatusConfig,
  getTierBadgeClass
} from "./groupManagement.constants";

export default function GroupManagementMobileCards({
  groups,
  onActivate,
  onDelete,
  onEdit,
  onFreeze,
  onView
}) {
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
        No groups found for current filters.
      </div>
    );
  }

  return (
    <section className="space-y-4 lg:hidden">
      {groups.map((group) => {
        const statusConfig = getStatusConfig(group.status);
        const lifecycleActionMap = {
          activate: {
            label: "Activate",
            icon: PlayArrowRoundedIcon,
            className: "bg-green-50 text-green-600",
            onClick: () => onActivate(group.group_id)
          },
          freeze: {
            label: "Freeze",
            icon: AcUnitRoundedIcon,
            className: "bg-sky-50 text-sky-600",
            onClick: () => onFreeze(group.group_id)
          },
          inactive: {
            label: "Inactive",
            icon: DeleteOutlineRoundedIcon,
            className: "bg-red-50 text-red-600",
            onClick: () => onDelete(group.group_id)
          }
        };
        const lifecycleActionKeys = getGroupLifecycleActionKeys(group.status);

        return (
          <article
            key={group.group_id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-900">{group.group_name}</h4>
                <p className="mt-1 text-xs font-mono font-bold uppercase text-[#1754cf]">
                  {group.group_code}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">{formatGroupMeta(group)}</p>
              </div>

              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getTierBadgeClass(
                  group.tier
                )}`}
              >
                Tier {String(group.tier || "-").toUpperCase()}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 py-2 text-xs">
              <span className="text-slate-500">Status</span>
              <span className={`flex items-center gap-1 font-bold ${statusConfig.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                {statusConfig.label}
              </span>
            </div>

            <div className="flex items-start justify-between border-t border-slate-100 py-2 text-xs">
              <span className="text-slate-500">Leader</span>
              <div className="text-right">
                <div className="font-bold text-slate-900">{group.leader_name || "-"}</div>
                <div className="font-mono text-[10px] text-slate-400">
                  {group.leader_roll_number || "No roll number"}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 py-2 text-xs">
              <span className="text-slate-500">Points</span>
              <span className="font-bold text-slate-900">{formatGroupPoints(group)}</span>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => onView(group.group_id)}
                className="flex flex-col items-center gap-1 rounded-lg bg-slate-50 p-2"
              >
                <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                <span className="text-[8px] font-bold uppercase">View</span>
              </button>

              <button
                type="button"
                onClick={() => onEdit(group.group_id)}
                className="flex flex-col items-center gap-1 rounded-lg bg-slate-50 p-2"
              >
                <EditOutlinedIcon sx={{ fontSize: 16 }} />
                <span className="text-[8px] font-bold uppercase">Edit</span>
              </button>

              {lifecycleActionKeys.map((actionKey) => {
                const action = lifecycleActionMap[actionKey];
                const Icon = action.icon;

                return (
                  <button
                    key={actionKey}
                    type="button"
                    onClick={action.onClick}
                    className={`flex flex-col items-center gap-1 rounded-lg p-2 ${action.className}`}
                  >
                    <Icon sx={{ fontSize: 16 }} />
                    <span className="text-[8px] font-bold uppercase">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </article>
        );
      })}
    </section>
  );
}
