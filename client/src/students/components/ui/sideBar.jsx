import React from "react";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { NavLink, useNavigate } from "react-router-dom";
import Icons from "../../../assets/Icons";
import { useAuth } from "../../../utils/AuthContext";

const studentMenuSections = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", path: "/", icon: Icons.Dashboard, end: true }
    ]
  },
  {
    title: "My Space",
    items: [
      { name: "My Group", path: "/my-group", icon: Icons.GroupManagement },
      { name: "My Teams", path: "/my-teams", icon: Icons.TeamManagement },
      { name: "My Hubs", path: "/my-hubs", icon: Icons.School },
      { name: "My Event Groups", path: "/my-event-groups", icon: Icons.EventManagement },
      { name: "My On-Duty", path: "/on-duty", icon: Icons.OnDuty }
    ]
  },
  {
    title: "Explore & Join",
    items: [
      { name: "All Groups", path: "/groups", icon: Icons.CreateGroup },
      { name: "All Teams", path: "/teams", icon: Icons.Explore },
      { name: "All Hubs", path: "/hubs", icon: Icons.TeamManagement },
      { name: "Events Calendar", path: "/events", icon: Icons.EventManagement }
    ]
  },
  {
    title: "Activity & Rankings",
    items: [
      { name: "Request Center", path: "/requests", icon: Icons.Requests },
      { name: "Leaderboard", path: "/leaderboard", icon: Icons.Leaderboard },
      { name: "Eligibility Points", path: "/eligibility", icon: Icons.Eligibility }
    ]
  }
];

const utilityItems = [
  { name: "Help & Support", path: "/support", icon: HelpOutlineRoundedIcon },
];

const SideBar = ({ onNavigate }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    [
      "group relative flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-none px-5 py-2.5 text-sm font-medium transition-[background-color,color,transform] duration-150 ease-out after:absolute after:right-0 after:top-0 after:h-full after:w-[3px] after:origin-bottom after:scale-y-0 after:bg-brand-600 after:transition-transform after:duration-150 after:ease-out after:content-['']",
      isActive
        ? "bg-brand-50/90 font-bold text-brand-700 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.1)] after:scale-y-100 dark:bg-brand-950/60 dark:text-brand-300"
        : "text-slate-600 hover:bg-slate-100/80 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200",
    ].join(" ");

  const utilityButtonClass =
    "flex w-full cursor-pointer items-center gap-3 rounded-none px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100/80 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200";

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
      <nav className="flex-1 space-y-3 pt-2">
        {studentMenuSections.map((section) => (
          <div key={section.title} className="space-y-0.5">
            <div className="px-5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {section.title}
            </div>
            {section.items.map(({ name, path, icon: Icon, end, badge }) => (
              <NavLink
                key={name}
                to={path}
                end={end}
                onClick={() => onNavigate?.()}
                className={linkClass}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={
                        isActive
                          ? "relative z-10 scale-105 text-brand-600 transition-all duration-150 dark:text-brand-400"
                          : "relative z-10 text-slate-400 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-brand-600 dark:text-slate-500 dark:group-hover:text-brand-400"
                      }
                    >
                      {Icon ? <Icon sx={{ fontSize: 18 }} /> : <span className="h-4 w-4 rounded-full bg-slate-300 dark:bg-slate-700" />}
                    </span>
                    <span
                      className={
                        isActive
                          ? "relative z-10 truncate translate-x-0.5 transition-transform duration-150"
                          : "relative z-10 truncate transition-transform duration-150 group-hover:translate-x-0.5"
                      }
                    >
                      {name}
                    </span>
                    {badge ? (
                      <span
                        className={[
                          "relative z-10 ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors duration-150",
                          isActive
                            ? "bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                        ].join(" ")}
                      >
                        {badge}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-slate-200 pt-3 pb-3 dark:border-slate-800">
        {utilityItems.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={name}
            to={path}
            onClick={() => onNavigate?.()}
            className={utilityButtonClass}
          >
            <span className="text-slate-400 dark:text-slate-500">
              {Icon ? <Icon sx={{ fontSize: 18 }} /> : <span className="h-4 w-4 rounded-full bg-slate-300 dark:bg-slate-700" />}
            </span>
            <span className="truncate">{name}</span>
          </NavLink>
        ))}

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full cursor-pointer items-center gap-3 rounded-none px-5 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
        >
          <span>
            <LogoutRoundedIcon sx={{ fontSize: 18 }} />
          </span>
          <span className="truncate">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default SideBar;
