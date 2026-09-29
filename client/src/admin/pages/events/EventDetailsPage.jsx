import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchEventById } from "../../../service/events.api";
import {
  fetchAllTeamMemberships,
  fetchEventGroupsByEvent,
  updateEventGroupRoundProgress
} from "../../../service/teams.api";
import {
  formatCountValue,
  formatDate,
  formatDurationDays,
  getBalanceCount
} from "../../components/events/eventManagement.constants";
import AdminWorkspaceHero, {
  AdminWorkspaceHeroActionButton
} from "../../components/ui/AdminWorkspaceHero";
import TeamManagementMembersModal from "../../components/teamManagement/TeamManagementMembersModal";
import {
  getEventDateRangeLabel,
  getEventMemberLimitLabel,
  getEventRegistrationModeLabel,
  getEventRegistrationDateRangeLabel,
  getNormalizedExternalUrl
} from "../../../students/components/events/events.constants";

function SummaryCard({ children, className = "", title }) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <h2 className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </h2>
      <div className="divide-y divide-slate-100">{children}</div>
    </section>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="grid gap-2 px-4 py-3 sm:grid-cols-[180px_minmax(0,1fr)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-900 sm:text-right">{value || "-"}</p>
    </div>
  );
}

function StatusPill({ tone = "default", value }) {
  const toneClassName = {
    default: "border-slate-200 bg-slate-100 text-slate-700",
    info: "border-[#1754cf]/20 bg-[#1754cf]/10 text-[#1754cf]",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700"
  }[tone];

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClassName}`}
    >
      {value || "-"}
    </span>
  );
}

const TABLE_WRAP_CLASS = "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm";
const TABLE_HEAD_CLASS = "bg-slate-50 text-slate-600";
const TH_CLASS = "whitespace-nowrap px-3.5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em]";
const TD_CLASS = "whitespace-nowrap px-3.5 py-2.5 align-middle";

function SummaryMetric({ label, tone = "slate", value }) {
  const toneClass =
    tone === "amber"
      ? "text-amber-600"
      : tone === "emerald"
        ? "text-emerald-600"
        : tone === "rose"
          ? "text-rose-600"
          : "text-slate-900";

  return (
    <div className="min-w-[148px] flex-1 border-l border-slate-200 px-4 py-3 first:border-l-0">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className={`mt-1 text-lg font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}

const getRequiredMinMembers = (event) => {
  const parsed = Number(event?.min_members);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 1;
  }
  return parsed;
};

const getRegistrationState = (event, teamRow) => {
  const explicitStatus = String(teamRow?.registration_status || "").toUpperCase();
  if (explicitStatus === "REGISTERED") {
    return {
      tone: "success",
      value: "Registered"
    };
  }
  if (explicitStatus === "PENDING") {
    const missingCount =
      Number(teamRow?.registration_missing_member_count) ||
      Math.max(getRequiredMinMembers(event) - (Number(teamRow?.active_member_count) || 0), 0);
    return {
      tone: "warning",
      value: missingCount > 0 ? `Needs ${missingCount}` : "Pending"
    };
  }

  const activeMembers = Number(teamRow?.active_member_count) || 0;
  const teamStatus = String(teamRow?.status || "").toUpperCase();
  const requiredMinMembers = getRequiredMinMembers(event);

  if (teamStatus !== "ACTIVE") {
    return {
      tone: teamStatus === "ARCHIVED" ? "danger" : "warning",
      value: teamStatus || "-"
    };
  }

  if (activeMembers >= requiredMinMembers) {
    return {
      tone: "success",
      value: "Valid"
    };
  }

  const missingCount = requiredMinMembers - activeMembers;
  return {
    tone: "warning",
    value: `Needs ${missingCount}`
  };
};

const getTimeLabel = (startTime, endTime) => {
  const segments = [
    startTime ? String(startTime).slice(0, 5) : null,
    endTime ? String(endTime).slice(0, 5) : null
  ].filter(Boolean);

  return segments.length > 0 ? segments.join(" - ") : "Time not set";
};

const getRoundDateLabel = (round) => {
  const startDate = formatDate(round?.round_date);
  const endDate = formatDate(round?.round_end_date || round?.round_date);

  if (!round?.round_date && !round?.round_end_date) {
    return "Date not set";
  }

  if ((round?.round_end_date || round?.round_date) === round?.round_date) {
    return startDate;
  }

  return `${startDate} - ${endDate}`;
};

const buildMembersByTeamId = (rows = []) => {
  const map = new Map();

  for (const row of Array.isArray(rows) ? rows : []) {
    const teamId = Number(row?.team_id);
    if (!teamId) continue;

    const existingRows = map.get(teamId) || [];
    existingRows.push(row);
    map.set(teamId, existingRows);
  }

  for (const [teamId, teamRows] of map.entries()) {
    teamRows.sort((left, right) => {
      const leftRole = String(left?.role || "").toUpperCase();
      const rightRole = String(right?.role || "").toUpperCase();
      if (leftRole === rightRole) {
        return String(left?.student_name || "").localeCompare(String(right?.student_name || ""));
      }
      if (leftRole === "CAPTAIN") return -1;
      if (rightRole === "CAPTAIN") return 1;
      return String(leftRole).localeCompare(String(rightRole));
    });
    map.set(teamId, teamRows);
  }

  return map;
};

const getParticipantPrimaryLabel = (teamRow, members = [], isIndividualRegistration = false) => {
  if (isIndividualRegistration) {
    return members[0]?.student_name || teamRow?.team_name || "-";
  }
  return teamRow?.team_name || "-";
};

const getParticipantSecondaryLabel = (teamRow, members = [], isIndividualRegistration = false) => {
  if (isIndividualRegistration) {
    return members[0]?.student_id || teamRow?.team_code || "-";
  }
  return teamRow?.team_code || "-";
};

const getHighestClearedRoundLabel = (roundsCleared, rounds = []) => {
  const normalized = Number(roundsCleared) || 0;
  if (normalized <= 0) return "Not cleared yet";
  return rounds[normalized - 1]?.round_name || `Round ${normalized}`;
};

const getNextRoundLabelForTeam = (roundsCleared, rounds = []) => {
  const normalized = Number(roundsCleared) || 0;
  if (rounds.length === 0) return "No rounds configured";
  if (normalized >= rounds.length) return "Event complete";
  return rounds[normalized]?.round_name || `Round ${normalized + 1}`;
};

const getRoundProgressOptions = ({ roundsCleared, roundCount, selectedRoundOrder }) => {
  const currentRoundProgress = Math.max(0, Number(roundsCleared) || 0);
  const cappedRoundCount = Math.max(0, Number(roundCount) || 0);
  const currentTabRoundOrder = Number(selectedRoundOrder) || 0;
  const maxProgress = currentTabRoundOrder
    ? Math.max(currentRoundProgress, Math.min(currentTabRoundOrder, cappedRoundCount))
    : Math.min(cappedRoundCount, currentRoundProgress + 1);

  return Array.from({ length: maxProgress + 1 }, (_, index) => index);
};

export default function EventDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [teamRows, setTeamRows] = useState([]);
  const [membershipRows, setMembershipRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progressBusyTeamId, setProgressBusyTeamId] = useState(null);
  const [progressError, setProgressError] = useState("");
  const [roundProgressDrafts, setRoundProgressDrafts] = useState({});
  const [selectedRoundOrder, setSelectedRoundOrder] = useState(null);
  const [viewTeam, setViewTeam] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setProgressError("");

    try {
      const [eventRow, groupRows, eventMemberships] = await Promise.all([
        fetchEventById(id),
        fetchEventGroupsByEvent(id),
        fetchAllTeamMemberships({
          event_id: Number(id),
          team_type: "EVENT",
          status: "ACTIVE"
        })
      ]);
      const normalizedRows = Array.isArray(groupRows) ? groupRows : [];
      const normalizedMembershipRows = Array.isArray(eventMemberships) ? eventMemberships : [];

      setEvent(eventRow || null);
      setTeamRows(normalizedRows);
      setMembershipRows(normalizedMembershipRows);
      setSelectedRoundOrder(null);
      setRoundProgressDrafts(
        Object.fromEntries(
          normalizedRows.map((row) => [
            String(row.team_id),
            String(Number(row.rounds_cleared) || 0)
          ])
        )
      );
    } catch (loadError) {
      setError(loadError?.response?.data?.message || "Failed to load event details");
      setEvent(null);
      setTeamRows([]);
      setMembershipRows([]);
      setSelectedRoundOrder(null);
      setRoundProgressDrafts({});
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const rounds = Array.isArray(event?.rounds) ? event.rounds : [];
  const isIndividualRegistration =
    String(event?.registration_mode || "TEAM").toUpperCase() === "INDIVIDUAL";
  const registrationLink = useMemo(
    () => getNormalizedExternalUrl(event?.registration_link),
    [event?.registration_link]
  );
  const durationLabel = useMemo(
    () => formatDurationDays(event?.start_date, event?.end_date, event?.duration_days),
    [event?.duration_days, event?.end_date, event?.start_date]
  );
  const availableSlotsLabel = useMemo(() => {
    if (event?.maximum_count === null || event?.maximum_count === undefined) {
      return "Unlimited";
    }
    return getBalanceCount(event?.maximum_count, event?.applied_count);
  }, [event?.applied_count, event?.maximum_count]);
  const membershipRowsByTeamId = useMemo(
    () => buildMembersByTeamId(membershipRows),
    [membershipRows]
  );

  const registeredParticipantRows = useMemo(() => {
    return [...teamRows].sort((left, right) => {
      const leftMembers = membershipRowsByTeamId.get(Number(left?.team_id)) || [];
      const rightMembers = membershipRowsByTeamId.get(Number(right?.team_id)) || [];
      const leftLabel = getParticipantPrimaryLabel(left, leftMembers, isIndividualRegistration);
      const rightLabel = getParticipantPrimaryLabel(right, rightMembers, isIndividualRegistration);

      return String(leftLabel).localeCompare(String(rightLabel));
    });
  }, [isIndividualRegistration, membershipRowsByTeamId, teamRows]);

  const roundTimelineRows = useMemo(() => {
    return rounds.map((round, index) => {
      const roundOrder = Number(round?.round_order) || index + 1;
      const participants = registeredParticipantRows.filter(
        (row) => (Number(row?.rounds_cleared) || 0) >= roundOrder - 1
      );

      return {
        alignment: index % 2 === 0 ? "left" : "right",
        participants,
        round,
        roundOrder
      };
    });
  }, [registeredParticipantRows, rounds]);
  const selectedRoundEntry = useMemo(
    () =>
      roundTimelineRows.find(
        (row) => Number(row.roundOrder) === Number(selectedRoundOrder)
      ) || null,
    [roundTimelineRows, selectedRoundOrder]
  );
  const selectedRoundParticipantLabel = isIndividualRegistration ? "Entries" : "Teams";
  const progressRows = registeredParticipantRows;
  const filteredProgressRows = useMemo(() => {
    if (!selectedRoundEntry) return progressRows;
    return Array.isArray(selectedRoundEntry.participants)
      ? selectedRoundEntry.participants
      : [];
  }, [progressRows, selectedRoundEntry]);
  const eventMetrics = useMemo(() => {
    const validRows = teamRows.filter((row) => {
      const state = getRegistrationState(event, row);
      return state.value === "Valid" || state.value === "Registered";
    });
    const activeRows = teamRows.filter(
      (row) => String(row?.status || "").toUpperCase() === "ACTIVE"
    );
    const completeRows = teamRows.filter(
      (row) => rounds.length > 0 && (Number(row?.rounds_cleared) || 0) >= rounds.length
    );

    return {
      active: activeRows.length,
      availableSlots: availableSlotsLabel,
      complete: completeRows.length,
      rounds: rounds.length,
      total: teamRows.length,
      valid: validRows.length
    };
  }, [availableSlotsLabel, event, rounds.length, teamRows]);

  const handleSelectRound = (roundOrder) => {
    setSelectedRoundOrder(roundOrder === null ? null : Number(roundOrder));
  };

  const handleSaveRoundsCleared = async (teamId) => {
    setProgressBusyTeamId(teamId);
    setProgressError("");

    try {
      await updateEventGroupRoundProgress(teamId, {
        rounds_cleared: Number(roundProgressDrafts[String(teamId)] || 0)
      });
      await load();
    } catch (updateError) {
      setProgressError(
        updateError?.response?.data?.message || "Failed to update round progress"
      );
    } finally {
      setProgressBusyTeamId(null);
    }
  };

  const handleOpenMembers = (teamRow) => {
    setViewTeam(teamRow || null);
  };

  const handleCloseMembers = () => {
    setViewTeam(null);
  };

  const viewedMembers = useMemo(() => {
    if (!viewTeam?.team_id) return [];
    return membershipRowsByTeamId.get(Number(viewTeam.team_id)) || [];
  }, [membershipRowsByTeamId, viewTeam]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-screen-2xl px-3 py-5 md:px-4 xl:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
          Loading event details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-screen-2xl px-3 py-5 md:px-4 xl:px-6">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto w-full max-w-screen-2xl px-3 py-5 md:px-4 xl:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
          Event not found.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-screen-2xl space-y-6 px-3 py-5 md:px-4 xl:px-6">
        <AdminWorkspaceHero
          eyebrow="Event Workspace"
          title={event.event_name || "-"}
          titleMeta={
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="info" value={event.status || "-"} />
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {getEventRegistrationModeLabel(event)}
              </span>
            </div>
          }
          description={
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs text-slate-600">
                  {event.event_code || "-"}
                </span>
                <span>{event.event_organizer || "Host not specified"}</span>
                {event.location ? (
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                    {event.location}
                  </span>
                ) : null}
              </div>
              <p className="max-w-4xl text-sm leading-6 text-slate-600">
                {event.description || "No student-facing notes have been added for this event yet."}
              </p>
            </div>
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <AdminWorkspaceHeroActionButton
                type="button"
                onClick={() => navigate("/event-management")}
                className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              >
                <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
                Back
              </AdminWorkspaceHeroActionButton>

              <AdminWorkspaceHeroActionButton
                type="button"
                onClick={load}
                disabled={loading}
                className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              >
                <RefreshRoundedIcon sx={{ fontSize: 18 }} />
                Refresh
              </AdminWorkspaceHeroActionButton>

              <AdminWorkspaceHeroActionButton
                type="button"
                onClick={() => navigate(`/on-duty-management?eventId=${event.event_id}`)}
                className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              >
                Manage OD
              </AdminWorkspaceHeroActionButton>

              {registrationLink ? (
                <a
                  href={registrationLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#1754cf]/15 bg-white px-3.5 py-2 text-sm font-semibold text-[#1754cf] transition-colors hover:bg-[#1754cf]/5"
                >
                  <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />
                  Open Event Page
                </a>
              ) : null}
            </div>
          }
        />

        <section className="flex flex-wrap overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <SummaryMetric label={isIndividualRegistration ? "Entries" : "Teams"} value={eventMetrics.total} />
          <SummaryMetric label="Active" tone="emerald" value={eventMetrics.active} />
          <SummaryMetric label="Valid" tone="emerald" value={eventMetrics.valid} />
          <SummaryMetric label="Rounds" value={eventMetrics.rounds} />
          <SummaryMetric label="Completed" value={eventMetrics.complete} />
          <SummaryMetric label="Slots" tone="amber" value={eventMetrics.availableSlots} />
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <SummaryCard title="Event Summary">
            <SummaryRow label="Event Dates" value={getEventDateRangeLabel(event)} />
            <SummaryRow
              label="Registration Window"
              value={getEventRegistrationDateRangeLabel(event)}
            />
            <SummaryRow
              label="Duration"
              value={durationLabel === "-" ? "-" : `${durationLabel} day(s)`}
            />
            <SummaryRow label="Location" value={event.location || "-"} />
          </SummaryCard>

          <SummaryCard title="Registration Overview">
            <SummaryRow label="Registration Mode" value={getEventRegistrationModeLabel(event)} />
            <SummaryRow label="Member Limits" value={getEventMemberLimitLabel(event)} />
            <SummaryRow
              label="Valid Registrations"
              value={formatCountValue(event.applied_count)}
            />
            <SummaryRow label="Available Slots" value={availableSlotsLabel} />
          </SummaryCard>

          <SummaryCard title="Notes">
            <SummaryRow label="Host / Organizer" value={event.event_organizer || "-"} />
            <SummaryRow label="Configured Rounds" value={String(rounds.length || 0)} />
            <SummaryRow
              label="Participation Notes"
              value={event.selected_resources || "-"}
            />
            <SummaryRow label="Reference Link" value={registrationLink ? "Available" : "-"} />
          </SummaryCard>
        </section>

        <section className={TABLE_WRAP_CLASS}>
          <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {selectedRoundEntry
                  ? `${selectedRoundEntry.round?.round_name || `Round ${selectedRoundOrder}`} Tracking`
                  : isIndividualRegistration
                    ? "Participant Tracking"
                    : "Team Tracking"}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {selectedRoundEntry
                  ? selectedRoundEntry.roundOrder === 1
                    ? "Round 1 starts with every registered team or entry."
                    : "Only teams or entries shortlisted from the previous round are shown."
                  : isIndividualRegistration
                    ? "Use round tabs to see registered entries first, then only shortlisted entries."
                    : "Use round tabs to see registered teams first, then only shortlisted teams."}
              </p>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => handleSelectRound(null)}
                className={`shrink-0 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                  selectedRoundEntry
                    ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    : "border-[#1754cf]/20 bg-[#1754cf] text-white shadow-sm shadow-[#1754cf]/20"
                }`}
              >
                All {selectedRoundParticipantLabel}
              </button>

              {roundTimelineRows.map(({ participants, round, roundOrder }) => {
                const selected = Number(selectedRoundOrder) === Number(roundOrder);

                return (
                  <button
                    type="button"
                    key={round?.round_id || roundOrder}
                    onClick={() => handleSelectRound(roundOrder)}
                    className={`shrink-0 rounded-xl border px-3.5 py-2 text-left transition ${
                      selected
                        ? "border-[#1754cf]/20 bg-[#1754cf] text-white shadow-sm shadow-[#1754cf]/20"
                        : "border-slate-200 bg-white text-slate-700 hover:border-[#1754cf]/25 hover:bg-[#1754cf]/[0.03]"
                    }`}
                  >
                    <span className="block text-xs font-bold">
                      {round?.round_name || `Round ${roundOrder}`}
                    </span>
                    <span
                      className={`mt-0.5 block text-[10px] font-semibold ${
                        selected ? "text-white/80" : "text-slate-500"
                      }`}
                    >
                      {roundOrder === 1 ? "Registered" : "Shortlisted"} |{" "}
                      {formatCountValue(participants.length)}{" "}
                      {selectedRoundParticipantLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-b border-slate-200 bg-slate-50 px-4 py-4">
            {selectedRoundEntry ? (
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_repeat(4,minmax(130px,1fr))]">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Selected Round
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {selectedRoundEntry.round?.round_name || `Round ${selectedRoundOrder}`}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Round {selectedRoundEntry.roundOrder}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Date
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {getRoundDateLabel(selectedRoundEntry.round)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Time
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {getTimeLabel(
                      selectedRoundEntry.round?.start_time,
                      selectedRoundEntry.round?.end_time
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Mode
                  </p>
                  <div className="mt-1">
                    <StatusPill tone="info" value={selectedRoundEntry.round?.round_mode || "-"} />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Status
                  </p>
                  <div className="mt-1">
                    <StatusPill value={selectedRoundEntry.round?.status || "-"} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">
                  {rounds.length === 0
                    ? "No rounds configured for this event yet."
                    : `Showing every ${selectedRoundParticipantLabel.toLowerCase()} registration.`}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {rounds.length === 0
                    ? "Tracking is still available for the event registrations below."
                    : "Round 1 includes every registration. Later rounds include only teams or entries shortlisted from the previous round."}
                </p>
              </div>
            )}
          </div>

          {progressError ? (
            <div className="m-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {progressError}
            </div>
          ) : null}

          {filteredProgressRows.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              {selectedRoundEntry
                ? selectedRoundEntry.roundOrder === 1
                  ? "No teams or entries have been registered for this event yet."
                  : "No teams or entries have been shortlisted for this round yet."
                : isIndividualRegistration
                  ? "No individual registrations have been recorded for this event yet."
                  : "No teams have been registered for this event yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1420px] w-full table-fixed text-xs">
                <thead className={TABLE_HEAD_CLASS}>
                  <tr>
                    <th className={`${TH_CLASS} w-[230px]`}>
                      {isIndividualRegistration ? "Participant" : "Team"}
                    </th>
                    <th className={`${TH_CLASS} w-[140px]`}>
                      {isIndividualRegistration ? "Student ID" : "Code"}
                    </th>
                    <th className={`${TH_CLASS} w-[86px]`}>
                      Members
                    </th>
                    <th className={`${TH_CLASS} w-[130px]`}>
                      Registration
                    </th>
                    <th className={`${TH_CLASS} w-[120px]`}>
                      Status
                    </th>
                    <th className={`${TH_CLASS} w-[86px]`}>
                      Cleared
                    </th>
                    <th className={`${TH_CLASS} w-[170px]`}>
                      Highest Round
                    </th>
                    <th className={`${TH_CLASS} w-[170px]`}>
                      Next Round
                    </th>
                    <th className={`${TH_CLASS} w-[112px] text-center`}>
                      Members View
                    </th>
                    <th className={`${TH_CLASS} w-[176px]`}>
                      Update
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredProgressRows.map((row) => {
                    const members = membershipRowsByTeamId.get(Number(row.team_id)) || [];
                    const roundsCleared = Number(row.rounds_cleared) || 0;
                    const progressOptions = getRoundProgressOptions({
                      roundsCleared,
                      roundCount: rounds.length,
                      selectedRoundOrder: selectedRoundEntry?.roundOrder
                    });
                    const registrationState = getRegistrationState(event, row);
                    const highestClearedRound = getHighestClearedRoundLabel(roundsCleared, rounds);
                    const nextRoundLabel = getNextRoundLabelForTeam(roundsCleared, rounds);

                    return (
                      <tr key={row.team_id} className="hover:bg-slate-50/80">
                        <td className={`${TD_CLASS} overflow-hidden text-ellipsis font-semibold text-slate-900`}>
                          {getParticipantPrimaryLabel(row, members, isIndividualRegistration)}
                        </td>
                        <td className={`${TD_CLASS} overflow-hidden text-ellipsis font-mono text-slate-600`}>
                          {getParticipantSecondaryLabel(row, members, isIndividualRegistration)}
                        </td>
                        <td className={`${TD_CLASS} text-slate-700`}>
                          {formatCountValue(row.active_member_count)}
                        </td>
                        <td className={TD_CLASS}>
                          <StatusPill
                            tone={registrationState.tone}
                            value={registrationState.value}
                          />
                        </td>
                        <td className={TD_CLASS}>
                          <StatusPill
                            tone={
                              String(row.status || "").toUpperCase() === "ACTIVE"
                                ? "info"
                                : "warning"
                            }
                            value={row.status || "-"}
                          />
                        </td>
                        <td className={`${TD_CLASS} font-semibold text-slate-700`}>
                          {String(roundsCleared)}
                        </td>
                        <td className={`${TD_CLASS} overflow-hidden text-ellipsis text-slate-700`}>
                          {highestClearedRound}
                        </td>
                        <td className={`${TD_CLASS} overflow-hidden text-ellipsis text-slate-700`}>
                          {nextRoundLabel}
                        </td>
                        <td className={`${TD_CLASS} text-center`}>
                          <button
                            type="button"
                            onClick={() => handleOpenMembers(row)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:border-[#1754cf]/25 hover:text-[#1754cf]"
                            aria-label={`View members for ${row?.team_name || "entry"}`}
                            title="View members"
                          >
                            <VisibilityOutlinedIcon sx={{ fontSize: 17 }} />
                          </button>
                        </td>
                        <td className={TD_CLASS}>
                          <div className="flex flex-nowrap items-center gap-2">
                            <select
                              value={roundProgressDrafts[String(row.team_id)] || "0"}
                              onChange={(eventValue) =>
                                setRoundProgressDrafts((previousValue) => ({
                                  ...previousValue,
                                  [String(row.team_id)]: eventValue.target.value
                                }))
                              }
                              className="h-8 w-16 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none transition focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10"
                            >
                              {progressOptions.map((index) => (
                                <option key={`${row.team_id}-${index}`} value={String(index)}>
                                  {index}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleSaveRoundsCleared(row.team_id)}
                              disabled={progressBusyTeamId === Number(row.team_id)}
                              className="h-8 rounded-lg border border-[#1754cf]/15 bg-[#1754cf]/8 px-2.5 text-xs font-semibold text-[#1754cf] transition hover:bg-[#1754cf]/12 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                            >
                              {progressBusyTeamId === Number(row.team_id) ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <TeamManagementMembersModal
        error=""
        loading={false}
        onClose={handleCloseMembers}
        rows={viewedMembers}
        scopeConfig={{ scopeLabel: isIndividualRegistration ? "Event Entry" : "Event Group" }}
        team={viewTeam}
      />
    </>
  );
}
