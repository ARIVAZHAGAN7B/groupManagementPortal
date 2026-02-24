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
      <Route path="/teams" element={<TeamsPage />} />
      <Route path="/my-teams" element={<MyTeamsPage />} />
      <Route path="/team-requests" element={<TeamRequestsPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/eligibility" element={<EligibilityHistoryPage />} />
      <Route path="*" element={<Navigate to="/my-group" replace />} />
    </Routes>
    </StudentLayout>
  );
};

export default StudentRoutes;
