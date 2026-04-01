import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  getAwardValue,
  formatDate,
  getEligibilityStatusConfig,
  getMultiplierLabel,
  getOverrideOptions,
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
      className={`w-full whitespace-nowrap rounded-md px-1.5 py-1 text-center text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {label}
    </button>
  );
}

function ActionIconButton({ className = "", label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${className}`}
    >
      <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
    </button>
  );
}

function IndividualTable({
  overrideBusyKey,
  onOverride,
  onViewReason,
  rows,
  selectedPhaseId
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
              <th className="px-6 py-4 text-center">Bonus</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">View</th>
              <th className="px-6 py-4">Evaluated</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.length > 0 ? (
              rows.map((row) => {
                const busyKey = getRowBusyKey("individual", selectedPhaseId, row);
                const isBusy = overrideBusyKey === busyKey;
                const overrideOptions = getOverrideOptions(row.is_eligible);

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
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-bold text-[#1754cf]">{getAwardValue(row)}</div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {getMultiplierLabel(row)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge value={row.is_eligible} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ActionIconButton
                        label="View reason"
                        onClick={() => onViewReason("individual", row)}
                        className="mx-auto border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(row.evaluated_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div
                        className={`ml-auto grid w-[10.5rem] gap-2 ${
                          overrideOptions.length > 1 ? "grid-cols-2" : "grid-cols-1"
                        }`}
                      >
                        {overrideOptions.map((option) => (
                          <ActionTextButton
                            key={option.label}
                            label={isBusy ? "Saving..." : option.label}
                            onClick={() => onOverride("individual", row, option.isEligible)}
                            disabled={isBusy}
                            className={
                              option.isEligible
                                ? "border border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                                : "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                            }
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-500">
                  No students found for current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function GroupTable({
  overrideBusyKey,
  onOverride,
  onViewReason,
  rows,
  selectedPhaseId
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
              <th className="px-6 py-4 text-center">Bonus</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">View</th>
              <th className="px-6 py-4">Evaluated</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.length > 0 ? (
              rows.map((row) => {
                const busyKey = getRowBusyKey("group", selectedPhaseId, row);
                const isBusy = overrideBusyKey === busyKey;
                const overrideOptions = getOverrideOptions(row.is_eligible);

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
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-bold text-[#1754cf]">{getAwardValue(row)}</div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {getMultiplierLabel(row)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge value={row.is_eligible} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ActionIconButton
                        label="View reason"
                        onClick={() => onViewReason("group", row)}
                        className="mx-auto border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(row.evaluated_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div
                        className={`ml-auto grid w-[10.5rem] gap-2 ${
                          overrideOptions.length > 1 ? "grid-cols-2" : "grid-cols-1"
                        }`}
                      >
                        {overrideOptions.map((option) => (
                          <ActionTextButton
                            key={option.label}
                            label={isBusy ? "Saving..." : option.label}
                            onClick={() => onOverride("group", row, option.isEligible)}
                            disabled={isBusy}
                            className={
                              option.isEligible
                                ? "border border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                                : "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                            }
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
                  No groups found for current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function EligibilityDesktopTable(props) {
  const { rows, type } = props;

  if (type === "individual") {
    return <IndividualTable {...props} rows={rows} />;
  }

  return <GroupTable {...props} rows={rows} />;
}
