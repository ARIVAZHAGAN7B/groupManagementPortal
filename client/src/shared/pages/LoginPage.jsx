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

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      const { role, userId, name, sessionExpiresAt } = response.data;

      // update App's user state
      onLogin({ userId, role, name, sessionExpiresAt });

      // navigate to role dashboard
      if (role === "ADMIN" || role === "SYSTEM_ADMIN") {
        navigate("/admin/dashboard");
      } else if (role === "STUDENT") {
        navigate("/student/dashboard");
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message);
      } else {
        setError("Server error");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-sky-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-indigo-100 bg-white p-8 shadow-xl shadow-indigo-200/30">
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
            className="mx-auto h-20 w-20 rounded-2xl object-contain shadow-sm"
          />
          <span className="mt-4 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-indigo-700">
            GM Portal
          </span>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">{selectedMode.title}</h2>
          <p className="mt-2 text-sm text-slate-500">
            {selectedMode.description}
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
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
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>

        <div className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">
              Recommended {selectedMode.label} Accounts
            </p>
            {accountsLoading ? (
              <span className="text-xs font-semibold text-slate-500">Loading...</span>
            ) : null}
          </div>

          <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
            {recommendedAccounts.map((account) => (
              <button
                key={account.userId || account.email || account.accountId}
                type="button"
                onClick={() => {
                  setEmail(account.email || "");
                  setError("");
                }}
                className="w-full rounded-xl border border-indigo-100 bg-white px-3 py-2 text-left transition hover:border-indigo-300 hover:bg-indigo-50"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-slate-900">
                      {account.name || selectedMode.label}
                    </span>
                    <span className="mt-0.5 block break-all text-xs text-slate-500">
                      {account.email || "-"}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-bold uppercase text-indigo-700">
                    Use
                  </span>
                </span>
                <span className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
                  <span>{selectedMode.idLabel}: {account.accountId || "-"}</span>
                  <span>Role: {account.role || selectedMode.label.toUpperCase()}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 transition focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 transition focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 py-2.5 font-semibold text-white shadow-lg shadow-indigo-200/40 transition hover:bg-indigo-700"
          >
            Login as {selectedMode.label}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
