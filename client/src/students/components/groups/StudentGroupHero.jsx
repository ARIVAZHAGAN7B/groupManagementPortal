import LeadershipGapChips from "../../../shared/components/LeadershipGapChips";

export default function StudentGroupHero({
  actions = null,
  badges = null,
  eyebrow = "",
  missingLeadershipRoles = [],
  title = ""
}) {
  const hasActionArea = Boolean(actions) || missingLeadershipRoles.length > 0;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#1754cf]/10 bg-[#1754cf]/5 p-4 md:p-5">
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            {eyebrow ? (
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
                {eyebrow}
              </span>
            ) : null}
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          </div>

          {hasActionArea ? (
            <div className="flex flex-col items-start gap-3 md:items-end">
              {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
              <LeadershipGapChips
                roles={missingLeadershipRoles}
                className="md:justify-end"
              />
            </div>
          ) : null}
        </div>

        {badges ? <div className="flex flex-wrap items-center gap-2">{badges}</div> : null}
      </div>

      <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-[#1754cf]/10 blur-3xl" />
    </section>
  );
}
