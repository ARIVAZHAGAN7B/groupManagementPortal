const normalizeKey = (value) => String(value || "").trim().toUpperCase();

export const TEAM_STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "FROZEN", "ARCHIVED"];

export const TEAM_SCOPE_CONFIG = {
  TEAM: {
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
  },
  HUB: {
    teamType: "HUB",
    title: "Hubs",
    myTitle: "My Hubs",
    detailsTitle: "Hub Details",
    singularLabel: "Hub",
    singularLower: "hub",
    pluralLower: "hubs",
    membershipPath: "/my-hubs",
    detailsBasePath: "/hubs",
    discoveryEyebrow: "Hub Discovery",
    membershipEyebrow: "Membership Overview",
    detailsEyebrow: "Hub Workspace",
    searchPlaceholder: "Search by code, name, status, or description",
    joinBusyLabel: "Joining...",
    joinTitle: "Join hub",
    joinDisabledTitle: "Only active hubs can be joined",
    joinConfirmLabel: "Join hub",
    joinedDetail: "Hubs you already belong to",
    emptyDirectoryState: "No hubs found for the current filters.",
    emptyMembershipState: "No hub memberships found for the current filters.",
    emptyMembersState: "No active hub members found.",
    membersModalTitle: "Hub Members",
    viewMembersTitle: "View hub members",
    leaveLabel: "Leave Hub",
    leaveBusyLabel: "Leaving..."
  }
};

export const getTeamScopeConfig = (teamType) =>
  TEAM_SCOPE_CONFIG[normalizeKey(teamType)] || TEAM_SCOPE_CONFIG.TEAM;
