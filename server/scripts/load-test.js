import http from "k6/http";
import { check, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const HttpErrors = new Counter('http_errors');
const ErrorRate = new Rate('error_rate');
const GroupListLatency = new Trend('latency_group_list');
const DashboardLatency = new Trend('latency_dashboard');
const AuthMeLatency = new Trend('latency_auth_me');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

export const options = {
  scenarios: {
    capacity_test: {
      executor: 'ramping-arrival-rate',
      startRate: 50,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 1500,
      stages: [
        { target: 50, duration: '30s' },
        { target: 150, duration: '1m' },
        { target: 300, duration: '1m' },
        { target: 500, duration: '1m' },
        { target: 50, duration: '30s' },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<300', 'p(99)<800'],
    error_rate: ['rate<0.01'],
    latency_group_list: ['p(95)<400'],
  },
};

function getRequestHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (AUTH_TOKEN) {
    headers['Cookie'] = `token=${AUTH_TOKEN}`;
  }
  return { headers, timeout: '10s' };
}

export default function () {
  const params = getRequestHeaders();
  const rand = Math.random();

  if (rand < 0.60) {
    group('Student Dashboard Flow', function () {
      const res = http.get(`${BASE_URL}/api/eligibility/my-dashboard-summary`, params);
      DashboardLatency.add(res.timings.duration);
      const passed = check(res, {
        'status is 200': (r) => r.status === 200,
        'has dashboard payload': (r) => r.body && r.body.length > 20,
      });
      ErrorRate.add(passed ? 0 : 1);
      if (!passed) HttpErrors.add(1);
    });
  } else if (rand < 0.85) {
    group('Group Overview (Covering Index)', function () {
      const res = http.get(`${BASE_URL}/api/groups/`, params);
      GroupListLatency.add(res.timings.duration);
      const passed = check(res, {
        'status is 200': (r) => r.status === 200,
        'groups array present': (r) => r.status === 200 && Array.isArray(r.json()),
      });
      ErrorRate.add(passed ? 0 : 1);
      if (!passed) HttpErrors.add(1);
    });
  } else if (rand < 0.95) {
    group('Auth Verification (/me)', function () {
      const res = http.get(`${BASE_URL}/api/auth/me`, params);
      AuthMeLatency.add(res.timings.duration);
      const passed = check(res, {
        'status is 200': (r) => r.status === 200,
      });
      ErrorRate.add(passed ? 0 : 1);
      if (!passed) HttpErrors.add(1);
    });
  } else {
    group('Student Leaderboards', function () {
      const res = http.get(`${BASE_URL}/api/eligibility/leaderboards`, params);
      const passed = check(res, {
        'status is 200 or 304': (r) => r.status === 200 || r.status === 304,
      });
      ErrorRate.add(passed ? 0 : 1);
      if (!passed) HttpErrors.add(1);
    });
  }
}
