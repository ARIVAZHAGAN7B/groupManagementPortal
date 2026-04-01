const joinClasses = (...values) => values.filter(Boolean).join(" ");

export function AdminWorkspaceHeroActionButton({
  children,
  className = "",
  ...props
}) {
  return (
    <button
      {...props}
      className={joinClasses(
        "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-70",
        className
      )}
    >
      {children}
    </button>
  );
}

export default function AdminWorkspaceHero({
  actions = null,
  accentClassName = "text-[#1754cf]",
  contentClassName = "relative z-10 flex flex-col gap-3",
  description = null,
  descriptionClassName = "mt-1 text-xs font-medium text-slate-600",
  eyebrow,
  glowClassName = "bg-[#1754cf]/10",
  headerClassName = "flex flex-col justify-between gap-3 md:flex-row md:items-center",
  sectionClassName = "rounded-2xl border border-[#1754cf]/10 bg-[#1754cf]/5 p-4 md:p-5",
  title,
  titleClassName = "text-2xl font-bold tracking-tight text-slate-900",
  titleMeta = null,
  titleRowClassName = "flex flex-wrap items-center gap-2"
}) {
  return (
    <section
      className={joinClasses(
        "relative overflow-hidden",
        sectionClassName
      )}
    >
      <div className={contentClassName}>
        <div className={headerClassName}>
          <div>
            {eyebrow ? (
              <span
                className={joinClasses(
                  "mb-1 block text-[11px] font-bold uppercase tracking-[0.24em]",
                  accentClassName
                )}
              >
                {eyebrow}
              </span>
            ) : null}

            <div className={titleRowClassName}>
              <h1 className={titleClassName}>{title}</h1>
              {titleMeta}
            </div>

            {description ? (
              <div className={descriptionClassName}>{description}</div>
            ) : null}
          </div>

          {actions}
        </div>
      </div>

      <div
        className={joinClasses(
          "absolute -bottom-10 -right-10 h-48 w-48 rounded-full blur-3xl",
          glowClassName
        )}
      />
    </section>
  );
}
