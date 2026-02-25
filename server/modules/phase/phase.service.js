const repo = require("./phase.repository");
const db = require("../../config/db");
const { v4: uuidv4 } = require("uuid");
const eligibilityService = require("../eligibility/eligibility.service");

const REQUIRED_TIERS = ["D", "C", "B", "A"];

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
  return day !== 0 && day !== 6 && !holidays.includes(formatted);
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

const finalizeExpiredActivePhases = async () => {
  const now = formatDateTime(new Date());
  if (!now) return;

  const expiredPhases = await repo.getExpiredActivePhases(now);
  if (!Array.isArray(expiredPhases) || expiredPhases.length === 0) return;

  for (const phase of expiredPhases) {
    await eligibilityService.evaluatePhaseEligibility(phase.phase_id);
    await repo.updatePhaseStatus(phase.phase_id, "COMPLETED");
  }
};

const calculatePhaseDates = async (startDate, totalDays, changeDayNumber) => {
  const [holidayRows] = await db.query(`SELECT holiday_date FROM holidays`);
  const holidays = holidayRows.map((h) => toDateOnly(h.holiday_date)).filter(Boolean);

  let count = 0;
  let currentDate = new Date(startDate);
  let changeDay = null;
  let endDate = null;

  while (count < totalDays) {
    if (isWorkingDay(currentDate, holidays)) {
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
  if (!data?.start_date) {
    throw new Error("start_date is required");
  }

  const phase_name = normalizePhaseName(data.phase_name);
  const phase_id = uuidv4();
  const startDate = toStartOfDay(data.start_date);
  if (!startDate) {
    throw new Error("Invalid start_date");
  }

  const totalWorkingDays = Number(data.total_working_days || 10);
  const changeDayNumber = Number(data.change_day_number || 5);
  const startTime = normalizeTimeValue(data.start_time, "08:00:00", "start_time");
  const endTime = normalizeTimeValue(data.end_time, "19:00:00", "end_time");

  if (!Number.isInteger(totalWorkingDays) || totalWorkingDays <= 0) {
    throw new Error("total_working_days must be a positive integer");
  }

  if (
    !Number.isInteger(changeDayNumber) ||
    changeDayNumber <= 0 ||
    changeDayNumber >= totalWorkingDays
  ) {
    throw new Error("change_day_number must be between 1 and total_working_days - 1");
  }

  const { changeDay, endDate } = await calculatePhaseDates(
    startDate,
    totalWorkingDays,
    changeDayNumber
  );
  const normalizedTargets = normalizeTargets(data.targets);
  const normalizedIndividualTarget = normalizeIndividualTarget(data.individual_target);

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
    status: "ACTIVE"
  };

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await repo.deactivateActivePhases(connection);
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
  await finalizeExpiredActivePhases();

  const phase = await repo.getCurrentPhase();
  if (!phase) return null;

  const [holidayRows] = await db.query(`SELECT holiday_date FROM holidays`);
  const holidays = holidayRows.map((h) => toDateOnly(h.holiday_date)).filter(Boolean);

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
    if (isWorkingDay(current, holidays)) {
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
  await finalizeExpiredActivePhases();
  return repo.getPhaseById(phase_id);
};

const getAllPhases = async () => {
  await finalizeExpiredActivePhases();
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

module.exports = {
  createPhase,
  setPhaseTargets,
  getPhaseTargets,
  finalizeExpiredActivePhases,
  getCurrentPhase,
  getPhaseById,
  getAllPhases,
  isChangeDay
};
