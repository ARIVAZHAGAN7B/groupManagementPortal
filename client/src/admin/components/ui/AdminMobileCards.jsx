const joinClasses = (...values) => values.filter(Boolean).join(" ");

export function AdminMobileEmptyState({
  className = "",
  message
}) {
  return (
    <div
      className={joinClasses(
        "rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm",
        className
      )}
    >
      {message}
    </div>
  );
}

export function AdminMobileCardList({
  emptyClassName = "",
  emptyMessage,
  items = [],
  listClassName = "space-y-4 lg:hidden",
  renderItem
}) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <AdminMobileEmptyState
        className={emptyClassName}
        message={emptyMessage}
      />
    );
  }

  return <section className={listClassName}>{items.map(renderItem)}</section>;
}

export function AdminMobileCard({
  children,
  className = ""
}) {
  return (
    <article
      className={joinClasses(
        "rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
        className
      )}
    >
      {children}
    </article>
  );
}

export function AdminMobileValueRow({
  align = "center",
  children,
  label,
  value,
  valueClassName = "font-bold text-slate-900"
}) {
  return (
    <div
      className={joinClasses(
        "flex justify-between gap-4 border-t border-slate-100 py-2 text-xs",
        align === "start" ? "items-start" : "items-center"
      )}
    >
      <span className="text-slate-500">{label}</span>
      <div className={joinClasses("text-right", valueClassName)}>
        {children ?? value}
      </div>
    </div>
  );
}
