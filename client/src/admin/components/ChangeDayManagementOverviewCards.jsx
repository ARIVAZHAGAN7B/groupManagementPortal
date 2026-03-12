export default function ChangeDayManagementOverviewCards({
  currentPhase,
  formatDate
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          Current Phase
        </p>
        <p className="mt-2 text-xl font-bold text-slate-900">
          {currentPhase?.phase_name || currentPhase?.phase_id || "-"}
        </p>
      </article>

      <article className="rounded-xl border border-slate-200 border-l-4 border-l-[#1754cf] bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          Change Day Count
        </p>
        <p className="mt-2 text-3xl font-black text-[#1754cf]">
          {currentPhase?.change_day_number ? `Day ${currentPhase.change_day_number}` : "-"}
        </p>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          Change Day Date
        </p>
        <p className="mt-2 text-xl font-bold text-slate-900">
          {formatDate(currentPhase?.change_day)}
        </p>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          Phase End Date
        </p>
        <p className="mt-2 text-xl font-bold text-slate-900">
          {formatDate(currentPhase?.end_date)}
        </p>
      </article>
    </div>
  );
}
