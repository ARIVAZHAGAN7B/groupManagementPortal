// src/assets/Icons.jsx
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AddBoxIcon from "@mui/icons-material/AddBox";
import GroupsIcon from "@mui/icons-material/Groups";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import SchoolIcon from "@mui/icons-material/School";
import HubIcon from "@mui/icons-material/Hub";
import EventIcon from "@mui/icons-material/Event";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SettingsIcon from "@mui/icons-material/Settings";
import ScienceIcon from "@mui/icons-material/Science";
import PersonIcon from "@mui/icons-material/Person";
import NotificationsIcon from "@mui/icons-material/Notifications";
import TimerIcon from "@mui/icons-material/Timer";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import TimelineIcon from "@mui/icons-material/Timeline";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import StarsIcon from "@mui/icons-material/Stars";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import BadgeIcon from "@mui/icons-material/Badge";
import ExploreIcon from "@mui/icons-material/Explore";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import HandshakeIcon from "@mui/icons-material/Handshake";

const Icons = {
  // Sidebar standard
  Dashboard: DashboardIcon,
  AuditLogs: AssignmentIcon,
  CreateGroup: AddBoxIcon,
  GroupManagement: GroupsIcon,
  MembershipManagement: HowToRegIcon,
  StudentManagement: SchoolIcon,
  TeamManagement: HubIcon,
  EventManagement: EventIcon,
  PhaseConfiguration: SettingsIcon,
  IncubationConfiguration: ScienceIcon,
  HolidayManagement: CalendarMonthIcon,

  // Semantic feature additions
  Timeline: TimelineIcon,
  Tier: MilitaryTechIcon,
  BasePoints: StarsIcon,
  Eligibility: CheckCircleOutlineIcon,
  Leadership: VolunteerActivismIcon,
  OnDuty: BadgeIcon,
  Badge: BadgeIcon,
  Explore: ExploreIcon,
  MySpace: BookmarkBorderIcon,
  ChangeDay: SwapHorizIcon,
  Requests: HandshakeIcon,

  // Header/footer extras (MUST exist)
  School: SchoolIcon,
  Person: PersonIcon,
  Notifications: NotificationsIcon,
  Timer: TimerIcon,
  Settings: SettingsIcon,
  Leaderboard: LeaderboardIcon,
};

export default Icons;
