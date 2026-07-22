import { useCallback, useEffect, useMemo, useState } from "react";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AllGroupsBadge from "../allGroups/AllGroupsBadge";
import { TeamDesktopTableShell } from "../teams/TeamDesktopTableControls";
import TeamMembersPreviewModal from "../teams/TeamMembersPreviewModal";
import TeamPageDetailTile from "../teams/TeamPageDetailTile";
import TeamPageHero from "../teams/TeamPageHero";
import {
  fetchHubMemberships,
  fetchHubs,
  fetchMyHubMemberships,
  joinHub
} from "../../../service/hubs.api";
import { WorkspaceFilterBar } from "../../../shared/components/WorkspaceInlineFilters";
import {
  formatLabel,
  formatMemberCount,
  formatShortDate
} from "../teams/teamPage.utils";
import {
  HUB_JOIN_RULE_MESSAGE,
  HUB_SCOPE,
  HUB_STATUS_OPTIONS
} from "./hubPage.constants";

const getLatestCreatedLabel = (rows) => {
  const timestamps = (Array.isArray(rows) ? rows : [])
    .map((row) => new Date(row?.created_at).getTime())
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) return "No date";
  return formatShortDate(new Date(Math.max(...timestamps)));
};

export default function HubDirectoryPage() {
  const [rows, setRows] = useState([]);
  const [myMemberships, setMyMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [busyHubId, setBusyHubId] = useState(null);
  const [viewHub, setViewHub] = useState(null);
  const [viewMembers, setViewMembers] = useState([]);
  const [viewMembersLoading, setViewMembersLoading] = useState(false);
  const [viewMembersError, setViewMembersError] = useState("");
  const [viewBusyHubId, setViewBusyHubId] = useState(null);

  const loadBase = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [hubRows, membershipRes] = await Promise.all([
        fetchHubs(),
        fetchMyHubMemberships({ status: "ACTIVE" })
      ]);

      setRows(Array.isArray(hubRows) ? hubRows : []);
      setMyMemberships(Array.isArray(membershipRes?.memberships) ? membershipRes.memberships : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load hubs");
      setRows([]);
      setMyMemberships([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBase();
  }, [loadBase]);

  const myHubIdSet = useMemo(
    () =>
      new Set(
        myMemberships
          .map((membership) => Number(membership.hub_id ?? membership.team_id))
          .filter((value) => Number.isInteger(value) && value > 0)
      ),
    [myMemberships]
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = String(query || "").trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          row.hub_code,
          row.hub_name,
          row.team_code,
          row.team_name,
          row.hub_priority,
          row.status,
          row.description
        ]
          .map((value) => String(value || "").toLowerCase())
          .join(" ")
          .includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "ALL" || String(row.status || "").toUpperCase() === statusFilter;
      const matchesPriority =
        priorityFilter === "ALL" ||
        String(row.hub_priority || "").toUpperCase() === priorityFilter;

      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [priorityFilter, query, rows, statusFilter]);

  const activeRowsCount = useMemo(
    () => rows.filter((row) => String(row.status || "").toUpperCase() === "ACTIVE").length,
    [rows]
  );
  const latestCreatedLabel = useMemo(() => getLatestCreatedLabel(rows), [rows]);
  const canResetFilters =
    Boolean(String(query || "").trim()) || statusFilter !== "ALL" || priorityFilter !== "ALL";

  const resetFilters = useCallback(() => {
    setQuery("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
  }, []);

  const hubPriorityOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => String(row.hub_priority || "").toUpperCase())
            .filter(Boolean)
        )
      ),
    [rows]
  );

  const filterFields = useMemo(
    () => [
      {
        key: "query",
        type: "search",
        label: "Hub",
        value: query,
        placeholder: HUB_SCOPE.searchPlaceholder,
        onChangeValue: setQuery
      },
      {
        key: "status",
        type: "select",
        label: "Status",
        value: statusFilter,
        onChangeValue: setStatusFilter,
        wrapperClassName: "w-full sm:w-[180px]",
        options: [
          { value: "ALL", label: "All statuses" },
          ...HUB_STATUS_OPTIONS.map((status) => ({
            value: status,
            label: formatLabel(status)
          }))
        ]
      },
      {
        key: "priority",
        type: "select",
        label: "Priority",
        value: priorityFilter,
        onChangeValue: setPriorityFilter,
        wrapperClassName: "w-full sm:w-[180px]",
        options: [
          { value: "ALL", label: "All priorities" },
          ...hubPriorityOptions.map((priority) => ({
            value: priority,
            label: formatLabel(priority)
          }))
        ]
      }
    ],
    [hubPriorityOptions, priorityFilter, query, statusFilter]
  );

  const resolveJoinAction = useCallback(
    (row) => {
      const hubId = Number(row?.hub_id ?? row?.team_id);
      const isJoined = myHubIdSet.has(hubId);
      const isActiveRow = String(row?.status || "").toUpperCase() === "ACTIVE";
      const isBusy = busyHubId === hubId;

      if (isBusy) {
        return {
          disabled: true,
          label: HUB_SCOPE.joinBusyLabel,
          title: HUB_SCOPE.joinTitle
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
          title: HUB_SCOPE.joinDisabledTitle
        };
      }

      return {
        disabled: false,
        label: "Join",
        title: HUB_SCOPE.joinTitle
      };
    },
    [busyHubId, myHubIdSet]
  );

  const onJoin = useCallback(
    async (row) => {
      const joinAction = resolveJoinAction(row);
      const hubId = Number(row?.hub_id ?? row?.team_id);
      if (joinAction.disabled || !hubId) return;

      const ok = window.confirm(
        `${HUB_SCOPE.joinConfirmLabel} ${row.team_name || row.team_code}?`
      );
      if (!ok) return;

      setBusyHubId(hubId);
      setError("");

      try {
        await joinHub(hubId);
        await loadBase();
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to join hub");
      } finally {
        setBusyHubId(null);
      }
    },
    [loadBase, resolveJoinAction]
  );

  const closeViewMembers = useCallback(() => {
    setViewHub(null);
    setViewMembers([]);
    setViewMembersError("");
    setViewMembersLoading(false);
    setViewBusyHubId(null);
  }, []);

  const onViewMembers = useCallback(async (row) => {
    const hubId = Number(row?.hub_id ?? row?.team_id);
    if (!hubId) return;

    setViewHub(row);
    setViewMembers([]);
    setViewMembersError("");
    setViewMembersLoading(true);
    setViewBusyHubId(hubId);

    try {
      const memberships = await fetchHubMemberships(hubId, { status: "ACTIVE" });
      setViewMembers(Array.isArray(memberships) ? memberships : []);
    } catch (err) {
      setViewMembersError(err?.response?.data?.message || "Failed to load hub members");
      setViewMembers([]);
    } finally {
      setViewMembersLoading(false);
      setViewBusyHubId(null);
    }
  }, []);

  const headerSummary = canResetFilters
    ? `${filteredRows.length} hubs match the current filters`
    : "Browse the hub directory and join the spaces that fit your priority plan.";

  return (
    <div className="max-w-screen-2xl space-y-3 p-4 md:p-5">
      <TeamPageHero
        loading={loading}
        onRefresh={loadBase}
        eyebrow={HUB_SCOPE.discoveryEyebrow}
        title={HUB_SCOPE.title}
        summary={headerSummary}
        actionLabel="Refresh"
        actionBusyLabel="Refreshing..."
        stats={[
          {
            accentClass: "bg-[#1754cf]",
            detail: "Hub records currently available in the directory",
            label: "Total",
            value: rows.length
          },
          {
            accentClass: "bg-emerald-500",
            detail: HUB_SCOPE.joinedDetail,
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
            detail: "Most recently created hub",
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

      <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
        {HUB_JOIN_RULE_MESSAGE}
      </div>

      <div className="lg:hidden">
        <WorkspaceFilterBar
          fields={filterFields}
          onReset={resetFilters}
          hasActiveFilters={canResetFilters}
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:hidden">
        {loading ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">Loading hubs...</div>
        ) : filteredRows.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            {HUB_SCOPE.emptyDirectoryState}
          </div>
        ) : (
          <div className="space-y-3 p-4 lg:hidden">
            {filteredRows.map((row) => {
              const joinAction = resolveJoinAction(row);
              const hubId = Number(row.hub_id ?? row.team_id);

              return (
                <article
                  key={hubId}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-slate-900">
                        {row.team_name || row.hub_name || "-"}
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {row.team_code || row.hub_code || "No code"}
                      </p>
                    </div>
                    <AllGroupsBadge value={formatLabel(row.status, "Unknown")} />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <AllGroupsBadge value={HUB_SCOPE.singularLabel} />
                    <AllGroupsBadge value={formatLabel(row.hub_priority, "Not set")} />
                    {myHubIdSet.has(hubId) ? <AllGroupsBadge value="Active Member" /> : null}
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <TeamPageDetailTile
                      label="Members"
                      value={formatMemberCount(row.active_member_count)}
                    />
                    <TeamPageDetailTile
                      label="Priority"
                      value={formatLabel(row.hub_priority, "Not set")}
                    />
                    <TeamPageDetailTile label="Created" value={formatShortDate(row.created_at)} />
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
                      disabled={viewBusyHubId === hubId}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
                      title={HUB_SCOPE.viewMembersTitle}
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
          <WorkspaceFilterBar
            fields={filterFields}
            onReset={resetFilters}
            hasActiveFilters={canResetFilters}
            showReset={false}
          />
        }
      >
        <div className="overflow-x-auto overflow-y-visible rounded-2xl">
          <table className="min-w-[1040px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Hub</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Priority</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Members</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Created</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Description</th>
                <th className="sticky right-0 bg-slate-50 px-4 py-3 text-left font-semibold whitespace-nowrap shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.14)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={7}>
                    Loading hubs...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={7}>
                    {HUB_SCOPE.emptyDirectoryState}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const joinAction = resolveJoinAction(row);
                  const hubId = Number(row.hub_id ?? row.team_id);

                  return (
                    <tr key={hubId} className="group hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {row.team_name || row.hub_name || "-"}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {row.team_code || row.hub_code || "No code"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <AllGroupsBadge value={formatLabel(row.status, "Unknown")} />
                      </td>
                      <td className="px-4 py-3">
                        <AllGroupsBadge value={formatLabel(row.hub_priority, "Not set")} />
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
                            disabled={viewBusyHubId === hubId}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
                            title={HUB_SCOPE.viewMembersTitle}
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
        team={viewHub}
        rows={viewMembers}
        loading={viewMembersLoading}
        error={viewMembersError}
        onClose={closeViewMembers}
        title={HUB_SCOPE.membersModalTitle}
        subtitle={
          viewHub
            ? `${viewHub.team_name || viewHub.hub_name || "-"} (${viewHub.team_code || viewHub.hub_code || "-"}) | Hub ID: ${viewHub.hub_id ?? viewHub.team_id}`
            : undefined
        }
        emptyText="No active members found for this hub."
      />
    </div>
  );
}
