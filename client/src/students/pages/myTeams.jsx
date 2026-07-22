import { useCallback, useEffect, useMemo, useState } from "react";
import AllGroupsBadge from "../components/allGroups/AllGroupsBadge";
import {
  TeamDesktopTableShell
} from "../components/teams/TeamDesktopTableControls";
import TeamPageDetailTile from "../components/teams/TeamPageDetailTile";
import TeamPageHero from "../components/teams/TeamPageHero";
import { fetchMyEventGroupMemberships } from "../../service/teams.api";
import { WorkspaceFilterBar } from "../../shared/components/WorkspaceInlineFilters";
import {
  formatLabel,
  formatShortDate,
  getUniqueCount,
  normalizeValue
} from "../components/teams/teamPage.utils";

export default function MyTeamsPage() {
  const [rows, setRows] = useState([]);
  const [studentId, setStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [eventStatusFilter, setEventStatusFilter] = useState("ALL");

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
                    <AllGroupsBadge value={formatLabel(row.team_status, "Unknown")} />
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

                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Notes
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {row.notes || "No notes added for this membership."}
                    </p>
                  </div>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={8}>
                    Loading memberships...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={8}>
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
                      <AllGroupsBadge value={formatLabel(row.team_status, "Unknown")} />
                    </td>
                    <td className="px-4 py-3">
                      <AllGroupsBadge value={formatLabel(row.event_status, "Unknown")} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatShortDate(row.join_date)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-sm leading-6 text-slate-600">
                        {row.notes || "No notes added for this membership."}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </TeamDesktopTableShell>
    </div>
  );
}
