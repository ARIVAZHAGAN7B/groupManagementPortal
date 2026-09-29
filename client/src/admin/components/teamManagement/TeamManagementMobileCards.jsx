import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  AdminMobileCard,
  AdminMobileCardList
} from "../ui/AdminMobileCards";
import {
  AdminBadge,
  AdminIconActionButton,
  AdminTextActionButton
} from "../ui/AdminUiPrimitives";
import {
  STATUS_STYLES,
  TYPE_STYLES,
  formatTeamTypeLabel,
  getActionDisabledState
} from "./teamManagement.constants";

export default function TeamManagementMobileCards({
  actionBusyId,
  onActivate,
  onArchive,
  onDeactivate,
  onEdit,
  onFreeze,
  onViewMembers,
  rows,
  scopeConfig,
  viewBusyTeamId
}) {
  const isEventGroupScope = scopeConfig.scope === "EVENT_GROUP";

  return (
    <AdminMobileCardList
      items={rows}
      emptyMessage={`${scopeConfig.emptyStateLabel} for the current filters.`}
      emptyClassName="rounded-3xl px-4 py-12 lg:hidden"
      listClassName="grid gap-4 lg:hidden"
      renderItem={(row) => {
          const busy = actionBusyId === Number(row.team_id);
          const disabled = getActionDisabledState(row.status);
          const statusActions = [
            {
              key: "activate",
              label: "Activate",
              onClick: () => onActivate(row),
              className: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            },
            {
              key: "freeze",
              label: "Freeze",
              onClick: () => onFreeze(row),
              className: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
            },
            {
              key: "archive",
              label: "Delete",
              onClick: () => onArchive(row),
              className: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
            },
            {
              key: "inactive",
              label: "Inactive",
              onClick: () => onDeactivate(row),
              className: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
            }
          ].filter((action) => !disabled[action.key]);
          const typeClass =
            TYPE_STYLES[String(row.team_type || "").toUpperCase()] ||
            "border-slate-200 bg-slate-100 text-slate-600";
          const statusClass =
            STATUS_STYLES[String(row.status || "").toUpperCase()] ||
            "border-slate-200 bg-slate-100 text-slate-600";

          return (
            <AdminMobileCard key={row.team_id} className="rounded-3xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-bold text-[#0f6cbd]">{row.team_code}</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">{row.team_name || "-"}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <AdminIconActionButton
                    onClick={() => onViewMembers(row)}
                    disabled={viewBusyTeamId === Number(row.team_id)}
                    title="View members"
                    label="View members"
                    sizeClassName="h-10 w-10"
                    baseClassName="rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  >
                    <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                  </AdminIconActionButton>
                  <AdminIconActionButton
                    onClick={() => onEdit(row)}
                    disabled={busy}
                    label="Edit"
                    sizeClassName="h-10 w-10"
                    baseClassName="rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  >
                    <EditRoundedIcon sx={{ fontSize: 18 }} />
                  </AdminIconActionButton>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <AdminBadge className={typeClass}>
                  {isEventGroupScope ? "Event Group" : formatTeamTypeLabel(row.team_type)}
                </AdminBadge>
                <AdminBadge className={statusClass}>
                  {String(row.status || "-").toUpperCase()}
                </AdminBadge>
                <AdminBadge className="border-slate-200 bg-slate-100 text-slate-700">
                  <span className="inline-flex items-center gap-1">
                    <PeopleAltOutlinedIcon sx={{ fontSize: 14 }} />
                    {Number(row.active_member_count) || 0} members
                  </span>
                </AdminBadge>
              </div>

              <div className="mt-4 text-sm text-slate-600">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {isEventGroupScope ? "Event" : "Type"}
                </p>
                <p className="mt-1 font-medium text-slate-800">
                  {isEventGroupScope ? row.event_code || "-" : formatTeamTypeLabel(row.team_type)}
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Description
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {row.description || "No description added."}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {statusActions.map((action) => (
                  <AdminTextActionButton
                    key={action.key}
                    label={action.label}
                    onClick={action.onClick}
                    disabled={busy}
                    fullWidth={false}
                    sizeClassName="px-3 py-2"
                    className={action.className}
                  />
                ))}
              </div>
            </AdminMobileCard>
          );
      }}
    />
  );
}
