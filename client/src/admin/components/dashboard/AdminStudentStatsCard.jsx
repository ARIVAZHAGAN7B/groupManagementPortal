import React from "react";
import {
  EmptyState,
  GrowthBlock,
  InsightRow,
  MiniStat,
  SectionCard,
  StatusBadge
} from "./AdminDashboardPrimitives";
import { count, formatAverage } from "./adminDashboard.constants";

export const AdminStudentStatsCard = React.memo(function AdminStudentStatsCard({
  currentPhaseId,
  dashboard,
  data,
  navigate
}) {
  return (
    <SectionCard
      title="Student Management Statistics"
      subtitle="Student status, registration velocity, and phase eligibility coverage."
      actionLabel="Open students"
      onAction={() => navigate("/student-management")}
    >
      <div className="grid gap-3 md:grid-cols-4">
        <MiniStat label="Total Students" note="Student records in the portal." value={count(data.students.length)} />
        <MiniStat
          label="Active Students"
          note="Students with active status."
          value={count(dashboard.studentStatusCounts.ACTIVE)}
        />
        <MiniStat
          label="Inactive Students"
          note="Students with inactive status."
          value={count(dashboard.studentStatusCounts.INACTIVE)}
        />
        <MiniStat
          label="Ungrouped Students"
          note="Students without an active group membership."
          value={count(dashboard.ungroupedStudents)}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge
          label="Active"
          statusKey="ACTIVE"
          value={dashboard.studentStatusCounts.ACTIVE}
        />
        <StatusBadge
          label="Inactive"
          statusKey="INACTIVE"
          value={dashboard.studentStatusCounts.INACTIVE}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <MiniStat
          label="Students / Group"
          note={`${count(dashboard.groupedStudents)} students already placed`}
          value={formatAverage(dashboard.avgStudentsPerActiveGroup)}
        />
        <MiniStat
          label="Current Phase Eligible"
          note="Students eligible in the active phase."
          value={currentPhaseId ? count(dashboard.eligibleStudents) : "N/A"}
        />
        <MiniStat
          label="Current Phase Ineligible"
          note="Students currently below phase requirements."
          value={currentPhaseId ? count(dashboard.ineligibleStudents) : "N/A"}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <GrowthBlock counts={dashboard.studentGrowth} label="New registrations" />

        <div className="space-y-3">
          {dashboard.largestGroupsByMembers.length > 0 ? (
            dashboard.largestGroupsByMembers.map((group) => (
              <InsightRow
                key={`student-group-${group.group_id}`}
                badge={`${count(group.active_member_count)} students`}
                meta={`${group.group_code || `Group ${group.group_id}`} | ${
                  group.group_name || "Unnamed"
                }`}
                onClick={() => navigate(`/groups/${group.group_id}`)}
                title={`Students in ${group.group_name || group.group_code || `Group ${group.group_id}`}`}
              />
            ))
          ) : (
            <EmptyState message="No student-per-group data is available right now." />
          )}
        </div>
      </div>
    </SectionCard>
  );
});
