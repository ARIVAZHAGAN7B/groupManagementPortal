import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";
import AuditLogs from "./pages/AuditLogs";
import CreateGroup from "./pages/CreateGroup";
import EventManagement from "./pages/EventManagement";
import GroupManagement from "./pages/groupManagement";
import IncubationConfiguration from "./pages/IncubationConfiguration";
import MembershipManagement from "./pages/membershipManagement";
import PhaseConfiguration from "./pages/phaseConfiguration";
import StudentManagement from "./pages/studentManagement";
import BasePointsManagement from "./pages/basePointsManagement";
import TeamManagement from "./pages/TeamManagement";
import EligibilityManagement from "./pages/eligibilityManagement";
import EventJoinRequestManagement from "./pages/eventJoinRequestManagement";
import AdminLayout from "./components/layout/adminLayout";
import GroupManagementPage from "./pages/groups/GroupManagementPage";
import CreateGroupPage from "./pages/groups/CreateGroupPage";
import EditGroupPage from "./pages/groups/EditGroupPage";
import GroupDetailsPage from "./pages/groups/GroupDetailsPage";

const AdminRoutes = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="/create-group" element={<CreateGroup />} />
              <Route path="/groups" element={<GroupManagementPage />} />
      <Route path="/groups/new" element={<CreateGroupPage />} />
      <Route path="/groups/:id" element={<GroupDetailsPage />} />
      <Route path="/groups/:id/edit" element={<EditGroupPage />} />
         <Route path="/event-management" element={<EventManagement />} />
      <Route path="/group-management" element={<GroupManagement />} />
      <Route path="/incubation-configuration" element={<IncubationConfiguration />} />
      <Route path="/membership-management" element={<MembershipManagement />} />
      <Route path="/phase-configuration" element={<PhaseConfiguration />} />
      <Route path="/eligibility" element={<EligibilityManagement />} />
      <Route path="/student-management" element={<StudentManagement />} />
      <Route path="/base-points" element={<BasePointsManagement />} />
      <Route path="/team-management" element={<TeamManagement />} />
      <Route path="/event-join-requests" element={<EventJoinRequestManagement />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminRoutes;
