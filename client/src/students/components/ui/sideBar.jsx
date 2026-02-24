import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { NavLink, useNavigate } from "react-router-dom";
import Icons from "../../../assets/Icons";
import { useAuth } from "../../../utils/AuthContext";

const menuItems = [
  { name: "Dashboard", path: "/", icon: Icons.Dashboard, end: true },
  { name: "My Group", path: "/my-group", icon: Icons.AuditLogs },
  { name: "All Groups", path: "/groups", icon: Icons.CreateGroup },
  { name: "Teams", path: "/teams", icon: Icons.TeamManagement },
  { name: "My Teams", path: "/my-teams", icon: Icons.TeamManagement },
  { name: "Team Requests", path: "/team-requests", icon: Icons.EventManagement, badge: "3" },
  { name: "Leaderboard", path: "/leaderboard", icon: Icons.Leaderboard },
  { name: "Eligibility", path: "/eligibility", icon: Icons.PhaseConfiguration },
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
        {menuItems.map(({ name, path, icon: Icon, end, badge }) => (
          <NavLink key={name} to={path} end={end} className={linkClass}>
            {({ isActive }) => (
              <>
                <span className={isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"}>
                  <Icon fontSize="small" />
                </span>
                <span className="truncate">{name}</span>
                {badge ? (
                  <span
                    className={[
                      "ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold",
                      isActive ? "bg-white/20 text-white" : "bg-[#3211d4]/10 text-[#3211d4]",
                    ].join(" ")}
                  >
                    {badge}
                  </span>
                ) : null}
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
