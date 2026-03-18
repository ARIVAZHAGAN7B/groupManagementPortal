import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  formatEligibleLabel,
  getEntityTitle,
  getScoreValue,
  inputClass
} from "./eligibility.constants";

const toneMap = {
  eligible: {
    panel: "border-green-200 bg-green-50",
    iconWrap: "bg-green-100 text-green-600",
    title: "text-green-900",
    body: "text-green-700",
    confirm: "bg-green-600 hover:bg-green-700",
    icon: CheckCircleRoundedIcon
  },
  blocked: {
    panel: "border-amber-200 bg-amber-50",
    iconWrap: "bg-amber-100 text-amber-600",
    title: "text-amber-900",
    body: "text-amber-700",
    confirm: "bg-red-600 hover:bg-red-700",
    icon: WarningAmberRoundedIcon
  }
};

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

export default function EligibilityOverrideModal({
  busy = false,
  onClose,
  onReasonChange,
  onSubmit,
  open,
  override
}) {
  if (!open || !override) return null;

  const toneKey = override.isEligible ? "eligible" : "blocked";
  const config = toneMap[toneKey];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={busy ? undefined : onClose}
        className="absolute inset-0"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_70px_rgba(15,23,42,0.24)]">
        <div className={`border-b px-6 py-5 ${config.panel}`}>
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.iconWrap}`}>
              <Icon sx={{ fontSize: 22 }} />
            </div>

            <div>
              <h3 className={`text-base font-bold ${config.title}`}>
                {override.isEligible ? "Mark Eligible" : "Mark Not Eligible"}
              </h3>
              <p className={`mt-1 text-sm ${config.body}`}>
                {getEntityTitle(override.type, override.row)}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <div className="space-y-4 px-6 py-5">
            <div className="grid grid-cols-2 gap-3">
              <MetaItem
                label="Current"
                value={formatEligibleLabel(override.row.is_eligible)}
              />
              <MetaItem
                label="Score"
                value={getScoreValue(override.type, override.row)}
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Reason Code
              </label>
              <input
                type="text"
                value={override.reasonCode}
                onChange={(event) => onReasonChange(event.target.value)}
                className={inputClass}
                placeholder="Enter reason code"
              />
            </div>

            {override.error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {override.error}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={busy}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${config.confirm}`}
            >
              {busy ? "Processing..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
