import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Image from "../../assets/Image";
import ThemeModeControl from "../components/theme/ThemeModeControl";
import { API_BASE_URL } from "../../lib/api";

const LOGIN_MODES = {
  student: {
    label: "Student Portal",
    badge: "Student Access",
    title: "Student Sign In",
    description: "Access your squad dashboard, milestones, and on-duty requests.",
    idLabel: "Student ID",
    accountsKey: "students",
    fallbackAccounts: [
      {
        accountId: "7376241IT745",
        email: "student745@bitsathy.ac.in",
        name: "Student 745 (IT)",
        department: "IT",
        role: "STUDENT"
      },
      {
        accountId: "7376251EC892",
        email: "student892@bitsathy.ac.in",
        name: "Student 892 (ECE)",
        department: "ECE",
        role: "STUDENT"
      }
    ]
  },
  admin: {
    label: "Faculty & Admin",
    badge: "Administrative Portal",
    title: "Administrator Sign In",
    description: "Manage system configurations, phase finalizations, and approvals.",
    idLabel: "Admin ID",
    accountsKey: "admins",
    fallbackAccounts: [
      {
        accountId: "ADM001",
        email: "admin001@bitsathy.ac.in",
        name: "System Admin 1",
        role: "SYSTEM_ADMIN"
      },
      {
        accountId: "ADM066",
        email: "admin066@bitsathy.ac.in",
        name: "Faculty Admin 66",
        role: "ADMIN"
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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showDemoDrawer, setShowDemoDrawer] = useState(false);

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

  const handleSelectAccount = (account) => {
    setEmail(account.email || "");
    setPassword("Password@123");
    setError("");
  };

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
      onLogin({ userId, role, name, sessionExpiresAt });
      navigate("/", { replace: true });
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || "Invalid credentials. Check email & password.");
      } else {
        setError("Network error. Could not reach server.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* LEFT COLUMN: Premium Enterprise Showcase (Desktop only) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white lg:flex xl:p-16">
        {/* Subtle Background Glow Orbs */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-indigo-400/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#312e81_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <img
            src={Image.GMPLogo}
            alt="GM Portal Logo"
            className="h-11 w-11 rounded-xl bg-white/10 p-1.5 backdrop-blur-md"
          />
          <div>
            <span className="text-lg font-black tracking-tight text-white">GM PORTAL</span>
            <span className="ml-2 rounded-full border border-indigo-500/30 bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-indigo-300">
              v2.4 Enterprise
            </span>
          </div>
        </div>

        {/* Hero Narrative & Features */}
        <div className="relative z-10 my-auto max-w-lg space-y-8 py-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-950/60 px-3 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Academic Governance & Collaboration Engine
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Elevate squad synergy & performance.
            </h1>
            <p className="text-base text-slate-400 leading-relaxed">
              A comprehensive portal for student squads, leadership hierarchies, automated tier transitions, and accredited milestone tracking.
            </p>
          </div>

          {/* Value Proposition Cards */}
          <div className="space-y-3.5">
            <div className="flex items-start gap-3.5 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md transition hover:border-indigo-400/40 hover:bg-white/[0.08]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-300">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Dynamic Tier Matrix</h4>
                <p className="text-xs text-slate-400 leading-normal">
                  Algorithmic scoring promoting squads from Tier D through Tier A based on reliability and contributions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md transition hover:border-indigo-400/40 hover:bg-white/[0.08]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600/30 text-emerald-300">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Multi-Tier Approvals</h4>
                <p className="text-xs text-slate-400 leading-normal">
                  Structured authorization workflows for on-duty leave, leadership transitions, and event invitations.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md transition hover:border-indigo-400/40 hover:bg-white/[0.08]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-600/30 text-sky-300">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Live Real-Time Telemetry</h4>
                <p className="text-xs text-slate-400 leading-normal">
                  Instant Socket.IO sync for notifications, points updates, and activity feeds.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Metrics */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-slate-400">
          <div className="flex gap-6">
            <span><strong className="text-white">100+</strong> Squads</span>
            <span><strong className="text-white">900+</strong> Students</span>
            <span><strong className="text-white">6</strong> Evaluation Phases</span>
          </div>
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Systems Operational
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: Modern Clean Authentication Panel */}
      <div className="flex min-h-screen w-full flex-col justify-between px-6 py-10 sm:px-12 lg:w-1/2 lg:px-16 xl:px-24">
        {/* Top Header with Theme Switcher */}
        <div className="flex items-center justify-between">
          {/* Mobile Logo display */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <img src={Image.GMPLogo} alt="Logo" className="h-9 w-9 rounded-lg" />
            <span className="text-base font-extrabold tracking-tight">GM Portal</span>
          </div>
          <div className="hidden lg:block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Institutional Access
          </div>
          <ThemeModeControl />
        </div>

        {/* Main Login Form Container */}
        <div className="mx-auto my-auto w-full max-w-md py-8">
          <div className="mb-8">
            <div className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              {selectedMode.badge}
            </div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              {selectedMode.title}
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
              {selectedMode.description}
            </p>
          </div>

          {/* Segmented Role Selector */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
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
                  className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-400"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {mode === "student" ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  )}
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              <svg className="h-5 w-5 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Institutional Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@bitsathy.ac.in"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-4 pl-10 text-sm text-slate-900 transition focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-10 pl-10 text-sm text-slate-900 transition focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700"
                />
                Remember me
              </label>
              <span className="text-slate-400 dark:text-slate-500">
                Default password: <strong className="text-slate-600 dark:text-slate-300">Password@123</strong>
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Authenticating...
                </>
              ) : (
                `Sign in to ${selectedMode.label}`
              )}
            </button>
          </form>

          {/* Collapsible Fast Demo Account Selector */}
          <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowDemoDrawer(!showDemoDrawer)}
              className="flex w-full items-center justify-between rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 px-3.5 py-2.5 text-left text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-900/60 dark:bg-indigo-950/20 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
            >
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                  ⚡
                </span>
                Quick Demo Accounts ({recommendedAccounts.length} ready)
              </span>
              <svg
                className={`h-4 w-4 transform transition-transform ${showDemoDrawer ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDemoDrawer && (
              <div className="mt-2.5 max-h-56 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-inner dark:border-slate-800 dark:bg-slate-900">
                {accountsLoading ? (
                  <div className="p-3 text-center text-xs text-slate-400">Loading accounts...</div>
                ) : (
                  recommendedAccounts.map((account) => (
                    <button
                      key={account.userId || account.email || account.accountId}
                      type="button"
                      onClick={() => handleSelectAccount(account)}
                      className="group flex w-full items-center justify-between rounded-lg p-2 text-left text-xs transition hover:bg-indigo-50 dark:hover:bg-slate-800"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-slate-800 truncate dark:text-slate-200">
                          {account.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {account.email} • {account.accountId}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-md border border-indigo-200 bg-white px-2 py-1 text-[10px] font-bold text-indigo-600 group-hover:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400">
                        Auto-fill
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-4 text-center text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
          Group Management Portal • Bannari Amman Institute of Technology
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
