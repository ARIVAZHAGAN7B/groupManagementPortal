// src/assets/Icons.jsx
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AddBoxIcon from "@mui/icons-material/AddBox";
import GroupsIcon from "@mui/icons-material/Groups";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import SchoolIcon from "@mui/icons-material/School";
import HubIcon from "@mui/icons-material/Hub";
import EventIcon from "@mui/icons-material/Event";
import SettingsIcon from "@mui/icons-material/Settings";
import ScienceIcon from "@mui/icons-material/Science";

import PersonIcon from "@mui/icons-material/Person";
import NotificationsIcon from "@mui/icons-material/Notifications";
import TimerIcon from "@mui/icons-material/Timer";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";

const Icons = {
  // sidebar
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

  // header/footer extras (MUST exist)
  School: SchoolIcon,
  Person: PersonIcon,
  Notifications: NotificationsIcon,
  Timer: TimerIcon,
  Settings: SettingsIcon,
  Leaderboard: LeaderboardIcon,
};

export default Icons;
