import { useCallback, useEffect, useMemo, useState } from "react";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AllGroupsBadge from "../components/allGroups/AllGroupsBadge";
import {
  TeamDesktopTableShell,
  TeamTableSearchField,
  TeamTableSelectField
} from "../components/teams/TeamDesktopTableControls";
import TeamMembersPreviewModal from "../components/teams/TeamMembersPreviewModal";
import TeamPageDetailTile from "../components/teams/TeamPageDetailTile";
import TeamPageFilters from "../components/teams/TeamPageFilters";
import TeamPageHero from "../components/teams/TeamPageHero";
import {
  fetchMyTeamMemberships,
  fetchTeamMemberships,
  fetchTeams,
  joinTeam
} from "../../service/teams.api";
import {
  formatLabel,
  formatMemberCount,
  formatShortDate,
  getUniqueCount
} from "../components/teams/teamPage.utils";

const inputClassName =
  "w-full rounded-2xl border border-slate-300 bg-[#f3f4f6] px-4 py-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10";

const selectClassName =
  "w-full rounded-2xl border border-slate-300 bg-[#f3f4f6] px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10";

export default function TeamsRegularPage() {
  const [teams, setTeams] = useState([]);
  const [myMemberships, setMyMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [busyTeamId, setBusyTeamId] = useState(null);
  const [viewTeam, setViewTeam] = useState(null);
  const [viewMembers, setViewMembers] = useState([]);
  const [viewMembersLoading, setViewMembersLoading] = useState(false);
  const [viewMembersError, setViewMembersError] = useState("");
  const [viewBusyTeamId, setViewBusyTeamId] = useState(null);

  const loadBase = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [teamRows, membershipRes] = await Promise.all([
        fetchTeams({ exclude_team_type: "EVENT" }),
        fetchMyTeamMemberships({ status: "ACTIVE", exclude_team_type: "EVENT" })
      ]);

      setTeams(Array.isArray(teamRows) ? teamRows : []);
      setMyMemberships(Array.isArray(membershipRes?.memberships) ? membershipRes.memberships : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load teams");
      setTeams([]);
      setMyMemberships([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBase();
  }, [loadBase]);

  const myTeamIdSet = useMemo(
    () => new Set(myMemberships.map((membership) => Number(membership.team_id))),
    [myMemberships]
  );

  const typeOptions = useMemo(() => {
    return [
      "ALL",
      ...new Set(teams.map((team) => String(team.team_type || "").trim()).filter(Boolean))
    ];
  }, [teams]);

  const filteredTeams = useMemo(() => {
    const normalizedQuery = String(query || "").trim().toLowerCase();

    return teams.filter((team) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          team.team_code,
          team.team_name,
          team.team_type,
          team.status,
          team.description
        ]
          .map((value) => String(value || "").toLowerCase())
          .join(" ")
          .includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "ALL" || String(team.status || "").toUpperCase() === statusFilter;

      const matchesType = typeFilter === "ALL" || String(team.team_type || "") === typeFilter;

      return matchesQuery && matchesStatus && matchesType;
    });
  }, [query, statusFilter, teams, typeFilter]);

  const activeFilters = useMemo(() => {
    const items = [];

    if (String(query || "").trim()) {
      items.push(`Search: ${String(query).trim()}`);
    }
    if (statusFilter !== "ALL") {
      items.push(`Status: ${formatLabel(statusFilter)}`);
    }
    if (typeFilter !== "ALL") {
      items.push(`Type: ${formatLabel(typeFilter)}`);
    }

    return items;
  }, [query, statusFilter, typeFilter]);

  const canResetFilters = activeFilters.length > 0;
  const activeTeamsCount = useMemo(
    () => teams.filter((team) => String(team.status || "").toUpperCase() === "ACTIVE").length,
    [teams]
  );
  const teamTypeCount = useMemo(() => getUniqueCount(teams, (team) => team.team_type), [teams]);
  const headerSummary =
    filteredTeams.length !== teams.length
      ? `Showing ${filteredTeams.length} of ${teams.length} teams`
      : `${teams.length} teams in directory`;

  const resetFilters = useCallback(() => {
    setQuery("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
  }, []);

  const resolveJoinAction = useCallback(
    (team) => {
      const teamId = Number(team?.team_id);
      const isJoined = myTeamIdSet.has(teamId);
      const isActiveTeam = String(team?.status || "").toUpperCase() === "ACTIVE";
      const isBusy = busyTeamId === teamId;

      if (isBusy) {
        return {
          disabled: true,
          label: "Joining...",
          title: "Joining team"
        };
      }

      if (isJoined) {
        return {
          disabled: true,
          label: "Joined",
          title: "Already an active member"
        };
      }

      if (!isActiveTeam) {
        return {
          disabled: true,
          label: "Join",
          title: "Only active teams can be joined"
        };
      }

      return {
        disabled: false,
        label: "Join",
        title: "Join team"
      };
    },
    [busyTeamId, myTeamIdSet]
  );

  const onJoin = useCallback(
    async (team) => {
      const joinAction = resolveJoinAction(team);
      if (joinAction.disabled || !team?.team_id) return;

      const ok = window.confirm(`Join team ${team.team_name || team.team_code}?`);
      if (!ok) return;

      setBusyTeamId(Number(team.team_id));
      setError("");

      try {
        await joinTeam(team.team_id);
        await loadBase();
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to join team");
      } finally {
        setBusyTeamId(null);
      }
    },
    [loadBase, resolveJoinAction]
  );

  const closeViewMembers = useCallback(() => {
    setViewTeam(null);
    setViewMembers([]);
    setViewMembersError("");
    setViewMembersLoading(false);
    setViewBusyTeamId(null);
  }, []);

  const onViewMembers = useCallback(async (team) => {
    if (!team?.team_id) return;

    setViewTeam(team);
    setViewMembers([]);
    setViewMembersError("");
    setViewMembersLoading(true);
    setViewBusyTeamId(Number(team.team_id));

    try {
      const rows = await fetchTeamMemberships(team.team_id, { status: "ACTIVE" });
      setViewMembers(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setViewMembersError(err?.response?.data?.message || "Failed to load team members");
      setViewMembers([]);
    } finally {
      setViewMembersLoading(false);
      setViewBusyTeamId(null);
    }
  }, []);

  return (
    <div className="max-w-screen-2xl space-y-3 p-4 md:p-5">
      <TeamPageHero
        loading={loading}
        onRefresh={loadBase}
        eyebrow="Team Discovery"
        title="Teams"
        summary={headerSummary}
        actionLabel="Refresh"
        actionBusyLabel="Refreshing..."
        stats={[
          {
            accentClass: "bg-[#1754cf]",
            detail:
              filteredTeams.length !== teams.length ? `Visible ${filteredTeams.length}` : "All teams",
            label: "Total",
            value: teams.length
          },
          {
            accentClass: "bg-emerald-500",
            detail: "Teams you already belong to",
            label: "Joined",
            value: myMemberships.length
          },
          {
            accentClass: "bg-sky-500",
            detail: "Available for direct join",
            label: "Active",
            value: activeTeamsCount
          },
          {
            accentClass: "bg-slate-400",
            detail: "Distinct categories",
            label: "Types",
            value: teamTypeCount
          }
        ]}
      />

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:hidden">
        <TeamPageFilters
          className="lg:hidden"
          activeFilters={activeFilters}
          canReset={canResetFilters}
          itemLabel="teams"
          onReset={resetFilters}
          panelTitle="Filter Teams"
          resultCount={filteredTeams.length}
          totalCount={teams.length}
          withDivider
        >
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Search
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by code, name, type, or description"
              className={inputClassName}
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Status
              </span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className={selectClassName}
              >
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="FROZEN">Frozen</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Team Type
              </span>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className={selectClassName}
              >
                <option value="ALL">All team types</option>
                {typeOptions
                  .filter((option) => option !== "ALL")
                  .map((option) => (
                    <option key={option} value={option}>
                      {formatLabel(option)}
                    </option>
                  ))}
              </select>
            </label>
          </div>
        </TeamPageFilters>

        {loading ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">Loading teams...</div>
        ) : filteredTeams.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            No teams found for the current filters.
          </div>
        ) : (
          <>
            <div className="space-y-3 p-4 lg:hidden">
              {filteredTeams.map((team) => {
                const joinAction = resolveJoinAction(team);
                const teamId = Number(team.team_id);

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
                      <AllGroupsBadge value={formatLabel(team.team_type, "Team")} />
                      {myTeamIdSet.has(teamId) ? <AllGroupsBadge value="Active Member" /> : null}
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
                        Description
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {team.description || "No description added."}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onViewMembers(team)}
                        disabled={viewBusyTeamId === teamId}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
                        title="View team members"
                      >
                        <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onJoin(team)}
                        disabled={joinAction.disabled}
                        title={joinAction.title}
                        className="rounded-lg border border-[#1754cf]/15 bg-[#1754cf]/8 px-3.5 py-2 text-sm font-semibold text-[#1754cf] transition hover:bg-[#1754cf]/12 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        {joinAction.label}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

          </>
        )}
      </section>

      <TeamDesktopTableShell
        canReset={canResetFilters}
        onReset={resetFilters}
        toolbar={
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="min-w-0 xl:w-[22rem]">
              <TeamTableSearchField
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by code, name, type, or description"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:w-auto">
              <div className="min-w-0 xl:w-44">
                <TeamTableSelectField
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="ALL">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="FROZEN">Frozen</option>
                  <option value="ARCHIVED">Archived</option>
                </TeamTableSelectField>
              </div>

              <div className="min-w-0 xl:w-48">
                <TeamTableSelectField
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                >
                  <option value="ALL">All team types</option>
                  {typeOptions
                    .filter((option) => option !== "ALL")
                    .map((option) => (
                      <option key={option} value={option}>
                        {formatLabel(option)}
                      </option>
                    ))}
                </TeamTableSelectField>
              </div>
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto overflow-y-visible rounded-2xl">
          <table className="min-w-[1120px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Team</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Type</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Members</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Created</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                  Description
                </th>
                <th className="sticky right-0 bg-slate-50 px-4 py-3 text-left font-semibold whitespace-nowrap shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.14)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={7}>
                    Loading teams...
                  </td>
                </tr>
              ) : filteredTeams.length === 0 ? (
                <tr>
                  <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={7}>
                    No teams found for the current filters.
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team) => {
                  const joinAction = resolveJoinAction(team);
                  const teamId = Number(team.team_id);

                  return (
                    <tr key={team.team_id} className="group hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{team.team_name || "-"}</div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {team.team_code || "No code"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <AllGroupsBadge value={formatLabel(team.team_type, "Team")} />
                      </td>
                      <td className="px-4 py-3">
                        <AllGroupsBadge value={formatLabel(team.status, "Unknown")} />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {formatMemberCount(team.active_member_count)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatShortDate(team.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-sm leading-6 text-slate-600">
                          {team.description || "No description added."}
                        </p>
                      </td>
                      <td className="sticky right-0 bg-white px-4 py-3 shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)] group-hover:bg-slate-50/80">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onViewMembers(team)}
                            disabled={viewBusyTeamId === teamId}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
                            title="View team members"
                          >
                            <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onJoin(team)}
                            disabled={joinAction.disabled}
                            title={joinAction.title}
                            className="rounded-lg border border-[#1754cf]/15 bg-[#1754cf]/8 px-3 py-1.5 text-sm font-semibold text-[#1754cf] transition hover:bg-[#1754cf]/12 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            {joinAction.label}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </TeamDesktopTableShell>

      <TeamMembersPreviewModal
        team={viewTeam}
        rows={viewMembers}
        loading={viewMembersLoading}
        error={viewMembersError}
        onClose={closeViewMembers}
        title="Team Members"
        emptyText="No active members found for this team."
      />
    </div>
  );
}
