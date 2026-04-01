const repo = require("./phase.repository");
const db = require("../../config/db");
const { v4: uuidv4 } = require("uuid");
const eligibilityService = require("../eligibility/eligibility.service");
const { completePhaseWithEvaluation } = require("./phase.finalization");
const { syncPhaseEndSchedule } = require("../../jobs/phaseEndScheduler");
const { broadcastPhaseChanged } = require("../../realtime/events");
const env = require("../../config/env");

const REQUIRED_TIERS = ["D", "C", "B", "A"];
const HOLIDAY_CACHE_TTL_MS = env.holidayCacheTtlMs;
let holidayCache = {
  expiresAt: 0,
  holidays: [],
  holidaySet: new Set()
};

const pad2 = (value) => String(value).padStart(2, "0");

const parseDateValue = (value) => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getTime());
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (dateOnlyMatch) {
      return new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3])
      );
    }
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const formatDateOnly = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

const formatDateTime = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return `${formatDateOnly(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(
    date.getSeconds()
  )}`;
};

const isWorkingDay = (date, holidays) => {
  const day = date.getDay();
  const formatted = formatDateOnly(date);
  const isHoliday = holidays instanceof Set ? holidays.has(formatted) : holidays.includes(formatted);
  return day !== 0 && day !== 6 && !isHoliday;
};

const toStartOfDay = (value) => {
  const d = parseDateValue(value);
  if (!d) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const toDateOnly = (value) => {
  const d = parseDateValue(value);
  if (!d) return null;
  return formatDateOnly(d);
};

const normalizeTimeValue = (value, fallback, fieldName) => {
  const source = value === undefined || value === null || value === "" ? fallback : value;
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(source).trim());
  if (!match) {
    throw new Error(`${fieldName} must be in HH:mm or HH:mm:ss format`);
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] === undefined ? 0 : Number(match[3]);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    throw new Error(`${fieldName} must be a valid time`);
  }

  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
};

const buildDateTimeFromDateAndTime = (dateValue, normalizedTime) => {
  const d = parseDateValue(dateValue);
  if (!d) return null;

  const [hours, minutes, seconds] = String(normalizedTime || "00:00:00")
    .split(":")
    .map((item) => Number(item));

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds)
  ) {
    return null;
  }

  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    hours,
    minutes,
    seconds,
    0
  );
};

const resolvePhaseStatusByWindow = (startDate, endDate, startTime, endTime) => {
  const startAt = buildDateTimeFromDateAndTime(startDate, startTime);
  const endAt = buildDateTimeFromDateAndTime(endDate, endTime);
  const now = new Date();

  if (!startAt || !endAt || Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    throw new Error("Phase has invalid start/end date-time values");
  }

  if (endAt <= startAt) {
    throw new Error("Phase end date-time must be after phase start date-time");
  }

  if (now >= endAt) return "COMPLETED";
  if (now >= startAt) return "ACTIVE";
  return "INACTIVE";
};

const windowsOverlap = (aStartAt, aEndAt, bStartAt, bEndAt) =>
  aStartAt < bEndAt && bStartAt < aEndAt;

const ensureNoPhaseWindowOverlap = async ({
  currentPhaseId = null,
  startDate,
  endDate,
  startTime,
  endTime
}) => {
  const startAt = buildDateTimeFromDateAndTime(startDate, startTime);
  const endAt = buildDateTimeFromDateAndTime(endDate, endTime);
  if (!startAt || !endAt || Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    throw new Error("Phase has invalid start/end date-time values");
  }

  const phases = await repo.getAllPhases();
  for (const phase of Array.isArray(phases) ? phases : []) {
    if (!phase?.phase_id) continue;
    if (currentPhaseId && String(phase.phase_id) === String(currentPhaseId)) continue;

    const existingStartTime = normalizeTimeValue(
      phase.start_time || "00:00:00",
      "00:00:00",
      "start_time"
    );
    const existingEndTime = normalizeTimeValue(
      phase.end_time || "23:59:59",
      "23:59:59",
      "end_time"
    );
    const existingStartAt = buildDateTimeFromDateAndTime(phase.start_date, existingStartTime);
    const existingEndAt = buildDateTimeFromDateAndTime(phase.end_date, existingEndTime);
    if (
      !existingStartAt ||
      !existingEndAt ||
      Number.isNaN(existingStartAt.getTime()) ||
      Number.isNaN(existingEndAt.getTime())
    ) {
      continue;
    }

    if (windowsOverlap(startAt, endAt, existingStartAt, existingEndAt)) {
      throw new Error(
        `Phase window overlaps with existing phase (${phase.phase_name || phase.phase_id}). Set start date/time after previous phase end.`
      );
    }
  }
};

const finalizeExpiredActivePhases = async () => {
  const now = formatDateTime(new Date());
  const nowDate = new Date();
  if (!now) return;

  const [expiredActivePhases, expiredInactivePhases] = await Promise.all([
    repo.getExpiredActivePhases(now),
    repo.getExpiredInactivePhases(now)
  ]);

  for (const phase of Array.isArray(expiredActivePhases) ? expiredActivePhases : []) {
    await completePhaseWithEvaluation(phase.phase_id);
  }

  for (const phase of Array.isArray(expiredInactivePhases) ? expiredInactivePhases : []) {
    await completePhaseWithEvaluation(phase.phase_id);
  }

  const dueInactivePhases = await repo.getDueInactivePhases(now);
  for (const duePhase of Array.isArray(dueInactivePhases) ? dueInactivePhases : []) {
    let hasBlockingActivePhase = false;
    const activePhases = await repo.getActivePhases();
    for (const activePhase of Array.isArray(activePhases) ? activePhases : []) {
      if (String(activePhase.phase_id) === String(duePhase.phase_id)) continue;

      const activeEndTime = normalizeTimeValue(
        activePhase.end_time || "23:59:59",
        "23:59:59",
        "end_time"
      );
      const activeEndAt = buildDateTimeFromDateAndTime(activePhase.end_date, activeEndTime);

      if (
        activeEndAt &&
        !Number.isNaN(activeEndAt.getTime()) &&
        nowDate < activeEndAt
      ) {
        hasBlockingActivePhase = true;
        break;
      }

      await completePhaseWithEvaluation(activePhase.phase_id);
    }

    if (hasBlockingActivePhase) {
      continue;
    }

    await repo.updatePhaseStatus(duePhase.phase_id, "ACTIVE");
    broadcastPhaseChanged({
      action: "PHASE_ACTIVATED",
      phaseId: duePhase.phase_id,
      status: "ACTIVE"
    });
  }
};

const getHolidayDateList = async () => {
  const now = Date.now();
  if (holidayCache.expiresAt > now) {
    return holidayCache;
  }

  const [holidayRows] = await db.query(`SELECT holiday_date FROM holidays`);
  const holidays = holidayRows.map((h) => toDateOnly(h.holiday_date)).filter(Boolean);

  holidayCache = {
    expiresAt: now + HOLIDAY_CACHE_TTL_MS,
    holidays,
    holidaySet: new Set(holidays)
  };

  return holidayCache;
};

const calculatePhaseDates = async (startDate, totalDays, changeDayNumber) => {
  const { holidaySet } = await getHolidayDateList();

  let count = 0;
  let currentDate = new Date(startDate);
  let changeDay = null;
  let endDate = null;

  while (count < totalDays) {
    if (isWorkingDay(currentDate, holidaySet)) {
      count += 1;
      if (count === changeDayNumber) {
        changeDay = new Date(currentDate);
      }
      if (count === totalDays) {
        endDate = new Date(currentDate);
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return { changeDay, endDate };
};

const calculateChangeDayNumberForDate = async (startDate, changeDayDate) => {
  const { holidaySet } = await getHolidayDateList();

  let count = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= changeDayDate) {
    if (isWorkingDay(currentDate, holidaySet)) {
      count += 1;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
};

const calculateWorkingDaysInRange = async (startDate, endDate) => {
  const { holidaySet } = await getHolidayDateList();
  let count = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (isWorkingDay(currentDate, holidaySet)) {
      count += 1;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
};

const calculateWorkingDaysMetricsInRange = async (startDate, endDate) => {
  const { holidaySet } = await getHolidayDateList();
  let totalWorkingDays = 0;
  let holidayCount = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const formatted = formatDateOnly(currentDate);
    const isHoliday = holidaySet.has(formatted);

    if (isHoliday && currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      holidayCount += 1;
    }

    if (isWorkingDay(currentDate, holidaySet)) {
      totalWorkingDays += 1;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    total_working_days: totalWorkingDays,
    holiday_count: holidayCount
  };
};

const calculateChangeDayDateByNumber = async (startDate, changeDayNumber) => {
  const { holidaySet } = await getHolidayDateList();
  let count = 0;
  const currentDate = new Date(startDate);

  while (count < changeDayNumber) {
    if (isWorkingDay(currentDate, holidaySet)) {
      count += 1;
    }
    if (count === changeDayNumber) {
      return new Date(currentDate);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return null;
};

const normalizeTargets = (targets) => {
  if (!Array.isArray(targets)) {
    throw new Error("targets are required");
  }

  const normalized = targets.map((target) => {
    const tier = String(target?.tier || "").toUpperCase();
    const groupTarget = Number(target?.group_target);

    if (!tier) {
      throw new Error("tier is required for each target row");
    }

    if (!Number.isFinite(groupTarget)) {
      throw new Error("All group targets must be numbers");
    }

    if (groupTarget < 0) {
      throw new Error("All group targets must be 0 or more");
    }

    return {
      tier,
      group_target: groupTarget
    };
  });

  const uniqueTiers = new Set(normalized.map((item) => item.tier));
  const hasAllRequiredTiers =
    REQUIRED_TIERS.every((tier) => uniqueTiers.has(tier)) &&
    uniqueTiers.size === REQUIRED_TIERS.length;

  if (!hasAllRequiredTiers) {
    throw new Error("targets must include D, C, B and A tiers");
  }

  return normalized;
};

const normalizeIndividualTarget = (value) => {
  const target = Number(value);
  if (!Number.isFinite(target) || target < 0) {
    throw new Error("individual_target must be a number greater than or equal to 0");
  }
  return target;
};

const normalizePhaseName = (value) => {
  const phaseName = String(value ?? "").trim();
  if (!phaseName) {
    throw new Error("phase_name is required");
  }
  return phaseName;
};

const createPhase = async (data) => {
  await finalizeExpiredActivePhases();

  if (!data?.start_date) {
    throw new Error("start_date is required");
  }

  const phase_name = normalizePhaseName(data.phase_name);
  const phase_id = uuidv4();
  const startDate = toStartOfDay(data.start_date);
  if (!startDate) {
    throw new Error("Invalid start_date");
  }

  const changeDayNumber = Number(data.change_day_number || 5);
  const configuredEndDate = data?.end_date ? toStartOfDay(data.end_date) : null;
  const startTime = normalizeTimeValue(data.start_time, "08:00:00", "start_time");
  const endTime = normalizeTimeValue(data.end_time, "19:00:00", "end_time");
  let totalWorkingDays = Number(data.total_working_days || 10);
  let endDate = null;
  let changeDay = null;

  if (!Number.isInteger(changeDayNumber) || changeDayNumber <= 0) {
    throw new Error("change_day_number must be a positive integer");
  }

  if (data?.end_date !== undefined && data?.end_date !== null && data?.end_date !== "") {
    if (!configuredEndDate) {
      throw new Error("Invalid end_date");
    }

    if (configuredEndDate <= startDate) {
      throw new Error("end_date must be after start_date");
    }

    endDate = configuredEndDate;
    totalWorkingDays = await calculateWorkingDaysInRange(startDate, endDate);

    if (!Number.isInteger(totalWorkingDays) || totalWorkingDays <= 1) {
      throw new Error("Configured start_date and end_date must include at least 2 working days");
    }

    if (changeDayNumber >= totalWorkingDays) {
      throw new Error("change_day_number must be between 1 and total_working_days - 1");
    }

    changeDay = await calculateChangeDayDateByNumber(startDate, changeDayNumber);
    if (!changeDay || changeDay > endDate) {
      throw new Error("change_day_number exceeds available working days before end_date");
    }
  } else {
    if (!Number.isInteger(totalWorkingDays) || totalWorkingDays <= 0) {
      throw new Error("total_working_days must be a positive integer");
    }

    if (changeDayNumber >= totalWorkingDays) {
      throw new Error("change_day_number must be between 1 and total_working_days - 1");
    }

    const calculatedDates = await calculatePhaseDates(
      startDate,
      totalWorkingDays,
      changeDayNumber
    );
    changeDay = calculatedDates.changeDay;
    endDate = calculatedDates.endDate;
  }
  const normalizedTargets = normalizeTargets(data.targets);
  const normalizedIndividualTarget = normalizeIndividualTarget(data.individual_target);

  await ensureNoPhaseWindowOverlap({
    currentPhaseId: null,
    startDate,
    endDate,
    startTime,
    endTime
  });

  const phase = {
    phase_id,
    phase_name,
    start_date: formatDateOnly(startDate),
    end_date: formatDateOnly(endDate),
    total_working_days: totalWorkingDays,
    change_day_number: changeDayNumber,
    change_day: formatDateOnly(changeDay),
    start_time: startTime,
    end_time: endTime,
    status: resolvePhaseStatusByWindow(startDate, endDate, startTime, endTime)
  };

  // Ensure outgoing active phases have evaluated eligibility and completed status
  // so "previous phase eligibility" is available for tier-management flows.
  const activePhasesToClose =
    phase.status === "ACTIVE" ? await repo.getActivePhases() : [];
  for (const activePhase of Array.isArray(activePhasesToClose) ? activePhasesToClose : []) {
    if (!activePhase?.phase_id) continue;
    await eligibilityService.evaluatePhaseEligibility(activePhase.phase_id);
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    if (phase.status === "ACTIVE") {
      for (const activePhase of Array.isArray(activePhasesToClose) ? activePhasesToClose : []) {
        if (!activePhase?.phase_id) continue;
        await repo.updatePhaseStatus(activePhase.phase_id, "COMPLETED", connection);
      }
      // Safety fallback in case of unexpected concurrent active rows.
      await repo.deactivateActivePhases(connection);
    }

    await repo.insertPhase(phase, connection);
    for (const target of normalizedTargets) {
      await repo.insertPhaseTarget(
        {
          phase_id,
          tier: target.tier,
          group_target: target.group_target,
          individual_target: normalizedIndividualTarget
        },
        connection
      );
    }

    await repo.upsertIndividualPhaseTarget(
      {
        phase_id,
        target: normalizedIndividualTarget
      },
      connection
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  for (const activePhase of Array.isArray(activePhasesToClose) ? activePhasesToClose : []) {
    if (!activePhase?.phase_id) continue;
    await syncPhaseEndSchedule({
      ...activePhase,
      status: "COMPLETED"
    });
    await completePhaseWithEvaluation(activePhase.phase_id, {
      broadcast: false
    });
  }

  await syncPhaseEndSchedule(phase, {
    forcePending: phase.status === "COMPLETED"
  });

  if (phase.status === "COMPLETED") {
    await completePhaseWithEvaluation(phase.phase_id, {
      broadcast: false
    });
  }

  return phase;
};

const setPhaseTargets = async (phase_id, targets, individualTarget) => {
  const normalizedTargets = normalizeTargets(targets);
  const normalizedIndividualTarget = normalizeIndividualTarget(individualTarget);

  for (const t of normalizedTargets) {
    await repo.insertPhaseTarget({
      phase_id,
      tier: t.tier,
      group_target: t.group_target,
      individual_target: normalizedIndividualTarget
    });
  }

  await repo.upsertIndividualPhaseTarget({
    phase_id,
    target: normalizedIndividualTarget
  });
};

const getPhaseTargets = async (phase_id) => {
  const targets = await repo.getPhaseTargets(phase_id);
  const individual = await repo.getIndividualPhaseTarget(phase_id);
  const fallbackTarget =
    Array.isArray(targets) && targets.length > 0 ? targets[0].individual_target : null;

  return {
    targets,
    individual_target: individual?.target ?? fallbackTarget ?? null
  };
};
const getCurrentPhase = async () => {
  const phase = await repo.getCurrentPhase();
  if (!phase) return null;

  const { holidaySet } = await getHolidayDateList();

  const today = toStartOfDay(new Date());
  const startDate = toStartOfDay(phase.start_date);
  const endDate = toStartOfDay(phase.end_date);

  if (!today || !startDate || !endDate) {
    return {
      ...phase,
      remaining_working_days: 0
    };
  }

  if (today > endDate) {
    return {
      ...phase,
      remaining_working_days: 0
    };
  }

  let current = today > startDate ? today : startDate;
  let remainingWorkingDays = 0;

  while (current <= endDate) {
    if (isWorkingDay(current, holidaySet)) {
      remainingWorkingDays += 1;
    }
    current.setDate(current.getDate() + 1);
  }

  return {
    ...phase,
    remaining_working_days: remainingWorkingDays
  };
};
const getPhaseById = async (phase_id) => {
  return repo.getPhaseById(phase_id);
};

const getAllPhases = async () => {
  return repo.getAllPhases();
};

const isChangeDay = async (phase_id) => {
  const phase = await repo.getPhaseById(phase_id);
  if (!phase) {
    throw new Error("Phase not found");
  }

  const today = toDateOnly(new Date());

  return {
    isChangeDay: today === phase.change_day,
    change_day: phase.change_day
  };
};

const updatePhaseSettings = async (phase_id, payload = {}) => {
  await finalizeExpiredActivePhases();

  const phase = await repo.getPhaseById(phase_id);
  if (!phase) {
    throw new Error("Phase not found");
  }

  if (String(phase.status || "").toUpperCase() !== "ACTIVE") {
    throw new Error("Only active phase settings can be updated");
  }

  const startDate = toStartOfDay(phase.start_date);
  const currentChangeDay = toStartOfDay(phase.change_day);
  const nextEndDate = payload?.end_date ? toStartOfDay(payload.end_date) : toStartOfDay(phase.end_date);
  if (!startDate || !nextEndDate || !currentChangeDay) {
    throw new Error("Phase has invalid date values");
  }

  if (nextEndDate <= startDate) {
    throw new Error("end_date must be after start_date");
  }

  if (currentChangeDay >= nextEndDate) {
    throw new Error("end_date must be after current change_day");
  }

  const totalWorkingDays = await calculateWorkingDaysInRange(startDate, nextEndDate);
  if (!Number.isInteger(totalWorkingDays) || totalWorkingDays <= 1) {
    throw new Error("Configured phase must include at least 2 working days");
  }

  const changeDayNumber = await calculateChangeDayNumberForDate(startDate, currentChangeDay);
  if (
    !Number.isInteger(changeDayNumber) ||
    changeDayNumber <= 0 ||
    changeDayNumber >= totalWorkingDays
  ) {
    throw new Error("Current change_day is outside the configured phase window");
  }

  const startTime = normalizeTimeValue(payload?.start_time, phase.start_time || "08:00:00", "start_time");
  const endTime = normalizeTimeValue(payload?.end_time, phase.end_time || "19:00:00", "end_time");

  await ensureNoPhaseWindowOverlap({
    currentPhaseId: phase_id,
    startDate,
    endDate: nextEndDate,
    startTime,
    endTime
  });

  await repo.updatePhaseSettings(
    phase_id,
    {
      end_date: formatDateOnly(nextEndDate),
      total_working_days: totalWorkingDays,
      change_day_number: changeDayNumber,
      start_time: startTime,
      end_time: endTime
    }
  );

  // Re-run finalization after settings update so eligibility/status update immediately
  // when the phase end window is moved to the past.
  await finalizeExpiredActivePhases();

  const updatedPhase = await repo.getPhaseById(phase_id);
  if (updatedPhase) {
    await syncPhaseEndSchedule(updatedPhase);
  }

  return updatedPhase;
};

const updatePhaseChangeDay = async (phase_id, change_day) => {
  await finalizeExpiredActivePhases();

  const phase = await repo.getPhaseById(phase_id);
  if (!phase) {
    throw new Error("Phase not found");
  }

  if (String(phase.status || "").toUpperCase() !== "ACTIVE") {
    throw new Error("Only active phase change day can be updated");
  }

  const selectedDate = toStartOfDay(change_day);
  if (!selectedDate) {
    throw new Error("Invalid change_day");
  }

  const startDate = toStartOfDay(phase.start_date);
  const endDate = toStartOfDay(phase.end_date);
  const today = toStartOfDay(new Date());
  if (!startDate || !endDate || !today) {
    throw new Error("Phase has invalid date boundaries");
  }

  const minAllowedDate = new Date(startDate);
  minAllowedDate.setDate(minAllowedDate.getDate() + 1);

  const endMinusOneDate = new Date(endDate);
  endMinusOneDate.setDate(endMinusOneDate.getDate() - 1);

  const maxAllowedDate = today < endMinusOneDate ? today : endMinusOneDate;
  if (maxAllowedDate < minAllowedDate) {
    throw new Error("No valid change day range available for this phase");
  }

  if (selectedDate < minAllowedDate || selectedDate > maxAllowedDate) {
    throw new Error(
      `change_day must be between ${formatDateOnly(minAllowedDate)} and ${formatDateOnly(
        maxAllowedDate
      )}`
    );
  }

  const changeDayNumber = await calculateChangeDayNumberForDate(startDate, selectedDate);
  if (!Number.isInteger(changeDayNumber) || changeDayNumber <= 0) {
    throw new Error("Unable to compute change_day_number for the selected date");
  }

  const totalWorkingDays = Number(phase.total_working_days);
  if (Number.isInteger(totalWorkingDays) && changeDayNumber >= totalWorkingDays) {
    throw new Error("change_day must be before the final working day");
  }

  await repo.updatePhaseChangeDay(phase_id, formatDateOnly(selectedDate), changeDayNumber);
  return repo.getPhaseById(phase_id);
};

const previewWorkingDays = async ({ start_date, end_date } = {}) => {
  const startDate = toStartOfDay(start_date);
  const endDate = toStartOfDay(end_date);

  if (!startDate) {
    throw new Error("start_date is required");
  }

  if (!endDate) {
    throw new Error("end_date is required");
  }

  if (endDate <= startDate) {
    throw new Error("end_date must be after start_date");
  }

  const metrics = await calculateWorkingDaysMetricsInRange(startDate, endDate);

  return {
    start_date: formatDateOnly(startDate),
    end_date: formatDateOnly(endDate),
    total_working_days: metrics.total_working_days,
    holiday_count: metrics.holiday_count
  };
};

module.exports = {
  createPhase,
  setPhaseTargets,
  getPhaseTargets,
  finalizeExpiredActivePhases,
  getCurrentPhase,
  getPhaseById,
  getAllPhases,
  isChangeDay,
  updatePhaseSettings,
  updatePhaseChangeDay,
  previewWorkingDays
};
