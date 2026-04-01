import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  STATUS_STYLES,
  TYPE_STYLES,
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

function ActionIconButton({ disabled, label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function ActionButton({ className, disabled, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-2 py-1 text-[11px] font-semibold leading-none transition disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
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
  onViewMembers,
  rows,
  scopeConfig,
  viewBusyTeamId
}) {
  const isEventGroupScope = scopeConfig.scope === "EVENT_GROUP";

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1040px] w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              <th className="px-5 py-4">Code</th>
              <th className="px-5 py-4">Name</th>
              <th className="px-5 py-4">{isEventGroupScope ? "Event" : "Type"}</th>
              <th className="px-5 py-4 text-center">Members</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Description</th>
              <th className="w-[1%] px-5 py-4 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
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

                    <td className="px-5 py-4">
                      <p className="max-w-[260px] text-sm leading-6 text-slate-500">
                        {row.description || "No description added."}
                      </p>
                    </td>

                    <td className="w-[1%] px-5 py-4 whitespace-nowrap">
                      <div className="ml-auto inline-grid grid-flow-col auto-cols-max items-center gap-1.5">
                        <ActionIconButton
                          disabled={busy || viewBusyTeamId === Number(row.team_id)}
                          label="View members"
                          onClick={() => onViewMembers(row)}
                        >
                          <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                        </ActionIconButton>
                        <ActionIconButton
                          disabled={busy}
                          label="Edit"
                          onClick={() => onEdit(row)}
                        >
                          <EditRoundedIcon sx={{ fontSize: 16 }} />
                        </ActionIconButton>
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
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center text-sm text-slate-500">
                  {scopeConfig.emptyStateLabel} for the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
