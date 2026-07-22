const joinClasses = (...values) => values.filter(Boolean).join(" ");

export function WorkspacePageHeaderActionButton({
  children,
  className = "",
  ...props
}) {
  return (
    <button
      {...props}
      className={joinClasses(
        "inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70",
        className
      )}
    >
      {children}
    </button>
  );
}

export default function WorkspacePageHeader({
  actions = null,
  description = null,
  descriptionClassName = "mt-2 max-w-3xl text-sm text-slate-600",
  eyebrow = "",
  eyebrowClassName = "text-[#1754cf]",
  sectionClassName = "rounded-2xl border border-[#1754cf]/10 bg-[#1754cf]/5 p-4 md:p-5",
  title,
  titleClassName = "text-2xl font-bold tracking-tight text-slate-900"
}) {
  return (
    <section className={joinClasses("relative overflow-hidden", sectionClassName)}>
      <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <span
              className={joinClasses(
                "mb-1 block text-[11px] font-bold uppercase tracking-[0.24em]",
                eyebrowClassName
              )}
            >
              {eyebrow}
            </span>
          ) : null}
          <h1 className={titleClassName}>{title}</h1>
          {description ? <div className={descriptionClassName}>{description}</div> : null}
        </div>

        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-[#1754cf]/10 blur-3xl" />
    </section>
  );
}
