import React from "react";
import {
  BarRow,
  EmptyState,
  InsightRow,
  MiniStat,
  SectionCard,
  StatusBadge
} from "./AdminDashboardPrimitives";
import { BAR_TONES, count, formatPercent, shortDate } from "./adminDashboard.constants";

export const AdminEventStatsCard = React.memo(function AdminEventStatsCard({
  dashboard,
  data,
  navigate
}) {
  return (
    <SectionCard
      title="Event Statistics"
      subtitle="Registration state, categories, and participation pressure."
      actionLabel="Open events"
      onAction={() => navigate("/event-management")}
    >
      <div className="grid gap-3 md:grid-cols-4">
        <MiniStat label="Total Events" note="Across all statuses." value={count(data.events.length)} />
        <MiniStat
          label="Registration Open"
          note={`${count(dashboard.registrationUpcomingEvents.length)} opening later`}
          value={count(dashboard.openEvents.length)}
        />
        <MiniStat
          label="Registration Closed"
          note="Closed by status or by registration end date."
          value={count(dashboard.closedEvents.length)}
        />
        <MiniStat
          label="Participation Rate"
          note={`${count(dashboard.totalEventRegistrations)} of ${count(
            dashboard.totalEventCapacity
          )} seats`}
          value={formatPercent(dashboard.participationRate)}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge label="Active" statusKey="ACTIVE" value={dashboard.eventStatusCounts.ACTIVE} />
        <StatusBadge label="Closed" statusKey="CLOSED" value={dashboard.eventStatusCounts.CLOSED} />
        <StatusBadge
          label="Inactive"
          statusKey="INACTIVE"
          value={dashboard.eventStatusCounts.INACTIVE}
        />
        <StatusBadge
          label="Archived"
          statusKey="ARCHIVED"
          value={dashboard.eventStatusCounts.ARCHIVED}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          {dashboard.eventCategoryDistribution.length > 0 ? (
            dashboard.eventCategoryDistribution.map((row, index) => (
              <BarRow
                key={row.label}
                label={row.label}
                note={`${formatPercent(
                  data.events.length ? row.value / data.events.length : null
                )} of all events`}
                tone={BAR_TONES[index % BAR_TONES.length]}
                total={data.events.length}
                value={row.value}
              />
            ))
          ) : (
            <EmptyState message="No event category data is available right now." />
          )}
        </div>

        <div className="space-y-3">
          {dashboard.nearDeadlineEvents.length > 0 ? (
            dashboard.nearDeadlineEvents.slice(0, 5).map((event) => (
              <InsightRow
                key={event.event_id}
                badge={`${count(event.daysLeft)}d left`}
                badgeTone="bg-orange-600"
                meta={`${event.event_code || `Event ${event.event_id}`} | Registration ends ${shortDate(
                  event.registration_end_date
                )}`}
                onClick={() => navigate(`/event-management/${event.event_id}`)}
                title={event.event_name || event.event_code || `Event ${event.event_id}`}
              />
            ))
          ) : dashboard.lowParticipationEvents.length > 0 ? (
            dashboard.lowParticipationEvents.slice(0, 5).map((event) => (
              <InsightRow
                key={event.event_id}
                badge={formatPercent(event.usage)}
                badgeTone="bg-rose-600"
                meta={`${count(event.applied_count)}/${count(event.maximum_count)} registrations`}
                onClick={() => navigate(`/event-management/${event.event_id}`)}
                title={event.event_name || event.event_code || `Event ${event.event_id}`}
              />
            ))
          ) : (
            <EmptyState message="No event deadline or participation warnings are active right now." />
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <MiniStat
          label="Upcoming Events"
          note="Events that have not started yet."
          value={count(dashboard.upcomingEvents.length)}
        />
        <MiniStat
          label="Completed Events"
          note="Events already completed or explicitly closed."
          value={count(dashboard.completedEvents.length)}
        />
      </div>
    </SectionCard>
  );
});
