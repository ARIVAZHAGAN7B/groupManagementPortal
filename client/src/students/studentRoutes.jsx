import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import StudentDashboard from "./pages/StudentDashboard";
import MyGroup from "./pages/myGroup";
import StudentLayout from "./components/layout/studentLayout";
import AllGroups from "./pages/allGroups";
import GroupDetails from "./pages/groupDetails";
import LeaderboardPage from "./pages/leaderboard";
import EligibilityHistoryPage from "./pages/eligibilityHistory";
import TeamsPage from "./pages/teams";
import TeamsRegularPage from "./pages/teamsRegular";
import MyTeamsPage from "./pages/myTeams";
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
      <Route path="/event-groups" element={<TeamsPage />} />
      <Route path="/my-event-groups" element={<MyTeamsPage />} />
      <Route path="/event-group-requests" element={<TeamRequestsPage />} />
      <Route path="/my-teams" element={<Navigate to="/my-event-groups" replace />} />
      <Route path="/team-requests" element={<Navigate to="/event-group-requests" replace />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/eligibility" element={<EligibilityHistoryPage />} />
      <Route path="*" element={<Navigate to="/my-group" replace />} />
    </Routes>
    </StudentLayout>
  );
};

export default StudentRoutes;
