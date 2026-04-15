import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMyOnDutyRequests } from "../../../service/onDuty.api";
import {
  OnDutyStatusBadge,
  formatOnDutyDateRange,
  formatOnDutyLabel
} from "../../../shared/components/OnDutyUi";
import { WorkspaceFilterBar } from "../../../shared/components/WorkspaceInlineFilters";
import WorkspacePageHeader, {
  WorkspacePageHeaderActionButton
} from "../../../shared/components/WorkspacePageHeader";

export default function StudentOnDutyPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchMyOnDutyRequests();
      setRows(Array.isArray(data?.requests) ? data.requests : []);
    } catch (loadError) {
      setError(loadError?.response?.data?.message || "Failed to load OD requests");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = String(query || "").trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          row.event_name,
          row.event_code,
          row.round_name,
          row.team_name,
          row.team_code,
          row.requested_by_student_name,
          row.requested_by_student_id
        ]
          .map((value) => String(value || "").toLowerCase())
          .join(" ")
          .includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "ALL" ||
        String(row?.admin_status || "").trim().toUpperCase() === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [query, rows, statusFilter]);

  const hasActiveFilters = Boolean(String(query || "").trim()) || statusFilter !== "ALL";
  const resetFilters = useCallback(() => {
    setQuery("");
    setStatusFilter("ALL");
  }, []);
  const filterFields = useMemo(
    () => [
      {
        key: "query",
        type: "search",
        label: "Search",
        value: query,
        placeholder: "Search by event, round, or registration",
        onChangeValue: setQuery
      },
      {
        key: "status",
        type: "select",
        label: "Admin Status",
        value: statusFilter,
        onChangeValue: setStatusFilter,
        wrapperClassName: "w-full sm:w-[180px]",
        options: [
          { value: "ALL", label: "All statuses" },
          { value: "PENDING", label: "Pending" },
          { value: "APPROVED", label: "Approved" },
          { value: "REJECTED", label: "Rejected" },
          { value: "CANCELLED", label: "Cancelled" }
        ]
      }
    ],
    [query, statusFilter]
  );

  return (
    <div className="max-w-screen-2xl space-y-4 p-4 md:p-5">
      <WorkspacePageHeader
        eyebrow="Student Services"
        title="My On Duty"
        description="Track round-wise OD requests and open the related event registration whenever you need more context."
        actions={
          <WorkspacePageHeaderActionButton
            type="button"
            onClick={load}
            disabled={loading}
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            <RefreshRoundedIcon sx={{ fontSize: 18 }} />
            {loading ? "Refreshing..." : "Refresh"}
          </WorkspacePageHeaderActionButton>
        }
      />

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <WorkspaceFilterBar
        fields={filterFields}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            Loading OD requests...
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            No OD requests found for the current filters.
          </div>
        ) : (
          <>
            <div className="space-y-3 p-4 lg:hidden">
              {filteredRows.map((row) => (
                <article
                  key={row.od_request_id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-slate-900">
                        {row.event_name || "-"}
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {row.round_name || "-"} | {row.team_name || "-"}
                      </p>
                    </div>
                    <OnDutyStatusBadge value={row.admin_status} />
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                      <span className="font-medium text-slate-500">OD Dates:</span>{" "}
                      {formatOnDutyDateRange(row.requested_from_date, row.requested_to_date)}
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                      <span className="font-medium text-slate-500">Days:</span>{" "}
                      {row.requested_day_count || 0}
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                      <span className="font-medium text-slate-500">Faculty:</span>{" "}
                      {formatOnDutyLabel(row.faculty_status)}
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                      <span className="font-medium text-slate-500">HOD:</span>{" "}
                      {formatOnDutyLabel(row.hod_status)}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => navigate(`/events/${row.event_id}/groups/${row.team_id}`)}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#1754cf]/15 bg-[#1754cf]/8 px-3.5 py-2 text-sm font-semibold text-[#1754cf] transition hover:bg-[#1754cf]/12"
                    >
                      <LaunchRoundedIcon sx={{ fontSize: 18 }} />
                      Open Registration
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-[1180px] w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Event</th>
                    <th className="px-4 py-3 text-left font-semibold">Round</th>
                    <th className="px-4 py-3 text-left font-semibold">Registration</th>
                    <th className="px-4 py-3 text-left font-semibold">OD Dates</th>
                    <th className="px-4 py-3 text-left font-semibold">Days</th>
                    <th className="px-4 py-3 text-left font-semibold">Faculty</th>
                    <th className="px-4 py-3 text-left font-semibold">HOD</th>
                    <th className="px-4 py-3 text-left font-semibold">Admin</th>
                    <th className="px-4 py-3 text-left font-semibold">Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredRows.map((row) => (
                    <tr key={row.od_request_id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{row.event_name || "-"}</div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {row.event_code || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{row.round_name || "-"}</div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          Round {row.round_order || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{row.team_name || "-"}</div>
                        <div className="mt-0.5 text-xs text-slate-500">{row.team_code || "-"}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatOnDutyDateRange(row.requested_from_date, row.requested_to_date)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.requested_day_count || 0}</td>
                      <td className="px-4 py-3">
                        <OnDutyStatusBadge type="external" value={row.faculty_status} />
                      </td>
                      <td className="px-4 py-3">
                        <OnDutyStatusBadge type="external" value={row.hod_status} />
                      </td>
                      <td className="px-4 py-3">
                        <OnDutyStatusBadge value={row.admin_status} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/events/${row.event_id}/groups/${row.team_id}`)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#1754cf]/15 bg-[#1754cf]/8 px-3 py-2 text-xs font-semibold text-[#1754cf] transition hover:bg-[#1754cf]/12"
                        >
                          <LaunchRoundedIcon sx={{ fontSize: 16 }} />
                          Open
                        </button>
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
