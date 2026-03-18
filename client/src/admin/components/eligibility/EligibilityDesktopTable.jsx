import {
  formatDateTime,
  getEligibilityStatusConfig,
  getRowBusyKey,
  getRowKey,
  getScoreValue,
  getTierBadgeClass
} from "./eligibility.constants";

function StatusBadge({ value }) {
  const config = getEligibilityStatusConfig(value);

  return (
    <span className={`flex items-center gap-1.5 text-[10px] font-bold ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function ActionTextButton({ className = "", disabled = false, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full whitespace-nowrap rounded-md px-2.5 py-1 text-center text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {label}
    </button>
  );
}

function IndividualTable({
  overrideBusyKey,
  onOverride,
  rows,
  selectedPhaseId,
  totalCount
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1080px] w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4 text-center">Year</th>
              <th className="px-6 py-4 text-center">Score</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Reason</th>
              <th className="px-6 py-4">Evaluated</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.length > 0 ? (
              rows.map((row) => {
                const busyKey = getRowBusyKey("individual", selectedPhaseId, row);
                const isBusy = overrideBusyKey === busyKey;

                return (
                  <tr key={getRowKey("individual", row)} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">
                        {row.student_name || "-"}
                      </div>
                      <div className="text-[10px] font-mono font-bold text-[#1754cf]">
                        {row.student_id || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {row.department || "-"}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                      {row.year ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-slate-900">
                        {getScoreValue("individual", row)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge value={row.is_eligible} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {row.reason_code || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDateTime(row.evaluated_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="ml-auto grid w-[10.5rem] grid-cols-2 gap-2">
                        <ActionTextButton
                          label={isBusy ? "Saving..." : "Eligible"}
                          onClick={() => onOverride("individual", row, true)}
                          disabled={isBusy}
                          className="border border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                        />
                        <ActionTextButton
                          label={isBusy ? "Saving..." : "Not Eligible"}
                          onClick={() => onOverride("individual", row, false)}
                          disabled={isBusy}
                          className="border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
                  No students found for current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between bg-slate-50 px-6 py-4">
        <p className="text-xs font-medium text-slate-500">
          Showing {rows.length} of {totalCount} students
        </p>
        <p className="text-xs font-medium text-slate-500">All matching students are listed</p>
      </div>
    </section>
  );
}

function GroupTable({
  overrideBusyKey,
  onOverride,
  rows,
  selectedPhaseId,
  totalCount
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1020px] w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              <th className="px-6 py-4">Group</th>
              <th className="px-6 py-4 text-center">Tier</th>
              <th className="px-6 py-4 text-center">Score</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Reason</th>
              <th className="px-6 py-4">Evaluated</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.length > 0 ? (
              rows.map((row) => {
                const busyKey = getRowBusyKey("group", selectedPhaseId, row);
                const isBusy = overrideBusyKey === busyKey;

                return (
                  <tr key={getRowKey("group", row)} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">
                        {row.group_name || "-"}
                      </div>
                      <div className="text-[10px] font-mono font-bold uppercase text-[#1754cf]">
                        {row.group_code || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getTierBadgeClass(
                          row.tier
                        )}`}
                      >
                        Tier {String(row.tier || "-").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-slate-900">
                        {getScoreValue("group", row)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge value={row.is_eligible} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {row.reason_code || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDateTime(row.evaluated_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="ml-auto grid w-[10.5rem] grid-cols-2 gap-2">
                        <ActionTextButton
                          label={isBusy ? "Saving..." : "Eligible"}
                          onClick={() => onOverride("group", row, true)}
                          disabled={isBusy}
                          className="border border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                        />
                        <ActionTextButton
                          label={isBusy ? "Saving..." : "Not Eligible"}
                          onClick={() => onOverride("group", row, false)}
                          disabled={isBusy}
                          className="border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                  No groups found for current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between bg-slate-50 px-6 py-4">
        <p className="text-xs font-medium text-slate-500">
          Showing {rows.length} of {totalCount} groups
        </p>
        <p className="text-xs font-medium text-slate-500">All matching groups are listed</p>
      </div>
    </section>
  );
}

export default function EligibilityDesktopTable(props) {
  const { rows, totalCount, type } = props;

  if (type === "individual") {
    return <IndividualTable {...props} rows={rows} totalCount={totalCount} />;
  }

  return <GroupTable {...props} rows={rows} totalCount={totalCount} />;
}
