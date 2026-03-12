export default function ChangeDayManagementSectionShell({
  action,
  border = true,
  children,
  description,
  title
}) {
  return (
    <section className={`${border ? "border-b border-slate-100" : ""} p-8`}>
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="md:w-1/3">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        <div className="flex-1 space-y-6">
          {children}

          {action ? <div className="flex justify-end">{action}</div> : null}
        </div>
      </div>
    </section>
  );
}
