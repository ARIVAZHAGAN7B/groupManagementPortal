import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import StudentLayout from "./components/layout/studentLayout";

const StudentDashboard = lazy(() => import("./pages/studentDashboard"));
const MyGroup = lazy(() => import("./pages/myGroup"));
const AllGroups = lazy(() => import("./pages/allGroups"));
const GroupDetails = lazy(() => import("./pages/groupDetails"));
const LeaderboardPage = lazy(() => import("./pages/leaderboard"));
const EligibilityHistoryPage = lazy(() => import("./pages/eligibilityHistory"));
const EventsPage = lazy(() => import("./pages/events"));
const EventGroupsPage = lazy(() => import("./pages/eventGroups"));
const EventGroupDetailsPage = lazy(() => import("./pages/eventGroupDetails"));
const TeamsRegularPage = lazy(() => import("./pages/teamsRegular"));
const HubsPage = lazy(() => import("./pages/hubs"));
const TeamDetailsPage = lazy(() => import("./pages/teamDetails"));
const HubDetailsPage = lazy(() => import("./pages/hubDetails"));
const MyTeamsPage = lazy(() => import("./pages/myRegularTeams"));
const MyHubsPage = lazy(() => import("./pages/myHubs"));
const MyEventGroupsPage = lazy(() => import("./pages/myTeams"));
const TeamRequestsPage = lazy(() => import("./pages/teamRequests"));

const RouteFallback = () => (
  <div className="flex min-h-[240px] items-center justify-center px-4 py-10 text-sm font-medium text-slate-500">
    Loading page...
  </div>
);

const StudentRoutes = () => {
  return (
    <StudentLayout>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<StudentDashboard />} />
          <Route path="/my-group" element={<MyGroup />} />
          <Route path="/groups" element={<AllGroups />} />
          <Route path="/groups/:id" element={<GroupDetails />} />
          <Route path="/teams" element={<TeamsRegularPage />} />
          <Route path="/teams/:id" element={<TeamDetailsPage />} />
          <Route path="/hubs" element={<HubsPage />} />
          <Route path="/hubs/:id" element={<HubDetailsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:eventId" element={<EventGroupsPage />} />
          <Route path="/events/:eventId/groups/:groupId" element={<EventGroupDetailsPage />} />
          <Route path="/event/:eventId" element={<EventGroupsPage />} />
          <Route path="/event/:eventId/groups/:groupId" element={<EventGroupDetailsPage />} />
          <Route path="/event-groups" element={<Navigate to="/events" replace />} />
          <Route path="/my-teams" element={<MyTeamsPage />} />
          <Route path="/my-hubs" element={<MyHubsPage />} />
          <Route path="/my-event-groups" element={<MyEventGroupsPage />} />
          <Route path="/event-group-requests" element={<TeamRequestsPage />} />
          <Route path="/team-requests" element={<Navigate to="/event-group-requests" replace />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/eligibility" element={<EligibilityHistoryPage />} />
          <Route path="*" element={<Navigate to="/my-group" replace />} />
        </Routes>
      </Suspense>
    </StudentLayout>
  );
};

export default StudentRoutes;
