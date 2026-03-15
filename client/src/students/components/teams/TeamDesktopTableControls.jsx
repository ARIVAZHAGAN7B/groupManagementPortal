import { useEffect, useRef, useState } from "react";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

export function TeamTableSelectField({ children, onChange, value }) {
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={onChange}
        className="w-full appearance-none rounded-2xl border border-slate-300 bg-[#f3f4f6] px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
        <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18 }} />
      </span>
    </div>
  );
}

export function TeamTableSearchField({ onChange, placeholder, value }) {
  return (
    <label className="block">
      <span className="relative block">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
          <SearchRoundedIcon sx={{ fontSize: 18 }} />
        </span>
        <input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-300 bg-[#f3f4f6] py-2.5 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10"
        />
      </span>
    </label>
  );
}

export function TeamTableHeaderFilterButton({
  active = false,
  align = "left",
  children,
  label,
  panelWidthClass = "w-72"
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

  return (
    <div ref={rootRef} className="relative inline-flex items-center gap-1.5">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={`Filter ${label}`}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition ${
          active || open
            ? "border-[#1754cf]/20 bg-[#1754cf]/10 text-[#1754cf]"
            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
        }`}
      >
        <FilterAltOutlinedIcon sx={{ fontSize: 16 }} />
      </button>

      {open ? (
        <div
          className={`absolute top-[calc(100%+10px)] z-30 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl ${panelWidthClass} ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function TeamTableFilterPanel({ children, currentText, helperText, title }) {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {title}
        </div>
        <div className="mt-1 text-sm font-semibold text-slate-900">{currentText}</div>
        <div className="mt-1 text-xs text-slate-500">{helperText}</div>
      </div>
      {children}
    </div>
  );
}

export function TeamDesktopTableShell({ canReset = false, children, onReset, toolbar = null }) {
  return (
    <div className="relative hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
      <div
        className={`border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 ${
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
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
            canReset
              ? "cursor-pointer border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
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
