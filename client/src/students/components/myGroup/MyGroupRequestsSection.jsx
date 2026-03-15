import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import MyGroupBadge from "./MyGroupBadge";
import { formatDate } from "./myGroup.constants";

export default function MyGroupRequestsSection({
  busy = false,
  decisionBusyId = null,
  loading = false,
  onDecision,
  onRefresh,
  pending
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Pending Join Requests</h2>
          <p className="text-sm text-slate-500">
            Review student requests to join your group.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={busy || decisionBusyId !== null || loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshRoundedIcon sx={{ fontSize: 18 }} />
          {loading ? "Refreshing..." : "Reload Requests"}
        </button>
      </div>

      <div className="overflow-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-[820px] w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Student ID
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Request Date
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {pending.map((row) => (
              <tr key={row.request_id} className="transition hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-700">{row.student_id}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(row.request_date)}</td>
                <td className="px-4 py-3">
                  <MyGroupBadge value={row.status || "-"} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onDecision(row.request_id, "APPROVED")}
                      disabled={decisionBusyId === row.request_id || busy}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                    >
                      {decisionBusyId === row.request_id ? "Working..." : "Approve"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDecision(row.request_id, "REJECTED")}
                      disabled={decisionBusyId === row.request_id || busy}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                    >
                      {decisionBusyId === row.request_id ? "Working..." : "Reject"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {pending.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                  No pending requests.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
