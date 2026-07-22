import EventRoundedIcon from "@mui/icons-material/EventRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import AllGroupsBadge from "../allGroups/AllGroupsBadge";
import { formatLabel } from "../teams/teamPage.utils";
import {
  getEventCategoryLabel,
  getEventDateRangeLabel,
  getEventAllowedHubSummary,
  getEventHubRestrictionLabel,
  getEventLevelLabel,
  getEventLocationLabel,
  getEventMemberLimitLabel,
  getEventOrganizerLabel,
  getEventRegistrationModeLabel,
  getEventRegistrationDateRangeLabel,
  getEventRegistrationStatus,
  getEventStudentApplyLabel,
  getNormalizedExternalUrl
} from "./events.constants";

function DetailRow({ label, value, hint = null }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
      {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

export default function EventSummaryPanel({
  event,
  eyebrow = "Participation Event",
  title = "Event Summary",
  descriptionLabel = "Participation Notes",
  groupCount = null,
  membershipText = ""
}) {
  if (!event) return null;

  const resolvedGroupCount =
    groupCount === null || groupCount === undefined ? Number(event.team_count) || 0 : groupCount;
  const registrationLink = getNormalizedExternalUrl(event.registration_link);
  const registrationStatus = getEventRegistrationStatus(event);
  const registrationModeLabel = getEventRegistrationModeLabel(event);
  const entryLabel =
    registrationModeLabel === "Individual Direct" ? "participants" : "teams";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
            {eyebrow}
          </p>
          <div className="mt-3 flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1754cf]/10 text-[#1754cf]">
              <EventRoundedIcon sx={{ fontSize: 24 }} />
            </div>

            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-900">{title}</h2>
              <p className="mt-1 text-sm text-slate-500">{event.event_name || "-"}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-[#1754cf]">
                  {event.event_code || "No code"}
                </span>
                <AllGroupsBadge value={formatLabel(event.status, "Unknown")} />
                <AllGroupsBadge value={formatLabel(registrationStatus.key, "Open")} />
                <AllGroupsBadge value={getEventStudentApplyLabel(event)} />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:max-w-sm">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            <LinkRoundedIcon sx={{ fontSize: 16 }} />
            Participation
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {membershipText || `Registered ${entryLabel} are listed below.`}
          </p>
          {registrationLink ? (
            <a
              href={registrationLink}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#1754cf] hover:underline"
            >
              Open Event Page
            </a>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No external registration link provided.</p>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Event Details
          </div>
          <div className="mt-4">
            <DetailRow label="Host" value={getEventOrganizerLabel(event)} />
            <DetailRow label="Category" value={getEventCategoryLabel(event)} />
            <DetailRow label="Level" value={getEventLevelLabel(event)} />
            <DetailRow
              label="Location"
              value={getEventLocationLabel(event)}
              hint="Venue or event location"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            <PlaceOutlinedIcon sx={{ fontSize: 16 }} />
            Registration Overview
          </div>
          <div className="mt-4">
            <DetailRow label="Event Dates" value={getEventDateRangeLabel(event)} />
            <DetailRow
              label="Registration Window"
              value={getEventRegistrationDateRangeLabel(event)}
              hint={formatLabel(registrationStatus.key, "Open")}
            />
            <DetailRow label="Registration Mode" value={registrationModeLabel} />
            <DetailRow
              label="Hub Access"
              value={getEventHubRestrictionLabel(event)}
              hint={getEventAllowedHubSummary(event)}
            />
            <DetailRow label="Member Limits" value={getEventMemberLimitLabel(event)} />
            <DetailRow
              label="Entries Listed"
              value={`${resolvedGroupCount} ${entryLabel}`}
              hint={membershipText || "Current registrations linked to this event"}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {descriptionLabel}
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {event.description || "No event details added."}
        </p>
      </div>
    </section>
  );
}
