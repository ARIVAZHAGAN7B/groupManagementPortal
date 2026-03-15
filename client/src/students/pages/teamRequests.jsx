import { useCallback, useEffect, useMemo, useState } from "react";
import AllGroupsBadge from "../components/allGroups/AllGroupsBadge";
import {
  TeamDesktopTableShell,
  TeamTableFilterPanel,
  TeamTableHeaderFilterButton,
  TeamTableSearchField,
  TeamTableSelectField
} from "../components/teams/TeamDesktopTableControls";
import TeamPageDetailTile from "../components/teams/TeamPageDetailTile";
import TeamPageFilters from "../components/teams/TeamPageFilters";
import TeamPageHero from "../components/teams/TeamPageHero";
import { fetchMyEventGroupMemberships } from "../../service/teams.api";
import {
  decideEventJoinRequest,
  getMyEventJoinRequests,
  getPendingEventJoinRequestsByTeam
} from "../../service/eventJoinRequests.api";
import {
  formatDateTime,
  formatLabel,
  normalizeValue
} from "../components/teams/teamPage.utils";

const inputClassName =
  "w-full rounded-2xl border border-slate-300 bg-[#f3f4f6] px-4 py-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10";

const selectClassName =
  "w-full rounded-2xl border border-slate-300 bg-[#f3f4f6] px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10";

export default function TeamRequestsPage() {
  const [activeTab, setActiveTab] = useState("my");
  const [myRequests, setMyRequests] = useState([]);
  const [captainTeams, setCaptainTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [pendingRows, setPendingRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPending, setLoadingPending] = useState(false);
  const [error, setError] = useState("");
  const [pendingError, setPendingError] = useState("");
  const [decisionBusyId, setDecisionBusyId] = useState(null);
  const [approvalRoleByRequestId, setApprovalRoleByRequestId] = useState({});
  const [myQuery, setMyQuery] = useState("");
  const [myStatusFilter, setMyStatusFilter] = useState("ALL");
  const [captainQuery, setCaptainQuery] = useState("");

  const loadBase = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [requests, myTeamsRes] = await Promise.all([
        getMyEventJoinRequests(),
        fetchMyEventGroupMemberships({ status: "ACTIVE" })
      ]);

      setMyRequests(Array.isArray(requests) ? requests : []);

      const memberships = Array.isArray(myTeamsRes?.memberships) ? myTeamsRes.memberships : [];
      const captains = memberships.filter((row) => normalizeValue(row?.role) === "CAPTAIN");
      setCaptainTeams(captains);
      setSelectedTeamId((prev) => {
        if (prev && captains.some((row) => String(row.team_id) === String(prev))) return prev;
        return captains[0] ? String(captains[0].team_id) : "";
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load event group requests");
      setMyRequests([]);
      setCaptainTeams([]);
      setSelectedTeamId("");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPending = useCallback(async (teamId) => {
    if (!teamId) {
      setPendingRows([]);
      return;
    }

    setLoadingPending(true);
    setPendingError("");

    try {
      const rows = await getPendingEventJoinRequestsByTeam(teamId);
      setPendingRows(Array.isArray(rows) ? rows : []);
      setApprovalRoleByRequestId((prev) => {
        const next = { ...prev };

        for (const row of Array.isArray(rows) ? rows : []) {
          const requestId = row?.event_request_id;
          if (!requestId || next[requestId]) continue;
          next[requestId] = "MEMBER";
        }

        return next;
      });
    } catch (err) {
      setPendingError(err?.response?.data?.message || "Failed to load pending requests");
      setPendingRows([]);
    } finally {
      setLoadingPending(false);
    }
  }, []);

  useEffect(() => {
    loadBase();
  }, [loadBase]);

  useEffect(() => {
    if (activeTab !== "captain" || !selectedTeamId) return;
    loadPending(selectedTeamId);
  }, [activeTab, loadPending, selectedTeamId]);

  const onDecision = useCallback(
    async (requestId, status) => {
      setDecisionBusyId(requestId);
      setPendingError("");

      try {
        const reason =
          status === "APPROVED"
            ? "Approved by event group captain"
            : "Rejected by event group captain";
        const approvedRole =
          status === "APPROVED" ? approvalRoleByRequestId[requestId] || "MEMBER" : undefined;

        await decideEventJoinRequest(requestId, status, reason, approvedRole);
        await Promise.all([loadPending(selectedTeamId), loadBase()]);
      } catch (err) {
        setPendingError(err?.response?.data?.message || "Failed to update request");
      } finally {
        setDecisionBusyId(null);
      }
    },
    [approvalRoleByRequestId, loadBase, loadPending, selectedTeamId]
  );

  const onChangeApprovalRole = useCallback((requestId, role) => {
    setApprovalRoleByRequestId((prev) => ({
      ...prev,
      [requestId]: role
    }));
  }, []);

  const selectedCaptainTeam = useMemo(
    () => captainTeams.find((row) => String(row.team_id) === String(selectedTeamId)) || null,
    [captainTeams, selectedTeamId]
  );

  const myStatusOptions = useMemo(() => {
    return ["ALL", ...new Set(myRequests.map((row) => normalizeValue(row.status)).filter(Boolean))];
  }, [myRequests]);

  const filteredMyRequests = useMemo(() => {
    const normalizedQuery = String(myQuery || "").trim().toLowerCase();

    return myRequests.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          row.event_name,
          row.event_code,
          row.team_name,
          row.team_code,
          row.team_status,
          row.status,
          row.decision_reason,
          row.decision_by_role
        ]
          .map((value) => String(value || "").toLowerCase())
          .join(" ")
          .includes(normalizedQuery);

      const matchesStatus =
        myStatusFilter === "ALL" || normalizeValue(row.status) === myStatusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [myQuery, myRequests, myStatusFilter]);

  const filteredPendingRows = useMemo(() => {
    const normalizedQuery = String(captainQuery || "").trim().toLowerCase();
    if (!normalizedQuery) return pendingRows;

    return pendingRows.filter((row) =>
      [
        row.student_name,
        row.student_email,
        row.student_id,
        row.department,
        row.year
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ")
      .includes(normalizedQuery)
    );
  }, [captainQuery, pendingRows]);
  const pendingMyRequestCount = useMemo(
    () => myRequests.filter((row) => normalizeValue(row.status) === "PENDING").length,
    [myRequests]
  );
  const headerSummary =
    activeTab === "my"
      ? filteredMyRequests.length !== myRequests.length
        ? `Showing ${filteredMyRequests.length} of ${myRequests.length} requests`
        : `${myRequests.length} request${myRequests.length === 1 ? "" : "s"} you've submitted`
      : selectedCaptainTeam
        ? filteredPendingRows.length !== pendingRows.length
          ? `Showing ${filteredPendingRows.length} of ${pendingRows.length} inbox items for ${selectedCaptainTeam.team_name}`
          : `${pendingRows.length} inbox item${pendingRows.length === 1 ? "" : "s"} for ${selectedCaptainTeam.team_name}`
        : captainTeams.length > 0
          ? `${captainTeams.length} captain inbox${captainTeams.length === 1 ? "" : "es"} available`
          : "No captain inboxes available";
  const canResetFilters =
    activeTab === "my"
      ? String(myQuery || "").trim().length > 0 || myStatusFilter !== "ALL"
      : String(captainQuery || "").trim().length > 0;

  const activeFilters = useMemo(() => {
    if (activeTab === "my") {
      const items = [];
      if (String(myQuery || "").trim()) {
        items.push(`Search: ${String(myQuery).trim()}`);
      }
      if (myStatusFilter !== "ALL") {
        items.push(`Status: ${formatLabel(myStatusFilter)}`);
      }
      return items;
    }

    const items = [];
    if (selectedCaptainTeam?.team_name) {
      items.push(`Inbox: ${selectedCaptainTeam.team_name}`);
    }
    if (String(captainQuery || "").trim()) {
      items.push(`Search: ${String(captainQuery).trim()}`);
    }
    return items;
  }, [activeTab, captainQuery, myQuery, myStatusFilter, selectedCaptainTeam?.team_name]);

  const resetFilters = useCallback(() => {
    if (activeTab === "my") {
      setMyQuery("");
      setMyStatusFilter("ALL");
      return;
    }

    setCaptainQuery("");
  }, [activeTab]);

  return (
    <div className="max-w-screen-2xl space-y-3 p-4 md:p-5">
      <TeamPageHero
        loading={loading}
        onRefresh={loadBase}
        eyebrow="Request Center"
        title="Event Group Requests"
        summary={headerSummary}
        actionLabel="Refresh requests"
        actionBusyLabel="Refreshing..."
        stats={[
          {
            accentClass: "bg-[#1754cf]",
            detail: "Requests you have submitted",
            label: "My Requests",
            value: myRequests.length
          },
          {
            accentClass: "bg-emerald-500",
            detail: "Active event groups you captain",
            label: "Captain Teams",
            value: captainTeams.length
          },
          {
            accentClass: "bg-sky-500",
            detail: selectedCaptainTeam
              ? `Pending requests for ${selectedCaptainTeam.team_code || selectedCaptainTeam.team_name}`
              : "Select a captain inbox to load requests",
            label: "Inbox Items",
            value: pendingRows.length
          },
          {
            accentClass: "bg-slate-400",
            detail: "Your requests awaiting review",
            label: "Pending My Requests",
            value: pendingMyRequestCount
          }
        ]}
      />

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("my")}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              activeTab === "my"
                ? "border-[#1754cf]/15 bg-[#1754cf]/8 text-[#1754cf]"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            My Requests
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("captain")}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              activeTab === "captain"
                ? "border-[#1754cf]/15 bg-[#1754cf]/8 text-[#1754cf]"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Captain Inbox
          </button>
        </div>
      </section>

      {activeTab === "captain" && captainTeams.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
                Captain Inbox
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">Choose an event group inbox</h2>
              <p className="mt-1 text-sm text-slate-500">
                Switch between your captain groups to review pending join requests.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadPending(selectedTeamId)}
              disabled={!selectedTeamId || loadingPending}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingPending ? "Refreshing..." : "Refresh inbox"}
            </button>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr,1fr]">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Captain Event Group
              </span>
              <select
                value={selectedTeamId}
                onChange={(event) => setSelectedTeamId(event.target.value)}
                className={selectClassName}
              >
                {captainTeams.map((row) => (
                  <option key={row.team_membership_id} value={row.team_id}>
                    {row.team_name} ({row.team_code}) | {row.event_code || "NO-EVENT"}
                  </option>
                ))}
              </select>
            </label>

            <TeamPageDetailTile
              label="Selected Inbox"
              value={selectedCaptainTeam?.team_name || "No captain group selected"}
              subtext={
                selectedCaptainTeam
                  ? `${selectedCaptainTeam.team_code || "No code"} | ${selectedCaptainTeam.event_name || selectedCaptainTeam.event_code || "No event"}`
                  : "Select a captain group to review requests"
              }
            />
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <TeamPageFilters
          className="lg:hidden"
          activeFilters={activeFilters}
          canReset={canResetFilters}
          itemLabel={activeTab === "my" ? "requests" : "inbox requests"}
          onReset={resetFilters}
          panelTitle={activeTab === "my" ? "Filter My Requests" : "Filter Captain Inbox"}
          resultCount={activeTab === "my" ? filteredMyRequests.length : filteredPendingRows.length}
          totalCount={activeTab === "my" ? myRequests.length : pendingRows.length}
          withDivider
        >
          {activeTab === "my" ? (
            <>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Search
                </span>
                <input
                  value={myQuery}
                  onChange={(event) => setMyQuery(event.target.value)}
                  placeholder="Search by event, group, decision, or status"
                  className={inputClassName}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Status
                </span>
                <select
                  value={myStatusFilter}
                  onChange={(event) => setMyStatusFilter(event.target.value)}
                  className={selectClassName}
                >
                  <option value="ALL">All statuses</option>
                  {myStatusOptions
                    .filter((option) => option !== "ALL")
                    .map((option) => (
                      <option key={option} value={option}>
                        {formatLabel(option)}
                      </option>
                    ))}
                </select>
              </label>
            </>
          ) : (
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Search Applicants
              </span>
              <input
                value={captainQuery}
                onChange={(event) => setCaptainQuery(event.target.value)}
                placeholder="Search by student, email, department, or year"
                className={inputClassName}
              />
            </label>
          )}
        </TeamPageFilters>

        {activeTab === "my" ? (
          loading ? (
            <div className="px-4 py-12 text-center text-sm text-slate-500">
              Loading event group requests...
            </div>
          ) : filteredMyRequests.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-slate-500">
              No event-group requests found for the current filters.
            </div>
          ) : (
            <>
              <div className="space-y-3 p-4 lg:hidden">
                {filteredMyRequests.map((row) => (
                  <article
                    key={row.event_request_id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-bold text-slate-900">
                          {row.team_name || "-"}
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {row.event_name || "No event"}
                        </p>
                      </div>
                      <AllGroupsBadge value={formatLabel(row.status, "Unknown")} />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <AllGroupsBadge value={formatLabel(row.team_status, "Unknown")} />
                      <AllGroupsBadge value={formatLabel(row.team_type, "Unknown")} />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <TeamPageDetailTile label="Requested" value={formatDateTime(row.request_date)} />
                      <TeamPageDetailTile
                        label="Decision By"
                        value={formatLabel(row.decision_by_role, "-")}
                      />
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Decision Reason
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {row.decision_reason || "No decision reason yet."}
                      </p>
                    </div>
                  </article>
                ))}
              </div>

              <TeamDesktopTableShell canReset={canResetFilters} onReset={resetFilters}>
                <div className="overflow-x-auto overflow-y-visible rounded-2xl">
                <table className="min-w-[1200px] w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                        <TeamTableHeaderFilterButton
                          active={String(myQuery || "").trim().length > 0}
                          label="Event"
                          panelWidthClass="w-80"
                        >
                          <TeamTableFilterPanel
                            title="Request Search"
                            currentText={String(myQuery || "").trim() || "All requests"}
                            helperText="Search by event, group, decision, or status."
                          >
                            <TeamTableSearchField
                              value={myQuery}
                              onChange={(event) => setMyQuery(event.target.value)}
                              placeholder="Event, group, decision, or status"
                            />
                          </TeamTableFilterPanel>
                        </TeamTableHeaderFilterButton>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">Event Group</th>
                      <th className="px-4 py-3 text-left font-semibold">Type</th>
                      <th className="px-4 py-3 text-left font-semibold">Group Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Requested</th>
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                        <TeamTableHeaderFilterButton active={myStatusFilter !== "ALL"} label="Status">
                          <TeamTableFilterPanel
                            title="Status Filter"
                            currentText={
                              myStatusFilter === "ALL" ? "All statuses" : formatLabel(myStatusFilter)
                            }
                            helperText="Filter your requests by their current decision state."
                          >
                            <TeamTableSelectField
                              value={myStatusFilter}
                              onChange={(event) => setMyStatusFilter(event.target.value)}
                            >
                              <option value="ALL">All statuses</option>
                              {myStatusOptions
                                .filter((option) => option !== "ALL")
                                .map((option) => (
                                  <option key={option} value={option}>
                                    {formatLabel(option)}
                                  </option>
                                ))}
                            </TeamTableSelectField>
                          </TeamTableFilterPanel>
                        </TeamTableHeaderFilterButton>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">Decision By</th>
                      <th className="px-4 py-3 text-left font-semibold">Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredMyRequests.map((row) => (
                      <tr key={row.event_request_id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{row.event_name || "-"}</div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            {row.event_code || "No code"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{row.team_name || "-"}</div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            {row.team_code || "No code"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <AllGroupsBadge value={formatLabel(row.team_type, "Unknown")} />
                        </td>
                        <td className="px-4 py-3">
                          <AllGroupsBadge value={formatLabel(row.team_status, "Unknown")} />
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatDateTime(row.request_date)}
                        </td>
                        <td className="px-4 py-3">
                          <AllGroupsBadge value={formatLabel(row.status, "Unknown")} />
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatLabel(row.decision_by_role, "-")}
                        </td>
                        <td className="px-4 py-3">
                          <p className="max-w-sm leading-6 text-slate-600">
                            {row.decision_reason || "No decision reason yet."}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </TeamDesktopTableShell>
            </>
          )
        ) : captainTeams.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            You are not a captain in any active event group.
          </div>
        ) : pendingError ? (
          <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {pendingError}
          </div>
        ) : loadingPending ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            Loading pending requests...
          </div>
        ) : filteredPendingRows.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            No pending requests found for this inbox.
          </div>
        ) : (
          <>
            <div className="space-y-3 p-4 lg:hidden">
              {filteredPendingRows.map((row) => (
                <article
                  key={row.event_request_id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-slate-900">
                        {row.student_name || "-"}
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-500">{row.student_email || "-"}</p>
                    </div>
                    <AllGroupsBadge value="Pending" />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <TeamPageDetailTile label="Student ID" value={row.student_id || "-"} />
                    <TeamPageDetailTile label="Requested" value={formatDateTime(row.request_date)} />
                    <TeamPageDetailTile label="Department" value={row.department || "-"} />
                    <TeamPageDetailTile label="Year" value={row.year ?? "-"} />
                  </div>

                  <label className="mt-4 block">
                    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Approve As
                    </span>
                    <select
                      value={approvalRoleByRequestId[row.event_request_id] || "MEMBER"}
                      onChange={(event) =>
                        onChangeApprovalRole(row.event_request_id, event.target.value)
                      }
                      disabled={decisionBusyId === row.event_request_id}
                      className={selectClassName}
                    >
                      <option value="MEMBER">Member</option>
                      <option value="VICE_CAPTAIN">Vice Captain</option>
                    </select>
                  </label>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onDecision(row.event_request_id, "APPROVED")}
                      disabled={decisionBusyId === row.event_request_id}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {decisionBusyId === row.event_request_id ? "Working..." : "Approve"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDecision(row.event_request_id, "REJECTED")}
                      disabled={decisionBusyId === row.event_request_id}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {decisionBusyId === row.event_request_id ? "Working..." : "Reject"}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <TeamDesktopTableShell canReset={canResetFilters} onReset={resetFilters}>
              <div className="overflow-x-auto overflow-y-visible rounded-2xl">
              <table className="min-w-[1180px] w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                      <TeamTableHeaderFilterButton
                        active={String(captainQuery || "").trim().length > 0}
                        label="Student"
                        panelWidthClass="w-80"
                      >
                        <TeamTableFilterPanel
                          title="Applicant Search"
                          currentText={String(captainQuery || "").trim() || "All applicants"}
                          helperText="Search by student, email, department, or year."
                        >
                          <TeamTableSearchField
                            value={captainQuery}
                            onChange={(event) => setCaptainQuery(event.target.value)}
                            placeholder="Student, email, department, or year"
                          />
                        </TeamTableFilterPanel>
                      </TeamTableHeaderFilterButton>
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-left font-semibold">Department</th>
                    <th className="px-4 py-3 text-left font-semibold">Year</th>
                    <th className="px-4 py-3 text-left font-semibold">Requested</th>
                    <th className="px-4 py-3 text-left font-semibold">Approve As</th>
                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredPendingRows.map((row) => (
                    <tr key={row.event_request_id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{row.student_name || "-"}</div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          ID: {row.student_id || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.student_email || "-"}</td>
                      <td className="px-4 py-3 text-slate-700">{row.department || "-"}</td>
                      <td className="px-4 py-3 text-slate-700">{row.year ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-700">{formatDateTime(row.request_date)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={approvalRoleByRequestId[row.event_request_id] || "MEMBER"}
                          onChange={(event) =>
                            onChangeApprovalRole(row.event_request_id, event.target.value)
                          }
                          disabled={decisionBusyId === row.event_request_id}
                          className="w-full rounded-xl border border-slate-300 bg-[#f3f4f6] px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10"
                        >
                          <option value="MEMBER">Member</option>
                          <option value="VICE_CAPTAIN">Vice Captain</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onDecision(row.event_request_id, "APPROVED")}
                            disabled={decisionBusyId === row.event_request_id}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {decisionBusyId === row.event_request_id ? "Working..." : "Approve"}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDecision(row.event_request_id, "REJECTED")}
                            disabled={decisionBusyId === row.event_request_id}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {decisionBusyId === row.event_request_id ? "Working..." : "Reject"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </TeamDesktopTableShell>
          </>
        )}
      </section>
    </div>
  );
}
