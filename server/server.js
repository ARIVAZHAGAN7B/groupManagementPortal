process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

const os = require("os");
// Scale libuv threadpool to avoid bottlenecking bcrypt / crypto operations under concurrency
const cpuCount = (os.cpus() || []).length || 4;
process.env.UV_THREADPOOL_SIZE =
  process.env.UV_THREADPOOL_SIZE || String(Math.min(128, Math.max(4, cpuCount * 2)));

const http = require("http");
const env = require("./config/env");
const app = require("./app");
const db = require("./config/db"); // import your MySQL pool
const { runMigrations } = require("./scripts/runMigrations");
const { startPhaseEndScheduler } = require("./jobs/phaseEndScheduler");
const { startPhaseFinalizationCron } = require("./jobs/phaseFinalization.cron");
const { initializeRealtime } = require("./realtime/socket");
const membershipService = require("./modules/membership/membership.service");
const eligibilityService = require("./modules/eligibility/eligibility.service");

const PORT = env.port;

const startServer = async () => {
  try {
    await runMigrations();

    // Test the DB connection
    const [rows] = await db.query("SELECT 1 + 1 AS result");
    console.log("DB connected, test query result:", rows[0].result);

    const cluster = require("node:cluster");
    const isPrimaryWorker = !cluster.isWorker || cluster.worker?.id === 1;

    if (isPrimaryWorker) {
      await startPhaseEndScheduler();
      startPhaseFinalizationCron();

      void membershipService.syncPendingGroupRankReviews().catch((error) => {
        console.error("Group rank review warmup failed:", error?.message || error);
      });
      
      void eligibilityService
        .syncStoredEligibilityPointAllocationsForAllPhases()
        .catch((error) => {
          console.error("Eligibility point sync warmup failed:", error?.message || error);
        });
    }

    const httpServer = http.createServer(app);
    initializeRealtime(httpServer);

    // Start Express server
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  }
};

startServer();
