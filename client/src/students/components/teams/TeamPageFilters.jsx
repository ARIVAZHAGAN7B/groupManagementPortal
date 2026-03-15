import { useEffect, useMemo, useRef, useState } from "react";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";

function SummaryChip({ label }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
      {label}
    </span>
  );
}

export default function TeamPageFilters({
  activeFilters = [],
  canReset = false,
  children,
  className = "",
  itemLabel = "results",
  onReset,
  panelTitle = "Filter results",
  panelDescription = "Changes apply instantly to the current list.",
  resultCount = 0,
  totalCount = 0,
  withDivider = false
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const showingText = useMemo(() => {
    if (totalCount > 0) {
      return `Showing ${resultCount} of ${totalCount} ${itemLabel}`;
    }

    return `Showing ${resultCount} ${itemLabel}`;
  }, [itemLabel, resultCount, totalCount]);

  const currentViewText = useMemo(() => {
    if (activeFilters.length > 0) {
      return activeFilters.join(" | ");
    }

    return `No filters applied. Showing the full ${itemLabel} list.`;
  }, [activeFilters, itemLabel]);

  return (
    <div
      ref={rootRef}
      className={`${className} relative bg-slate-50/80 px-4 py-3 ${
        withDivider ? "border-b border-slate-200" : ""
      }`.trim()}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">{showingText}</div>
          <div className="mt-1 truncate text-xs text-slate-500">{currentViewText}</div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <FilterAltOutlinedIcon sx={{ fontSize: 18 }} />
          {activeFilters.length > 0 ? `Filters (${activeFilters.length})` : "Filters"}
        </button>
      </div>

      {open ? (
        <div className="absolute right-4 top-[calc(100%+10px)] z-20 w-[min(92vw,440px)] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">{panelTitle}</h3>
              <p className="mt-1 text-xs text-slate-500">{panelDescription}</p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Current View
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">{showingText}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeFilters.length > 0 ? (
                activeFilters.map((item) => <SummaryChip key={item} label={item} />)
              ) : (
                <SummaryChip label={`All ${itemLabel}`} />
              )}
            </div>
          </div>

          <div className="mt-4 space-y-3">{children}</div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {activeFilters.length > 0
                ? `${activeFilters.length} filter${activeFilters.length === 1 ? "" : "s"} active`
                : "All filters are cleared"}
            </div>

            <button
              type="button"
              onClick={onReset}
              disabled={!canReset}
              title="Reset filters"
              aria-label="Reset filters"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-[#f3f4f6] px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-[#eceef2] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-300"
            >
              <RestartAltRoundedIcon sx={{ fontSize: 18 }} />
              Reset
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
