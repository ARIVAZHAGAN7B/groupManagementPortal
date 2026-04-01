import { useEffect, useState } from "react";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import Icons from "../../../assets/Icons";
import { useDebouncedCallback } from "../../../hooks/useDebouncedCallback";
import { useRealtimeEvents } from "../../../hooks/useRealtimeEvents";
import { REALTIME_EVENTS } from "../../../lib/realtime";
import { useGetAdminNotificationsQuery } from "../../../store/api/sharedApi";
import { useAuth } from "../../../utils/AuthContext";

const ADMIN_SIDEBAR_SECTION_STATE_KEY = "gmp.admin.sidebar.sections";

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
      { name: "Phase Creation", path: "/phase-creation", icon: Icons.PhaseConfiguration },
      { name: "All Phases", path: "/phase-history", icon: Icons.PhaseConfiguration },
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
    title: "Hub Services",
    items: [
      { name: "Hub Management", path: "/hub-management", icon: Icons.TeamManagement },
      { name: "Hub Memberships", path: "/hub-membership-management", icon: Icons.MembershipManagement }
    ]
  },
  {
    title: "Event Services",
    items: [
      { name: "Event Management", path: "/event-management", icon: Icons.EventManagement },
      { name: "Event Groups", path: "/event-group-management", icon: Icons.EventManagement },
      { name: "Event Group Memberships", path: "/event-group-membership-management", icon: Icons.MembershipManagement },
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

const getDefaultSectionState = () =>
  menuSections.reduce((acc, section) => {
    acc[section.title] = true;
    return acc;
  }, {});

const getInitialSectionState = () => {
  const defaults = getDefaultSectionState();

  if (typeof window === "undefined") return defaults;

  try {
    const rawValue = window.localStorage.getItem(ADMIN_SIDEBAR_SECTION_STATE_KEY);
    if (!rawValue) return defaults;

    const parsedValue = JSON.parse(rawValue);
    if (!parsedValue || typeof parsedValue !== "object") return defaults;

    return {
      ...defaults,
      ...Object.fromEntries(
        Object.entries(parsedValue).filter(([, value]) => typeof value === "boolean")
      ),
    };
  } catch {
    return defaults;
  }
};

const isItemActive = (pathname, item) => {
  if (item.end || item.path === "/") {
    return pathname === item.path;
  }

  return pathname === item.path || pathname.startsWith(`${item.path}/`);
};

const SideBar = ({ onNavigate }) => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState(getInitialSectionState);
  const notificationsQuery = useGetAdminNotificationsQuery(
    { userId: user?.userId, userRole: user?.role },
    { skip: !user?.userId }
  );
  const leadershipAttentionCount =
    Number(notificationsQuery.data?.leadership?.total_attention_count) || 0;
  const handleNotificationRefresh = useDebouncedCallback(() => {
    if (!user?.userId) return;

    void notificationsQuery.refetch();
  }, 250);

  const linkClass = ({ isActive }) =>
    [
      "group relative flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-none px-5 py-3 text-sm font-medium transition-[background-color,color,transform] duration-200 ease-out after:absolute after:right-0 after:top-0 after:h-full after:w-[4px] after:origin-bottom after:scale-y-0 after:bg-[#3211d4] after:transition-transform after:duration-200 after:ease-out after:content-['']",
      isActive
        ? "bg-[#3211d4]/12 font-bold text-[#2b0fb8] shadow-[inset_0_0_0_1px_rgba(50,17,212,0.08)] after:scale-y-100"
        : "text-slate-600 hover:bg-slate-100/80 hover:text-[#3211d4]",
    ].join(" ");

  const utilityButtonClass =
    "flex w-full cursor-pointer items-center gap-3 rounded-none px-5 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100/80 hover:text-[#3211d4]";

  useRealtimeEvents(REALTIME_EVENTS.ADMIN_NOTIFICATIONS, handleNotificationRefresh);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      ADMIN_SIDEBAR_SECTION_STATE_KEY,
      JSON.stringify(openSections)
    );
  }, [openSections]);

  const toggleSection = (title) => {
    setOpenSections((current) => ({
      ...current,
      [title]: !current[title],
    }));
  };

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
      <nav className="space-y-5 pt-3">
        {menuSections.map(({ title, items }) => {
          const sectionIsActive = items.some((item) => isItemActive(location.pathname, item));
          const sectionIsOpen = Boolean(openSections[title]);

          return (
          <section key={title} className="space-y-1">
            <button
              type="button"
              onClick={() => toggleSection(title)}
              className={`flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] transition-colors ${
                sectionIsActive
                  ? sectionIsOpen
                    ? "bg-[#3211d4]/8 text-[#3211d4]"
                    : "border-r-[4px] border-[#3211d4] bg-[#3211d4]/8 text-[#3211d4]"
                  : "text-slate-400 hover:bg-slate-100/60 hover:text-slate-600"
              }`}
              aria-expanded={sectionIsOpen}
            >
              <span>{title}</span>
              <KeyboardArrowDownRoundedIcon
                sx={{ fontSize: 18 }}
                className={`transition-transform duration-200 ${
                  sectionIsOpen ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>

            {sectionIsOpen
              ? items.map(({ name, path, icon: Icon, end }) => (
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
                        {path === "/leadership-management" && leadershipAttentionCount > 0 ? (
                          <span
                            className={`relative z-10 ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold transition-colors duration-200 ${
                              isActive
                                ? "bg-[#3211d4]/12 text-[#2b0fb8]"
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
                ))
              : null}
          </section>
        );
        })}
      </nav>

      <div className="mt-6 border-t border-slate-200 pt-6">
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
