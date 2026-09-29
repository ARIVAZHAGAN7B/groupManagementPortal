const cluster = require("node:cluster");
const os = require("node:os");

if (cluster.isPrimary) {
  const numWorkers =
    parseInt(process.env.WEB_CONCURRENCY || process.env.WORKERS, 10) ||
    Math.min(8, os.cpus().length || 4);
  console.log(`[Cluster Primary] Master PID ${process.pid} is online.`);
  console.log(`[Cluster Primary] Forking ${numWorkers} cluster workers...`);

  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on("online", (worker) => {
    console.log(`[Cluster Worker] Worker PID ${worker.process.pid} (ID: ${worker.id}) is online.`);
  });

  cluster.on("exit", (worker, code, signal) => {
    console.warn(`[Cluster Primary] Worker PID ${worker.process.pid} died (${signal || code}). Respawning...`);
    cluster.fork();
  });

  const shutdown = () => {
    console.log("\n[Cluster Primary] Shutting down cluster gracefully...");
    for (const id in cluster.workers) {
      cluster.workers[id]?.process.kill();
    }
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
} else {
  require("./server.js");
}
