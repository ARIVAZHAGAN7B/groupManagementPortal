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
    title: "Command Center",
    items: [
      { name: "Dashboard", path: "/", icon: Icons.Dashboard, end: true },
      { name: "Audit Logs", path: "/audit-logs", icon: Icons.AuditLogs }
    ]
  },
  {
    title: "Student & Group Ops",
    items: [
      { name: "Group Directory", path: "/groups", icon: Icons.GroupManagement },
      { name: "Group Memberships", path: "/membership-management", icon: Icons.MembershipManagement },
      { name: "Student Roster", path: "/student-management", icon: Icons.StudentManagement },
      { name: "Leadership Requests", path: "/leadership-management", icon: Icons.Leadership },
      { name: "Tier Change Requests", path: "/tier-management", icon: Icons.Tier }
    ]
  },
  {
    title: "Activities & Events",
    items: [
      { name: "Team Management", path: "/team-management", icon: Icons.TeamManagement },
      { name: "Hub Management", path: "/hub-management", icon: Icons.School },
      { name: "Event Lifecycles", path: "/event-management", icon: Icons.EventManagement },
      { name: "Event Groups", path: "/event-group-management", icon: Icons.Explore },
      { name: "Event Join Requests", path: "/event-join-requests", icon: Icons.Requests },
      { name: "On-Duty Events", path: "/on-duty-management", icon: Icons.OnDuty },
      { name: "On-Duty Requests", path: "/on-duty-requests", icon: Icons.Badge },
      { name: "Team Targets", path: "/team-target-management", icon: Icons.Leaderboard }
    ]
  },
  {
    title: "Academic & Phase Engine",
    items: [
      { name: "Phase Planner & History", path: "/phase-history", icon: Icons.Timeline },
      { name: "Create Phase", path: "/phase-creation", icon: Icons.PhaseConfiguration },
      { name: "Eligibility & Multipliers", path: "/eligibility", icon: Icons.Eligibility },
      { name: "Base Points Rules", path: "/base-points", icon: Icons.BasePoints },
      { name: "Change Day Rules", path: "/change-day-management", icon: Icons.ChangeDay },
      { name: "Incubation Settings", path: "/incubation-configuration", icon: Icons.IncubationConfiguration },
      { name: "Holiday Calendar", path: "/holiday-management", icon: Icons.HolidayManagement }
    ]
  }
];

const utilityItems = [
  { name: "Help & Support", path: "/support", icon: HelpOutlineRoundedIcon },
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
      "group relative flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-none px-5 py-2.5 text-sm font-medium transition-[background-color,color,transform] duration-150 ease-out after:absolute after:right-0 after:top-0 after:h-full after:w-[3px] after:origin-bottom after:scale-y-0 after:bg-brand-600 after:transition-transform after:duration-150 after:ease-out after:content-['']",
      isActive
        ? "bg-brand-50/90 font-bold text-brand-700 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.1)] after:scale-y-100 dark:bg-brand-950/60 dark:text-brand-300"
        : "text-slate-600 hover:bg-slate-100/80 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200",
    ].join(" ");

  const utilityButtonClass =
    "flex w-full cursor-pointer items-center gap-3 rounded-none px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100/80 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200";

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
      <nav className="flex-1 space-y-2 pt-2">
        {menuSections.map(({ title, items }) => {
          const sectionIsOpen = openSections[title] ?? true;
          const hasActiveItem = items.some((item) =>
            isItemActive(location.pathname, item)
          );

          return (
            <section key={title} className="space-y-0.5">
              <button
                type="button"
                onClick={() => toggleSection(title)}
                className={`flex w-full cursor-pointer items-center justify-between px-5 py-1.5 text-left text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  hasActiveItem
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                }`}
                aria-expanded={sectionIsOpen}
              >
                <span>{title}</span>
                <KeyboardArrowDownRoundedIcon
                  sx={{ fontSize: 16 }}
                  className={`transform transition-transform duration-200 ${
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
                          {path === "/leadership-management" && leadershipAttentionCount > 0 ? (
                            <span
                              className={`relative z-10 ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold transition-colors duration-150 ${
                                isActive
                                  ? "bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300"
                                  : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
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

      <div className="mt-auto border-t border-slate-200 pt-3 pb-3 dark:border-slate-800">
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
                </>
              )}
            </NavLink>
          ) : (
            <button key={name} type="button" className={utilityButtonClass}>
              <span className="text-slate-400 dark:text-slate-500">
                {Icon ? <Icon sx={{ fontSize: 18 }} /> : <span className="h-4 w-4 rounded-full bg-slate-300 dark:bg-slate-700" />}
              </span>
              <span className="truncate">{name}</span>
            </button>
          )
        )}

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
