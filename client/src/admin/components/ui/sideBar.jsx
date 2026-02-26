import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { NavLink, useNavigate } from "react-router-dom";
import Icons from "../../../assets/Icons";
import { useAuth } from "../../../utils/AuthContext";

const menuItems = [
  { name: "Dashboard", path: "/", icon: Icons.Dashboard, end: true },
  { name: "Audit Logs", path: "/audit-logs", icon: Icons.AuditLogs },
  { name: "Group", path: "/groups", icon: Icons.CreateGroup },
  { name: "Membership Management", path: "/membership-management", icon: Icons.MembershipManagement },
  { name: "Student Management", path: "/student-management", icon: Icons.StudentManagement },
  { name: "Base Points", path: "/base-points", icon: Icons.Leaderboard },
  { name: "Team Management", path: "/team-management", icon: Icons.TeamManagement },
  { name: "Event Join Requests", path: "/event-join-requests", icon: Icons.EventManagement },
  { name: "Leadership Management", path: "/leadership-management", icon: Icons.Notifications },
  { name: "Event Management", path: "/event-management", icon: Icons.EventManagement },
  { name: "Phase Configuration", path: "/phase-configuration", icon: Icons.PhaseConfiguration },
  { name: "Change Day", path: "/change-day-management", icon: Icons.PhaseConfiguration },
  { name: "Eligibility", path: "/eligibility", icon: Icons.Leaderboard },
  { name: "Incubation Configuration", path: "/incubation-configuration", icon: Icons.IncubationConfiguration },
];

const utilityItems = [
  { name: "Help & Support", icon: HelpOutlineRoundedIcon },
  { name: "Settings", icon: SettingsOutlinedIcon },
];

const SideBar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    [
      "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
      isActive
        ? "bg-[#3211d4] text-white shadow-md shadow-[#3211d4]/20"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
    ].join(" ");

  const utilityButtonClass =
    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900";

  const handleLogout = async () => {
    try {
      await logout?.();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="flex h-full flex-col p-4">
      <nav className="space-y-1">
        {menuItems.map(({ name, path, icon: Icon, end }) => (
          <NavLink key={name} to={path} end={end} className={linkClass}>
            {({ isActive }) => (
              <>
                <span className={isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"}>
                  <Icon fontSize="small" />
                </span>
                <span className="truncate">{name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 space-y-1 border-t border-slate-100 pt-6">
        {utilityItems.map(({ name, icon: Icon }) => (
          <button key={name} type="button" className={utilityButtonClass}>
            <span className="text-slate-500">
              <Icon fontSize="small" />
            </span>
            <span className="truncate">{name}</span>
          </button>
        ))}

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
        >
          <span>
            <LogoutRoundedIcon fontSize="small" />
          </span>
          <span className="truncate">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default SideBar;
