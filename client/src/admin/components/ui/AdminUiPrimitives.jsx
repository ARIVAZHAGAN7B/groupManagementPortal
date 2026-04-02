const joinClasses = (...values) => values.filter(Boolean).join(" ");

export const normalizeAdminBadgeValue = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

export const formatAdminBadgeValue = (value, fallback = "-") => {
  const normalized = normalizeAdminBadgeValue(value);
  if (!normalized) return fallback;

  return normalized.replaceAll("_", " ");
};

export function AdminBadge({
  children,
  className = ""
}) {
  return (
    <span
      className={joinClasses(
        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold",
        className
      )}
    >
      {children}
    </span>
  );
}

export function AdminMappedBadge({
  className = "",
  map,
  value,
  fallbackClassName = "border-slate-200 bg-slate-100 text-slate-600",
  fallbackLabel = "-",
  formatLabel = formatAdminBadgeValue,
  normalizeValue = normalizeAdminBadgeValue
}) {
  const normalized = normalizeValue(value);
  const badgeClassName = map?.[normalized] ?? fallbackClassName;
  const label = normalized ? formatLabel(normalized, fallbackLabel) : fallbackLabel;

  return <AdminBadge className={joinClasses(badgeClassName, className)}>{label}</AdminBadge>;
}

export function AdminStatusDotBadge({
  config,
  label,
  className = "",
  dotClassName = "h-1.5 w-1.5",
  gapClassName = "gap-1.5",
  textClassName = "text-[10px] font-bold"
}) {
  return (
    <span
      className={joinClasses(
        "flex items-center",
        gapClassName,
        textClassName,
        config?.text,
        className
      )}
    >
      <span className={joinClasses("rounded-full", dotClassName, config?.dot)} />
      {label || config?.label || "-"}
    </span>
  );
}

export function AdminIconActionButton({
  children,
  className = "",
  disabled = false,
  label,
  onClick,
  sizeClassName = "h-8 w-8",
  baseClassName = ""
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={joinClasses(
        "inline-flex cursor-pointer items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        sizeClassName,
        baseClassName,
        className
      )}
    >
      {children}
    </button>
  );
}

export function AdminTextActionButton({
  className = "",
  disabled = false,
  label,
  onClick,
  sizeClassName = "px-2.5 py-1",
  textClassName = "text-xs font-semibold",
  fullWidth = true
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={joinClasses(
        "cursor-pointer rounded-md text-center transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        fullWidth ? "w-full whitespace-nowrap" : "",
        sizeClassName,
        textClassName,
        className
      )}
    >
      {label}
    </button>
  );
}
