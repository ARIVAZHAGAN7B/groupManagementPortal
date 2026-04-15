import { useCallback, useEffect, useState } from "react";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useSearchParams } from "react-router-dom";
import useClientPagination from "../../hooks/useClientPagination";
import { fetchEvents } from "../../service/events.api";
import { fetchOnDutyRequests, reviewOnDutyRequest } from "../../service/onDuty.api";
import { fetchEventGroupMemberships } from "../../service/teams.api";
import OnDutyFiltersPanel from "../../shared/components/OnDutyFiltersPanel";
import {
  ON_DUTY_ADMIN_STATUS_OPTIONS,
  ON_DUTY_EXTERNAL_STATUS_OPTIONS,
  OnDutyStatusBadge,
  formatOnDutyDateRange,
  getOnDutyUploadUrl,
  isOnDutyImageProof
} from "../../shared/components/OnDutyUi";
import WorkspacePageHeader, {
  WorkspacePageHeaderActionButton
} from "../../shared/components/WorkspacePageHeader";
import TeamManagementMembersModal from "../components/teamManagement/TeamManagementMembersModal";
import AdminFormModal from "../components/ui/AdminFormModal";
import AdminPaginationBar from "../components/ui/AdminPaginationBar";

function ReviewModal({
  busy = false,
  error = "",
  onChange,
  onClose,
  onSubmit,
  open,
  request,
  values
}) {
  if (!open || !request) return null;

  const proofUrl = getOnDutyUploadUrl(request.shortlist_proof_path);
  const showImagePreview =
    proofUrl && isOnDutyImageProof(request.shortlist_proof_type, request.shortlist_proof_path);

  return (
    <AdminFormModal busy={busy} open={open} onClose={onClose}>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1754cf]">
              Review OD
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {request.team_name || "-"} | {request.round_name || "-"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {request.event_name || "-"} | {formatOnDutyDateRange(
                request.requested_from_date,
                request.requested_to_date
              )} | {request.requested_day_count || 0} day(s)
            </p>
          </div>

          <button
            type="button"
            onClick={busy ? undefined : onClose}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Request Details
            </h3>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-900">Requested By:</span>{" "}
                {request.requested_by_student_name || request.requested_by_student_id}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Registration:</span>{" "}
                {request.team_name || "-"} ({request.team_code || "-"})
              </p>
              <p>
                <span className="font-semibold text-slate-900">Offline Window:</span>{" "}
                {formatOnDutyDateRange(request.round_date, request.round_end_date)}
              </p>
              {showImagePreview ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Proof Preview
                  </p>
                  <img
                    src={proofUrl}
                    alt="Shortlist proof"
                    className="h-48 w-full rounded-xl border border-slate-200 object-cover"
                  />
                </div>
              ) : null}
              {proofUrl ? (
                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#1754cf] hover:underline"
                >
                  <OpenInNewRoundedIcon sx={{ fontSize: 16 }} />
                  Open shortlist proof
                </a>
              ) : (
                <p className="text-sm text-slate-500">No proof uploaded.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Approvals
            </h3>
            <div className="mt-3 grid gap-4">
              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Faculty Status
                </span>
                <select
                  value={values.faculty_status}
                  onChange={(event) => onChange("faculty_status", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1754cf]/35 focus:ring-4 focus:ring-[#1754cf]/10"
                >
                  {ON_DUTY_EXTERNAL_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  HOD Status
                </span>
                <select
                  value={values.hod_status}
                  onChange={(event) => onChange("hod_status", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1754cf]/35 focus:ring-4 focus:ring-[#1754cf]/10"
                >
                  {ON_DUTY_EXTERNAL_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Admin Status
                </span>
                <select
                  value={values.admin_status}
                  onChange={(event) => onChange("admin_status", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1754cf]/35 focus:ring-4 focus:ring-[#1754cf]/10"
                >
                  {ON_DUTY_ADMIN_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Faculty Notes
            </span>
            <textarea
              value={values.faculty_notes}
              onChange={(event) => onChange("faculty_notes", event.target.value)}
              className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1754cf]/35 focus:ring-4 focus:ring-[#1754cf]/10"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              HOD Notes
            </span>
            <textarea
              value={values.hod_notes}
              onChange={(event) => onChange("hod_notes", event.target.value)}
              className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1754cf]/35 focus:ring-4 focus:ring-[#1754cf]/10"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Admin Notes
          </span>
          <textarea
            value={values.admin_notes}
            onChange={(event) => onChange("admin_notes", event.target.value)}
            className="min-h-[116px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1754cf]/35 focus:ring-4 focus:ring-[#1754cf]/10"
          />
        </label>

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={busy ? undefined : onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={busy}
            className="rounded-xl bg-[#1754cf] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? "Saving..." : "Save Review"}
          </button>
        </div>
      </section>
    </AdminFormModal>
  );
}

export default function OnDutyManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [eventFilter, setEventFilter] = useState(searchParams.get("eventId") || "ALL");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL");
  const [reviewRow, setReviewRow] = useState(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewValues, setReviewValues] = useState({
    faculty_status: "PENDING",
    hod_status: "PENDING",
    admin_status: "PENDING",
    faculty_notes: "",
    hod_notes: "",
    admin_notes: ""
  });
  const [viewTeam, setViewTeam] = useState(null);
  const [viewMembers, setViewMembers] = useState([]);
  const [viewMembersLoading, setViewMembersLoading] = useState(false);
  const [viewMembersError, setViewMembersError] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchOnDutyRequests({
        event_id: eventFilter !== "ALL" ? Number(eventFilter) : undefined,
        admin_status: statusFilter !== "ALL" ? statusFilter : undefined,
        search: String(search || "").trim() || undefined
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError?.response?.data?.message || "Failed to load OD requests");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [eventFilter, search, statusFilter]);

  const loadEvents = useCallback(async () => {
    try {
      const data = await fetchEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (_error) {
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    const nextSearchParams = new URLSearchParams();
    if (String(search || "").trim()) {
      nextSearchParams.set("search", String(search).trim());
    }
    if (eventFilter !== "ALL") {
      nextSearchParams.set("eventId", eventFilter);
    }
    if (statusFilter !== "ALL") {
      nextSearchParams.set("status", statusFilter);
    }
    setSearchParams(nextSearchParams, { replace: true });
  }, [eventFilter, search, setSearchParams, statusFilter]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const {
    limit,
    page,
    pageCount,
    pagedItems: pagedRows,
    setLimit,
    setPage
  } = useClientPagination(rows);

  useEffect(() => {
    setPage(1);
  }, [rows, setPage]);

  const handleOpenReview = (row) => {
    setReviewRow(row);
    setReviewError("");
    setReviewValues({
      faculty_status: row?.faculty_status || "PENDING",
      hod_status: row?.hod_status || "PENDING",
      admin_status: row?.admin_status || "PENDING",
      faculty_notes: row?.faculty_notes || "",
      hod_notes: row?.hod_notes || "",
      admin_notes: row?.admin_notes || ""
    });
  };

  const handleCloseReview = () => {
    if (reviewBusy) return;
    setReviewRow(null);
    setReviewError("");
  };

  const handleSubmitReview = async () => {
    if (!reviewRow?.od_request_id) return;

    setReviewBusy(true);
    setReviewError("");
    setError("");
    setSuccessMessage("");

    try {
      await reviewOnDutyRequest(reviewRow.od_request_id, reviewValues);
      setSuccessMessage(`OD review updated for ${reviewRow.team_name || reviewRow.team_code || "request"}.`);
      setReviewRow(null);
      await loadRequests();
    } catch (submitError) {
      setReviewError(submitError?.response?.data?.message || "Failed to save OD review");
    } finally {
      setReviewBusy(false);
    }
  };

  const handleOpenMembers = async (row) => {
    setViewTeam(row);
    setViewMembers([]);
    setViewMembersError("");
    setViewMembersLoading(true);

    try {
      const membershipRows = await fetchEventGroupMemberships(row.team_id, { status: "ACTIVE" });
      setViewMembers(Array.isArray(membershipRows) ? membershipRows : []);
    } catch (memberError) {
      setViewMembersError(
        memberError?.response?.data?.message || "Failed to load registration members"
      );
      setViewMembers([]);
    } finally {
      setViewMembersLoading(false);
    }
  };

  const handleCloseMembers = () => {
    setViewTeam(null);
    setViewMembers([]);
    setViewMembersError("");
    setViewMembersLoading(false);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-screen-2xl space-y-6 px-3 py-5 md:px-4 xl:px-6">
        <WorkspacePageHeader
          eyebrow="On Duty Desk"
          title="OD Management"
          description="Review round-wise OD requests, validate shortlist proof for later offline rounds, and update approval decisions cleanly from one place."
          actions={
            <WorkspacePageHeaderActionButton
              type="button"
              onClick={loadRequests}
              disabled={loading}
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              <RefreshRoundedIcon sx={{ fontSize: 18 }} />
              {loading ? "Refreshing..." : "Refresh"}
            </WorkspacePageHeaderActionButton>
          }
        />

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        <OnDutyFiltersPanel
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Event, round, team, or student"
          filters={[
            {
              label: "Event",
              value: eventFilter,
              onChange: setEventFilter,
              options: [
                { value: "ALL", label: "All events" },
                ...events.map((row) => ({
                  value: String(row.event_id),
                  label: row.event_name || row.event_code || `Event ${row.event_id}`
                }))
              ]
            },
            {
              label: "Admin Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "ALL", label: "All statuses" },
                ...ON_DUTY_ADMIN_STATUS_OPTIONS.map((status) => ({
                  value: status,
                  label: status
                }))
              ]
            }
          ]}
          onReset={() => {
            setSearch("");
            setEventFilter("ALL");
            setStatusFilter("ALL");
          }}
          footer={`${rows.length} request(s) matched the current filters`}
        />

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
            Loading OD requests...
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
            No OD requests matched the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[1340px] w-full text-sm">
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
                  <th className="px-4 py-3 text-left font-semibold">Proof</th>
                  <th className="px-4 py-3 text-left font-semibold">Members</th>
                  <th className="px-4 py-3 text-left font-semibold">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {pagedRows.map((row) => (
                  <tr key={row.od_request_id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{row.event_name || "-"}</div>
                      <div className="mt-0.5 text-xs font-mono text-slate-500">
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
                      <div className="mt-0.5 text-xs font-mono text-slate-500">
                        {row.team_code || "-"}
                      </div>
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
                      <OnDutyStatusBadge type="admin" value={row.admin_status} />
                    </td>
                    <td className="px-4 py-3">
                      {row.shortlist_proof_path ? (
                        <a
                          href={getOnDutyUploadUrl(row.shortlist_proof_path)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1754cf] hover:underline"
                        >
                          <OpenInNewRoundedIcon sx={{ fontSize: 16 }} />
                          Open
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleOpenMembers(row)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:border-[#1754cf]/25 hover:text-[#1754cf]"
                        title="View members"
                      >
                        <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleOpenReview(row)}
                        className="rounded-xl border border-[#1754cf]/15 bg-[#1754cf]/8 px-3.5 py-2 text-xs font-semibold text-[#1754cf] transition hover:bg-[#1754cf]/12"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminPaginationBar
          itemLabel="OD requests"
          limit={limit}
          loading={loading}
          onLimitChange={setLimit}
          onPageChange={setPage}
          page={page}
          pageCount={pageCount}
          shownCount={pagedRows.length}
          totalCount={rows.length}
        />
      </div>

      <ReviewModal
        busy={reviewBusy}
        error={reviewError}
        onChange={(field, value) =>
          setReviewValues((previousValue) => ({ ...previousValue, [field]: value }))
        }
        onClose={handleCloseReview}
        onSubmit={handleSubmitReview}
        open={Boolean(reviewRow)}
        request={reviewRow}
        values={reviewValues}
      />

      <TeamManagementMembersModal
        error={viewMembersError}
        loading={viewMembersLoading}
        onClose={handleCloseMembers}
        rows={viewMembers}
        scopeConfig={{
          scopeLabel:
            String(viewTeam?.registration_mode || "").toUpperCase() === "INDIVIDUAL"
              ? "Event Entry"
              : "Event Group"
        }}
        team={viewTeam}
      />
    </>
  );
}
