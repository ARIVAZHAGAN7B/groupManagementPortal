const joinClasses = (...values) => values.filter(Boolean).join(" ");

export default function ChangeDayManagementSectionShell({
  action,
  children,
  description,
  eyebrow,
  icon: Icon,
  title,
  aside = null,
  className = "",
  contentClassName = ""
}) {
  return (
    <section
      className={joinClasses(
        "relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_22px_55px_-36px_rgba(15,23,42,0.52)] md:p-7",
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1754cf] via-sky-400 to-emerald-400" />
      <div className="relative z-10 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            {Icon ? (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1754cf]/10 text-[#1754cf]">
                <Icon sx={{ fontSize: 24 }} />
              </div>
            ) : null}

            <div>
              {eyebrow ? (
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
                  {eyebrow}
                </span>
              ) : null}
              <h3 className="text-xl font-black tracking-tight text-slate-900">{title}</h3>
              {description ? (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
              ) : null}
            </div>
          </div>

          {action ? <div className="shrink-0">{action}</div> : null}
        </div>

        {aside ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/85 p-4">
            {aside}
          </div>
        ) : null}

        <div className={joinClasses("space-y-6", contentClassName)}>
          {children}
        </div>
      </div>
    </section>
  );
}
