const STATUS_STYLES = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700"
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

function StatusBadge({ value }) {
  const key = String(value || "-").toUpperCase();
  const className =
    STATUS_STYLES[key] || "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${className}`}
    >
      {key.replaceAll("_", " ")}
    </span>
  );
}

export default function MyGroupLeadershipSection({
  canRequest = false,
  currentRole = "MEMBER",
  form,
  loading = false,
  missingRoles = [],
  onRefresh,
  onSubmit,
  onUpdateForm,
  pendingRequest = null,
  requests = [],
  submitError = "",
  submitting = false
}) {
  const normalizedRole = String(currentRole || "MEMBER").toUpperCase();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Leadership Requests</h2>
          <p className="mt-1 text-sm text-slate-500">
            Apply only for open leadership roles in your current group.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading || submitting}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {submitError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      ) : null}

      {canRequest ? (
        pendingRequest ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Pending request: <span className="font-semibold">{pendingRequest.requested_role}</span>
          </div>
        ) : missingRoles.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            All leadership roles are currently filled.
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
          >
            <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Open Role
                </label>
                <select
                  value={form.requested_role}
                  onChange={(event) => onUpdateForm("requested_role", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1754cf] focus:ring-4 focus:ring-[#1754cf]/10"
                >
                  {missingRoles.map((role) => (
                    <option key={role} value={role}>
                      {role.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Reason
                </label>
                <textarea
                  value={form.request_reason}
                  onChange={(event) => onUpdateForm("request_reason", event.target.value)}
                  rows={3}
                  maxLength={255}
                  placeholder="Optional note for the admin"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#1754cf] focus:ring-4 focus:ring-[#1754cf]/10"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Missing roles: {missingRoles.join(", ")}
              </p>
              <button
                type="submit"
                disabled={submitting || !form.requested_role}
                className="rounded-lg bg-[#1754cf] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Request Role"}
              </button>
            </div>
          </form>
        )
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Current role: <span className="font-semibold">{normalizedRole}</span>. Only members can request leadership roles.
        </div>
      )}

      {loading && requests.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
          Loading requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
          No leadership requests yet.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <article
              key={request.leadership_request_id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {request.requested_role || "-"}
                  </p>
                  <p className="mt-1 text-[11px] font-mono text-slate-400">
                    Request #{request.leadership_request_id}
                  </p>
                </div>
                <StatusBadge value={request.status} />
              </div>

              {request.request_reason ? (
                <p className="mt-3 text-sm text-slate-600">{request.request_reason}</p>
              ) : null}

              <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                <div>Requested: <span className="font-medium text-slate-700">{formatDateTime(request.request_date)}</span></div>
                <div>Updated: <span className="font-medium text-slate-700">{formatDateTime(request.decision_date)}</span></div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
