import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Image from "../../assets/Image";
import ThemeModeControl from "../components/theme/ThemeModeControl";
import { API_BASE_URL } from "../../lib/api";

const LOGIN_MODES = {
  student: {
    label: "Student",
    title: "Student Login",
    description: "Use your student account email and password.",
    idLabel: "Student ID",
    accountsKey: "students",
    fallbackAccounts: [
      {
        accountId: "STU001",
        email: "student@example.com",
        name: "Demo Student",
        role: "STUDENT"
      }
    ]
  },
  admin: {
    label: "Admin",
    title: "Admin Login",
    description: "Use your admin account email and password.",
    idLabel: "Admin ID",
    accountsKey: "admins",
    fallbackAccounts: [
      {
        accountId: "ADM001",
        email: "admin@example.com",
        name: "System Admin",
        role: "SYSTEM_ADMIN"
      }
    ]
  }
};

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState("student");
  const [demoAccounts, setDemoAccounts] = useState({ students: [], admins: [] });
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const selectedMode = LOGIN_MODES[activeMode];
  const recommendedAccounts = useMemo(() => {
    const accounts = demoAccounts[selectedMode.accountsKey];
    return accounts?.length ? accounts : selectedMode.fallbackAccounts;
  }, [demoAccounts, selectedMode]);

  useEffect(() => {
    let isMounted = true;

    const loadDemoAccounts = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/auth/demo-accounts`);

        if (!isMounted) return;

        setDemoAccounts({
          students: Array.isArray(data?.students) ? data.students : [],
          admins: Array.isArray(data?.admins) ? data.admins : []
        });
      } catch (_error) {
        if (isMounted) {
          setDemoAccounts({ students: [], admins: [] });
        }
      } finally {
        if (isMounted) {
          setAccountsLoading(false);
        }
      }
    };

    loadDemoAccounts();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      const { role, userId, name, sessionExpiresAt } = response.data;

      // update App's user state
      onLogin({ userId, role, name, sessionExpiresAt });

      // navigate to root dashboard (handled by role router)
      navigate("/", { replace: true });
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || "Invalid credentials");
      } else {
        setError("Network error. Please check server connection.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50/60 via-slate-50 to-indigo-50/40 px-4 transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="mb-4 flex justify-end">
          <ThemeModeControl />
        </div>

        <div className="mb-6 text-center">
          <img
            src={Image.GMPLogo}
            alt="GM Portal logo"
            width="80"
            height="80"
            decoding="async"
            className="mx-auto h-20 w-20 rounded-2xl object-contain shadow-xs"
          />
          <span className="mt-4 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
            GM Portal
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {selectedMode.title}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {selectedMode.description}
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {Object.entries(LOGIN_MODES).map(([mode, config]) => {
            const isActive = activeMode === mode;

            return (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setActiveMode(mode);
                  setError("");
                }}
                className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                  isActive
                    ? "bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-300"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>

        <div className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/30">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
              Recommended {selectedMode.label} Accounts
            </p>
            {accountsLoading ? (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading...</span>
            ) : null}
          </div>

          <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
            {recommendedAccounts.map((account) => (
              <button
                key={account.userId || account.email || account.accountId}
                type="button"
                onClick={() => {
                  setEmail(account.email || "");
                  setPassword("Password@123");
                  setError("");
                }}
                className="w-full rounded-xl border border-indigo-100 bg-white px-3 py-2 text-left transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                      {account.name || selectedMode.label}
                    </span>
                    <span className="mt-0.5 block break-all text-xs text-slate-500 dark:text-slate-400">
                      {account.email || "-"}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-bold uppercase text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                    Use
                  </span>
                </span>
                <span className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span>{selectedMode.idLabel}: {account.accountId || "-"}</span>
                  <span>Role: {account.role || selectedMode.label.toUpperCase()}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.edu"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-brand-500 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-brand-400"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-brand-500 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-brand-400"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full cursor-pointer rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/25 transition-all hover:bg-brand-700 focus:outline-hidden focus:ring-3 focus:ring-brand-500/30 disabled:opacity-60"
          >
            {submitting ? "Signing in..." : `Login as ${selectedMode.label}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
