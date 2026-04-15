export default function EventJoinRequestModal({
  group,
  loading = false,
  onClose,
  onConfirm,
  open = false
}) {
  if (!open || !group) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
              Join Request
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">Send team join request</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-semibold text-slate-900">
            {group.team_name || group.team_code || "Selected team"}
          </div>
          <div className="mt-1 text-xs text-slate-500">{group.team_code || "No code"}</div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {group.description || "No description added for this team."}
          </p>
        </div>

        <p className="mt-4 text-sm text-slate-600">
          This will submit a join request to the selected team.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg border border-[#1754cf]/15 bg-[#1754cf]/8 px-4 py-2 text-sm font-semibold text-[#1754cf] transition hover:bg-[#1754cf]/12 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          >
            {loading ? "Sending..." : "Confirm Join Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
