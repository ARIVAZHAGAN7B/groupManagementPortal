import { useEffect, useState } from "react";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { NavLink, useNavigate } from "react-router-dom";
import Icons from "../../../assets/Icons";
import { fetchAdminLeadershipNotifications } from "../../../service/leadershipRequests.api";
import { useAuth } from "../../../utils/AuthContext";

const menuSections = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", path: "/", icon: Icons.Dashboard, end: true }
    ]
  },
  {
    title: "Group Services",
    items: [
      { name: "Group Management", path: "/groups", icon: Icons.CreateGroup },
      { name: "Group Memberships", path: "/membership-management", icon: Icons.MembershipManagement },
      { name: "Eligibility", path: "/eligibility", icon: Icons.Leaderboard },
      { name: "Leadership Requests", path: "/leadership-management", icon: Icons.Notifications },
      { name: "Tier Changes", path: "/tier-management", icon: Icons.Leaderboard }
    ]
  },
  {
    title: "Phase Services",
    items: [
      { name: "Phase Configuration", path: "/phase-configuration", icon: Icons.PhaseConfiguration },
      { name: "Change Day", path: "/change-day-management", icon: Icons.PhaseConfiguration },
      { name: "Incubation Configuration", path: "/incubation-configuration", icon: Icons.IncubationConfiguration },
      { name: "Holiday Management", path: "/holiday-management", icon: Icons.HolidayManagement },
      { name: "Base Points", path: "/base-points", icon: Icons.Leaderboard }
    ]
  },
  {
    title: "Team Services",
    items: [
      { name: "Team Management", path: "/team-management", icon: Icons.TeamManagement },
      { name: "Team Memberships", path: "/team-membership-management", icon: Icons.MembershipManagement },
      { name: "Team Targets", path: "/team-target-management", icon: Icons.Leaderboard }
    ]
  },
  {
    title: "Event Services",
    items: [
      { name: "Event Management", path: "/event-management", icon: Icons.EventManagement },
      { name: "Event Groups", path: "/event-group-management", icon: Icons.EventManagement },
      { name: "Event Group Requests", path: "/event-join-requests", icon: Icons.EventManagement }
    ]
  },
  {
    title: "Admin Tools",
    items: [
      { name: "Student Management", path: "/student-management", icon: Icons.StudentManagement },
      { name: "Audit Logs", path: "/audit-logs", icon: Icons.AuditLogs }
    ]
  }
];

const utilityItems = [
  { name: "Help & Support", icon: HelpOutlineRoundedIcon },
  { name: "Settings", icon: SettingsOutlinedIcon, path: "/settings" },
];

const SideBar = ({ onNavigate }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [leadershipAttentionCount, setLeadershipAttentionCount] = useState(0);

  const linkClass = ({ isActive }) =>
    [
      "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
      isActive
        ? "bg-[#3211d4] text-white shadow-md shadow-[#3211d4]/20"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
    ].join(" ");

  const utilityButtonClass =
    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900";

  useEffect(() => {
    let mounted = true;

    const loadLeadershipNotifications = async () => {
      if (!["ADMIN", "SYSTEM_ADMIN"].includes(String(user?.role || "").toUpperCase())) {
        if (mounted) setLeadershipAttentionCount(0);
        return;
      }

      try {
        const data = await fetchAdminLeadershipNotifications();
        if (!mounted) return;
        setLeadershipAttentionCount(Number(data?.total_attention_count) || 0);
      } catch {
        if (!mounted) return;
        setLeadershipAttentionCount(0);
      }
    };

    loadLeadershipNotifications();
    const intervalId = setInterval(loadLeadershipNotifications, 30000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [user?.role]);

  const handleLogout = async () => {
    try {
      await logout?.();
    } finally {
      onNavigate?.();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="flex h-full flex-col p-4">
      <nav className="space-y-5">
        {menuSections.map(({ title, items }) => (
          <section key={title} className="space-y-1">
            <div className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              {title}
            </div>
            {items.map(({ name, path, icon: Icon, end }) => (
              <NavLink key={name} to={path} end={end} onClick={() => onNavigate?.()} className={linkClass}>
                {({ isActive }) => (
                  <>
                    <span className={isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"}>
                      <Icon fontSize="small" />
                    </span>
                    <span className="truncate">{name}</span>
                    {path === "/leadership-management" && leadershipAttentionCount > 0 ? (
                      <span
                        className={`ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-red-100 text-red-700"
                        }`}
                        title={`${leadershipAttentionCount} leadership alert${leadershipAttentionCount === 1 ? "" : "s"}`}
                      >
                        {leadershipAttentionCount}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            ))}
          </section>
        ))}
      </nav>

      <div className="mt-6 space-y-1 border-t border-slate-100 pt-6">
        {utilityItems.map(({ name, icon: Icon, path }) =>
          path ? (
            <NavLink
              key={name}
              to={path}
              onClick={() => onNavigate?.()}
              className={linkClass}
            >
              {({ isActive }) => (
                <>
                  <span className={isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"}>
                    <Icon fontSize="small" />
                  </span>
                  <span className="truncate">{name}</span>
                </>
              )}
            </NavLink>
          ) : (
            <button key={name} type="button" className={utilityButtonClass}>
              <span className="text-slate-500">
                <Icon fontSize="small" />
              </span>
              <span className="truncate">{name}</span>
            </button>
          )
        )}

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
