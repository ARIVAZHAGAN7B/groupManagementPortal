// src/ui/sideBar.jsx
import { NavLink } from "react-router-dom";
import Icons from "../../../assets/Icons";

const menuItems = [
  { name: "Dashboard", path: "/", icon: Icons.Dashboard, end: true },
  { name: "Audit Logs", path: "/audit-logs", icon: Icons.AuditLogs },
  { name: "Group", path: "/groups", icon: Icons.CreateGroup },
  { name: "Membership Management", path: "/membership-management", icon: Icons.MembershipManagement },
  { name: "Student Management", path: "/student-management", icon: Icons.StudentManagement },
  { name: "Base Points", path: "/base-points", icon: Icons.Leaderboard },
  { name: "Team Management", path: "/team-management", icon: Icons.TeamManagement },
  { name: "Event Join Requests", path: "/event-join-requests", icon: Icons.EventManagement },
  { name: "Event Management", path: "/event-management", icon: Icons.EventManagement },
  { name: "Phase Configuration", path: "/phase-configuration", icon: Icons.PhaseConfiguration },
  { name: "Eligibility", path: "/eligibility", icon: Icons.Leaderboard },
  { name: "Incubation Configuration", path: "/incubation-configuration", icon: Icons.IncubationConfiguration },
];

const SideBar = () => {
  const linkClass = ({ isActive }) =>
    `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
     ${
       isActive
         ? "bg-blue-50 text-blue-700"
         : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
     }`;

  return (
    <div className="px-3 py-4">
      <nav>
        <ul className="space-y-0.5">
          {menuItems.map(({ name, path, icon: Icon, end }) => (
            <li key={name}>
              <NavLink to={path} end={end} className={linkClass}>
                {({ isActive }) => (
                  <>
                    <span className={`flex-shrink-0 transition-colors ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}>
                      <Icon fontSize="small" />
                    </span>
                    <span className="truncate">{name}</span>
                    {isActive && (
                      <span className="ml-auto w-1 h-4 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default SideBar;
