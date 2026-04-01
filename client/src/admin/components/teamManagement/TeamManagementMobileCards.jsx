import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  STATUS_STYLES,
  TYPE_STYLES,
  formatTeamTypeLabel,
  getActionDisabledState
} from "./teamManagement.constants";

function Pill({ children, className }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${className}`}>
      {children}
    </span>
  );
}

function ActionButton({ className, disabled, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {label}
    </button>
  );
}

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
    <div className="grid gap-4 lg:hidden">
      {rows.length > 0 ? (
        rows.map((row) => {
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
            <article key={row.team_id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-bold text-[#0f6cbd]">{row.team_code}</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">{row.team_name || "-"}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onViewMembers(row)}
                    disabled={viewBusyTeamId === Number(row.team_id)}
                    title="View members"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(row)}
                    disabled={busy}
                    title="Edit"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <EditRoundedIcon sx={{ fontSize: 18 }} />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Pill className={typeClass}>
                  {isEventGroupScope ? "Event Group" : formatTeamTypeLabel(row.team_type)}
                </Pill>
                <Pill className={statusClass}>{String(row.status || "-").toUpperCase()}</Pill>
                <Pill className="border-slate-200 bg-slate-100 text-slate-700">
                  <span className="inline-flex items-center gap-1">
                    <PeopleAltOutlinedIcon sx={{ fontSize: 14 }} />
                    {Number(row.active_member_count) || 0} members
                  </span>
                </Pill>
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
                  <ActionButton
                    key={action.key}
                    label={action.label}
                    onClick={action.onClick}
                    disabled={busy}
                    className={action.className}
                  />
                ))}
              </div>
            </article>
          );
        })
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
          {scopeConfig.emptyStateLabel} for the current filters.
        </div>
      )}
    </div>
  );
}
