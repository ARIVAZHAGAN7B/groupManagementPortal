export const TEAM_STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "FROZEN", "ARCHIVED"];

export const TEAM_SCOPE_CONFIG = {
  teamType: "TEAM",
  title: "Teams",
  myTitle: "My Teams",
  detailsTitle: "Team Details",
  singularLabel: "Team",
  singularLower: "team",
  pluralLower: "teams",
  membershipPath: "/my-teams",
  detailsBasePath: "/teams",
  discoveryEyebrow: "Team Discovery",
  membershipEyebrow: "Membership Overview",
  detailsEyebrow: "Team Workspace",
  searchPlaceholder: "Search by code, name, status, or description",
  joinBusyLabel: "Joining...",
  joinTitle: "Join team",
  joinDisabledTitle: "Only active teams can be joined",
  joinConfirmLabel: "Join team",
  joinedDetail: "Teams you already belong to",
  emptyDirectoryState: "No teams found for the current filters.",
  emptyMembershipState: "No team memberships found for the current filters.",
  emptyMembersState: "No active team members found.",
  membersModalTitle: "Team Members",
  viewMembersTitle: "View team members",
  leaveLabel: "Leave Team",
  leaveBusyLabel: "Leaving..."
};

export const getTeamScopeConfig = () => TEAM_SCOPE_CONFIG;
