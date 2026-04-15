import { useCallback, useEffect, useMemo, useState } from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useNavigate, useParams } from "react-router-dom";
import { useRealtimeEvents } from "../../../hooks/useRealtimeEvents";
import { REALTIME_EVENTS, matchesRealtimeScope } from "../../../lib/realtime";
import { fetchEventById } from "../../../service/events.api";
import {
  fetchEventGroupById,
  fetchEventGroupMemberships,
  fetchMyEventGroupMemberships,
  leaveTeamMembership
} from "../../../service/teams.api";
import WorkspacePageHeader, {
  WorkspacePageHeaderActionButton
} from "../../../shared/components/WorkspacePageHeader";
import TeamMembershipLeaveModal from "../teams/TeamMembershipLeaveModal";
import { formatLabel, normalizeValue } from "../teams/teamPage.utils";
import EventGroupMembersSection from "./EventGroupMembersSection";
import EventOnDutySection from "./EventOnDutySection";
import EventRegistrationOverviewSection from "./EventRegistrationOverviewSection";
import { getEventRegistrationStatus } from "./events.constants";

const EVENT_GROUP_LEAVE_SCOPE = {
  singularLabel: "Registered Team",
  singularLower: "registered team",
  leaveLabel: "Leave Team",
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
        throw new Error("Registered team not found");
      }

      if (String(groupRow.event_id || "") !== String(eventId)) {
        throw new Error("This team does not belong to the selected event");
      }

      setEvent(eventRow || null);
      setGroup(groupRow || null);
      setMembers(Array.isArray(memberRows) ? memberRows : []);
      setMyActiveMemberships(
        Array.isArray(membershipRes?.memberships) ? membershipRes.memberships : []
      );
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to load registered team details"
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

  useRealtimeEvents(
    [REALTIME_EVENTS.EVENT_JOIN_REQUESTS, REALTIME_EVENTS.TEAM_MEMBERSHIPS],
    (payload) => {
      if (!matchesRealtimeScope(payload, { teamId: groupId })) return;
      void load();
    }
  );

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
      setLeaveError(err?.response?.data?.message || "Failed to leave team");
    } finally {
      setLeaveBusyMembershipId(null);
    }
  }, [load, myMembershipInThisGroup?.team_membership_id]);

  const myRoleLabel = myMembershipInThisGroup
    ? formatLabel(myMembershipInThisGroup.role, "Member")
    : "-";
  const normalizedMyRole = String(myMembershipInThisGroup?.role || "").toUpperCase();
  const isCaptain = normalizedMyRole === "CAPTAIN";
  const canManageOnDuty = ["CAPTAIN", "VICE_CAPTAIN"].includes(normalizedMyRole);
  const currentStudentId = myMembershipInThisGroup?.student_id || null;
  const registrationStatus = getEventRegistrationStatus(event);
  const rosterLocked = Boolean(event) && registrationStatus.key === "CLOSED";

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
          Loading registered team details...
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
          Registered team not found.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 md:px-6">
      <WorkspacePageHeader
        eyebrow="Registered Entry"
        title={group.team_name || "-"}
        description={`${event.event_name || "-"} - Review members, OD access, and registration progress in one place.`}
        actions={
          <>
            <WorkspacePageHeaderActionButton
              type="button"
              onClick={() => navigate(`/events/${eventId}`)}
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
              Back
            </WorkspacePageHeaderActionButton>
            <WorkspacePageHeaderActionButton
              type="button"
              onClick={load}
              disabled={loading}
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              <RefreshRoundedIcon sx={{ fontSize: 18 }} />
              Refresh
            </WorkspacePageHeaderActionButton>
            <WorkspacePageHeaderActionButton
              type="button"
              onClick={handleOpenLeaveModal}
              disabled={!myMembershipInThisGroup || Boolean(leaveBusyMembershipId) || rosterLocked}
              title={
                rosterLocked
                  ? "Roster changes are locked because registration ended"
                  : myMembershipInThisGroup
                    ? "Leave this registered team"
                    : "You are not an active member of this team"
              }
              className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
            >
              <LogoutRoundedIcon sx={{ fontSize: 18 }} />
              {leaveBusyMembershipId ? "Leaving..." : "Leave Team"}
            </WorkspacePageHeaderActionButton>
          </>
        }
      />

      <EventRegistrationOverviewSection
        event={event}
        group={group}
        memberCount={members.length}
        myRoleLabel={myRoleLabel}
      />

      {rosterLocked ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Registration is closed for this event, so the team roster is locked.
        </div>
      ) : null}

      {myMembershipInThisGroup ? (
        <EventOnDutySection
          canManage={canManageOnDuty}
          event={event}
          group={group}
        />
      ) : null}

      <EventGroupMembersSection
        members={members}
        canRemoveMember={isCaptain && !rosterLocked}
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
