import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";

const inputClassName =
  "w-full rounded-2xl border border-slate-300 bg-[#f3f4f6] px-4 py-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10";

export default function EventGroupCreateModal({
  event,
  eventActive = false,
  myActiveMembershipInEvent = null,
  onChangeField,
  onClose,
  onSubmit,
  open = false,
  saving = false,
  teamForm
}) {
  if (!open || !event) return null;

  const disabled = saving || !eventActive || !!myActiveMembershipInEvent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
              Create Group
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">Start a new event group</h2>
            <p className="mt-1 text-sm text-slate-500">
              {event.event_name || event.event_code || "Selected event"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden rounded-2xl bg-slate-100 p-3 text-slate-700 sm:block">
              <AddCircleOutlineRoundedIcon sx={{ fontSize: 24 }} />
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Close
            </button>
          </div>
        </div>

        {!eventActive ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This event is not active, so new event groups cannot be created right now.
          </div>
        ) : null}

        {myActiveMembershipInEvent ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You already belong to{" "}
            <span className="font-semibold">
              {myActiveMembershipInEvent.team_code || myActiveMembershipInEvent.team_name}
            </span>{" "}
            in this event.
          </div>
        ) : null}

        <div className="mt-5 grid gap-3">
          <input
            value={teamForm.team_code}
            onChange={(eventValue) => onChangeField?.("team_code", eventValue.target.value)}
            className={inputClassName}
            placeholder="Event Group Code"
            maxLength={50}
            disabled={disabled}
          />
          <input
            value={teamForm.team_name}
            onChange={(eventValue) => onChangeField?.("team_name", eventValue.target.value)}
            className={inputClassName}
            placeholder="Event Group Name"
            maxLength={120}
            disabled={disabled}
          />
          <textarea
            value={teamForm.description}
            onChange={(eventValue) => onChangeField?.("description", eventValue.target.value)}
            className={`${inputClassName} min-h-28 resize-y`}
            placeholder="Group details"
            maxLength={255}
            disabled={disabled}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={disabled}
            className="rounded-lg border border-[#1754cf]/15 bg-[#1754cf]/8 px-4 py-2 text-sm font-semibold text-[#1754cf] transition hover:bg-[#1754cf]/12 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          >
            {saving ? "Creating..." : "Create Event Group"}
          </button>
        </div>
      </form>
    </div>
  );
}
