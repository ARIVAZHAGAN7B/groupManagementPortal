import {
  getStatusConfig,
  getTierBadgeClass,
  inputClass
} from "../groups/groupManagement.constants";
import { AdminFilterSelect } from "../ui/AdminFilterControls";
import { AdminMobileValueRow } from "../ui/AdminMobileCards";
import { AdminBadge, AdminStatusDotBadge } from "../ui/AdminUiPrimitives";
import {
  getActionButtonClass,
  MANUAL_ACTIONS,
  normalizeStatus
} from "./tierChangeManagement.utils";

const ACTION_BADGE_STYLES = {
  PROMOTE: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  DEMOTE: "border border-red-200 bg-red-50 text-red-700",
  APPLIED: "border border-[#1754cf]/20 bg-[#1754cf]/10 text-[#1754cf]",
  AUTO_DEMOTE: "border border-red-200 bg-red-50 text-red-700",
  YES: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  NO: "border border-red-200 bg-red-50 text-red-700",
  NOT_EVALUATED: "border border-slate-200 bg-slate-100 text-slate-500"
};

export function StatPill({ accentClass, detail, label, value }) {
  return (
    <article className="rounded-lg border border-white/80 bg-white/90 px-3 py-2.5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${accentClass}`} />
        <p className="text-sm font-semibold text-slate-700">
          {label}: <span className="text-slate-900">{value}</span>
        </p>
      </div>
      <p className="mt-1 pl-4 text-[11px] font-medium text-slate-500">{detail}</p>
    </article>
  );
}

export function FilterSelect({ children, onChange, value }) {
  return (
    <AdminFilterSelect
      value={value}
      onChange={onChange}
      wrapperClassName="relative min-w-32"
      selectClassName={`${inputClass} min-w-32 appearance-none pr-10`}
    >
        {children}
    </AdminFilterSelect>
  );
}

export function StatusBadge({ status }) {
  return <AdminStatusDotBadge config={getStatusConfig(status)} />;
}

export function TierBadge({ tier }) {
  return (
    <AdminBadge className={`px-2 py-0.5 text-[10px] ${getTierBadgeClass(tier)}`}>
      Tier {String(tier || "-").toUpperCase()}
    </AdminBadge>
  );
}

export function ToneBadge({ value, fallback = "-" }) {
  const text = String(value ?? fallback);
  const key = text.toUpperCase().replace(/\s+/g, "_");
  const className =
    ACTION_BADGE_STYLES[key] || "border border-slate-200 bg-slate-100 text-slate-600";

  return (
    <AdminBadge className={`px-2.5 py-1 text-[10px] ${className}`}>
      {text}
    </AdminBadge>
  );
}

export function ActionSelector({ disabled, onChange, resolvedAction, row }) {
  const groupStatus = normalizeStatus(row?.group_status);
  const isActiveGroup = groupStatus === "ACTIVE";

  if (!isActiveGroup) {
    return <ToneBadge value="Auto Demote" />;
  }

  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
      {MANUAL_ACTIONS.map((action) => {
        const isSelected = resolvedAction === action;

        return (
          <button
            key={action}
            type="button"
            onClick={() => onChange(action)}
            disabled={disabled}
            className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${getActionButtonClass(
              action,
              isSelected
            )}`}
          >
            {action === "PROMOTE" ? "Promote" : "Demote"}
          </button>
        );
      })}
    </div>
  );
}

export function MobileValueRow({ children, label }) {
  return (
    <AdminMobileValueRow align="start" label={label} valueClassName="">
      {children}
    </AdminMobileValueRow>
  );
}
