import { useCallback, useEffect, useMemo, useState } from "react";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useNavigate } from "react-router-dom";
import AllGroupsBadge from "../allGroups/AllGroupsBadge";
import {
  TeamDesktopTableShell,
  TeamTableSearchField,
  TeamTableSelectField
} from "./TeamDesktopTableControls";
import TeamPageDetailTile from "./TeamPageDetailTile";
import TeamPageFilters from "./TeamPageFilters";
import TeamPageHero from "./TeamPageHero";
import TeamMembershipLeaveModal from "./TeamMembershipLeaveModal";
import { fetchMyTeamMemberships, leaveTeamMembership } from "../../../service/teams.api";
import {
  formatLabel,
  formatShortDate,
  getUniqueCount,
  normalizeValue
} from "./teamPage.utils";
import { getTeamScopeConfig, TEAM_STATUS_OPTIONS } from "./teamScope.constants";

const inputClassName =
  "w-full rounded-2xl border border-slate-300 bg-[#f3f4f6] px-4 py-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10";

const selectClassName =
  "w-full rounded-2xl border border-slate-300 bg-[#f3f4f6] px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10";

const getLatestJoinLabel = (rows) => {
  const timestamps = (Array.isArray(rows) ? rows : [])
    .map((row) => new Date(row?.join_date).getTime())
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) return "No join date";
  return formatShortDate(new Date(Math.max(...timestamps)));
};

export default function ScopedTeamMembershipsPage({ teamType = "TEAM" }) {
  const navigate = useNavigate();
  const scope = useMemo(() => getTeamScopeConfig(teamType), [teamType]);

  const [rows, setRows] = useState([]);
  const [studentId, setStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [teamStatusFilter, setTeamStatusFilter] = useState("ALL");
  const [leaveModalRow, setLeaveModalRow] = useState(null);
  const [leaveBusyMembershipId, setLeaveBusyMembershipId] = useState(null);
  const [leaveError, setLeaveError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchMyTeamMemberships({ status: "ACTIVE", team_type: scope.teamType });
      setStudentId(data?.student_id || null);
      setRows(Array.isArray(data?.memberships) ? data.memberships : []);
    } catch (err) {
      setError(err?.response?.data?.message || `Failed to load ${scope.pluralLower}`);
      setStudentId(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [scope.pluralLower, scope.teamType]);

  useEffect(() => {
    load();
  }, [load]);

  const distinctRoleCount = useMemo(
    () => getUniqueCount(rows, (row) => normalizeValue(row.role)),
    [rows]
  );
  const uniqueScopeCount = useMemo(
    () => getUniqueCount(rows, (row) => row.team_id || row.team_name),
    [rows]
  );
  const elevatedRoleCount = useMemo(
    () => rows.filter((row) => normalizeValue(row.role) !== "MEMBER").length,
    [rows]
  );
  const latestJoinLabel = useMemo(() => getLatestJoinLabel(rows), [rows]);

  const roleOptions = useMemo(() => {
    return ["ALL", ...new Set(rows.map((row) => normalizeValue(row.role)).filter(Boolean))];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = String(query || "").trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        [row.team_name, row.team_code, row.role, row.status, row.team_status, row.notes]
          .map((value) => String(value || "").toLowerCase())
          .join(" ")
          .includes(normalizedQuery);

      const matchesRole = roleFilter === "ALL" || normalizeValue(row.role) === roleFilter;
      const matchesTeamStatus =
        teamStatusFilter === "ALL" || normalizeValue(row.team_status) === teamStatusFilter;

      return matchesQuery && matchesRole && matchesTeamStatus;
    });
  }, [query, roleFilter, rows, teamStatusFilter]);

  const activeFilters = useMemo(() => {
    const items = [];

    if (String(query || "").trim()) {
      items.push(`Search: ${String(query).trim()}`);
    }
    if (roleFilter !== "ALL") {
      items.push(`Role: ${formatLabel(roleFilter)}`);
    }
    if (teamStatusFilter !== "ALL") {
      items.push(`Status: ${formatLabel(teamStatusFilter)}`);
    }

    return items;
  }, [query, roleFilter, teamStatusFilter]);

  const resetFilters = useCallback(() => {
    setQuery("");
    setRoleFilter("ALL");
    setTeamStatusFilter("ALL");
  }, []);

  const handleOpenDetails = useCallback(
    (row) => {
      if (!row?.team_id) return;
      navigate(`${scope.detailsBasePath}/${row.team_id}`);
    },
    [navigate, scope.detailsBasePath]
  );

  const handleOpenLeaveModal = useCallback((row) => {
    setLeaveError("");
    setLeaveModalRow(row || null);
  }, []);

  const handleCloseLeaveModal = useCallback(() => {
    if (leaveBusyMembershipId) return;
    setLeaveModalRow(null);
    setLeaveError("");
  }, [leaveBusyMembershipId]);

  const handleConfirmLeave = useCallback(async () => {
    const membershipId = Number(leaveModalRow?.team_membership_id);
    if (!membershipId) return;

    setLeaveBusyMembershipId(membershipId);
    setLeaveError("");

    try {
      await leaveTeamMembership(membershipId);
      setLeaveModalRow(null);
      await load();
    } catch (err) {
      setLeaveError(
        err?.response?.data?.message || `Failed to leave ${scope.singularLower}`
      );
    } finally {
      setLeaveBusyMembershipId(null);
    }
  }, [leaveModalRow, load, scope.singularLower]);

  const headerSummary =
    filteredRows.length !== rows.length
      ? `Showing ${filteredRows.length} of ${rows.length} memberships`
      : `${rows.length} active ${scope.singularLower} membership${rows.length === 1 ? "" : "s"}`;

  return (
    <div className="max-w-screen-2xl space-y-3 p-4 md:p-5">
      <TeamPageHero
        loading={loading}
        onRefresh={load}
        eyebrow={scope.membershipEyebrow}
        title={scope.myTitle}
        summary={headerSummary}
        actionLabel="Refresh memberships"
        actionBusyLabel="Refreshing..."
        stats={[
          {
            accentClass: "bg-[#1754cf]",
            detail: `${scope.title} you currently belong to`,
            label: "Active Memberships",
            value: rows.length
          },
          {
            accentClass: "bg-emerald-500",
            detail: `Unique ${scope.pluralLower} across your active memberships`,
            label: scope.title,
            value: uniqueScopeCount
          },
          {
            accentClass: "bg-sky-500",
            detail: `${elevatedRoleCount} membership${elevatedRoleCount === 1 ? "" : "s"} with non-member roles`,
            label: "Distinct Roles",
            value: distinctRoleCount
          },
          {
            accentClass: "bg-slate-400",
            detail: studentId ? `Student ID ${studentId}` : "Membership activity timeline",
            label: "Latest Join Date",
            value: latestJoinLabel
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
          canReset={activeFilters.length > 0}
          itemLabel="memberships"
          onReset={resetFilters}
          panelTitle="Filter Memberships"
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
              placeholder="Search by code, name, role, status, or notes"
              className={inputClassName}
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Role
              </span>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className={selectClassName}
              >
                <option value="ALL">All roles</option>
                {roleOptions
                  .filter((option) => option !== "ALL")
                  .map((option) => (
                    <option key={option} value={option}>
                      {formatLabel(option)}
                    </option>
                  ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {scope.singularLabel} Status
              </span>
              <select
                value={teamStatusFilter}
                onChange={(event) => setTeamStatusFilter(event.target.value)}
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
          </div>
        </TeamPageFilters>

        {loading ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            Loading memberships...
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            {scope.emptyMembershipState}
          </div>
        ) : (
          <div className="space-y-3 p-4 lg:hidden">
            {filteredRows.map((row) => (
              <article
                key={row.team_membership_id || `${row.team_id}-${row.join_date}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold text-slate-900">
                      {row.team_name || "-"}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {row.team_code || "No code"}
                    </p>
                  </div>
                  <AllGroupsBadge value={formatLabel(row.role, "Member")} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <AllGroupsBadge value={formatLabel(row.status, "Unknown")} />
                  <AllGroupsBadge value={formatLabel(row.team_status, "Unknown")} />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <TeamPageDetailTile label="Joined" value={formatShortDate(row.join_date)} />
                  <TeamPageDetailTile
                    label={`${scope.singularLabel} Code`}
                    value={row.team_code || "-"}
                  />
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Notes
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {row.notes || "No notes added for this membership."}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenDetails(row)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                    title={`View ${scope.singularLower} details`}
                  >
                    <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenLeaveModal(row)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                    title={scope.leaveLabel}
                  >
                    <LogoutRoundedIcon sx={{ fontSize: 18 }} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <TeamDesktopTableShell
        canReset={activeFilters.length > 0}
        onReset={resetFilters}
        toolbar={
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="min-w-0 xl:w-[24rem]">
              <TeamTableSearchField
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by code, name, role, status, or notes"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:w-auto">
              <div className="min-w-0 xl:w-48">
                <TeamTableSelectField
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                >
                  <option value="ALL">All roles</option>
                  {roleOptions
                    .filter((option) => option !== "ALL")
                    .map((option) => (
                      <option key={option} value={option}>
                        {formatLabel(option)}
                      </option>
                    ))}
                </TeamTableSelectField>
              </div>

              <div className="min-w-0 xl:w-48">
                <TeamTableSelectField
                  value={teamStatusFilter}
                  onChange={(event) => setTeamStatusFilter(event.target.value)}
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
          </div>
        }
      >
        <div className="overflow-x-auto overflow-y-visible rounded-2xl">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                  {scope.singularLabel}
                </th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Role</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                  Membership
                </th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                  {scope.singularLabel} Status
                </th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Joined</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Notes</th>
                <th className="sticky right-0 bg-slate-50 px-4 py-3 text-left font-semibold whitespace-nowrap shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.14)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={7}>
                    Loading memberships...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={7}>
                    {scope.emptyMembershipState}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.team_membership_id || `${row.team_id}-${row.join_date}`}
                    className="group hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{row.team_name || "-"}</div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {row.team_code || "No code"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <AllGroupsBadge value={formatLabel(row.role, "Member")} />
                    </td>
                    <td className="px-4 py-3">
                      <AllGroupsBadge value={formatLabel(row.status, "Unknown")} />
                    </td>
                    <td className="px-4 py-3">
                      <AllGroupsBadge value={formatLabel(row.team_status, "Unknown")} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatShortDate(row.join_date)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-sm leading-6 text-slate-600">
                        {row.notes || "No notes added for this membership."}
                      </p>
                    </td>
                    <td className="sticky right-0 bg-white px-4 py-3 shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)] group-hover:bg-slate-50/80">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(row)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                          title={`View ${scope.singularLower} details`}
                        >
                          <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenLeaveModal(row)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                          title={scope.leaveLabel}
                        >
                          <LogoutRoundedIcon sx={{ fontSize: 18 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </TeamDesktopTableShell>

      <TeamMembershipLeaveModal
        open={Boolean(leaveModalRow)}
        row={leaveModalRow}
        scope={scope}
        busy={leaveBusyMembershipId === Number(leaveModalRow?.team_membership_id)}
        error={leaveError}
        onCancel={handleCloseLeaveModal}
        onConfirm={handleConfirmLeave}
      />
    </div>
  );
}
