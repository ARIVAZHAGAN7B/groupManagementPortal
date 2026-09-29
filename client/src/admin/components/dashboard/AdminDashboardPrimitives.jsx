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
      className="group rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 min-h-10 text-sm leading-5 text-slate-600">{note}</p>
        </div>
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border"
          style={{ backgroundColor: `${accent}14`, borderColor: `${accent}33`, color: accent }}
        >
          <Icon sx={{ fontSize: 22 }} />
        </div>
      </div>
      <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-700 transition group-hover:text-[#1754cf]">
        Open
        <ArrowOutwardRoundedIcon sx={{ fontSize: 16 }} />
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
        "rounded-lg border border-slate-200 bg-white p-5 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase text-[#1754cf]">{title}</p>
          {subtitle ? <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        {actionLabel ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex w-fit items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-[#1754cf]"
          >
            {actionLabel}
            <ArrowOutwardRoundedIcon sx={{ fontSize: 16 }} />
          </button>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
});

export const MiniStat = React.memo(function MiniStat({ label, note, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-4">
      <p className="text-[11px] font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{renderMetric(value)}</p>
      <p className="mt-1 text-sm text-slate-600">{note}</p>
    </div>
  );
});

export const StatusBadge = React.memo(function StatusBadge({ label, statusKey, value }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-semibold",
        BADGE_TONES[statusKey] || BADGE_TONES.INACTIVE
      )}
    >
      <span>{label}</span>
      <span>{count(value)}</span>
    </div>
  );
});

export const BarRow = React.memo(function BarRow({ label, note, tone, total, value }) {
  const ratio = total ? Math.min(Math.max(num(value) / total, 0), 1) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <span className="text-sm font-bold text-slate-900">{count(value)}</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${ratio * 100}%` }} />
      </div>
      {note ? <p className="mt-2 text-xs text-slate-500">{note}</p> : null}
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
    "flex w-full items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-white";

  const content = (
    <>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-600">{meta}</p>
      </div>
      {badge ? (
        <span
          className={cn(
            "inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-bold text-white",
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
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {message}
    </div>
  );
});

export const GrowthBlock = React.memo(function GrowthBlock({ counts: growthCounts, label }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-4">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xl font-bold text-slate-950">{count(growthCounts?.day)}</p>
          <p className="text-xs uppercase text-slate-500">24h</p>
        </div>
        <div>
          <p className="text-xl font-bold text-slate-950">{count(growthCounts?.week)}</p>
          <p className="text-xs uppercase text-slate-500">7d</p>
        </div>
        <div>
          <p className="text-xl font-bold text-slate-950">{count(growthCounts?.month)}</p>
          <p className="text-xs uppercase text-slate-500">30d</p>
        </div>
      </div>
    </div>
  );
});
