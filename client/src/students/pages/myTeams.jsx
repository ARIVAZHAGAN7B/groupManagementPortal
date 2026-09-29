import { useCallback, useEffect, useMemo, useState } from "react";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AllGroupsBadge from "../components/allGroups/AllGroupsBadge";
import {
  TeamDesktopTableShell
} from "../components/teams/TeamDesktopTableControls";
import TeamPageDetailTile from "../components/teams/TeamPageDetailTile";
import TeamPageHero from "../components/teams/TeamPageHero";
import TeamMembersPreviewModal from "../components/teams/TeamMembersPreviewModal";
import {
  fetchEventGroupMemberships,
  fetchMyEventGroupMemberships
} from "../../service/teams.api";
import { WorkspaceFilterBar } from "../../shared/components/WorkspaceInlineFilters";
import {
  formatLabel,
  formatShortDate,
  getUniqueCount,
  normalizeValue
} from "../components/teams/teamPage.utils";

const getNotesPreview = (notes) => {
  const words = String(notes || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "No notes";
  return words.slice(0, 3).join(" ");
};

export default function MyTeamsPage() {
  const [rows, setRows] = useState([]);
  const [studentId, setStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [eventStatusFilter, setEventStatusFilter] = useState("ALL");
  const [viewTeam, setViewTeam] = useState(null);
  const [viewMembers, setViewMembers] = useState([]);
  const [viewMembersLoading, setViewMembersLoading] = useState(false);
  const [viewMembersError, setViewMembersError] = useState("");
  const [viewBusyTeamId, setViewBusyTeamId] = useState(null);
  const [notesDetail, setNotesDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchMyEventGroupMemberships({ status: "ACTIVE" });
      setStudentId(data?.student_id || null);
      setRows(Array.isArray(data?.memberships) ? data.memberships : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load my event groups");
      setStudentId(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const roleCounts = useMemo(() => {
    return rows.reduce((accumulator, row) => {
      const key = normalizeValue(row.role) || "MEMBER";
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});
  }, [rows]);

  const uniqueEventCount = useMemo(
    () => getUniqueCount(rows, (row) => row.event_id || row.event_name),
    [rows]
  );

  const leadershipCount = useMemo(
    () =>
      rows.filter((row) => ["CAPTAIN", "VICE_CAPTAIN"].includes(normalizeValue(row.role))).length,
    [rows]
  );

  const lastJoinedLabel = useMemo(() => {
    const timestamps = rows
      .map((row) => new Date(row.join_date).getTime())
      .filter((value) => Number.isFinite(value));

    if (timestamps.length === 0) return "No join date";
    return formatShortDate(new Date(Math.max(...timestamps)));
  }, [rows]);

  const roleOptions = useMemo(() => {
    return ["ALL", ...new Set(rows.map((row) => normalizeValue(row.role)).filter(Boolean))];
  }, [rows]);

  const eventStatusOptions = useMemo(() => {
    return [
      "ALL",
      ...new Set(rows.map((row) => normalizeValue(row.event_status)).filter(Boolean))
    ];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = String(query || "").trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          row.event_name,
          row.event_code,
          row.team_name,
          row.team_code,
          row.team_type,
          row.team_status,
          row.event_status,
          row.role,
          row.status,
          row.notes
        ]
          .map((value) => String(value || "").toLowerCase())
          .join(" ")
          .includes(normalizedQuery);

      const matchesRole = roleFilter === "ALL" || normalizeValue(row.role) === roleFilter;
      const matchesEventStatus =
        eventStatusFilter === "ALL" || normalizeValue(row.event_status) === eventStatusFilter;

      return matchesQuery && matchesRole && matchesEventStatus;
    });
  }, [eventStatusFilter, query, roleFilter, rows]);

  const resetFilters = useCallback(() => {
    setQuery("");
    setRoleFilter("ALL");
    setEventStatusFilter("ALL");
  }, []);

  const closeViewMembers = useCallback(() => {
    setViewTeam(null);
    setViewMembers([]);
    setViewMembersError("");
    setViewMembersLoading(false);
    setViewBusyTeamId(null);
  }, []);

  const handleViewMembers = useCallback(async (row) => {
    const teamId = Number(row?.team_id);
    if (!teamId) return;

    setViewTeam(row);
    setViewMembers([]);
    setViewMembersError("");
    setViewMembersLoading(true);
    setViewBusyTeamId(teamId);

    try {
      const memberships = await fetchEventGroupMemberships(teamId, { status: "ACTIVE" });
      setViewMembers(Array.isArray(memberships) ? memberships : []);
    } catch (err) {
      setViewMembersError(err?.response?.data?.message || "Failed to load group members");
      setViewMembers([]);
    } finally {
      setViewMembersLoading(false);
      setViewBusyTeamId(null);
    }
  }, []);

  const openNotesDetail = useCallback((row) => {
    setNotesDetail({
      eventName: row?.event_name || "No event",
      teamCode: row?.team_code || "No code",
      teamName: row?.team_name || "Event Group",
      notes: row?.notes || "No notes added for this membership."
    });
  }, []);

  const closeNotesDetail = useCallback(() => {
    setNotesDetail(null);
  }, []);
  const hasActiveFilters =
    Boolean(String(query || "").trim()) ||
    roleFilter !== "ALL" ||
    eventStatusFilter !== "ALL";
  const filterFields = useMemo(
    () => [
      {
        key: "query",
        type: "search",
        label: "Search",
        value: query,
        placeholder: "Search by event, group, role, or notes",
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
        key: "eventStatus",
        type: "select",
        label: "Event Status",
        value: eventStatusFilter,
        onChangeValue: setEventStatusFilter,
        wrapperClassName: "w-full sm:w-[190px]",
        options: [
          { value: "ALL", label: "All event statuses" },
          ...eventStatusOptions
            .filter((option) => option !== "ALL")
            .map((option) => ({
              value: option,
              label: formatLabel(option)
            }))
        ]
      }
    ],
    [eventStatusFilter, eventStatusOptions, query, roleFilter, roleOptions]
  );
  const headerSummary =
    filteredRows.length !== rows.length
      ? `Showing ${filteredRows.length} of ${rows.length} memberships`
      : `${rows.length} active membership${rows.length === 1 ? "" : "s"}`;

  return (
    <div className="max-w-screen-2xl space-y-3 p-4 md:p-5">
      <TeamPageHero
        loading={loading}
        onRefresh={load}
        eyebrow="Membership Overview"
        title="My Event Groups"
        summary={headerSummary}
        actionLabel="Refresh memberships"
        actionBusyLabel="Refreshing..."
        stats={[
          {
            accentClass: "bg-[#1754cf]",
            detail: "Event groups you currently belong to",
            label: "Active Memberships",
            value: rows.length
          },
          {
            accentClass: "bg-emerald-500",
            detail: "Unique events connected to your memberships",
            label: "Events Joined",
            value: uniqueEventCount
          },
          {
            accentClass: "bg-sky-500",
            detail: `${roleCounts.CAPTAIN || 0} captain and ${roleCounts.VICE_CAPTAIN || 0} vice-captain roles`,
            label: "Leadership Roles",
            value: leadershipCount
          },
          {
            accentClass: "bg-slate-400",
            detail: studentId ? `Student ID ${studentId}` : "Membership activity timeline",
            label: "Latest Join Date",
            value: lastJoinedLabel
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
            No memberships found for the current filters.
          </div>
        ) : (
          <>
            <div className="space-y-3 p-4 lg:hidden">
              {filteredRows.map((row) => (
                <article
                  key={row.team_membership_id || `${row.team_id}-${row.event_id}-${row.join_date}`}
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
                    <AllGroupsBadge value={formatLabel(row.role, "Member")} />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <AllGroupsBadge value={formatLabel(row.status, "Unknown")} />
                    <AllGroupsBadge
                      value={formatLabel(row.registration_status || row.team_status, "Unknown")}
                    />
                    <AllGroupsBadge value={formatLabel(row.event_status, "Unknown")} />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <TeamPageDetailTile
                      label="Joined"
                      value={formatShortDate(row.join_date)}
                    />
                    <TeamPageDetailTile
                      label="Type"
                      value={formatLabel(row.team_type, "Unknown")}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => openNotesDetail(row)}
                    className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:border-[#1754cf]/35 hover:bg-[#1754cf]/5"
                    title="Show note details"
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Notes
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                      {getNotesPreview(row.notes)}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleViewMembers(row)}
                    disabled={viewBusyTeamId === Number(row.team_id)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#1754cf]/25 bg-[#1754cf] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1247b4] disabled:cursor-wait disabled:opacity-70"
                    title="View group members"
                  >
                    <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                    {viewBusyTeamId === Number(row.team_id) ? "Loading members..." : "View Members"}
                  </button>
                </article>
              ))}
            </div>

          </>
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
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Event</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Group</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Role</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                  Membership
                </th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                  Group Status
                </th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Event Status</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Joined</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Notes</th>
                <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Members</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={9}>
                    Loading memberships...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={9}>
                    No memberships found for the current filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.team_membership_id || `${row.team_id}-${row.event_id}-${row.join_date}`}
                    className="hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{row.event_name || "-"}</div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {row.event_code || "No code"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{row.team_name || "-"}</div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {formatLabel(row.team_type, "Unknown")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <AllGroupsBadge value={formatLabel(row.role, "Member")} />
                    </td>
                    <td className="px-4 py-3">
                      <AllGroupsBadge value={formatLabel(row.status, "Unknown")} />
                    </td>
                    <td className="px-4 py-3">
                      <AllGroupsBadge
                        value={formatLabel(row.registration_status || row.team_status, "Unknown")}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <AllGroupsBadge value={formatLabel(row.event_status, "Unknown")} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatShortDate(row.join_date)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openNotesDetail(row)}
                        className="inline-flex max-w-[180px] items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:border-[#1754cf]/35 hover:bg-[#1754cf]/5 hover:text-[#1754cf]"
                        title="Show note details"
                      >
                        <span className="truncate">{getNotesPreview(row.notes)}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleViewMembers(row)}
                        disabled={viewBusyTeamId === Number(row.team_id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-[#1754cf]/40 hover:bg-[#1754cf]/5 hover:text-[#1754cf] disabled:cursor-wait disabled:opacity-60"
                        title="View group members"
                        aria-label={`View members of ${row.team_name || "event group"}`}
                      >
                        <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </TeamDesktopTableShell>

      <TeamMembersPreviewModal
        emptyText="No active members found for this event group."
        error={viewMembersError}
        loading={viewMembersLoading}
        onClose={closeViewMembers}
        rows={viewMembers}
        subtitle={
          viewTeam
            ? `${viewTeam.event_name || "No event"} - ${viewTeam.team_code || "No code"}`
            : undefined
        }
        team={viewTeam}
        title={viewTeam?.team_name || "Event Group Members"}
      />

      {notesDetail ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onClick={closeNotesDetail}
          role="dialog"
          aria-modal="true"
          aria-labelledby="notes-detail-title"
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
                    Membership Notes
                  </p>
                  <h2 id="notes-detail-title" className="mt-1 truncate text-xl font-bold text-slate-900">
                    {notesDetail.teamName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {notesDetail.eventName} - {notesDetail.teamCode}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeNotesDetail}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="px-5 py-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {notesDetail.notes}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
