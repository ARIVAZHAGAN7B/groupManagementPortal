import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import StudentDashboard from "./pages/StudentDashboard";
import MyGroup from "./pages/myGroup";
import StudentLayout from "./components/layout/studentLayout";
import AllGroups from "./pages/allGroups";
import GroupDetails from "./pages/groupDetails";
import LeaderboardPage from "./pages/leaderboard";
import EligibilityHistoryPage from "./pages/eligibilityHistory";
import EventsPage from "./pages/events";
import EventGroupsPage from "./pages/eventGroups";
import EventGroupDetailsPage from "./pages/eventGroupDetails";
import TeamsRegularPage from "./pages/teamsRegular";
import HubsPage from "./pages/hubs";
import TeamDetailsPage from "./pages/teamDetails";
import HubDetailsPage from "./pages/hubDetails";
import MyTeamsPage from "./pages/myRegularTeams";
import MyHubsPage from "./pages/myHubs";
import MyEventGroupsPage from "./pages/myTeams";
import TeamRequestsPage from "./pages/teamRequests";

const StudentRoutes = () => {
  return (
    <StudentLayout>
    <Routes>
      <Route path="/" element={<StudentDashboard/>} />
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
    </StudentLayout>
  );
};

export default StudentRoutes;
