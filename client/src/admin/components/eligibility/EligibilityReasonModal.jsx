import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  formatDate,
  formatEligibleLabel,
  getEntityCode,
  getEntityMeta,
  getEntityTitle,
  getScoreValue
} from "./eligibility.constants";

function MetaItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function EligibilityReasonModal({ onClose, open, reasonView }) {
  if (!open || !reasonView?.row) return null;

  const { row, type } = reasonView;
  const entityCodeLabel = type === "individual" ? "Student ID" : "Group Code";
  const reasonText = String(row.reason_code || "").trim() || "No reason available.";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0"
      />

      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_70px_rgba(15,23,42,0.24)]">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1754cf]/10 text-[#1754cf]">
              <VisibilityOutlinedIcon sx={{ fontSize: 22 }} />
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
                Eligibility Reason
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                {getEntityTitle(type, row)}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{getEntityMeta(type, row)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <MetaItem label={entityCodeLabel} value={getEntityCode(type, row)} />
            <MetaItem label="Status" value={formatEligibleLabel(row.is_eligible)} />
            <MetaItem label="Score" value={getScoreValue(type, row)} />
            <MetaItem label="Evaluated" value={formatDate(row.evaluated_at)} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Reason
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold text-slate-900">
              {reasonText}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
