export default function IncubationConfigurationPolicySection({
  children,
  eyebrow,
  title
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-[#1754cf]">
            {eyebrow}
          </span>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">{title}</h2>
        </div>
      </div>

      <div className="mt-4">{children}</div>
    </section>
  );
}
