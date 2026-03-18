import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import {
  STATUS_STYLES,
  TYPE_STYLES,
  formatDate,
  formatTeamTypeLabel,
  getActionDisabledState
} from "./teamManagement.constants";

function StatusBadge({ value }) {
  const normalized = String(value || "").toUpperCase();
  const cls = STATUS_STYLES[normalized] || "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${cls}`}>
      {normalized || "-"}
    </span>
  );
}

function TypeBadge({ value }) {
  const normalized = String(value || "").toUpperCase();
  const cls = TYPE_STYLES[normalized] || "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${cls}`}>
      {formatTeamTypeLabel(normalized)}
    </span>
  );
}

function ActionButton({ className, disabled, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {label}
    </button>
  );
}

export default function TeamManagementDesktopTable({
  actionBusyId,
  onActivate,
  onArchive,
  onDeactivate,
  onEdit,
  onFreeze,
  rows,
  scopeConfig,
  totalCount
}) {
  const isEventGroupScope = scopeConfig.scope === "EVENT_GROUP";

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1120px] w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              <th className="px-5 py-4">Code</th>
              <th className="px-5 py-4">Name</th>
              <th className="px-5 py-4">{isEventGroupScope ? "Event" : "Type"}</th>
              <th className="px-5 py-4 text-center">Members</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Updated</th>
              <th className="px-5 py-4">Notes</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.length > 0 ? (
              rows.map((row) => {
                const busy = actionBusyId === Number(row.team_id);
                const disabled = getActionDisabledState(row.status);

                return (
                  <tr key={row.team_id} className="align-top transition hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="font-mono text-xs font-bold text-[#0f6cbd]">{row.team_code}</div>
                      <div className="mt-1 text-[10px] text-slate-400">ID {row.team_id}</div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-sm font-semibold text-slate-900">{row.team_name || "-"}</div>
                    </td>

                    <td className="px-5 py-4">
                      {isEventGroupScope ? (
                        <div className="text-sm text-slate-700">
                          <div className="font-semibold text-slate-900">{row.event_name || "-"}</div>
                          <div className="mt-1 text-[11px] text-slate-500">{row.event_code || "No event code"}</div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <TypeBadge value={row.team_type} />
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                        <PeopleAltOutlinedIcon sx={{ fontSize: 16 }} />
                        {Number(row.active_member_count) || 0}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge value={row.status} />
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      <div>{formatDate(row.updated_at)}</div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        Created {formatDate(row.created_at)}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="max-w-[260px] text-sm leading-6 text-slate-500">
                        {row.description || "No description added."}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="ml-auto flex max-w-[320px] flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(row)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <EditRoundedIcon sx={{ fontSize: 15 }} />
                          Edit
                        </button>
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
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-5 py-14 text-center text-sm text-slate-500">
                  {scopeConfig.emptyStateLabel} for the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-4">
        <p className="text-xs font-medium text-slate-500">
          Showing {rows.length} of {totalCount} {scopeConfig.scopeLabelPlural.toLowerCase()}
        </p>
        <p className="text-xs font-medium text-slate-500">All matching records are listed</p>
      </div>
    </section>
  );
}
