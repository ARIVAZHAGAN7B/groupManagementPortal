import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { formatLabel, formatShortDate } from "./teamPage.utils";

export default function TeamMembershipLeaveModal({
  busy = false,
  error = "",
  onCancel,
  onConfirm,
  open = false,
  row = null,
  scope
}) {
  if (!open || !row || !scope) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={busy ? undefined : onCancel}
        className="absolute inset-0"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_70px_rgba(15,23,42,0.24)]">
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <WarningAmberRoundedIcon sx={{ fontSize: 22 }} />
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-700">
                Leave {scope.singularLabel}
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">
                {row.team_name || row.team_code || scope.singularLabel}
              </h3>
              <p className="mt-1 text-sm text-amber-800">
                This will remove your active membership from this {scope.singularLower}.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border border-white/80 bg-white px-3 py-1 text-xs font-semibold text-[#1754cf]">
                {row.team_code || "No code"}
              </span>
              <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                Role: {formatLabel(row.role, "Member")}
              </span>
            </div>

            <div className="mt-3 text-sm text-slate-600">
              Joined on <span className="font-semibold text-slate-900">{formatShortDate(row.join_date)}</span>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? scope.leaveBusyLabel : scope.leaveLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
