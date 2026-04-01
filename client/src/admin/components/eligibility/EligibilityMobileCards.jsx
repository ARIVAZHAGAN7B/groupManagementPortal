import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  AdminMobileCard,
  AdminMobileCardList,
  AdminMobileValueRow
} from "../ui/AdminMobileCards";
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

export default function EligibilityMobileCards({
  overrideBusyKey,
  onOverride,
  onViewReason,
  rows,
  selectedPhaseId,
  type
}) {
  return (
    <AdminMobileCardList
      items={rows}
      emptyMessage={`No ${type === "individual" ? "students" : "groups"} found for current filters.`}
      renderItem={(row) => {
        const busyKey = getRowBusyKey(type, selectedPhaseId, row);
        const isBusy = overrideBusyKey === busyKey;
        const statusConfig = getEligibilityStatusConfig(row.is_eligible);
        const overrideOptions = getOverrideOptions(row.is_eligible);

        return (
          <AdminMobileCard key={getRowKey(type, row)}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-900">
                  {type === "individual" ? row.student_name || "-" : row.group_name || "-"}
                </h4>
                <p className="mt-1 text-xs font-mono font-bold uppercase text-[#1754cf]">
                  {type === "individual" ? row.student_id || "-" : row.group_code || "-"}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {type === "individual"
                    ? `${row.department || "-"} | Year ${row.year ?? "-"}`
                    : `ID ${row.group_id || "-"}`}
                </p>
              </div>

              {type === "group" ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getTierBadgeClass(
                    row.tier
                  )}`}
                >
                  Tier {String(row.tier || "-").toUpperCase()}
                </span>
              ) : (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusConfig.pill}`}>
                  {statusConfig.label}
                </span>
              )}
            </div>

            {type === "group" ? (
              <AdminMobileValueRow
                label="Status"
                value={statusConfig.label}
                valueClassName={`font-bold ${statusConfig.text}`}
              />
            ) : null}

            <AdminMobileValueRow label="Score" value={getScoreValue(type, row)} />
            <AdminMobileValueRow
              label="Bonus"
              value={`${getAwardValue(row)} (${getMultiplierLabel(row)})`}
            />
            <AdminMobileValueRow
              label="Evaluated"
              value={formatDate(row.evaluated_at)}
              valueClassName="text-slate-600"
            />

            <div
              className={`mt-4 grid gap-2 border-t border-slate-100 pt-4 ${
                overrideOptions.length > 1 ? "grid-cols-3" : "grid-cols-2"
              }`}
            >
              <button
                type="button"
                onClick={() => onViewReason(type, row)}
                className="flex flex-col items-center gap-1 rounded-lg bg-slate-50 px-1.5 py-2 text-slate-600 transition hover:bg-slate-100"
              >
                <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                <span className="text-[8px] font-bold uppercase">Reason</span>
              </button>

              {overrideOptions.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => onOverride(type, row, option.isEligible)}
                  disabled={isBusy}
                  className={`rounded-lg border px-2 py-2 text-xs font-bold disabled:opacity-60 ${
                    option.isEligible
                      ? "border-green-200 bg-green-50 text-green-600"
                      : "border-red-200 bg-red-50 text-red-600"
                  }`}
                >
                  {isBusy ? "Saving..." : option.label}
                </button>
              ))}
            </div>
          </AdminMobileCard>
        );
      }}
    />
  );
}
