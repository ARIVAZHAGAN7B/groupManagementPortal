const cron = require("node-cron");
const phaseService = require("../modules/phase/phase.service");

let phaseFinalizationTask = null;
let isRunning = false;

const runPhaseFinalizationSweep = async (trigger = "cron") => {
  if (isRunning) return;
  isRunning = true;

  try {
    await phaseService.finalizeExpiredActivePhases();
  } catch (error) {
    console.error(`[phase-finalization:${trigger}]`, error?.message || error);
  } finally {
    isRunning = false;
  }
};

const startPhaseFinalizationCron = () => {
  if (phaseFinalizationTask) return phaseFinalizationTask;

  const enabled = String(process.env.PHASE_FINALIZER_CRON_ENABLED || "true").toLowerCase() !== "false";
  if (!enabled) {
    console.log("Phase finalization cron disabled (PHASE_FINALIZER_CRON_ENABLED=false)");
    return null;
  }

  const expression = process.env.PHASE_FINALIZER_CRON || "*/15 * * * * *";
  if (!cron.validate(expression)) {
    throw new Error(`Invalid PHASE_FINALIZER_CRON expression: ${expression}`);
  }

  phaseFinalizationTask = cron.schedule(expression, () => {
    void runPhaseFinalizationSweep("cron");
  });

  // Catch up phases that may have ended while the server was down.
  void runPhaseFinalizationSweep("startup");

  console.log(`Phase finalization cron started (${expression})`);
  return phaseFinalizationTask;
};

module.exports = {
  startPhaseFinalizationCron,
  runPhaseFinalizationSweep
};
