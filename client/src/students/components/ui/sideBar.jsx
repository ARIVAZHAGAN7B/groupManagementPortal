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
  { name: "Teams", path: "/teams", icon: Icons.GroupManagement },
  { name: "Hubs", path: "/hubs", icon: Icons.TeamManagement },
  { name: "My Teams", path: "/my-teams", icon: Icons.MembershipManagement },
  { name: "My Hubs", path: "/my-hubs", icon: Icons.TeamManagement },
  { name: "Events", path: "/events", icon: Icons.EventManagement },
  { name: "My Event Groups", path: "/my-event-groups", icon: Icons.EventManagement },
  { name: "Event Group Requests", path: "/event-group-requests", icon: Icons.EventManagement },
  { name: "Leaderboard", path: "/leaderboard", icon: Icons.Leaderboard },
  { name: "Eligibility", path: "/eligibility", icon: Icons.PhaseConfiguration },
];

const utilityItems = [
  { name: "Help & Support", icon: HelpOutlineRoundedIcon },
  { name: "Settings", icon: SettingsOutlinedIcon },
];

const SideBar = ({ onNavigate }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    [
      "group relative flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-none px-5 py-3 text-sm font-medium transition-[background-color,color,transform] duration-200 ease-out after:absolute after:right-0 after:top-0 after:h-full after:w-[4px] after:origin-bottom after:scale-y-0 after:bg-[#3211d4] after:transition-transform after:duration-200 after:ease-out after:content-['']",
      isActive
        ? "bg-[#3211d4]/12 font-bold text-[#2b0fb8] shadow-[inset_0_0_0_1px_rgba(50,17,212,0.08)] after:scale-y-100"
        : "text-slate-600 hover:bg-slate-100/80 hover:text-[#3211d4]",
    ].join(" ");

  const utilityButtonClass =
    "flex w-full cursor-pointer items-center gap-3 rounded-none px-5 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100/80 hover:text-[#3211d4]";

  const handleLogout = async () => {
    try {
      await logout?.();
    } finally {
      onNavigate?.();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="flex h-full flex-col">
      <nav className="pt-3">
        {menuItems.map(({ name, path, icon: Icon, end, badge }) => (
          <NavLink key={name} to={path} end={end} onClick={() => onNavigate?.()} className={linkClass}>
            {({ isActive }) => (
              <>
                <span
                  className={
                    isActive
                      ? "relative z-10 scale-105 text-[#2b0fb8] transition-all duration-200"
                      : "relative z-10 text-slate-500 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#3211d4]"
                  }
                >
                  <Icon fontSize="small" />
                </span>
                <span
                  className={
                    isActive
                      ? "relative z-10 truncate translate-x-0.5 transition-transform duration-200"
                      : "relative z-10 truncate transition-transform duration-200 group-hover:translate-x-0.5"
                  }
                >
                  {name}
                </span>
                {badge ? (
                  <span
                    className={[
                      "relative z-10 ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors duration-200",
                      isActive
                        ? "bg-[#3211d4]/12 text-[#2b0fb8]"
                        : "bg-slate-100 text-slate-600",
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

      <div className="mt-5 border-t border-slate-200 pt-5">
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
          className="flex w-full cursor-pointer items-center gap-3 rounded-none px-5 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
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
