import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import { useEffect } from "react";

const toneMap = {
  error: {
    panel: "border-red-200 bg-red-50",
    iconWrap: "bg-red-100 text-red-600",
    title: "text-red-900",
    body: "text-red-700",
    confirm: "bg-red-600 hover:bg-red-700",
    icon: ErrorOutlineRoundedIcon
  },
  danger: {
    panel: "border-amber-200 bg-amber-50",
    iconWrap: "bg-amber-100 text-amber-600",
    title: "text-amber-900",
    body: "text-amber-700",
    confirm: "bg-red-600 hover:bg-red-700",
    icon: WarningAmberRoundedIcon
  },
  success: {
    panel: "border-emerald-200 bg-emerald-50",
    iconWrap: "bg-emerald-100 text-emerald-600",
    title: "text-emerald-900",
    body: "text-emerald-700",
    confirm: "bg-emerald-600 hover:bg-emerald-700",
    icon: CheckCircleRoundedIcon
  }
};

export default function GroupManagementActionModal({
  busy = false,
  cancelLabel = "Cancel",
  confirmLabel = "OK",
  message,
  mode = "alert",
  onCancel,
  onConfirm,
  open,
  title,
  tone = "error"
}) {
  useEffect(() => {
    if (!open || mode !== "alert" || busy) return undefined;

    const timeoutId = window.setTimeout(() => {
      onCancel?.();
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [busy, mode, onCancel, open, title, message]);

  if (!open) return null;

  const config = toneMap[tone] || toneMap.error;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={busy ? undefined : onCancel}
        className="absolute inset-0"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_70px_rgba(15,23,42,0.24)]">
        <div className={`border-b px-6 py-5 ${config.panel}`}>
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.iconWrap}`}>
              <Icon sx={{ fontSize: 22 }} />
            </div>

            <div>
              <h3 className={`text-base font-bold ${config.title}`}>{title}</h3>
              <p className={`mt-1 text-sm ${config.body}`}>{message}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4">
          {mode === "confirm" ? (
            <>
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelLabel}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${config.confirm}`}
              >
                {busy ? "Processing..." : confirmLabel}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
