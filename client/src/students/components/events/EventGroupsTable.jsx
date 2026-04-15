import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AllGroupsBadge from "../allGroups/AllGroupsBadge";
import {
  formatLabel,
  formatMemberCount,
  formatShortDate
} from "../teams/teamPage.utils";
import {
  getEventGroupRequestStatus,
  getEventRegistrationMode
} from "./events.constants";

export default function EventGroupsTable({
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

  return (
    <div className="overflow-x-auto overflow-y-visible rounded-2xl">
      <table className="min-w-[1120px] w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
              {individualRegistration ? "Registered Participant" : "Registered Team"}
            </th>
            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Status</th>
            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Members</th>
            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Created</th>
            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">My Request</th>
            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Team Notes</th>
            <th className="sticky right-0 bg-slate-50 px-4 py-3 text-left font-semibold whitespace-nowrap shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.14)]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {loading ? (
            <tr>
              <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={7}>
                Loading registered teams...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={7}>
                No registered teams found for the current filters.
              </td>
            </tr>
          ) : (
            rows.map((team) => {
              const requestStatus = getEventGroupRequestStatus({
                latestRequestByTeamId,
                myTeamIdSet,
                teamId: team.team_id
              });

              return (
                <tr key={team.team_id} className="group hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{team.team_name || "-"}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {team.team_code || "No code"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <AllGroupsBadge value={formatLabel(team.status, "Unknown")} />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {formatMemberCount(team.active_member_count)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatShortDate(team.created_at)}</td>
                  <td className="px-4 py-3">
                    <AllGroupsBadge value={requestStatus.label} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="max-w-sm leading-6 text-slate-600">
                      {team.description || "No description added."}
                    </p>
                  </td>
                  <td className="sticky right-0 bg-white px-4 py-3 shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)] group-hover:bg-slate-50/80">
                    <button
                      type="button"
                      onClick={() => onView?.(team)}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#1754cf]/15 bg-[#1754cf]/8 px-3 py-1.5 text-sm font-semibold text-[#1754cf] transition hover:bg-[#1754cf]/12"
                    >
                      <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                      {individualRegistration ? "View Entry" : "View Team"}
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
