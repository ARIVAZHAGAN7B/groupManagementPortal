const fs = require("fs/promises");
const path = require("path");

const db = require("../../config/db");
const eventRepo = require("../event/event.repository");
const teamRepo = require("../team/team.repository");
const repo = require("./onDuty.repository");

const EXTERNAL_APPROVAL_STATUSES = ["PENDING", "APPROVED", "REJECTED"];
const ADMIN_APPROVAL_STATUSES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];
const TEAM_OD_ALLOWED_ROLES = ["CAPTAIN", "VICE_CAPTAIN"];
const PROOF_MIME_TO_EXTENSION = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};
const MAX_PROOF_FILE_BYTES = 5 * 1024 * 1024;
const UPLOAD_DIRECTORY = path.resolve(__dirname, "../../uploads/on-duty-proofs");

const normalizeText = (value) => String(value || "").trim();
const normalizeBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const normalized = normalizeText(value).toLowerCase();
  return ["1", "true", "yes", "y"].includes(normalized);
};

const normalizeId = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
  return parsed;
};

const normalizeExternalStatus = (value, fieldName) => {
  const normalized = normalizeText(value).toUpperCase() || "PENDING";
  if (!EXTERNAL_APPROVAL_STATUSES.includes(normalized)) {
    throw new Error(`${fieldName} must be one of: ${EXTERNAL_APPROVAL_STATUSES.join(", ")}`);
  }
  return normalized;
};

const normalizeAdminStatus = (value) => {
  const normalized = normalizeText(value).toUpperCase() || "PENDING";
  if (!ADMIN_APPROVAL_STATUSES.includes(normalized)) {
    throw new Error(`admin_status must be one of: ${ADMIN_APPROVAL_STATUSES.join(", ")}`);
  }
  return normalized;
};

const normalizeOptionalNotes = (value, fieldName) => {
  const normalized = normalizeText(value);
  if (normalized.length > 255 && fieldName !== "admin_notes") {
    throw new Error(`${fieldName} must be 255 characters or less`);
  }
  return normalized || null;
};

const normalizeAdminNotes = (value) => {
  const normalized = normalizeText(value);
  return normalized || null;
};

const sanitizeFilenameBase = (value) =>
  String(value || "proof")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "proof";

const toIsoDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split("T")[0];
};

const calculateInclusiveDayCount = (startValue, endValue) => {
  const start = new Date(startValue);
  const end = new Date(endValue);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid round dates configured for OD");
  }

  const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((endUtc - startUtc) / msPerDay);

  if (diffDays < 0) {
    throw new Error("Round end date cannot be before start date");
  }

  return diffDays + 1;
};

const isAdminUser = (actorUser) =>
  ["ADMIN", "SYSTEM_ADMIN"].includes(String(actorUser?.role || "").trim().toUpperCase());

const getRequiredMinMembers = (teamLike) => {
  const parsed = Number(teamLike?.event_min_members ?? teamLike?.min_members);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const getRoundWindow = (round) => {
  const startDate = toIsoDate(round?.round_date);
  const endDate = toIsoDate(round?.round_end_date || round?.round_date);
  if (!startDate || !endDate) {
    throw new Error("This round does not have OD dates configured yet");
  }

  return {
    requested_from_date: startDate,
    requested_to_date: endDate,
    requested_day_count: calculateInclusiveDayCount(startDate, endDate)
  };
};

const buildProofPublicPath = (filename) => `/uploads/on-duty-proofs/${filename}`;

const getFilePathFromPublicPath = (publicPath) => {
  const normalized = normalizeText(publicPath);
  if (!normalized.startsWith("/uploads/on-duty-proofs/")) return null;
  return path.join(UPLOAD_DIRECTORY, path.basename(normalized));
};

const removeProofFile = async (publicPath) => {
  const absolutePath = getFilePathFromPublicPath(publicPath);
  if (!absolutePath) return;

  try {
    await fs.unlink(absolutePath);
  } catch (_error) {
    // Ignore cleanup failures for already-missing files.
  }
};

const saveProofFile = async (proof, teamId, roundId) => {
  if (!proof) return null;

  const mimeType = normalizeText(proof.mime_type).toLowerCase();
  const extension = PROOF_MIME_TO_EXTENSION[mimeType];
  if (!extension) {
    throw new Error("Only PDF, JPG, PNG, or WEBP proof files are supported");
  }

  const base64Content = normalizeText(proof.content_base64);
  if (!base64Content) {
    throw new Error("Proof content is required");
  }

  const buffer = Buffer.from(base64Content, "base64");
  if (!buffer.length) {
    throw new Error("Proof file is empty");
  }

  if (buffer.length > MAX_PROOF_FILE_BYTES) {
    throw new Error("Proof file must be 5 MB or smaller");
  }

  await fs.mkdir(UPLOAD_DIRECTORY, { recursive: true });

  const safeBaseName = sanitizeFilenameBase(proof.file_name);
  const filename = `${safeBaseName}-${teamId}-${roundId}-${Date.now()}.${extension}`;
  await fs.writeFile(path.join(UPLOAD_DIRECTORY, filename), buffer);

  return {
    shortlist_proof_path: buildProofPublicPath(filename),
    shortlist_proof_name: normalizeText(proof.file_name) || filename,
    shortlist_proof_type: mimeType,
    shortlist_proof_uploaded_at: new Date()
  };
};

const mapRequestRow = (row) => ({
  ...row,
  od_request_id: Number(row.od_request_id),
  event_id: Number(row.event_id),
  round_id: Number(row.round_id),
  team_id: Number(row.team_id),
  requested_day_count: Number(row.requested_day_count) || 0,
  round_order: Number(row.round_order) || 0,
  rounds_cleared: Number(row.rounds_cleared) || 0,
  od_proof_required: normalizeBoolean(row.od_proof_required),
  proof_required: normalizeBoolean(row.od_proof_required)
});

const ensureTeamAndRoundContext = async (teamId, roundId, executor) => {
  const team = await teamRepo.getTeamById(teamId, executor);
  if (!team) throw new Error("Team not found");
  if (!team.event_id) throw new Error("This team is not linked to an event");
  if (String(team.team_type || "").toUpperCase() !== "EVENT") {
    throw new Error("Only event registrations can request OD");
  }
  if (String(team.status || "").toUpperCase() !== "ACTIVE") {
    throw new Error("Only active event registrations can request OD");
  }
  if ((Number(team.active_member_count) || 0) < getRequiredMinMembers(team)) {
    throw new Error(
      `Registration is pending until it reaches ${getRequiredMinMembers(team)} active member(s)`
    );
  }

  const event = await eventRepo.getEventById(team.event_id, executor);
  if (!event) throw new Error("Event not found");

  const rounds = await eventRepo.getRoundsByEventId(team.event_id, executor);
  const round = (rounds || []).find(
    (roundRow) => Number(roundRow?.round_id) === Number(roundId)
  );

  if (!round) {
    throw new Error("Round not found for this event");
  }

  if (String(round.round_mode || "").toUpperCase() !== "OFFLINE") {
    throw new Error("OD is only available for offline rounds");
  }

  if ((Number(round.round_order) || 0) > (Number(team.rounds_cleared) || 0) + 1) {
    throw new Error("This team is not yet eligible for OD in the selected round");
  }

  const roundWindow = getRoundWindow(round);
  const roundEndDate = new Date(`${roundWindow.requested_to_date}T23:59:59.999`);
  if (!Number.isNaN(roundEndDate.getTime()) && Date.now() > roundEndDate.getTime()) {
    throw new Error("OD can only be requested before the selected round ends");
  }

  return {
    event,
    round: {
      ...round,
      ...roundWindow
    },
    team
  };
};

const ensureStudentCanManageTeamOd = async (teamId, actorUser, executor) => {
  if (isAdminUser(actorUser)) {
    return null;
  }

  const student = await teamRepo.getStudentByUserId(actorUser?.userId, executor);
  if (!student) throw new Error("Student not found");

  const membership = await teamRepo.findActiveTeamMembershipByTeamAndStudent(
    teamId,
    student.student_id,
    executor
  );
  if (!membership) {
    throw new Error("You are not an active member of this event registration");
  }

  const role = String(membership.role || "").trim().toUpperCase();
  if (!TEAM_OD_ALLOWED_ROLES.includes(role)) {
    throw new Error("Only the captain or vice captain can submit OD for this team");
  }

  return {
    membership,
    student
  };
};

const listRequests = async (query = {}) => {
  const rows = await repo.listRequests({
    admin_status: query.admin_status,
    event_id: query.event_id,
    round_id: query.round_id,
    search: query.search,
    team_id: query.team_id
  });

  return (rows || []).map(mapRequestRow);
};

const getMyRequests = async (actorUser) => {
  if (!actorUser?.userId) throw new Error("Unauthorized");

  const student = await teamRepo.getStudentByUserId(actorUser.userId);
  if (!student) throw new Error("Student not found");

  const rows = await repo.getRequestsByStudentId(student.student_id);
  return {
    student_id: student.student_id,
    requests: (rows || []).map(mapRequestRow)
  };
};

const getTeamRequests = async (teamIdValue, actorUser) => {
  const teamId = normalizeId(teamIdValue, "team_id");
  const team = await teamRepo.getTeamById(teamId);
  if (!team) throw new Error("Team not found");

  if (!isAdminUser(actorUser)) {
    await ensureStudentCanManageTeamOd(teamId, actorUser);
  }

  const rows = await repo.getRequestsByTeamId(teamId);
  return (rows || []).map(mapRequestRow);
};

const submitRequest = async (teamIdValue, payload = {}, actorUser) => {
  if (!actorUser?.userId) throw new Error("Unauthorized");

  const teamId = normalizeId(teamIdValue, "team_id");
  const roundId = normalizeId(payload.round_id, "round_id");

  let savedProof = null;
  let oldProofToDelete = null;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const actorContext = await ensureStudentCanManageTeamOd(teamId, actorUser, conn);
    const { event, round, team } = await ensureTeamAndRoundContext(teamId, roundId, conn);
    const proofRequired = normalizeBoolean(round.od_proof_required);
    const existing = await repo.lockRequestByRoundAndTeam(roundId, teamId, conn);
    const hasReusableProof = Boolean(existing?.shortlist_proof_path);
    const shouldUploadNewProof = Boolean(payload?.proof?.content_base64);

    if (proofRequired && !shouldUploadNewProof && !hasReusableProof) {
      throw new Error("Shortlist proof is required for this round");
    }

    if (existing) {
      const currentStatus = String(existing.admin_status || "").toUpperCase();
      if (!["REJECTED", "CANCELLED"].includes(currentStatus)) {
        throw new Error("OD is already submitted for this round");
      }
    }

    if (shouldUploadNewProof) {
      savedProof = await saveProofFile(payload.proof, teamId, roundId);
    }

    const nextProof =
      savedProof ||
      (existing?.shortlist_proof_path
        ? {
            shortlist_proof_path: existing.shortlist_proof_path,
            shortlist_proof_name: existing.shortlist_proof_name,
            shortlist_proof_type: existing.shortlist_proof_type,
            shortlist_proof_uploaded_at: existing.shortlist_proof_uploaded_at
          }
        : null);

    const requestPayload = {
      event_id: Number(event.event_id),
      round_id: roundId,
      team_id: teamId,
      requested_by_student_id: actorContext.student.student_id,
      requested_from_date: round.requested_from_date,
      requested_to_date: round.requested_to_date,
      requested_day_count: round.requested_day_count,
      shortlist_proof_path: nextProof?.shortlist_proof_path || null,
      shortlist_proof_name: nextProof?.shortlist_proof_name || null,
      shortlist_proof_type: nextProof?.shortlist_proof_type || null,
      shortlist_proof_uploaded_at: nextProof?.shortlist_proof_uploaded_at || null
    };

    let requestId = null;
    if (existing) {
      requestId = Number(existing.od_request_id);
      await repo.resubmitRequest(requestId, requestPayload, conn);
      if (savedProof && existing.shortlist_proof_path) {
        oldProofToDelete = existing.shortlist_proof_path;
      }
    } else {
      const insertResult = await repo.createRequest(requestPayload, conn);
      requestId = Number(insertResult.insertId);
    }

    await conn.commit();

    if (oldProofToDelete && oldProofToDelete !== savedProof?.shortlist_proof_path) {
      await removeProofFile(oldProofToDelete);
    }

    const row = await repo.getRequestById(requestId);
    return row ? mapRequestRow(row) : null;
  } catch (error) {
    await conn.rollback();
    if (savedProof?.shortlist_proof_path) {
      await removeProofFile(savedProof.shortlist_proof_path);
    }
    throw error;
  } finally {
    conn.release();
  }
};

const reviewRequest = async (odRequestIdValue, payload = {}, actorUser) => {
  const odRequestId = normalizeId(odRequestIdValue, "od_request_id");
  const faculty_status = normalizeExternalStatus(payload.faculty_status, "faculty_status");
  const hod_status = normalizeExternalStatus(payload.hod_status, "hod_status");
  const admin_status = normalizeAdminStatus(payload.admin_status);
  const faculty_notes = normalizeOptionalNotes(payload.faculty_notes, "faculty_notes");
  const hod_notes = normalizeOptionalNotes(payload.hod_notes, "hod_notes");
  const admin_notes = normalizeAdminNotes(payload.admin_notes);

  if (
    admin_status === "APPROVED" &&
    (faculty_status !== "APPROVED" || hod_status !== "APPROVED")
  ) {
    throw new Error("Faculty and HOD approvals are required before admin approval");
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const existing = await repo.lockRequestById(odRequestId, conn);
    if (!existing) throw new Error("OD request not found");

    await repo.reviewRequest(
      odRequestId,
      {
        faculty_status,
        hod_status,
        admin_status,
        faculty_notes,
        hod_notes,
        admin_notes,
        reviewed_by_user_id: actorUser?.userId || null
      },
      conn
    );

    if (admin_status === "APPROVED") {
      const team = await teamRepo.lockTeamById(existing.team_id, conn);
      if (!team) throw new Error("Team not found");
      if ((Number(team.active_member_count) || 0) < getRequiredMinMembers(team)) {
        throw new Error(
          `Registration is pending until it reaches ${getRequiredMinMembers(team)} active member(s)`
        );
      }

      const currentRoundsCleared = Number(team.rounds_cleared) || 0;
      const approvedRoundOrder = Number(existing.round_order) || 0;
      if (approvedRoundOrder > currentRoundsCleared) {
        await teamRepo.updateTeamRoundsCleared(team.team_id, approvedRoundOrder, conn);
      }
    }

    await conn.commit();

    const row = await repo.getRequestById(odRequestId);
    return row ? mapRequestRow(row) : null;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const getEventsWithOdDetails = async () => {
  const events = await eventRepo.getAllEvents();
  if (!Array.isArray(events)) return [];

  const eventsWithDetails = await Promise.all(
    events.map(async (event) => {
      const rounds = await eventRepo.getRoundsByEventId(event.event_id);
      const odRequests = await repo.listRequests({ event_id: event.event_id });

      return {
        event_id: Number(event.event_id),
        event_code: event.event_code,
        event_name: event.event_name,
        event_organizer: event.event_organizer,
        status: event.status,
        start_date: event.start_date,
        end_date: event.end_date,
        registration_mode: event.registration_mode,
        round_count: (rounds || []).length,
        total_od_requests: (odRequests || []).length,
        pending_od_requests: (odRequests || []).filter((r) =>
          ["PENDING"].includes(String(r.admin_status || "").toUpperCase())
        ).length,
        rounds: (rounds || []).map((round) => ({
          round_id: Number(round.round_id),
          round_order: Number(round.round_order),
          round_name: round.round_name,
          round_date: round.round_date,
          round_end_date: round.round_end_date,
          round_mode: round.round_mode,
          status: round.status,
          od_proof_required: normalizeBoolean(round.od_proof_required)
        }))
      };
    })
  );

  return eventsWithDetails;
};

const getEventTeamsWithOdRequests = async (eventIdValue) => {
  const eventId = normalizeId(eventIdValue, "event_id");
  const event = await eventRepo.getEventById(eventId);
  if (!event) throw new Error("Event not found");

  const teams = await teamRepo.getTeamsByEventId(eventId);
  const allOdRequests = await repo.listRequests({ event_id: eventId });

  const teamsWithOd = (teams || [])
    .filter((team) => String(team.team_type || "").toUpperCase() === "EVENT")
    .map((team) => {
      const teamRequests = (allOdRequests || []).filter(
        (req) => Number(req.team_id) === Number(team.team_id)
      );

      return {
        team_id: Number(team.team_id),
        team_code: team.team_code,
        team_name: team.team_name,
        status: team.status,
        rounds_cleared: Number(team.rounds_cleared),
        member_count: Number(team.active_member_count) || 0,
        od_requests_count: teamRequests.length,
        od_requests: teamRequests.map((req) => ({
          od_request_id: Number(req.od_request_id),
          round_id: Number(req.round_id),
          round_order: Number(req.round_order),
          round_name: req.round_name,
          od_proof_required: normalizeBoolean(req.od_proof_required),
          proof_required: normalizeBoolean(req.od_proof_required),
          requested_from_date: req.requested_from_date,
          requested_to_date: req.requested_to_date,
          requested_day_count: Number(req.requested_day_count),
          requested_by_student_id: req.requested_by_student_id,
          requested_by_student_name: req.requested_by_student_name,
          faculty_status: req.faculty_status,
          hod_status: req.hod_status,
          admin_status: req.admin_status,
          faculty_notes: req.faculty_notes,
          hod_notes: req.hod_notes,
          admin_notes: req.admin_notes,
          shortlist_proof_path: req.shortlist_proof_path,
          shortlist_proof_name: req.shortlist_proof_name,
          shortlist_proof_type: req.shortlist_proof_type,
          reviewed_at: req.reviewed_at,
          created_at: req.created_at
        }))
      };
    });

  return teamsWithOd;
};

module.exports = {
  EXTERNAL_APPROVAL_STATUSES,
  ADMIN_APPROVAL_STATUSES,
  listRequests,
  getMyRequests,
  getTeamRequests,
  submitRequest,
  reviewRequest,
  getEventsWithOdDetails,
  getEventTeamsWithOdRequests
};
