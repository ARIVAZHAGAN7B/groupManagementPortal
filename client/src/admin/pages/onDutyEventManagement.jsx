import React, { useCallback, useEffect, useMemo, useState } from "react";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useSearchParams } from "react-router-dom";
import { fetchAdminOdEvents, fetchEventTeamsWithOd, reviewOnDutyRequest } from "../../service/onDuty.api";
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
import AdminFormModal from "../components/ui/AdminFormModal";

const OD_PROOF_BADGE = {
  true: { label: "Required", color: "border-amber-200 bg-amber-50 text-amber-700" },
  false: { label: "Optional", color: "border-slate-200 bg-slate-100 text-slate-600" }
};

const EVENT_STATUS_STYLES = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ARCHIVED: "border-slate-200 bg-slate-100 text-slate-600",
  CLOSED: "border-slate-200 bg-slate-100 text-slate-700",
  INACTIVE: "border-rose-200 bg-rose-50 text-rose-700"
};

const TABLE_WRAP_CLASS = "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm";
const TABLE_HEAD_CLASS = "bg-slate-50 text-slate-600";
const TH_CLASS = "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em]";
const TD_CLASS = "px-4 py-3 align-top";

const getStatusPillClass = (status) => {
  const normalized = String(status || "").trim().toUpperCase();
  return EVENT_STATUS_STYLES[normalized] || "border-slate-200 bg-slate-100 text-slate-600";
};

function EventStatusPill({ status }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusPillClass(
        status
      )}`}
    >
      {status || "-"}
    </span>
  );
}

function SummaryMetric({ label, tone = "slate", value }) {
  const toneClass =
    tone === "amber"
      ? "text-amber-600"
      : tone === "emerald"
        ? "text-emerald-600"
        : "text-slate-900";

  return (
    <div className="min-w-[138px] border-l border-slate-200 px-4 py-2 first:border-l-0">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className={`mt-1 text-lg font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}

function OdReviewModal({
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
              Review OD Request
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {request.team_name || "-"} | Round {request.round_order}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {formatOnDutyDateRange(
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
                <span className="font-semibold text-slate-900">Team:</span>{" "}
                {request.team_name || "-"} ({request.team_code || "-"})
              </p>
              <p>
                <span className="font-semibold text-slate-900">Days:</span>{" "}
                {request.requested_day_count || 0} day(s)
              </p>
              {showImagePreview ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Proof Preview
                  </p>
                  <img
                    src={proofUrl}
                    alt="Shortlist proof"
                    loading="lazy"
                    decoding="async"
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
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
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
            className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1754cf]/35 focus:ring-4 focus:ring-[#1754cf]/10"
          />
        </label>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={busy ? undefined : onClose}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="flex-1 rounded-xl bg-[#1754cf] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1754cf]/90 disabled:opacity-50"
            disabled={busy}
          >
            {busy ? "Updating..." : "Update Request"}
          </button>
        </div>
      </section>
    </AdminFormModal>
  );
}

function OnDutyEventManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [reviewingRequest, setReviewingRequest] = useState(null);
  const [reviewFormValues, setReviewFormValues] = useState({
    faculty_status: "PENDING",
    hod_status: "PENDING",
    admin_status: "PENDING",
    faculty_notes: "",
    hod_notes: "",
    admin_notes: ""
  });
  const [reviewError, setReviewError] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

  const selectedEventRequestRows = useMemo(
    () =>
      teams.flatMap((team) =>
        (Array.isArray(team.od_requests) ? team.od_requests : []).map((request) => ({
          ...request,
          team_code: team.team_code,
          team_id: team.team_id,
          team_member_count: team.member_count,
          team_name: team.team_name,
          team_status: team.status
        }))
      ),
    [teams]
  );

  const selectedEventMetrics = useMemo(() => {
    const counts = selectedEventRequestRows.reduce(
      (accumulator, request) => {
        const status = String(request.admin_status || "PENDING").toUpperCase();
        return {
          ...accumulator,
          [status]: (accumulator[status] || 0) + 1
        };
      },
      {
        APPROVED: 0,
        CANCELLED: 0,
        PENDING: 0,
        REJECTED: 0
      }
    );

    return {
      activeTeams: teams.filter((team) => String(team.status || "").toUpperCase() === "ACTIVE")
        .length,
      approved: counts.APPROVED || 0,
      pending: counts.PENDING || 0,
      rejected: counts.REJECTED || 0,
      teams: teams.length,
      totalRequests: selectedEventRequestRows.length
    };
  }, [selectedEventRequestRows, teams]);

  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const data = await fetchAdminOdEvents();
      setEvents(data);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleSelectEvent = useCallback(
    async (event) => {
      setSelectedEvent(event);
      setSearchParams((previousParams) => {
        const nextParams = new URLSearchParams(previousParams);
        nextParams.set("eventId", String(event.event_id));
        return nextParams;
      }, { replace: true });
      setLoadingTeams(true);
      try {
        const data = await fetchEventTeamsWithOd(event.event_id);
        setTeams(data);
      } catch (error) {
        console.error("Error loading teams:", error);
        setTeams([]);
      } finally {
        setLoadingTeams(false);
      }
    },
    [setSearchParams]
  );

  useEffect(() => {
    const eventId = Number(searchParams.get("eventId"));
    if (!eventId || selectedEvent || events.length === 0) return;

    const matchedEvent = events.find((event) => Number(event.event_id) === eventId);
    if (matchedEvent) {
      void handleSelectEvent(matchedEvent);
    }
  }, [events, handleSelectEvent, searchParams, selectedEvent]);

  const handleBackToEvents = useCallback(() => {
    setSelectedEvent(null);
    setTeams([]);
    setSearchParams((previousParams) => {
      const nextParams = new URLSearchParams(previousParams);
      nextParams.delete("eventId");
      return nextParams;
    }, { replace: true });
  }, [setSearchParams]);

  const handleReviewRequest = useCallback((request) => {
    setReviewingRequest(request);
    setReviewFormValues({
      faculty_status: request.faculty_status || "PENDING",
      hod_status: request.hod_status || "PENDING",
      admin_status: request.admin_status || "PENDING",
      faculty_notes: request.faculty_notes || "",
      hod_notes: request.hod_notes || "",
      admin_notes: request.admin_notes || ""
    });
    setReviewError("");
  }, []);

  const handleReviewFormChange = useCallback((field, value) => {
    setReviewFormValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmitReview = useCallback(async () => {
    if (!reviewingRequest) return;

    setReviewBusy(true);
    setReviewError("");
    try {
      await reviewOnDutyRequest(reviewingRequest.od_request_id, reviewFormValues);
      setReviewingRequest(null);
      // Reload teams to show updated statuses
      if (selectedEvent) {
        handleSelectEvent(selectedEvent);
      }
    } catch (error) {
      setReviewError(error?.response?.data?.message || error?.message || "Failed to update OD request");
    } finally {
      setReviewBusy(false);
    }
  }, [reviewingRequest, reviewFormValues, selectedEvent, handleSelectEvent]);

  if (selectedEvent) {
    return (
      <div className="mx-auto w-full max-w-screen-2xl space-y-5 px-3 py-5 md:px-4 xl:px-6">
        <WorkspacePageHeader
          eyebrow="On Duty Desk"
          title={selectedEvent.event_name || "OD Event Management"}
          description={
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-mono text-xs font-semibold text-[#1754cf]">
                {selectedEvent.event_code || `Event ${selectedEvent.event_id}`}
              </span>
              <span className="text-slate-400">|</span>
              <span>{selectedEvent.event_organizer || "No organizer"}</span>
              <span className="text-slate-400">|</span>
              <EventStatusPill status={selectedEvent.status} />
            </div>
          }
          actions={
            <WorkspacePageHeaderActionButton
              onClick={handleBackToEvents}
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              type="button"
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
              Back to Events
            </WorkspacePageHeaderActionButton>
          }
        />

        <section className="flex flex-wrap overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <SummaryMetric label="Teams" value={selectedEventMetrics.teams} />
          <SummaryMetric label="Active Teams" value={selectedEventMetrics.activeTeams} />
          <SummaryMetric label="OD Requests" value={selectedEventMetrics.totalRequests} />
          <SummaryMetric label="Pending" tone="amber" value={selectedEventMetrics.pending} />
          <SummaryMetric label="Approved" tone="emerald" value={selectedEventMetrics.approved} />
          <SummaryMetric label="Rejected" value={selectedEventMetrics.rejected} />
        </section>

        <section className={TABLE_WRAP_CLASS}>
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-bold text-slate-900">Round OD Configuration</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full text-sm">
              <thead className={TABLE_HEAD_CLASS}>
                <tr>
                  <th className={TH_CLASS}>Round</th>
                  <th className={TH_CLASS}>Mode</th>
                  <th className={TH_CLASS}>Dates</th>
                  <th className={TH_CLASS}>Status</th>
                  <th className={TH_CLASS}>Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {(selectedEvent.rounds || []).map((round) => {
                  const proofConfig = OD_PROOF_BADGE[Boolean(round.od_proof_required)];

                  return (
                    <tr key={round.round_id} className="hover:bg-slate-50/80">
                      <td className={TD_CLASS}>
                        <div className="font-semibold text-slate-900">
                          {round.round_name || `Round ${round.round_order || "-"}`}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          Round {round.round_order || "-"}
                        </div>
                      </td>
                      <td className={TD_CLASS}>
                        <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                          {round.round_mode || "-"}
                        </span>
                      </td>
                      <td className={`${TD_CLASS} text-slate-700`}>
                        {formatOnDutyDateRange(round.round_date, round.round_end_date)}
                      </td>
                      <td className={TD_CLASS}>
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          {round.status || "-"}
                        </span>
                      </td>
                      <td className={TD_CLASS}>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${proofConfig.color}`}
                        >
                          {proofConfig.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

          {loadingTeams ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
              <p className="text-sm font-medium text-slate-500">Loading teams...</p>
            </div>
          ) : teams.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
              <p className="text-sm font-medium text-slate-500">No teams registered for this event</p>
            </div>
          ) : selectedEventRequestRows.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
              <p className="text-sm font-medium text-slate-500">No OD requests for this event yet</p>
            </div>
          ) : (
            <section className={TABLE_WRAP_CLASS}>
              <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">OD Review Queue</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {selectedEventRequestRows.length} request(s) across {teams.length} registration(s)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectEvent(selectedEvent)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
                  disabled={loadingTeams}
                >
                  <RefreshRoundedIcon sx={{ fontSize: 18 }} />
                  {loadingTeams ? "Refreshing..." : "Refresh"}
                </button>
              </div>
              <div className="overflow-x-auto">
              <table className="min-w-[1240px] w-full text-sm">
                <thead className={TABLE_HEAD_CLASS}>
                  <tr>
                    <th className={TH_CLASS}>Registration</th>
                    <th className={TH_CLASS}>Round</th>
                    <th className={TH_CLASS}>OD Dates</th>
                    <th className={TH_CLASS}>Days</th>
                    <th className={TH_CLASS}>Requested By</th>
                    <th className={TH_CLASS}>Members</th>
                    <th className={TH_CLASS}>Faculty</th>
                    <th className={TH_CLASS}>HOD</th>
                    <th className={TH_CLASS}>Admin</th>
                    <th className={TH_CLASS}>Proof</th>
                    <th className={TH_CLASS}>Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {selectedEventRequestRows.map((request) => (
                    <tr key={request.od_request_id} className="hover:bg-slate-50/80">
                      <td className={TD_CLASS}>
                        <div className="font-semibold text-slate-900">
                          {request.team_name || "-"}
                        </div>
                        <div className="mt-0.5 text-xs font-mono text-slate-500">
                          {request.team_code || "-"} | {request.team_status || "-"}
                        </div>
                      </td>
                      <td className={TD_CLASS}>
                        <div className="font-semibold text-slate-900">
                          {request.round_name || "-"}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          Round {request.round_order || "-"}
                        </div>
                      </td>
                      <td className={`${TD_CLASS} text-slate-700`}>
                        {formatOnDutyDateRange(
                          request.requested_from_date,
                          request.requested_to_date
                        )}
                      </td>
                      <td className={`${TD_CLASS} text-slate-700`}>
                        {request.requested_day_count || 0}
                      </td>
                      <td className={TD_CLASS}>
                        <div className="font-medium text-slate-800">
                          {request.requested_by_student_name || "-"}
                        </div>
                        <div className="mt-0.5 text-xs font-mono text-slate-500">
                          {request.requested_by_student_id || ""}
                        </div>
                      </td>
                      <td className={`${TD_CLASS} text-slate-700`}>
                        {request.team_member_count || 0}
                      </td>
                      <td className={TD_CLASS}>
                        <OnDutyStatusBadge value={request.faculty_status} type="external" />
                      </td>
                      <td className={TD_CLASS}>
                        <OnDutyStatusBadge value={request.hod_status} type="external" />
                      </td>
                      <td className={TD_CLASS}>
                        <OnDutyStatusBadge value={request.admin_status} type="admin" />
                      </td>
                      <td className={TD_CLASS}>
                        {request.shortlist_proof_path ? (
                          <a
                            href={getOnDutyUploadUrl(request.shortlist_proof_path)}
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
                      <td className={TD_CLASS}>
                        <button
                          type="button"
                          onClick={() => handleReviewRequest(request)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1754cf]/20 bg-[#1754cf]/8 text-[#1754cf] transition hover:bg-[#1754cf]/12"
                          title="Review OD request"
                        >
                          <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </section>
          )}

        <OdReviewModal
          busy={reviewBusy}
          error={reviewError}
          onChange={handleReviewFormChange}
          onClose={() => setReviewingRequest(null)}
          onSubmit={handleSubmitReview}
          open={Boolean(reviewingRequest)}
          request={reviewingRequest}
          values={reviewFormValues}
        />
      </div>
    );
  }

  return (
    <div>
      <WorkspacePageHeader
        title="OD Event Management"
        subtitle="Manage On-Duty approvals by event"
        primaryAction={
          <WorkspacePageHeaderActionButton
            icon={RefreshRoundedIcon}
            label="Refresh"
            onClick={loadEvents}
            loading={loadingEvents}
          />
        }
      />

      <div className="space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        {loadingEvents ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <p className="text-sm font-medium text-slate-500">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
            <p className="text-sm font-medium text-slate-500">No events with OD requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Event</th>
                  <th className="px-4 py-3 text-left font-semibold">Organizer</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Rounds</th>
                  <th className="px-4 py-3 text-left font-semibold">Total OD</th>
                  <th className="px-4 py-3 text-left font-semibold">Pending</th>
                  <th className="px-4 py-3 text-left font-semibold">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {events.map((event) => (
                  <tr key={event.event_id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{event.event_name || "-"}</div>
                      <div className="mt-0.5 text-xs font-mono text-[#1754cf]">
                        {event.event_code || `Event ${event.event_id}`}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {event.event_organizer || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        {event.status || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{event.round_count || 0}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {event.total_od_requests || 0}
                    </td>
                    <td className="px-4 py-3 font-semibold text-amber-600">
                      {event.pending_od_requests || 0}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleSelectEvent(event)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1754cf]/20 bg-[#1754cf]/8 text-[#1754cf] transition hover:bg-[#1754cf]/12"
                        title="Manage event OD requests"
                      >
                        <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default OnDutyEventManagement;
