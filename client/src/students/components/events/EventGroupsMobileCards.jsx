import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AllGroupsBadge from "../allGroups/AllGroupsBadge";
import TeamPageDetailTile from "../teams/TeamPageDetailTile";
import {
  formatLabel,
  formatMemberCount,
  formatShortDate
} from "../teams/teamPage.utils";
import {
  getEventGroupRequestStatus,
  getEventRegistrationMode
} from "./events.constants";

export default function EventGroupsMobileCards({
  rows = [],
  loading = false,
  latestRequestByTeamId,
  myTeamIdSet,
  onView,
  registrationMode = "TEAM"
}) {
  const individualRegistration = getEventRegistrationMode({
    registration_mode: registrationMode
  }) === "INDIVIDUAL";

  if (loading) {
    return (
      <div className="px-4 py-12 text-center text-sm text-slate-500">
        Loading registered teams...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-slate-500">
        No registered teams found for the current filters.
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 lg:hidden">
      {rows.map((team) => {
        const requestStatus = getEventGroupRequestStatus({
          latestRequestByTeamId,
          myTeamIdSet,
          teamId: team.team_id
        });

        return (
          <article
            key={team.team_id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-slate-900">
                  {team.team_name || "-"}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">{team.team_code || "No code"}</p>
              </div>
              <AllGroupsBadge value={formatLabel(team.status, "Unknown")} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <AllGroupsBadge value={requestStatus.label} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TeamPageDetailTile
                label="Members"
                value={formatMemberCount(team.active_member_count)}
              />
              <TeamPageDetailTile
                label="Created"
                value={formatShortDate(team.created_at)}
              />
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Team Notes
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {team.description || "No description added."}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onView?.(team)}
                className="inline-flex items-center gap-2 rounded-lg border border-[#1754cf]/15 bg-[#1754cf]/8 px-3.5 py-2 text-sm font-semibold text-[#1754cf] transition hover:bg-[#1754cf]/12"
              >
                <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                {individualRegistration ? "View Entry" : "View Team"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
