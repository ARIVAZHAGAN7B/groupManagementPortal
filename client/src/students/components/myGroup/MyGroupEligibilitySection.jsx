import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import MyGroupBadge from "./MyGroupBadge";
import { formatDate } from "./myGroup.constants";

const truncatePhaseName = (value) => {
  const text = String(value || "-");
  return text.length > 7 ? `${text.slice(0, 7)}...` : text;
};

export default function MyGroupEligibilitySection({
  description = "Completed phase eligibility with target progress and final status.",
  emptyMessage = "No completed phases are available yet.",
  eligibility,
  eligibilityErr,
  eligibilityLoading = false,
  onRefresh,
  title = "Eligibility"
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={eligibilityLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshRoundedIcon sx={{ fontSize: 18 }} />
          {eligibilityLoading ? "Loading..." : "Refresh Eligibility"}
        </button>
      </div>

      {eligibilityErr ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {eligibilityErr}
        </div>
      ) : null}

      {eligibilityLoading && (!Array.isArray(eligibility) || eligibility.length === 0) ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
          Loading eligibility...
        </div>
      ) : !Array.isArray(eligibility) || eligibility.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
          {emptyMessage}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-[860px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Phase Name</th>
                <th className="px-4 py-3 text-left font-semibold">Start Date</th>
                <th className="px-4 py-3 text-left font-semibold">End Date</th>
                <th className="px-4 py-3 text-left font-semibold">Tier</th>
                <th className="px-4 py-3 text-left font-semibold">Target Assigned</th>
                <th className="px-4 py-3 text-left font-semibold">Target Achived</th>
                <th className="px-4 py-3 text-left font-semibold">Eligibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {eligibility.map((phase) => {
                const eligibilityLabel =
                  phase?.is_eligible === true
                    ? "Eligible"
                    : phase?.is_eligible === false
                      ? "Not Eligible"
                      : "Not Available";

                return (
                  <tr key={phase?.phase_id || phase?.phase_name} className="align-middle">
                    <td className="px-4 py-3 font-medium text-slate-900" title={phase?.phase_name || "-"}>
                      {truncatePhaseName(phase?.phase_name || phase?.phase_id)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(phase?.start_date)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(phase?.end_date)}</td>
                    <td className="px-4 py-3 text-slate-700">{phase?.tier || "-"}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {phase?.target_points === null || phase?.target_points === undefined
                        ? "Not set"
                        : Number(phase.target_points)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {Number(phase?.earned_points ?? 0)}
                    </td>
                    <td className="px-4 py-3">
                      {phase?.eligibility_error ? (
                        <span className="text-xs font-medium text-amber-700">
                          {phase.eligibility_error}
                        </span>
                      ) : (
                        <MyGroupBadge value={eligibilityLabel} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
