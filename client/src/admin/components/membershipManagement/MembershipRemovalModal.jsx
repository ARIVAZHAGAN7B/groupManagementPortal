export default function MembershipRemovalModal({
  busy,
  error,
  onCancel,
  onConfirm,
  onReasonChange,
  open,
  reason,
  row
}) {
  if (!open || !row) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 px-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={busy ? undefined : onCancel}
        className="absolute inset-0"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_70px_rgba(15,23,42,0.24)]">
        <div className="border-b border-red-200 bg-red-50 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-red-600">
                Remove Membership
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                {row.student_name || row.student_id || "Member"}
              </h2>
              <p className="mt-1 text-sm text-red-700">{row.group_name || "No group"}</p>
            </div>

            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Close
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-sm font-semibold text-slate-900">{row.student_email || "-"}</div>
            <div className="mt-1 text-xs font-mono text-slate-500">
              Membership ID {row.membership_id || "-"}
            </div>
          </div>

          <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Removal Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            disabled={busy}
            rows={4}
            maxLength={500}
            placeholder="Enter removal reason"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#1754cf] focus:ring-4 focus:ring-[#1754cf]/10 disabled:opacity-60"
          />

          <div className="mt-2 flex items-center justify-end text-xs text-slate-400">
            <span>{String(reason || "").length}/500</span>
          </div>

          {error ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy || !String(reason || "").trim()}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
            >
              {busy ? "Removing..." : "Remove"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
