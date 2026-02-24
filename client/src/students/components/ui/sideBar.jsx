// src/ui/sideBar.jsx
import { NavLink } from "react-router-dom";
import Icons from "../../../assets/Icons";

const menuItems = [
  { name: "Dashboard", path: "/", icon: Icons.Dashboard, end: true },
  { name: "My Group", path: "/my-group", icon: Icons.AuditLogs },
  { name: "All Groups", path: "/groups", icon: Icons.CreateGroup },
  { name: "Teams", path: "/teams", icon: Icons.TeamManagement },
  { name: "My Teams", path: "/my-teams", icon: Icons.TeamManagement },
  { name: "Team Requests", path: "/team-requests", icon: Icons.EventManagement },
  { name: "Leaderboard", path: "/leaderboard", icon: Icons.Leaderboard },
  { name: "Eligibility", path: "/eligibility", icon: Icons.PhaseConfiguration },
];

const SideBar = () => {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-semibold transition
     ${
       isActive
         ? "bg-blue-100 text-blue-700"
         : "text-gray-800 hover:bg-gray-200"
     }`;

  return (
    <div className="p-4">
      <nav>
        <ul className="space-y-2">
          {menuItems.map(({ name, path, icon: Icon, end }) => (
            <li key={name}>
              <NavLink to={path} end={end} className={linkClass}>
                <Icon fontSize="small" />
                <span className="truncate">{name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default SideBar;
