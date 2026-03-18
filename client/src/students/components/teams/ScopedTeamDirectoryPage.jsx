import { useCallback, useEffect, useMemo, useState } from "react";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AllGroupsBadge from "../allGroups/AllGroupsBadge";
import {
  TeamDesktopTableShell,
  TeamTableSearchField,
  TeamTableSelectField
} from "./TeamDesktopTableControls";
import TeamMembersPreviewModal from "./TeamMembersPreviewModal";
import TeamPageDetailTile from "./TeamPageDetailTile";
import TeamPageFilters from "./TeamPageFilters";
import TeamPageHero from "./TeamPageHero";
import {
  fetchMyTeamMemberships,
  fetchTeamMemberships,
  fetchTeams,
  joinTeam
} from "../../../service/teams.api";
import { formatLabel, formatMemberCount, formatShortDate } from "./teamPage.utils";
import { getTeamScopeConfig, TEAM_STATUS_OPTIONS } from "./teamScope.constants";

const inputClassName =
  "w-full rounded-2xl border border-slate-300 bg-[#f3f4f6] px-4 py-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10";

const selectClassName =
  "w-full rounded-2xl border border-slate-300 bg-[#f3f4f6] px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10";

const getLatestCreatedLabel = (rows) => {
  const timestamps = (Array.isArray(rows) ? rows : [])
    .map((row) => new Date(row?.created_at).getTime())
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) return "No date";
  return formatShortDate(new Date(Math.max(...timestamps)));
};

export default function ScopedTeamDirectoryPage({ teamType = "TEAM" }) {
  const scope = useMemo(() => getTeamScopeConfig(teamType), [teamType]);

  const [rows, setRows] = useState([]);
  const [myMemberships, setMyMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
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
        fetchTeams({ team_type: scope.teamType }),
        fetchMyTeamMemberships({ status: "ACTIVE", team_type: scope.teamType })
      ]);

      setRows(Array.isArray(teamRows) ? teamRows : []);
      setMyMemberships(Array.isArray(membershipRes?.memberships) ? membershipRes.memberships : []);
    } catch (err) {
      setError(err?.response?.data?.message || `Failed to load ${scope.pluralLower}`);
      setRows([]);
      setMyMemberships([]);
    } finally {
      setLoading(false);
    }
  }, [scope.pluralLower, scope.teamType]);

  useEffect(() => {
    loadBase();
  }, [loadBase]);

  const myTeamIdSet = useMemo(
    () => new Set(myMemberships.map((membership) => Number(membership.team_id))),
    [myMemberships]
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = String(query || "").trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        [row.team_code, row.team_name, row.status, row.description]
          .map((value) => String(value || "").toLowerCase())
          .join(" ")
          .includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "ALL" || String(row.status || "").toUpperCase() === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [query, rows, statusFilter]);

  const activeFilters = useMemo(() => {
    const items = [];

    if (String(query || "").trim()) {
      items.push(`Search: ${String(query).trim()}`);
    }
    if (statusFilter !== "ALL") {
      items.push(`Status: ${formatLabel(statusFilter)}`);
    }

    return items;
  }, [query, statusFilter]);

  const activeRowsCount = useMemo(
    () => rows.filter((row) => String(row.status || "").toUpperCase() === "ACTIVE").length,
    [rows]
  );
  const latestCreatedLabel = useMemo(() => getLatestCreatedLabel(rows), [rows]);
  const canResetFilters = activeFilters.length > 0;
  const headerSummary =
    filteredRows.length !== rows.length
      ? `Showing ${filteredRows.length} of ${rows.length} ${scope.pluralLower}`
      : `${rows.length} ${scope.pluralLower} in directory`;

  const resetFilters = useCallback(() => {
    setQuery("");
    setStatusFilter("ALL");
  }, []);

  const resolveJoinAction = useCallback(
    (row) => {
      const teamId = Number(row?.team_id);
      const isJoined = myTeamIdSet.has(teamId);
      const isActiveRow = String(row?.status || "").toUpperCase() === "ACTIVE";
      const isBusy = busyTeamId === teamId;

      if (isBusy) {
        return {
          disabled: true,
          label: scope.joinBusyLabel,
          title: scope.joinTitle
        };
      }

      if (isJoined) {
        return {
          disabled: true,
          label: "Joined",
          title: "Already an active member"
        };
      }

      if (!isActiveRow) {
        return {
          disabled: true,
          label: "Join",
          title: scope.joinDisabledTitle
        };
      }

      return {
        disabled: false,
        label: "Join",
        title: scope.joinTitle
      };
    },
    [busyTeamId, myTeamIdSet, scope.joinBusyLabel, scope.joinDisabledTitle, scope.joinTitle]
  );

  const onJoin = useCallback(
    async (row) => {
      const joinAction = resolveJoinAction(row);
      if (joinAction.disabled || !row?.team_id) return;

      const ok = window.confirm(
        `${scope.joinConfirmLabel} ${row.team_name || row.team_code}?`
      );
      if (!ok) return;

      setBusyTeamId(Number(row.team_id));
      setError("");

      try {
        await joinTeam(row.team_id);
        await loadBase();
      } catch (err) {
        setError(err?.response?.data?.message || `Failed to join ${scope.singularLower}`);
      } finally {
        setBusyTeamId(null);
      }
    },
    [loadBase, resolveJoinAction, scope.joinConfirmLabel, scope.singularLower]
  );

  const closeViewMembers = useCallback(() => {
    setViewTeam(null);
    setViewMembers([]);
    setViewMembersError("");
    setViewMembersLoading(false);
    setViewBusyTeamId(null);
  }, []);

  const onViewMembers = useCallback(
    async (row) => {
      if (!row?.team_id) return;

      setViewTeam(row);
      setViewMembers([]);
      setViewMembersError("");
      setViewMembersLoading(true);
      setViewBusyTeamId(Number(row.team_id));

      try {
        const memberships = await fetchTeamMemberships(row.team_id, { status: "ACTIVE" });
        setViewMembers(Array.isArray(memberships) ? memberships : []);
      } catch (err) {
        setViewMembersError(
          err?.response?.data?.message || `Failed to load ${scope.singularLower} members`
        );
        setViewMembers([]);
      } finally {
        setViewMembersLoading(false);
        setViewBusyTeamId(null);
      }
    },
    [scope.singularLower]
  );

  return (
    <div className="max-w-screen-2xl space-y-3 p-4 md:p-5">
      <TeamPageHero
        loading={loading}
        onRefresh={loadBase}
        eyebrow={scope.discoveryEyebrow}
        title={scope.title}
        summary={headerSummary}
        actionLabel="Refresh"
        actionBusyLabel="Refreshing..."
        stats={[
          {
            accentClass: "bg-[#1754cf]",
            detail:
              filteredRows.length !== rows.length
                ? `Visible ${filteredRows.length} after filters`
                : `All ${scope.pluralLower} currently listed`,
            label: "Total",
            value: rows.length
          },
          {
            accentClass: "bg-emerald-500",
            detail: scope.joinedDetail,
            label: "Joined",
            value: myMemberships.length
          },
          {
            accentClass: "bg-sky-500",
            detail: "Available for direct join",
            label: "Active",
            value: activeRowsCount
          },
          {
            accentClass: "bg-slate-400",
            detail: `Most recently created ${scope.singularLower}`,
            label: "Latest Created",
            value: latestCreatedLabel
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
          itemLabel={scope.pluralLower}
          onReset={resetFilters}
          panelTitle={`Filter ${scope.title}`}
          resultCount={filteredRows.length}
          totalCount={rows.length}
          withDivider
        >
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Search
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={scope.searchPlaceholder}
              className={inputClassName}
            />
          </label>

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
              {TEAM_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </label>
        </TeamPageFilters>

        {loading ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            Loading {scope.pluralLower}...
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            {scope.emptyDirectoryState}
          </div>
        ) : (
          <div className="space-y-3 p-4 lg:hidden">
            {filteredRows.map((row) => {
              const joinAction = resolveJoinAction(row);
              const teamId = Number(row.team_id);

              return (
                <article
                  key={row.team_id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-slate-900">
                        {row.team_name || "-"}
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-500">{row.team_code || "No code"}</p>
                    </div>
                    <AllGroupsBadge value={formatLabel(row.status, "Unknown")} />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <AllGroupsBadge value={scope.singularLabel} />
                    {myTeamIdSet.has(teamId) ? <AllGroupsBadge value="Active Member" /> : null}
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <TeamPageDetailTile
                      label="Members"
                      value={formatMemberCount(row.active_member_count)}
                    />
                    <TeamPageDetailTile
                      label="Created"
                      value={formatShortDate(row.created_at)}
                    />
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Description
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {row.description || "No description added."}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onViewMembers(row)}
                      disabled={viewBusyTeamId === teamId}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
                      title={scope.viewMembersTitle}
                    >
                      <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onJoin(row)}
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
                placeholder={scope.searchPlaceholder}
              />
            </div>

            <div className="min-w-0 xl:w-44">
              <TeamTableSelectField
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="ALL">All statuses</option>
                {TEAM_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {formatLabel(status)}
                  </option>
                ))}
              </TeamTableSelectField>
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto overflow-y-visible rounded-2xl">
          <table className="min-w-[1040px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                  {scope.singularLabel}
                </th>
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
                  <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={6}>
                    Loading {scope.pluralLower}...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={6}>
                    {scope.emptyDirectoryState}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const joinAction = resolveJoinAction(row);
                  const teamId = Number(row.team_id);

                  return (
                    <tr key={row.team_id} className="group hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{row.team_name || "-"}</div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {row.team_code || "No code"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <AllGroupsBadge value={formatLabel(row.status, "Unknown")} />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {formatMemberCount(row.active_member_count)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatShortDate(row.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-sm leading-6 text-slate-600">
                          {row.description || "No description added."}
                        </p>
                      </td>
                      <td className="sticky right-0 bg-white px-4 py-3 shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)] group-hover:bg-slate-50/80">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onViewMembers(row)}
                            disabled={viewBusyTeamId === teamId}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
                            title={scope.viewMembersTitle}
                          >
                            <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onJoin(row)}
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
        title={scope.membersModalTitle}
        subtitle={
          viewTeam
            ? `${viewTeam.team_name || "-"} (${viewTeam.team_code || "-"}) | ${scope.singularLabel} ID: ${viewTeam.team_id}`
            : undefined
        }
        emptyText={`No active members found for this ${scope.singularLower}.`}
      />
    </div>
  );
}
