import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import {
  HUB_PRIORITY_OPTIONS,
  TEAM_STATUSES,
  formatTeamTypeLabel,
  inputClass,
  selectClass
} from "./teamManagement.constants";

export default function TeamManagementFormCard({
  editingRow,
  form,
  onCancelEdit,
  onChangeField,
  onReset,
  onSubmit,
  saving,
  scopeConfig
}) {
  const isEventGroupScope = scopeConfig.scope === "EVENT_GROUP";
  const isHubScope = scopeConfig.scope === "HUB";

  const submitLabel = saving
    ? "Saving..."
    : editingRow
      ? `Update ${scopeConfig.scopeLabel}`
      : `Create ${scopeConfig.scopeLabel}`;

  if (isEventGroupScope && !editingRow) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
            Edit-Only Mode
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">Select an Event Group to Edit</h2>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className={`text-[11px] font-bold uppercase tracking-[0.24em] ${scopeConfig.accent}`}>
            {editingRow ? "Edit Record" : "Create Record"}
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">
            {editingRow
              ? `Update ${scopeConfig.scopeLabel} #${editingRow.team_id}`
              : `Create ${scopeConfig.scopeLabel}`}
          </h2>
        </div>

        {editingRow ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel Edit
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancelEdit}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        )}
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              {scopeConfig.scopeLabel} Code
            </label>
            <input
              value={form.team_code}
              onChange={(e) => onChangeField("team_code", e.target.value)}
              className={inputClass}
              placeholder={
                isEventGroupScope
                  ? "EVT-GRP-01"
                  : scopeConfig.scope === "HUB"
                    ? "HUB-01"
                    : "TEAM-01"
              }
              maxLength={50}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              {scopeConfig.scopeLabel} Name
            </label>
            <input
              value={form.team_name}
              onChange={(e) => onChangeField("team_name", e.target.value)}
              className={inputClass}
              placeholder={
                isEventGroupScope
                  ? "Hackathon Group Alpha"
                  : scopeConfig.scope === "HUB"
                    ? "AI Innovation Hub"
                    : "Platform Team"
              }
              maxLength={120}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Type
            </label>
            <input
              readOnly
              value={formatTeamTypeLabel(form.team_type)}
              className={`${inputClass} bg-slate-50`}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Status
            </label>
            <div className="relative">
              <select
                value={form.status}
                onChange={(e) => onChangeField("status", e.target.value)}
                className={selectClass}
              >
                {TEAM_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20 }} />
              </span>
            </div>
          </div>

          {isHubScope ? (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Hub Priority
              </label>
              <div className="relative">
                <select
                  value={form.hub_priority || ""}
                  onChange={(e) => onChangeField("hub_priority", e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select priority</option>
                  {HUB_PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority.charAt(0) + priority.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                  <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20 }} />
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => onChangeField("description", e.target.value)}
            className={`${inputClass} min-h-[120px] resize-y`}
            maxLength={2000}
            placeholder={
              isEventGroupScope
                ? "Add context about this event group, ownership, or participation notes..."
                : scopeConfig.scope === "HUB"
                  ? "Describe the hub scope, programs, and collaborating teams..."
                  : "Describe what the team owns, delivers, or supports..."
            }
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#0f6cbd] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0f6cbd]/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
