import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import {
  STATUS_STYLES,
  TYPE_STYLES,
  formatDate,
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
  rows,
  scopeConfig
}) {
  const isEventGroupScope = scopeConfig.scope === "EVENT_GROUP";

  return (
    <div className="grid gap-4 lg:hidden">
      {rows.length > 0 ? (
        rows.map((row) => {
          const busy = actionBusyId === Number(row.team_id);
          const disabled = getActionDisabledState(row.status);
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

                <button
                  type="button"
                  onClick={() => onEdit(row)}
                  disabled={busy}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <EditRoundedIcon sx={{ fontSize: 18 }} />
                </button>
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

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    {isEventGroupScope ? "Event" : "Type"}
                  </p>
                  <p className="mt-1 font-medium text-slate-800">
                    {isEventGroupScope ? row.event_code || "-" : formatTeamTypeLabel(row.team_type)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Updated</p>
                  <p className="mt-1 font-medium text-slate-800">{formatDate(row.updated_at)}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <ActionButton
                  label="Activate"
                  onClick={() => onActivate(row)}
                  disabled={busy || disabled.activate}
                  className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                />
                <ActionButton
                  label="Freeze"
                  onClick={() => onFreeze(row)}
                  disabled={busy || disabled.freeze}
                  className="border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                />
                <ActionButton
                  label="Archive"
                  onClick={() => onArchive(row)}
                  disabled={busy || disabled.archive}
                  className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                />
                <ActionButton
                  label={busy ? "Working..." : "Set Inactive"}
                  onClick={() => onDeactivate(row)}
                  disabled={busy || disabled.inactive}
                  className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                />
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
