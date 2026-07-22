import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Image from "../../assets/Image";
import ThemeModeControl from "../components/theme/ThemeModeControl";
import { API_BASE_URL } from "../../lib/api";

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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
          <h2 className="mt-4 text-2xl font-bold text-slate-900">Login</h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to continue to your dashboard.
          </p>
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
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
