import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/layout/adminLayout";

const AdminDashboard = lazy(() => import("./pages/adminDashboard"));
const AuditLogs = lazy(() => import("./pages/auditLogs"));
const CreateGroup = lazy(() => import("./pages/createGroup"));
const EventManagement = lazy(() => import("./pages/eventManagement"));
const GroupManagement = lazy(() => import("./pages/groupManagement"));
const ChangeDayManagement = lazy(() => import("./pages/changeDayManagement"));
const IncubationConfiguration = lazy(() => import("./pages/incubationConfiguration"));
const MembershipManagement = lazy(() => import("./pages/membershipManagement"));
const PhaseConfiguration = lazy(() => import("./pages/phaseConfiguration"));
const PhaseHistory = lazy(() => import("./pages/phaseHistory"));
const SettingsPage = lazy(() => import("./pages/settingsPage"));
const HolidayManagement = lazy(() => import("./pages/holidayManagement"));
const StudentManagement = lazy(() => import("./pages/studentManagement"));
const BasePointsManagement = lazy(() => import("./pages/basePointsManagement"));
const TeamManagement = lazy(() => import("./pages/teamManagement"));
const TeamMembershipManagement = lazy(() => import("./pages/teamMembershipManagement"));
const TeamTargetManagement = lazy(() => import("./pages/teamTargetManagement"));
const EligibilityManagement = lazy(() => import("./pages/eligibilityManagement"));
const EventJoinRequestManagement = lazy(() => import("./pages/eventJoinRequestManagement"));
const LeadershipRequestManagement = lazy(() => import("./pages/leadershipRequestManagement"));
const TierChangeRequestManagement = lazy(() => import("./pages/tierChangeRequestManagement"));
const EventDetailsPage = lazy(() => import("./pages/events/EventDetailsPage"));
const GroupManagementPage = lazy(() => import("./pages/groups/GroupManagementPage"));
const CreateGroupPage = lazy(() => import("./pages/groups/CreateGroupPage"));
const EditGroupPage = lazy(() => import("./pages/groups/EditGroupPage"));
const GroupDetailsPage = lazy(() => import("./pages/groups/GroupDetailsPage"));

const RouteFallback = () => (
  <div className="flex min-h-[240px] items-center justify-center px-4 py-10 text-sm font-medium text-slate-500">
    Loading page...
  </div>
);

const AdminRoutes = () => {
  return (
    <AdminLayout>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/create-group" element={<CreateGroup />} />
          <Route path="/groups" element={<GroupManagementPage />} />
          <Route path="/groups/new" element={<CreateGroupPage />} />
          <Route path="/groups/:id" element={<GroupDetailsPage />} />
          <Route path="/groups/:id/edit" element={<EditGroupPage />} />
          <Route path="/event-management" element={<EventManagement />} />
          <Route path="/event-management/:id" element={<EventDetailsPage />} />
          <Route path="/group-management" element={<GroupManagement />} />
          <Route path="/change-day-management" element={<ChangeDayManagement />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/incubation-configuration" element={<IncubationConfiguration />} />
          <Route path="/holiday-management" element={<HolidayManagement />} />
          <Route path="/membership-management" element={<MembershipManagement />} />
          <Route path="/phase-creation" element={<PhaseConfiguration />} />
          <Route path="/phase-history" element={<PhaseHistory />} />
          <Route path="/phase-configuration" element={<Navigate to="/phase-history" replace />} />
          <Route path="/eligibility" element={<EligibilityManagement />} />
          <Route path="/student-management" element={<StudentManagement />} />
          <Route path="/base-points" element={<BasePointsManagement />} />
          <Route path="/team-management" element={<TeamManagement scope="TEAM" />} />
          <Route path="/hub-management" element={<TeamManagement scope="HUB" />} />
          <Route path="/event-group-management" element={<TeamManagement scope="EVENT_GROUP" />} />
          <Route path="/team-membership-management" element={<TeamMembershipManagement scope="TEAM" />} />
          <Route path="/hub-membership-management" element={<TeamMembershipManagement scope="HUB" />} />
          <Route
            path="/event-group-membership-management"
            element={<TeamMembershipManagement scope="EVENT_GROUP" />}
          />
          <Route path="/team-target-management" element={<TeamTargetManagement />} />
          <Route path="/event-join-requests" element={<EventJoinRequestManagement />} />
          <Route path="/leadership-management" element={<LeadershipRequestManagement />} />
          <Route path="/tier-management" element={<TierChangeRequestManagement />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AdminLayout>
  );
};

export default AdminRoutes;
