import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";

export function TeamDesktopTableShell({ canReset = false, children, onReset, toolbar = null }) {
  return (
    <div className="relative hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
      <div
        className={`border-b border-slate-200 bg-white px-3 py-3 ${
          toolbar
            ? "flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"
            : "flex items-center justify-end"
        }`}
      >
        {toolbar ? <div className="min-w-0 flex-1">{toolbar}</div> : null}
        <button
          type="button"
          onClick={onReset}
          disabled={!canReset}
          title="Reset filters"
          aria-label="Reset filters"
          className={`inline-flex min-h-[38px] items-center gap-2 rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition ${
            canReset
              ? "cursor-pointer border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300"
          }`}
        >
          <RestartAltRoundedIcon sx={{ fontSize: 16 }} />
          Reset
        </button>
      </div>
      {children}
    </div>
  );
}
