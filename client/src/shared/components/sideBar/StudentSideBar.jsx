import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  DashboardIcon,
  UsersIcon,
  ExploreIcon,
  ScheduleIcon,
  TimerIcon,
  RankingsIcon,
  SettingsIcon,
  LogoutIcon,
  LogoIcon
} from "../../../assets/Icons";

const StudentSidebar = ({ user }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) return null;

  const menuItems = [
    { label: "Dashboard", icon: <DashboardIcon />, path: "/student/dashboard" },
    { label: "My Group", icon: <UsersIcon />, path: "/student/mygroup/members" },
    { label: "All Groups", icon: <ExploreIcon />, path: "/student/all-groups" },
    { label: "My Teams", icon: <UsersIcon />, path: "/student/my-teams" },
    { label: "Events", icon: <ScheduleIcon />, path: "/student/events" },
    { label: "Phase Eligibility", icon: <TimerIcon />, path: "/student/phase-eligibility" },
    { label: "Leaderboard", icon: <RankingsIcon />, path: "/student/leaderboard" },
  ];

  const phaseInfo = {
    number: 3,
    start: "Feb 10, 2024",
    end: "Feb 20, 2024 11:59 PM",
    remaining: "3D 4H",
  };

  return (
    <>
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        {/* Logo */}
        <div className="p-6 flex items-center justify-between lg:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center text-white">
              <LogoIcon />
            </div>
            <h1 className="font-bold text-lg text-blue-900">GM Portal</h1>
          </div>

          {/* Mobile Close */}
          <button
            className="lg:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
            onClick={() => setIsSidebarOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                  ? "bg-blue-50 border-l-4 border-blue-900 text-blue-900 font-semibold"
                  : "text-slate-600 hover:bg-slate-50"
                }`
              }
            >
              <span className="w-5 h-5">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Phase Info */}
        <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
              <span className="font-bold text-blue-900 text-sm">Phase {phaseInfo.number}</span>
            </div>
            <div className="text-xs text-slate-500">{phaseInfo.remaining} left</div>
          </div>
          <div className="text-[10px] text-slate-400 flex flex-col gap-1 mt-2">
            <span>Start: {phaseInfo.start}</span>
            <span>End: {phaseInfo.end}</span>
          </div>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-100 flex flex-col gap-4 mt-auto">
          <div className="flex items-center gap-3">
            <img src={user.avatar} className="w-8 h-8 rounded-full" alt="avatar" />
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 font-medium truncate">{user.rollNumber}</p>
            </div>
            <button className="text-slate-400 hover:text-blue-900 transition-colors">
              <SettingsIcon sx={{ fontSize: 18 }} />
            </button>
          </div>

          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 font-semibold border border-transparent hover:border-red-100">
            <LogoutIcon sx={{ fontSize: 20 }} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Hamburger Button for Mobile */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-white rounded-lg shadow-md"
        onClick={() => setIsSidebarOpen(true)}
      >
        <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  );
};

export default StudentSidebar;
