import { formatDate } from "./teamManagement.constants";
import { AdminBadge } from "../ui/AdminUiPrimitives";

const formatLabel = (value, fallback = "-") => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  if (!normalized) return fallback;

  return normalized
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

export default function TeamManagementMembersModal({
  error = "",
  loading = false,
  onClose,
  rows = [],
  scopeConfig,
  team
}) {
  if (!team) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-management-members-modal-title"
    >
      <div
        className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_70px_rgba(15,23,42,0.24)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
                Member Preview
              </p>
              <h2
                id="team-management-members-modal-title"
                className="mt-1 text-xl font-bold text-slate-900"
              >
                {scopeConfig?.scopeLabel || "Team"} Members
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {team?.team_name || "-"} ({team?.team_code || "-"}) |{" "}
                {scopeConfig?.scopeLabel || "Team"} ID: {team?.team_id || "-"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>

        {error ? (
          <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">Loading members...</div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            {`No active members found for this ${String(
              scopeConfig?.scopeLabel || "team"
            ).toLowerCase()}.`}
          </div>
        ) : (
          <>
            <div className="grid gap-3 p-4 md:hidden">
              {rows.map((row) => (
                <article
                  key={row.team_membership_id || `${row.student_id}-${row.join_date}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {row.student_name || "-"}
                      </h3>
                      <p className="mt-1 text-xs font-mono font-bold uppercase text-[#1754cf]">
                        {row.student_id || "-"}
                      </p>
                    </div>
                    <AdminBadge className="border-slate-200 bg-slate-100 text-slate-700">
                      {formatLabel(row.role, "Member")}
                    </AdminBadge>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Status
                      </div>
                      <div className="mt-1">
                        <AdminBadge className="border-slate-200 bg-slate-100 text-slate-700">
                          {formatLabel(row.status)}
                        </AdminBadge>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Joined
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {formatDate(row.join_date)}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-[820px] w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                      Student
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                      Role
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                      Status
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {rows.map((row) => (
                    <tr
                      key={row.team_membership_id || `${row.student_id}-${row.join_date}`}
                      className="hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{row.student_name || "-"}</div>
                        <div className="mt-0.5 text-xs font-mono text-[#1754cf]">
                          ID: {row.student_id || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <AdminBadge className="border-slate-200 bg-slate-100 text-slate-700">
                          {formatLabel(row.role, "Member")}
                        </AdminBadge>
                      </td>
                      <td className="px-4 py-3">
                        <AdminBadge className="border-slate-200 bg-slate-100 text-slate-700">
                          {formatLabel(row.status)}
                        </AdminBadge>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatDate(row.join_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
