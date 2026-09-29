import React from "react";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import MilitaryTechRoundedIcon from "@mui/icons-material/MilitaryTechRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";

const STATUS_CONFIGS = {
  PENDING: {
    label: "Under Review",
    className: "border-amber-300/80 bg-amber-50 text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300",
    icon: HourglassTopRoundedIcon
  },
  APPROVED: {
    label: "Approved",
    className: "border-emerald-300/80 bg-emerald-50 text-emerald-800 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    icon: CheckCircleRoundedIcon
  },
  REJECTED: {
    label: "Rejected",
    className: "border-rose-300/80 bg-rose-50 text-rose-800 dark:border-rose-700/60 dark:bg-rose-950/40 dark:text-rose-300",
    icon: CancelRoundedIcon
  }
};

const ROLE_INFO = {
  CAPTAIN: {
    title: "Squad Captain",
    icon: "👑",
    description: "Squad Lead — manages team roster, approves join requests, and leads project milestone submissions."
  },
  VICE_CAPTAIN: {
    title: "Vice Captain",
    icon: "🛡️",
    description: "Second-in-Command — coordinates activities, supports team operations, and manages group delegation."
  }
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

function StatusBadge({ value }) {
  const key = String(value || "PENDING").toUpperCase();
  const config = STATUS_CONFIGS[key] || {
    label: key.replaceAll("_", " "),
    className: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    icon: null
  };
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${config.className}`}
    >
      {Icon && <Icon sx={{ fontSize: 13 }} />}
      {config.label}
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
    <div className="space-y-6">
      {/* 1. Header with Refresh */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800">
              <MilitaryTechRoundedIcon sx={{ fontSize: 15 }} />
              Leadership Governance
            </span>
          </div>
          <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            Squad Leadership Requests
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Apply for open leadership vacancies in your current squad or track administrative decisions.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading || submitting}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
        >
          <RefreshRoundedIcon sx={{ fontSize: 16 }} className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing..." : "Refresh Status"}
        </button>
      </div>

      {/* Error Alert */}
      {submitError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {submitError}
        </div>
      ) : null}

      {/* 2. Application Section */}
      {canRequest ? (
        pendingRequest ? (
          /* Active Pending Application Banner */
          <div className="relative overflow-hidden rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-amber-50/90 p-5 shadow-xs dark:border-amber-900/60 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 border border-amber-300/60 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-700/60">
                  <HourglassTopRoundedIcon sx={{ fontSize: 22 }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      Application Pending Review
                    </span>
                    <span className="font-mono text-xs text-amber-700/70 dark:text-amber-400/70">
                      #{pendingRequest.leadership_request_id}
                    </span>
                  </div>
                  <h3 className="mt-1 text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    Requested Role: <span className="text-amber-700 dark:text-amber-400">{pendingRequest.requested_role}</span>
                  </h3>
                  {pendingRequest.request_reason ? (
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 italic">
                      "{pendingRequest.request_reason}"
                    </p>
                  ) : null}
                  <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    Submitted on {formatDateTime(pendingRequest.request_date)} • Awaiting admin adjudication.
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/80 px-3 py-1 text-xs font-bold text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 shrink-0 self-start sm:self-center">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Under Review
              </span>
            </div>
          </div>
        ) : missingRoles.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-6 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
            <MilitaryTechRoundedIcon sx={{ fontSize: 32 }} className="mx-auto text-emerald-500 mb-1" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">All Leadership Roles Filled</p>
            <p className="mt-1 text-xs">Your squad currently has active Captains and Vice Captains assigned.</p>
          </div>
        ) : (
          /* Role Application Form */
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4"
          >
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                1. Select Vacant Role
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {missingRoles.map((role) => {
                  const roleKey = String(role).toUpperCase();
                  const isSelected = form.requested_role === role;
                  const info = ROLE_INFO[roleKey] || {
                    title: role.replaceAll("_", " "),
                    icon: "🛡️",
                    description: "Squad leadership & coordination position."
                  };

                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => onUpdateForm("requested_role", role)}
                      className={`relative flex flex-col p-4 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40"
                          : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-850 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{info.icon}</span>
                          {info.title}
                        </span>
                        {isSelected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {info.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  2. Statement of Purpose & Motivation (Optional)
                </label>
                <span className="text-[11px] text-slate-400">
                  {(form.request_reason || "").length}/255
                </span>
              </div>
              <textarea
                value={form.request_reason || ""}
                onChange={(e) => onUpdateForm("request_reason", e.target.value)}
                rows={3}
                maxLength={255}
                placeholder="Share your background, commitment, or vision for leading the squad..."
                className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-3 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-850 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:bg-slate-900"
              />
            </div>

            <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Open roles for your squad: <strong>{missingRoles.join(", ")}</strong>
              </span>

              <button
                type="submit"
                disabled={submitting || !form.requested_role}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Submitting Application..." : "Submit Leadership Request"}
              </button>
            </div>
          </form>
        )
      ) : (
        /* Member Role Guard Info */
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
          You currently hold the role of <strong className="text-indigo-600 dark:text-indigo-400">{normalizedRole}</strong> in this squad. Leadership requests can only be submitted by squad members seeking elevation to vacant leadership roles.
        </div>
      )}

      {/* 3. Request History */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Application History
        </h3>

        {loading && requests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-xs text-slate-500 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            Loading your application history...
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <p className="text-xs font-semibold">No prior leadership applications recorded for this squad.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {requests.map((request) => (
              <div
                key={request.leadership_request_id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {request.requested_role || "-"}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          #{request.leadership_request_id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Applied {formatDateTime(request.request_date)}
                      </div>
                    </div>

                    <StatusBadge value={request.status} />
                  </div>

                  {request.request_reason ? (
                    <div className="mt-2.5 flex items-start gap-1 rounded-lg border border-slate-100 bg-slate-50/70 p-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300">
                      <FormatQuoteRoundedIcon sx={{ fontSize: 13 }} className="text-slate-400 shrink-0 rotate-180" />
                      <span className="italic">{request.request_reason}</span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-400 dark:border-slate-800 dark:text-slate-500 flex items-center justify-between">
                  <span>Decision Date:</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    {formatDateTime(request.decision_date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
