import React from "react";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import {
  BADGE_TONES,
  cn,
  count,
  num,
  renderMetric
} from "./adminDashboard.constants";

export const SummaryTile = React.memo(function SummaryTile({
  accent,
  icon: Icon,
  label,
  note,
  onClick,
  value
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">{value}</p>
          <p className="mt-1.5 min-h-10 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{note}</p>
        </div>
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border shadow-xs"
          style={{ backgroundColor: `${accent}18`, borderColor: `${accent}33`, color: accent }}
        >
          <Icon sx={{ fontSize: 22 }} />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs font-bold text-slate-700 transition group-hover:text-indigo-600 dark:text-slate-300 dark:group-hover:text-indigo-400">
        <span>Explore view</span>
        <ArrowOutwardRoundedIcon sx={{ fontSize: 14 }} />
      </div>
    </button>
  );
});

export const SectionCard = React.memo(function SectionCard({
  actionLabel,
  children,
  className = "",
  onAction,
  subtitle,
  title
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-3 dark:border-slate-800/80">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">{title}</p>
          {subtitle ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
        </div>
        {actionLabel ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex w-fit items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:text-indigo-400"
          >
            {actionLabel}
            <ArrowOutwardRoundedIcon sx={{ fontSize: 14 }} />
          </button>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
});

export const MiniStat = React.memo(function MiniStat({ label, note, value }) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-850">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight text-slate-950 dark:text-white">{renderMetric(value)}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{note}</p>
    </div>
  );
});

export const StatusBadge = React.memo(function StatusBadge({ label, statusKey, value }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-2xs",
        BADGE_TONES[statusKey] || BADGE_TONES.INACTIVE
      )}
    >
      <span>{label}</span>
      <span className="font-bold">{count(value)}</span>
    </div>
  );
});

export const BarRow = React.memo(function BarRow({ label, note, tone, total, value }) {
  const ratio = total ? Math.min(Math.max(num(value) / total, 0), 1) : 0;
  const percentage = Math.round(ratio * 100);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{label}</p>
        <span className="text-xs font-bold text-slate-900 dark:text-white">{count(value)} <span className="font-normal text-slate-400 text-[10px]">({percentage}%)</span></span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={cn("h-full rounded-full transition-all duration-500", tone)} style={{ width: `${ratio * 100}%` }} />
      </div>
      {note ? <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{note}</p> : null}
    </div>
  );
});

export const InsightRow = React.memo(function InsightRow({
  badge,
  badgeTone = "bg-slate-900",
  meta,
  onClick,
  title
}) {
  const classes =
    "flex w-full items-start justify-between gap-4 rounded-xl border border-slate-200/70 bg-slate-50/70 p-3.5 text-left transition hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-850/60 dark:hover:border-slate-700 dark:hover:bg-slate-800";

  const content = (
    <>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{meta}</p>
      </div>
      {badge ? (
        <span
          className={cn(
            "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs",
            badgeTone
          )}
        >
          {badge}
        </span>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {content}
      </button>
    );
  }

  return <div className={classes}>{content}</div>;
});

export const EmptyState = React.memo(function EmptyState({ message }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-850/50 dark:text-slate-400">
      {message}
    </div>
  );
});

export const GrowthBlock = React.memo(function GrowthBlock({ counts: growthCounts, label }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-850">
      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{label}</p>
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        <div>
          <p className="text-lg font-black text-slate-950 dark:text-white">{count(growthCounts?.day)}</p>
          <p className="text-[10px] uppercase font-semibold text-slate-400">24h</p>
        </div>
        <div>
          <p className="text-lg font-black text-slate-950 dark:text-white">{count(growthCounts?.week)}</p>
          <p className="text-[10px] uppercase font-semibold text-slate-400">7d</p>
        </div>
        <div>
          <p className="text-lg font-black text-slate-950 dark:text-white">{count(growthCounts?.month)}</p>
          <p className="text-[10px] uppercase font-semibold text-slate-400">30d</p>
        </div>
      </div>
    </div>
  );
});
