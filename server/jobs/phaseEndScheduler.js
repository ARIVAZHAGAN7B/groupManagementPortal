const repo = require("../modules/phase/phase.repository");
const { completePhaseWithEvaluation } = require("../modules/phase/phase.finalization");

const MAX_TIMEOUT_MS = 2147483647;
const DEFAULT_BATCH_SIZE = 25;
const DEFAULT_STALE_LOCK_MS = 5 * 60 * 1000;
const DEFAULT_RETRY_MS = 60 * 1000;
const MAX_RETRY_MS = 5 * 60 * 1000;

let schedulerStartPromise = null;
let schedulerStarted = false;
let nextWakeTimer = null;
let refreshTimer = null;
let isProcessingDueJobs = false;

const workerId = `${process.pid}:${Math.random().toString(36).slice(2, 10)}`;

const pad2 = (value) => String(value).padStart(2, "0");

const parseDateValue = (value) => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getTime());
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const dateTimeMatch =
      /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(trimmed);
    if (dateTimeMatch) {
      return new Date(
        Number(dateTimeMatch[1]),
        Number(dateTimeMatch[2]) - 1,
        Number(dateTimeMatch[3]),
        Number(dateTimeMatch[4] || 0),
        Number(dateTimeMatch[5] || 0),
        Number(dateTimeMatch[6] || 0),
        0
      );
    }
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
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

const normalizeTimeValue = (value, fallback = "23:59:59") => {
  const source = value === undefined || value === null || value === "" ? fallback : value;
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(source).trim());
  if (!match) return fallback;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] || 0);
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
    return fallback;
  }

  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
};

const buildDateTimeFromDateAndTime = (dateValue, normalizedTime) => {
  const date = parseDateValue(dateValue);
  if (!date) return null;

  const [hours, minutes, seconds] = String(normalizedTime || "00:00:00")
    .split(":")
    .map((value) => Number(value));

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds)
  ) {
    return null;
  }

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    seconds,
    0
  );
};

const getPhaseEndRunAt = (phase) =>
  buildDateTimeFromDateAndTime(phase?.end_date, normalizeTimeValue(phase?.end_time, "23:59:59"));

const getRetryDelayMs = (attempts) => {
  const retryCount = Math.max(1, Number(attempts) || 1);
  return Math.min(MAX_RETRY_MS, DEFAULT_RETRY_MS * retryCount);
};

const clearNextWakeTimer = () => {
  if (nextWakeTimer) {
    clearTimeout(nextWakeTimer);
    nextWakeTimer = null;
  }
};

const queueScheduleRefresh = (trigger = "refresh") => {
  if (!schedulerStarted || refreshTimer) return;

  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    void scheduleNextWake(trigger);
  }, 0);

  refreshTimer.unref?.();
};

const scheduleNextWake = async (_trigger = "refresh") => {
  if (!schedulerStarted) return null;

  clearNextWakeTimer();

  const nextJob = await repo.getNextPendingPhaseEndJob();
  if (!nextJob?.run_at) return null;

  const nextRunAt = parseDateValue(nextJob.run_at);
  if (!nextRunAt) return null;

  const delayMs = Math.max(0, nextRunAt.getTime() - Date.now());
  nextWakeTimer = setTimeout(() => {
    void processDuePhaseEndJobs("timer");
  }, Math.min(delayMs, MAX_TIMEOUT_MS));

  nextWakeTimer.unref?.();
  return nextJob;
};

const processDuePhaseEndJobs = async (trigger = "scheduler") => {
  if (!schedulerStarted || isProcessingDueJobs) return;
  isProcessingDueJobs = true;
  clearNextWakeTimer();

  try {
    const staleThreshold = formatDateTime(new Date(Date.now() - DEFAULT_STALE_LOCK_MS));
    if (staleThreshold) {
      await repo.requeueStaleRunningPhaseEndJobs(staleThreshold);
    }

    while (true) {
      const dueAt = formatDateTime(new Date());
      if (!dueAt) break;

      const dueJobs = await repo.listDuePhaseEndJobs(dueAt, DEFAULT_BATCH_SIZE);
      if (!Array.isArray(dueJobs) || dueJobs.length === 0) break;

      for (const job of dueJobs) {
        const claimed = await repo.claimPhaseEndJob(job.job_id, workerId);
        if (!claimed) continue;

        try {
          const phase = await repo.getPhaseById(job.phase_id);
          if (!phase) {
            await repo.cancelPhaseEndJobByPhaseId(job.phase_id, "Phase not found");
            continue;
          }

          const actualRunAt = getPhaseEndRunAt(phase);
          const actualRunAtText = formatDateTime(actualRunAt);
          if (!actualRunAt || !actualRunAtText) {
            await repo.cancelPhaseEndJobByPhaseId(job.phase_id, "Phase end time is invalid");
            continue;
          }

          if (actualRunAt.getTime() > Date.now()) {
            await repo.reschedulePhaseEndJob(job.job_id, actualRunAtText);
            continue;
          }

          await completePhaseWithEvaluation(job.phase_id);
          await repo.completePhaseEndJob(job.job_id);
        } catch (error) {
          const nextRetryAt = formatDateTime(
            new Date(Date.now() + getRetryDelayMs((Number(job.attempts) || 0) + 1))
          );

          if (nextRetryAt) {
            await repo.reschedulePhaseEndJob(
              job.job_id,
              nextRetryAt,
              String(error?.message || error).slice(0, 2000)
            );
          }

          console.error(`[phase-end-scheduler:${trigger}]`, error?.message || error);
        }
      }

      if (dueJobs.length < DEFAULT_BATCH_SIZE) {
        break;
      }
    }
  } finally {
    isProcessingDueJobs = false;
    await scheduleNextWake(`after-${trigger}`);
  }
};

const syncPhaseEndSchedule = async (phase, options = {}) => {
  if (!phase?.phase_id) return null;

  const runAt = getPhaseEndRunAt(phase);
  const runAtText = formatDateTime(runAt);
  if (!runAt || !runAtText) {
    await repo.cancelPhaseEndJobByPhaseId(phase.phase_id, "Phase end time is invalid");
    queueScheduleRefresh("phase-invalid");
    return null;
  }

  const status = options.forcePending === true || String(phase.status || "").toUpperCase() !== "COMPLETED"
    ? "PENDING"
    : "COMPLETED";

  await repo.upsertPhaseEndJob({
    phase_id: phase.phase_id,
    run_at: runAtText,
    status
  });

  queueScheduleRefresh("phase-sync");
  return {
    phase_id: phase.phase_id,
    run_at: runAtText,
    status
  };
};

const startPhaseEndScheduler = async () => {
  if (!schedulerStartPromise) {
    schedulerStartPromise = (async () => {
      schedulerStarted = true;
      await processDuePhaseEndJobs("startup");
      await scheduleNextWake("startup");
      console.log("Phase end scheduler started");
    })().catch((error) => {
      schedulerStarted = false;
      schedulerStartPromise = null;
      throw error;
    });
  }

  return schedulerStartPromise;
};

module.exports = {
  startPhaseEndScheduler,
  syncPhaseEndSchedule,
  processDuePhaseEndJobs
};
