const http = require("http");
const env = require("./config/env");
const app = require("./app");
const db = require("./config/db"); // import your MySQL pool
const { startPhaseEndScheduler } = require("./jobs/phaseEndScheduler");
const { startPhaseFinalizationCron } = require("./jobs/phaseFinalization.cron");
const { initializeRealtime } = require("./realtime/socket");
const membershipService = require("./modules/membership/membership.service");
const eligibilityService = require("./modules/eligibility/eligibility.service");

const PORT = env.port;

const startServer = async () => {
  try {
    // Test the DB connection
    const [rows] = await db.query("SELECT 1 + 1 AS result");
    console.log("DB connected, test query result:", rows[0].result);

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
