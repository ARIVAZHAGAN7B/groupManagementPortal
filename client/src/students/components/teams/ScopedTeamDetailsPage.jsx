import { useCallback, useEffect, useMemo, useState } from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useNavigate, useParams } from "react-router-dom";
import AllGroupsBadge from "../allGroups/AllGroupsBadge";
import TeamPageDetailTile from "./TeamPageDetailTile";
import {
  fetchMyTeamMemberships,
  fetchTeamById,
  fetchTeamMemberships
} from "../../../service/teams.api";
import {
  formatDateTime,
  formatLabel,
  formatMemberCount,
  formatShortDate
} from "./teamPage.utils";
import { getTeamScopeConfig } from "./teamScope.constants";

function MemberCard({ row }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-slate-900">{row.student_name || "-"}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{row.student_email || "-"}</p>
        </div>
        <AllGroupsBadge value={formatLabel(row.role, "Member")} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TeamPageDetailTile label="Student ID" value={row.student_id || "-"} />
        <TeamPageDetailTile label="Joined" value={formatShortDate(row.join_date)} />
      </div>
    </article>
  );
}

export default function ScopedTeamDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const scope = useMemo(() => getTeamScopeConfig(), []);
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [myMembership, setMyMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [teamRow, teamMembers, myMemberships] = await Promise.all([
        fetchTeamById(id),
        fetchTeamMemberships(id, { status: "ACTIVE" }),
        fetchMyTeamMemberships({ status: "ACTIVE", team_type: scope.teamType })
      ]);

      if (!teamRow || String(teamRow.team_type || "").toUpperCase() !== scope.teamType) {
        throw new Error(`${scope.singularLabel} not found`);
      }

      setTeam(teamRow);
      setMembers(Array.isArray(teamMembers) ? teamMembers : []);

      const memberships = Array.isArray(myMemberships?.memberships) ? myMemberships.memberships : [];
      setMyMembership(
        memberships.find((row) => Number(row.team_id) === Number(teamRow.team_id)) || null
      );
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || `Failed to load ${scope.singularLower}`
      );
      setTeam(null);
      setMembers([]);
      setMyMembership(null);
    } finally {
      setLoading(false);
    }
  }, [id, scope.singularLabel, scope.singularLower, scope.teamType]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
          Loading {scope.singularLower} details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
          {scope.singularLabel} not found.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 md:px-6">
      <section className="relative overflow-hidden rounded-2xl border border-[#1754cf]/10 bg-[#1754cf]/5 p-8">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-[#1754cf]">
              {scope.detailsEyebrow}
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {scope.detailsTitle}
            </h1>
            <p className="mt-2 text-xl font-bold text-slate-900">{team.team_name || "-"}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-[#1754cf]">
                {team.team_code || "No code"}
              </span>
              <AllGroupsBadge value={formatLabel(team.status, "Unknown")} />
              {myMembership ? (
                <span className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
                  My Role: {formatLabel(myMembership.role, "Member")}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(scope.membershipPath)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
              Back
            </button>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
            >
              <RefreshRoundedIcon sx={{ fontSize: 18 }} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <TeamPageDetailTile
            label="Active Members"
            value={formatMemberCount(team.active_member_count)}
            subtext={`${members.length} loaded in roster`}
          />
          <TeamPageDetailTile
            label="Created"
            value={formatShortDate(team.created_at)}
            subtext={formatDateTime(team.created_at)}
          />
          <TeamPageDetailTile
            label="Updated"
            value={formatShortDate(team.updated_at)}
            subtext={formatDateTime(team.updated_at)}
          />
          <TeamPageDetailTile
            label="Membership"
            value={myMembership ? formatLabel(myMembership.status, "Unknown") : "Not joined"}
            subtext={
              myMembership?.join_date
                ? `Joined ${formatShortDate(myMembership.join_date)}`
                : `No active ${scope.singularLower} membership found`
            }
          />
        </div>

        <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-[#1754cf]/10 blur-3xl" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
          Overview
        </p>
        <h2 className="mt-2 text-xl font-bold text-slate-900">{scope.singularLabel} Summary</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <TeamPageDetailTile label="Type" value={formatLabel(team.team_type, scope.singularLabel)} />
          <TeamPageDetailTile label="Status" value={formatLabel(team.status, "Unknown")} />
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Description
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {team.description || `No description added for this ${scope.singularLower}.`}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">{scope.membersModalTitle}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Active members currently assigned to this {scope.singularLower}.
          </p>
        </div>

        {members.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">
            {scope.emptyMembersState}
          </div>
        ) : (
          <>
            <div className="grid gap-3 p-4 md:hidden">
              {members.map((row) => (
                <MemberCard
                  key={row.team_membership_id || `${row.student_id}-${row.join_date}`}
                  row={row}
                />
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-[860px] w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                      Student
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                      Email
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                      Role
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                      Status
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {members.map((row) => (
                    <tr
                      key={row.team_membership_id || `${row.student_id}-${row.join_date}`}
                      className="hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{row.student_name || "-"}</div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          ID: {row.student_id || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.student_email || "-"}</td>
                      <td className="px-4 py-3">
                        <AllGroupsBadge value={formatLabel(row.role, "Member")} />
                      </td>
                      <td className="px-4 py-3">
                        <AllGroupsBadge value={formatLabel(row.status, "Unknown")} />
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatDateTime(row.join_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
