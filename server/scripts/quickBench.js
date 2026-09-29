const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'server/.env' });

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const DURATION_SEC = parseInt(process.env.DURATION || '10', 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '100', 10);

const token = jwt.sign(
  { userId: '074e2c52-9b32-4eac-a209-54d892dfcfb2', role: 'SYSTEM_ADMIN' },
  process.env.JWT_SECRET || 'mySuperSecretKey123',
  { expiresIn: '1d' }
);

const endpoints = [
  { name: 'GET /api/groups', url: `${BASE_URL}/api/groups` },
  { name: 'GET /api/phases/current', url: `${BASE_URL}/api/phases/current` },
  { name: 'GET /api/eligibility/leaderboards', url: `${BASE_URL}/api/eligibility/leaderboards` }
];

async function runBenchmark() {
  console.log('======================================================');
  console.log('       GM PORTAL — IN-PROCESS LOAD BENCHMARK          ');
  console.log('======================================================');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Duration: ${DURATION_SEC} seconds`);
  console.log(`Concurrency: ${CONCURRENCY} parallel workers\n`);

  const latencies = [];
  let successfulRequests = 0;
  let failedRequests = 0;
  const startTime = Date.now();
  const endTime = startTime + DURATION_SEC * 1000;

  async function worker() {
    while (Date.now() < endTime) {
      const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
      const reqStart = performance.now();
      try {
        const res = await fetch(ep.url, {
          headers: {
            'Cookie': `token=${token}`,
            'Content-Type': 'application/json'
          }
        });
        const duration = performance.now() - reqStart;
        if (res.ok) {
          successfulRequests++;
          latencies.push(duration);
        } else {
          failedRequests++;
        }
      } catch (err) {
        failedRequests++;
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  const totalTimeSec = (Date.now() - startTime) / 1000;
  const totalRequests = successfulRequests + failedRequests;
  const rps = (totalRequests / totalTimeSec).toFixed(1);

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.50)]?.toFixed(2) || 0;
  const p90 = latencies[Math.floor(latencies.length * 0.90)]?.toFixed(2) || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)]?.toFixed(2) || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)]?.toFixed(2) || 0;
  const min = latencies[0]?.toFixed(2) || 0;
  const max = latencies[latencies.length - 1]?.toFixed(2) || 0;
  const errRate = ((failedRequests / (totalRequests || 1)) * 100).toFixed(2);

  console.log('\n--- BENCHMARK RESULTS ---');
  console.table([
    { Metric: 'Total Requests', Value: totalRequests },
    { Metric: 'Successful Requests', Value: successfulRequests },
    { Metric: 'Failed Requests', Value: failedRequests },
    { Metric: 'Error Rate', Value: `${errRate}%` },
    { Metric: 'Throughput (RPS)', Value: `${rps} req/sec` },
    { Metric: 'p50 Latency', Value: `${p50} ms` },
    { Metric: 'p90 Latency', Value: `${p90} ms` },
    { Metric: 'p95 Latency', Value: `${p95} ms` },
    { Metric: 'p99 Latency', Value: `${p99} ms` },
    { Metric: 'Min Latency', Value: `${min} ms` },
    { Metric: 'Max Latency', Value: `${max} ms` }
  ]);

  if (Number(rps) >= 500 && Number(p95) <= 100) {
    console.log('🚀 TARGET HIT: System comfortably delivers 500-1,000 RPS with sub-100ms p95 latency!');
  } else {
    console.log(`Measured: ${rps} RPS at p95 = ${p95}ms.`);
  }

  process.exit(0);
}

runBenchmark().catch((err) => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
