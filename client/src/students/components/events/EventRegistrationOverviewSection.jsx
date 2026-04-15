import { formatLabel, formatShortDate } from "../teams/teamPage.utils";
import {
  getEventAllowedHubSummary,
  getEventHubRestrictionLabel
} from "./events.constants";

function OverviewRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

const formatEventWindow = (startDate, endDate) => {
  if (!startDate && !endDate) return "-";

  const start = formatShortDate(startDate);
  const end = formatShortDate(endDate || startDate);
  if ((endDate || startDate) === startDate) return start;
  return `${start} to ${end}`;
};

export default function EventRegistrationOverviewSection({
  event,
  group,
  memberCount = 0,
  myRoleLabel = "-"
}) {
  const individualRegistration =
    String(event?.registration_mode || "").trim().toUpperCase() === "INDIVIDUAL";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Registration Overview
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Clean event and registration details without the dashboard-style stat cards.
        </p>
      </div>

      <dl className="mt-4 grid gap-x-8 md:grid-cols-2">
        <OverviewRow label="Event" value={event?.event_name || "-"} />
        <OverviewRow label="Registration Code" value={group?.team_code || "-"} />
        <OverviewRow
          label="Registration Type"
          value={individualRegistration ? "Individual" : "Team"}
        />
        <OverviewRow
          label="Registration Status"
          value={formatLabel(group?.status, "Unknown")}
        />
        <OverviewRow label="My Role" value={myRoleLabel} />
        <OverviewRow
          label={individualRegistration ? "Participant Count" : "Member Count"}
          value={memberCount}
        />
        <OverviewRow
          label="Rounds Cleared"
          value={Number(group?.rounds_cleared) || 0}
        />
        <OverviewRow
          label="Hub Access"
          value={getEventHubRestrictionLabel(event)}
        />
        <OverviewRow
          label="Event Window"
          value={formatEventWindow(event?.start_date, event?.end_date)}
        />
      </dl>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {getEventAllowedHubSummary(event)}
      </div>
    </section>
  );
}
