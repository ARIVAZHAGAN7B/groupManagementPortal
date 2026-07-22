const repo = require("./event.repository");

const normalizePositiveInteger = (value, fallback = 1) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const normalizeOptionalNonNegativeInteger = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

const resolveRequiredMinMembers = (eventLike, overrideMinMembers = undefined) =>
  normalizePositiveInteger(
    overrideMinMembers ?? eventLike?.min_members ?? eventLike?.event_min_members,
    1
  );

const resolveMaximumRegistrations = (eventLike) =>
  normalizeOptionalNonNegativeInteger(
    eventLike?.maximum_count ?? eventLike?.event_maximum_count
  );

const isEventParticipationTeam = (teamLike) => {
  if (!teamLike) return false;

  const teamType = String(teamLike.team_type || "").trim().toUpperCase();
  return teamType === "EVENT" || teamLike.event_id !== null && teamLike.event_id !== undefined;
};

const isActiveTeam = (teamLike) =>
  String(teamLike?.status ?? teamLike?.team_status ?? "")
    .trim()
    .toUpperCase() === "ACTIVE";

const getActiveMemberCount = (teamLike) => {
  const parsed = Number(teamLike?.active_member_count);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.floor(parsed);
};

const isTeamValidForParticipation = (teamLike, options = {}) => {
  if (!isEventParticipationTeam(teamLike)) return false;
  if (!isActiveTeam(teamLike)) return false;

  return (
    getActiveMemberCount(teamLike) >=
    resolveRequiredMinMembers(teamLike, options.requiredMinMembers)
  );
};

const getEventLikeOrThrow = async (eventId, options = {}, executor) => {
  const eventLike =
    options.eventLike ||
    (options.lockEvent ? await repo.lockEventById(eventId, executor) : null) ||
    (await repo.getEventById(eventId, executor));

  if (!eventLike) {
    throw new Error("Event not found");
  }

  return eventLike;
};

const getEventParticipationSummary = async (eventId, options = {}, executor) => {
  const normalizedEventId = Number(eventId);
  if (!Number.isInteger(normalizedEventId) || normalizedEventId <= 0) {
    throw new Error("event_id must be a positive integer");
  }

  const eventLike = await getEventLikeOrThrow(normalizedEventId, options, executor);
  const requiredMinMembers = resolveRequiredMinMembers(
    eventLike,
    options.requiredMinMembers
  );
  const maximumRegistrations = resolveMaximumRegistrations({
    ...eventLike,
    maximum_count:
      options.maximumCount !== undefined ? options.maximumCount : eventLike.maximum_count
  });
  const counts = await repo.getEventParticipationCounts(
    normalizedEventId,
    requiredMinMembers,
    executor
  );
  const totalTeamCount = Number(counts?.total_team_count) || 0;
  const activeTeamCount = Number(counts?.active_team_count) || 0;
  const validTeamCount = Number(counts?.valid_team_count) || 0;

  return {
    event_id: normalizedEventId,
    event: eventLike,
    total_team_count: totalTeamCount,
    active_team_count: activeTeamCount,
    valid_team_count: validTeamCount,
    forming_team_count: Math.max(activeTeamCount - validTeamCount, 0),
    required_min_members: requiredMinMembers,
    maximum_registrations: maximumRegistrations,
    balance_count:
      maximumRegistrations === null
        ? null
        : Math.max(0, maximumRegistrations - validTeamCount)
  };
};

const syncEventParticipationCounts = async (eventId, options = {}, executor) => {
  if (eventId === null || eventId === undefined || eventId === "") {
    return null;
  }

  const summary = await getEventParticipationSummary(eventId, options, executor);
  await repo.updateEventAppliedCount(summary.event_id, summary.valid_team_count, executor);
  return summary;
};

const ensureTeamCanBecomeValidWithoutOverflow = async (
  teamLike,
  nextActiveMemberCount,
  executor,
  options = {}
) => {
  if (!isEventParticipationTeam(teamLike) || !teamLike?.event_id) {
    return null;
  }

  const eventLike = await getEventLikeOrThrow(
    teamLike.event_id,
    { ...options, lockEvent: Boolean(options.lockEvent) },
    executor
  );
  const requiredMinMembers = resolveRequiredMinMembers(
    eventLike,
    options.requiredMinMembers
  );
  const currentIsValid = isTeamValidForParticipation(teamLike, {
    requiredMinMembers
  });
  const nextIsValid =
    isActiveTeam(teamLike) &&
    normalizePositiveInteger(nextActiveMemberCount, 0) >= requiredMinMembers;

  if (currentIsValid || !nextIsValid) {
    return {
      event: eventLike,
      current_is_valid: currentIsValid,
      next_is_valid: nextIsValid,
      required_min_members: requiredMinMembers
    };
  }

  const summary = await getEventParticipationSummary(
    teamLike.event_id,
    {
      eventLike,
      requiredMinMembers
    },
    executor
  );

  if (
    summary.maximum_registrations !== null &&
    summary.valid_team_count >= summary.maximum_registrations
  ) {
    throw new Error(
      `This event already has the maximum of ${summary.maximum_registrations} valid registrations`
    );
  }

  return {
    event: eventLike,
    summary,
    current_is_valid: currentIsValid,
    next_is_valid: nextIsValid,
    required_min_members: requiredMinMembers
  };
};

const ensureEventConfigurationCapacity = async (eventId, options = {}, executor) => {
  const summary = await getEventParticipationSummary(eventId, options, executor);

  if (
    summary.maximum_registrations !== null &&
    summary.valid_team_count > summary.maximum_registrations
  ) {
    throw new Error(
      `This event already has ${summary.valid_team_count} valid registration(s). Increase maximum count or reduce valid teams before saving.`
    );
  }

  return summary;
};

module.exports = {
  resolveRequiredMinMembers,
  isTeamValidForParticipation,
  getEventParticipationSummary,
  syncEventParticipationCounts,
  ensureTeamCanBecomeValidWithoutOverflow,
  ensureEventConfigurationCapacity
};
