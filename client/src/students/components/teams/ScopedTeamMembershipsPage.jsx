import { useCallback, useEffect, useMemo, useState } from "react";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useNavigate } from "react-router-dom";
import AllGroupsBadge from "../allGroups/AllGroupsBadge";
import { TeamDesktopTableShell } from "./TeamDesktopTableControls";
import TeamPageDetailTile from "./TeamPageDetailTile";
import TeamPageHero from "./TeamPageHero";
import TeamMembershipLeaveModal from "./TeamMembershipLeaveModal";
import { fetchMyTeamMemberships, leaveTeamMembership } from "../../../service/teams.api";
import { WorkspaceFilterBar } from "../../../shared/components/WorkspaceInlineFilters";
import {
  formatLabel,
  formatShortDate,
  getUniqueCount,
  normalizeValue
} from "./teamPage.utils";
import { getTeamScopeConfig, TEAM_STATUS_OPTIONS } from "./teamScope.constants";

const getLatestJoinLabel = (rows) => {
  const timestamps = (Array.isArray(rows) ? rows : [])
    .map((row) => new Date(row?.join_date).getTime())
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) return "No join date";
  return formatShortDate(new Date(Math.max(...timestamps)));
};

export default function ScopedTeamMembershipsPage() {
  const navigate = useNavigate();
  const scope = useMemo(() => getTeamScopeConfig(), []);
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

  const roleOptions = useMemo(
    () => ["ALL", ...new Set(rows.map((row) => normalizeValue(row.role)).filter(Boolean))],
    [rows]
  );

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

  const resetFilters = useCallback(() => {
    setQuery("");
    setRoleFilter("ALL");
    setTeamStatusFilter("ALL");
  }, []);

  const hasActiveFilters =
    Boolean(String(query || "").trim()) || roleFilter !== "ALL" || teamStatusFilter !== "ALL";

  const filterFields = useMemo(
    () => [
      {
        key: "query",
        type: "search",
        label: "Team",
        value: query,
        placeholder: "Search by code, name, role, status, or notes",
        onChangeValue: setQuery
      },
      {
        key: "role",
        type: "select",
        label: "Role",
        value: roleFilter,
        onChangeValue: setRoleFilter,
        wrapperClassName: "w-full sm:w-[180px]",
        options: [
          { value: "ALL", label: "All roles" },
          ...roleOptions
            .filter((option) => option !== "ALL")
            .map((option) => ({
              value: option,
              label: formatLabel(option)
            }))
        ]
      },
      {
        key: "teamStatus",
        type: "select",
        label: `${scope.singularLabel} Status`,
        value: teamStatusFilter,
        onChangeValue: setTeamStatusFilter,
        wrapperClassName: "w-full sm:w-[190px]",
        options: [
          { value: "ALL", label: "All statuses" },
          ...TEAM_STATUS_OPTIONS.map((status) => ({
            value: status,
            label: formatLabel(status)
          }))
        ]
      }
    ],
    [query, roleFilter, roleOptions, scope.singularLabel, teamStatusFilter]
  );

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
      setLeaveError(err?.response?.data?.message || `Failed to leave ${scope.singularLower}`);
    } finally {
      setLeaveBusyMembershipId(null);
    }
  }, [leaveModalRow, load, scope.singularLower]);

  const headerSummary = hasActiveFilters
    ? `${filteredRows.length} team memberships match the current filters`
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

      <div className="lg:hidden">
        <WorkspaceFilterBar
          fields={filterFields}
          onReset={resetFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:hidden">
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
        canReset={hasActiveFilters}
        onReset={resetFilters}
        toolbar={
          <WorkspaceFilterBar
            fields={filterFields}
            onReset={resetFilters}
            hasActiveFilters={hasActiveFilters}
            showReset={false}
          />
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
