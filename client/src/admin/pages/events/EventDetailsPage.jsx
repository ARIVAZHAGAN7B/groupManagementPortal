import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    <section className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <p className="min-w-[136px] text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="text-right text-sm font-semibold text-slate-900">{value || "-"}</p>
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
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClassName}`}
    >
      {value || "-"}
    </span>
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

const canParticipateInRound = (event, teamRow) => {
  const activeMembers = Number(teamRow?.active_member_count) || 0;
  const requiredMinMembers = getRequiredMinMembers(event);
  const teamStatus = String(teamRow?.status || "").toUpperCase();

  return activeMembers >= requiredMinMembers && teamStatus !== "INACTIVE";
};

function RoundTimelineCard({
  isIndividualRegistration,
  onSelect,
  participants,
  round,
  selected = false
}) {
  const roundOrder = Number(round?.round_order) || 1;
  const timeLabel = getTimeLabel(round?.start_time, round?.end_time);
  const dateLabel = getRoundDateLabel(round);
  const participantHeading = isIndividualRegistration
    ? "Participating Registrations"
    : "Participating Teams";

  return (
    <button
      type="button"
      onClick={() => onSelect(roundOrder)}
      className={`w-full rounded-3xl border bg-white p-5 text-left shadow-sm transition ${
        selected
          ? "border-[#1754cf] ring-2 ring-[#1754cf]/15"
          : "border-slate-200 hover:border-[#1754cf]/25 hover:bg-[#1754cf]/[0.02]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1754cf]">
            Round {roundOrder}
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">
            {round?.round_name || `Round ${roundOrder}`}
          </h3>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Date
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{dateLabel}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Time
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{timeLabel}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {participantHeading}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {formatCountValue(participants.length)}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function EventDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const trackingSectionRef = useRef(null);
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

  const eligibleParticipantRows = useMemo(() => {
    return [...teamRows]
      .filter((row) => canParticipateInRound(event, row))
      .sort((left, right) => {
        const leftMembers = membershipRowsByTeamId.get(Number(left?.team_id)) || [];
        const rightMembers = membershipRowsByTeamId.get(Number(right?.team_id)) || [];
        const leftLabel = getParticipantPrimaryLabel(
          left,
          leftMembers,
          isIndividualRegistration
        );
        const rightLabel = getParticipantPrimaryLabel(
          right,
          rightMembers,
          isIndividualRegistration
        );

        return String(leftLabel).localeCompare(String(rightLabel));
      });
  }, [event, isIndividualRegistration, membershipRowsByTeamId, teamRows]);

  const roundTimelineRows = useMemo(() => {
    return rounds.map((round, index) => {
      const roundOrder = Number(round?.round_order) || index + 1;
      const participants = eligibleParticipantRows.filter(
        (row) => (Number(row?.rounds_cleared) || 0) >= roundOrder - 1
      );

      return {
        alignment: index % 2 === 0 ? "left" : "right",
        participants,
        round,
        roundOrder
      };
    });
  }, [eligibleParticipantRows, rounds]);
  const selectedRoundEntry = useMemo(
    () =>
      roundTimelineRows.find(
        (row) => Number(row.roundOrder) === Number(selectedRoundOrder)
      ) || null,
    [roundTimelineRows, selectedRoundOrder]
  );
  const progressRows = isIndividualRegistration ? eligibleParticipantRows : teamRows;
  const filteredProgressRows = useMemo(() => {
    if (!selectedRoundEntry) return progressRows;
    return Array.isArray(selectedRoundEntry.participants)
      ? selectedRoundEntry.participants
      : [];
  }, [progressRows, selectedRoundEntry]);

  const handleSelectRound = (roundOrder) => {
    setSelectedRoundOrder((previousValue) =>
      Number(previousValue) === Number(roundOrder) ? null : Number(roundOrder)
    );
    trackingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

        <section className="grid gap-4 xl:grid-cols-2">
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

          <SummaryCard className="xl:col-span-2" title="Notes">
            <SummaryRow label="Host / Organizer" value={event.event_organizer || "-"} />
            <SummaryRow label="Configured Rounds" value={String(rounds.length || 0)} />
            <SummaryRow
              label="Participation Notes"
              value={event.selected_resources || "-"}
            />
            <SummaryRow label="Reference Link" value={registrationLink ? "Available" : "-"} />
          </SummaryCard>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Event Rounds
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isIndividualRegistration
                  ? "Rounds are shown as a direct participant journey for this event."
                  : "Rounds are listed here so event-group progress can be tracked stage by stage."}
              </p>
            </div>
          </div>

          {rounds.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              No rounds configured for this event yet.
            </div>
          ) : (
            <div className="relative mt-6 space-y-6 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-slate-200 xl:before:left-1/2 xl:before:-translate-x-1/2">
              {roundTimelineRows.map(({ alignment, participants, round, roundOrder }) => (
                <div
                  key={round?.round_id || roundOrder}
                  className="relative xl:grid xl:grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] xl:gap-5"
                >
                  <div
                    className={`pl-12 xl:pl-0 ${
                      alignment === "left"
                        ? "xl:col-start-1 xl:mr-8"
                        : "xl:col-start-3 xl:ml-8"
                    }`}
                  >
                    <RoundTimelineCard
                      isIndividualRegistration={isIndividualRegistration}
                      onSelect={handleSelectRound}
                      participants={participants}
                      round={round}
                      selected={Number(selectedRoundOrder) === Number(roundOrder)}
                    />
                  </div>

                  <div className="absolute left-0 top-8 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-[#1754cf] shadow-sm xl:left-1/2 xl:-translate-x-1/2">
                    <span className="text-[11px] font-bold text-white">{roundOrder}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section
          ref={trackingSectionRef}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                {selectedRoundEntry
                  ? `${selectedRoundEntry.round?.round_name || `Round ${selectedRoundOrder}`} Entries`
                  : isIndividualRegistration
                    ? "Participant Tracking"
                    : "Team Tracking"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {selectedRoundEntry
                  ? "Showing only the teams or entries registered for the selected round."
                  : isIndividualRegistration
                    ? "Click a round card to open the participants for that round here."
                    : "Click a round card to open the teams for that round here."}
              </p>
            </div>
            {selectedRoundEntry ? (
              <button
                type="button"
                onClick={() => setSelectedRoundOrder(null)}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Show All
              </button>
            ) : null}
          </div>

          {progressError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {progressError}
            </div>
          ) : null}

          {filteredProgressRows.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              {selectedRoundEntry
                ? "No teams or entries are available for this round yet."
                : isIndividualRegistration
                  ? "No valid individual registrations have been recorded for this event yet."
                  : "No teams have been registered for this event yet."}
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-[1240px] w-full text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em]">
                      {isIndividualRegistration ? "Participant" : "Team"}
                    </th>
                    <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em]">
                      {isIndividualRegistration ? "Student ID" : "Code"}
                    </th>
                    <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em]">
                      Members
                    </th>
                    <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em]">
                      Registration
                    </th>
                    <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em]">
                      Status
                    </th>
                    <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em]">
                      Cleared
                    </th>
                    <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em]">
                      Highest Round
                    </th>
                    <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em]">
                      Next Round
                    </th>
                    <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em]">
                      Members View
                    </th>
                    <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em]">
                      Update
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredProgressRows.map((row) => {
                    const members = membershipRowsByTeamId.get(Number(row.team_id)) || [];
                    const roundsCleared = Number(row.rounds_cleared) || 0;
                    const registrationState = getRegistrationState(event, row);
                    const highestClearedRound = getHighestClearedRoundLabel(roundsCleared, rounds);
                    const nextRoundLabel = getNextRoundLabelForTeam(roundsCleared, rounds);

                    return (
                      <tr key={row.team_id} className="hover:bg-slate-50/80">
                        <td className="px-3 py-3 font-semibold text-slate-900">
                          {getParticipantPrimaryLabel(row, members, isIndividualRegistration)}
                        </td>
                        <td className="px-3 py-3 font-mono text-slate-600">
                          {getParticipantSecondaryLabel(row, members, isIndividualRegistration)}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {formatCountValue(row.active_member_count)}
                        </td>
                        <td className="px-3 py-3">
                          <StatusPill
                            tone={registrationState.tone}
                            value={registrationState.value}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <StatusPill
                            tone={
                              String(row.status || "").toUpperCase() === "ACTIVE"
                                ? "info"
                                : "warning"
                            }
                            value={row.status || "-"}
                          />
                        </td>
                        <td className="px-3 py-3 font-semibold text-slate-700">
                          {String(roundsCleared)}
                        </td>
                        <td className="px-3 py-3 text-slate-700">{highestClearedRound}</td>
                        <td className="px-3 py-3 text-slate-700">{nextRoundLabel}</td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => handleOpenMembers(row)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:border-[#1754cf]/25 hover:text-[#1754cf]"
                            aria-label={`View members for ${row?.team_name || "entry"}`}
                            title="View members"
                          >
                            <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <select
                              value={roundProgressDrafts[String(row.team_id)] || "0"}
                              onChange={(eventValue) =>
                                setRoundProgressDrafts((previousValue) => ({
                                  ...previousValue,
                                  [String(row.team_id)]: eventValue.target.value
                                }))
                              }
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10"
                            >
                              {Array.from({ length: rounds.length + 1 }, (_, index) => (
                                <option key={`${row.team_id}-${index}`} value={String(index)}>
                                  {index}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleSaveRoundsCleared(row.team_id)}
                              disabled={progressBusyTeamId === Number(row.team_id)}
                              className="rounded-lg border border-[#1754cf]/15 bg-[#1754cf]/8 px-3 py-2 text-xs font-semibold text-[#1754cf] transition hover:bg-[#1754cf]/12 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
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
