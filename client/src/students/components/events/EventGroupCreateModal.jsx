import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";

const inputClassName =
  "w-full rounded-2xl border border-slate-300 bg-[#f3f4f6] px-4 py-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10";

export default function EventGroupCreateModal({
  event,
  eventActive = false,
  inviteSearchLoading = false,
  inviteSearchQuery = "",
  inviteSearchRows = [],
  maxInviteeCount = null,
  myActiveMembershipInEvent = null,
  onAddInvitee,
  onChangeField,
  onChangeInviteSearchQuery,
  onClose,
  onRemoveInvitee,
  onSubmit,
  open = false,
  saving = false,
  selectedInvitees = [],
  teamForm
}) {
  if (!open || !event) return null;

  const disabled = saving || !eventActive || !!myActiveMembershipInEvent;
  const selectedCountLabel =
    maxInviteeCount === null
      ? `${selectedInvitees.length} teammate${selectedInvitees.length === 1 ? "" : "s"} selected`
      : `${selectedInvitees.length}/${maxInviteeCount} teammate${maxInviteeCount === 1 ? "" : "s"} selected`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
              Team Registration
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">Register a team for this event</h2>
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
            This event is not active, so new team registrations cannot be created right now.
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
            placeholder="Team Code"
            maxLength={50}
            disabled={disabled}
          />
          <input
            value={teamForm.team_name}
            onChange={(eventValue) => onChangeField?.("team_name", eventValue.target.value)}
            className={inputClassName}
            placeholder="Team Name"
            maxLength={120}
            disabled={disabled}
          />
          <textarea
            value={teamForm.description}
            onChange={(eventValue) => onChangeField?.("description", eventValue.target.value)}
            className={`${inputClassName} min-h-28 resize-y`}
            placeholder="Team notes"
            maxLength={255}
            disabled={disabled}
          />
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Invite teammates</p>
              <p className="mt-1 text-xs text-slate-500">
                Select classmates now. They will receive an invite request and can accept or reject it.
              </p>
            </div>
            <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              {selectedCountLabel}
            </span>
          </div>

          <div className="mt-4">
            <input
              value={inviteSearchQuery}
              onChange={(eventValue) =>
                onChangeInviteSearchQuery?.(eventValue.target.value)
              }
              className={inputClassName}
              placeholder="Search students by ID, name, or email"
              disabled={disabled}
            />
          </div>

          {selectedInvitees.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedInvitees.map((student) => (
                <div
                  key={student.student_id}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                >
                  <span className="font-semibold">
                    {student.name || student.student_id}
                  </span>
                  <span className="text-slate-400">{student.student_id}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveInvitee?.(student.student_id)}
                    className="font-semibold text-rose-600 transition hover:text-rose-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-4 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
            {inviteSearchLoading ? (
              <div className="px-4 py-6 text-sm text-slate-500">Searching students...</div>
            ) : inviteSearchQuery.trim() && inviteSearchRows.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">
                No available students found for this event.
              </div>
            ) : inviteSearchRows.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">
                Search to add teammates before submitting the team registration.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {inviteSearchRows.map((student) => {
                  const addDisabled =
                    disabled ||
                    (maxInviteeCount !== null && selectedInvitees.length >= maxInviteeCount);

                  return (
                    <div
                      key={student.student_id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {student.name || student.student_id}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {student.student_id} | {student.email || "-"}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-400">
                          {student.department || "-"} | Year {student.year || "-"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onAddInvitee?.(student)}
                        disabled={addDisabled}
                        className="rounded-lg border border-[#1754cf]/15 bg-[#1754cf]/8 px-3 py-2 text-xs font-semibold text-[#1754cf] transition hover:bg-[#1754cf]/12 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        Add
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
            {saving ? "Registering..." : "Register Team"}
          </button>
        </div>
      </form>
    </div>
  );
}
