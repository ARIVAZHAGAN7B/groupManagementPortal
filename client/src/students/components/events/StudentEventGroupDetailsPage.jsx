import { useCallback, useEffect, useMemo, useState } from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useNavigate, useParams } from "react-router-dom";
import { fetchEventById } from "../../../service/events.api";
import {
  fetchEventGroupById,
  fetchEventGroupMemberships,
  fetchMyEventGroupMemberships,
  leaveTeamMembership
} from "../../../service/teams.api";
import TeamPageDetailTile from "../teams/TeamPageDetailTile";
import TeamMembershipLeaveModal from "../teams/TeamMembershipLeaveModal";
import { formatLabel, formatShortDate, normalizeValue } from "../teams/teamPage.utils";
import EventGroupMembersSection from "./EventGroupMembersSection";

const EVENT_GROUP_LEAVE_SCOPE = {
  singularLabel: "Event Group",
  singularLower: "event group",
  leaveLabel: "Leave Group",
  leaveBusyLabel: "Leaving..."
};

export default function StudentEventGroupDetailsPage() {
  const navigate = useNavigate();
  const { eventId, groupId } = useParams();

  const [event, setEvent] = useState(null);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [myActiveMemberships, setMyActiveMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveBusyMembershipId, setLeaveBusyMembershipId] = useState(null);
  const [leaveError, setLeaveError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [eventRow, groupRow, memberRows, membershipRes] = await Promise.all([
        fetchEventById(eventId),
        fetchEventGroupById(groupId),
        fetchEventGroupMemberships(groupId, { status: "ACTIVE" }),
        fetchMyEventGroupMemberships({ status: "ACTIVE" })
      ]);

      if (!groupRow || normalizeValue(groupRow.team_type) !== "EVENT") {
        throw new Error("Event group not found");
      }

      if (String(groupRow.event_id || "") !== String(eventId)) {
        throw new Error("This event group does not belong to the selected event");
      }

      setEvent(eventRow || null);
      setGroup(groupRow || null);
      setMembers(Array.isArray(memberRows) ? memberRows : []);
      setMyActiveMemberships(
        Array.isArray(membershipRes?.memberships) ? membershipRes.memberships : []
      );
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to load event group details"
      );
      setEvent(null);
      setGroup(null);
      setMembers([]);
      setMyActiveMemberships([]);
    } finally {
      setLoading(false);
    }
  }, [eventId, groupId]);

  useEffect(() => {
    load();
  }, [load]);

  const myActiveMembershipInEvent = useMemo(
    () =>
      myActiveMemberships.find(
        (membership) => String(membership.event_id || "") === String(eventId)
      ) || null,
    [eventId, myActiveMemberships]
  );

  const myMembershipInThisGroup =
    myActiveMembershipInEvent &&
    Number(myActiveMembershipInEvent.team_id) === Number(group?.team_id)
      ? myActiveMembershipInEvent
      : null;

  const handleOpenLeaveModal = useCallback(() => {
    if (!myMembershipInThisGroup) return;
    setLeaveError("");
    setLeaveModalOpen(true);
  }, [myMembershipInThisGroup]);

  const handleCloseLeaveModal = useCallback(() => {
    if (leaveBusyMembershipId) return;
    setLeaveModalOpen(false);
    setLeaveError("");
  }, [leaveBusyMembershipId]);

  const handleConfirmLeave = useCallback(async () => {
    const membershipId = Number(myMembershipInThisGroup?.team_membership_id);
    if (!membershipId) return;

    setLeaveBusyMembershipId(membershipId);
    setLeaveError("");
    setError("");

    try {
      await leaveTeamMembership(membershipId);
      setLeaveModalOpen(false);
      await load();
    } catch (err) {
      setLeaveError(err?.response?.data?.message || "Failed to leave event group");
    } finally {
      setLeaveBusyMembershipId(null);
    }
  }, [load, myMembershipInThisGroup?.team_membership_id]);

  const myRoleLabel = myMembershipInThisGroup
    ? formatLabel(myMembershipInThisGroup.role, "Member")
    : "-";
  const isCaptain = String(myMembershipInThisGroup?.role || "").toUpperCase() === "CAPTAIN";
  const currentStudentId = myMembershipInThisGroup?.student_id || null;

  const leaveModalRow =
    myMembershipInThisGroup && group
      ? {
          team_membership_id: myMembershipInThisGroup.team_membership_id,
          team_name: group.team_name,
          team_code: group.team_code,
          role: myMembershipInThisGroup.role,
          join_date: myMembershipInThisGroup.join_date
        }
      : null;

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
          Loading event group details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!event || !group) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
          Event group not found.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 md:px-6">
      <section className="relative overflow-hidden rounded-2xl border border-[#1754cf]/10 bg-[#1754cf]/5 p-8">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-[#1754cf]">
              Event Group Details
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {group.team_name || "-"}
            </h1>
            <p className="mt-2 text-base font-medium text-slate-600">
              {event.event_name || "-"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/events/${eventId}`)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
              Back
            </button>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
            >
              <RefreshRoundedIcon sx={{ fontSize: 18 }} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleOpenLeaveModal}
              disabled={!myMembershipInThisGroup || Boolean(leaveBusyMembershipId)}
              title={myMembershipInThisGroup ? "Leave this event group" : "You are not an active member of this event group"}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogoutRoundedIcon sx={{ fontSize: 18 }} />
              {leaveBusyMembershipId ? "Leaving..." : "Leave Group"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <TeamPageDetailTile
            label="Team Status"
            value={formatLabel(group.status, "Unknown")}
          />
          <TeamPageDetailTile
            label="My Role"
            value={myRoleLabel}
          />
          <TeamPageDetailTile
            label="Total Members"
            value={members.length}
          />
          <TeamPageDetailTile
            label="Start Date"
            value={formatShortDate(event?.start_date)}
          />
          <TeamPageDetailTile
            label="End Date"
            value={formatShortDate(event?.end_date)}
          />
        </div>

        <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-[#1754cf]/10 blur-3xl" />
      </section>

      <EventGroupMembersSection
        members={members}
        canRemoveMember={isCaptain}
        currentStudentId={currentStudentId}
        onChanged={load}
      />

      <TeamMembershipLeaveModal
        open={leaveModalOpen}
        row={leaveModalRow}
        scope={EVENT_GROUP_LEAVE_SCOPE}
        busy={leaveBusyMembershipId === Number(myMembershipInThisGroup?.team_membership_id)}
        error={leaveError}
        onCancel={handleCloseLeaveModal}
        onConfirm={handleConfirmLeave}
      />
    </div>
  );
}
