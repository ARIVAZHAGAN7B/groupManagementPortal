import EventRoundedIcon from "@mui/icons-material/EventRounded";
import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import AllGroupsBadge from "../allGroups/AllGroupsBadge";
import TeamPageDetailTile from "../teams/TeamPageDetailTile";
import { formatLabel } from "../teams/teamPage.utils";
import {
  getEventCategoryLabel,
  getEventDateRangeLabel,
  getEventLevelLabel,
  getEventLocationLabel,
  getEventMemberLimitLabel,
  getEventOrganizerLabel,
  getEventRegistrationDateRangeLabel,
  getEventRegistrationStatus,
  getEventStudentApplyLabel,
  getNormalizedExternalUrl
} from "./events.constants";

export default function EventSummaryPanel({
  event,
  eyebrow = "Event Context",
  title = "Event Details",
  descriptionLabel = "Event Details",
  groupCount = null,
  membershipText = ""
}) {
  if (!event) return null;

  const resolvedGroupCount =
    groupCount === null || groupCount === undefined ? Number(event.team_count) || 0 : groupCount;
  const registrationLink = getNormalizedExternalUrl(event.registration_link);
  const registrationStatus = getEventRegistrationStatus(event);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
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
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-[#1754cf]">
            {event.event_code || "No code"}
          </span>
          <AllGroupsBadge value={formatLabel(event.status, "Unknown")} />
          <AllGroupsBadge value={formatLabel(registrationStatus.key, "Open")} />
          <AllGroupsBadge value={getEventStudentApplyLabel(event)} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TeamPageDetailTile
          label="Organizer"
          value={getEventOrganizerLabel(event)}
          subtext="Event organizer"
        />
        <TeamPageDetailTile
          label="Category"
          value={getEventCategoryLabel(event)}
          subtext="Event category"
        />
        <TeamPageDetailTile
          label="Level"
          value={getEventLevelLabel(event)}
          subtext="Competition or event level"
        />
        <TeamPageDetailTile
          label="Location"
          value={getEventLocationLabel(event)}
          subtext="Venue or event location"
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            <PlaceOutlinedIcon sx={{ fontSize: 16 }} />
            Location
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {getEventLocationLabel(event)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            <LinkRoundedIcon sx={{ fontSize: 16 }} />
            Registration Link
          </div>
          {registrationLink ? (
            <a
              href={registrationLink}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#1754cf] hover:underline"
            >
              Open Registration
            </a>
          ) : (
            <p className="mt-2 text-sm font-semibold text-slate-900">Not provided</p>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TeamPageDetailTile
          label="Event Dates"
          value={getEventDateRangeLabel(event)}
          subtext="Event timeline"
        />
        <TeamPageDetailTile
          label="Registration"
          value={getEventRegistrationDateRangeLabel(event)}
          subtext={formatLabel(registrationStatus.key, "Open")}
        />
        <TeamPageDetailTile
          label="Member Limits"
          value={getEventMemberLimitLabel(event)}
          subtext="Applied to event groups in this event"
        />
        <TeamPageDetailTile
          label="Registered Groups"
          value={resolvedGroupCount}
          subtext={membershipText || "Current event groups linked to this event"}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            <HowToRegRoundedIcon sx={{ fontSize: 16 }} />
            Registration Window
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {getEventRegistrationDateRangeLabel(event)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            <Groups2RoundedIcon sx={{ fontSize: 16 }} />
            Student Apply
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {getEventStudentApplyLabel(event)}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
