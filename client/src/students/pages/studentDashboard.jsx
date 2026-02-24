import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../utils/AuthContext";
import { fetchMyDashboardSummary } from "../../service/eligibility.api";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  console.log("Authenticated user:", user);

  const loadSummary = async () => {
    setSummaryLoading(true);
    setSummaryError("");
    try {
      const data = await fetchMyDashboardSummary();
      setSummary(data || null);
    } catch (err) {
      setSummaryError(err?.response?.data?.message || "Failed to load dashboard summary.");
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/auth/logout",
        {},
        { withCredentials: true }
      );
      // redirect to login page
      navigate("/login");
      // optionally, you can also reload the page or reset user state
      window.location.reload(); // ensures App state resets
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Failed to logout. Please try again.");
    }
  };

  const eligibilityText = useMemo(() => {
    const value = summary?.this_phase_eligibility?.is_eligible;
    if (value === true) return "Eligible";
    if (value === false) return "Not Eligible";
    return "Not Available";
  }, [summary]);

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Welcome back</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {summary?.name || user?.name || "Student"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Student ID: {summary?.student_id || "-"}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadSummary}
              className="px-4 py-2 rounded border hover:bg-gray-50 transition"
              disabled={summaryLoading}
            >
              {summaryLoading ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {summaryError ? (
          <div className="mt-4 p-3 rounded border border-red-300 bg-red-50 text-red-700">
            {summaryError}
          </div>
        ) : null}

        {summaryLoading ? (
          <div className="mt-4 p-3 border rounded text-gray-600">
            Loading your points summary...
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">
                Base Points
              </div>
              <div className="mt-2 text-xl font-bold text-gray-900">
                {summary?.base_points ?? 0}
              </div>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">
                This Phase Base Points
              </div>
              <div className="mt-2 text-xl font-bold text-blue-700">
                {summary?.this_phase_base_points ?? 0}
              </div>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">
                Total Points
              </div>
              <div className="mt-2 text-xl font-bold text-gray-900">
                {summary?.total_points ?? 0}
              </div>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">
                Phase ID
              </div>
              <div className="mt-2 text-sm font-semibold text-gray-900 break-all">
                {summary?.this_phase_eligibility?.phase_id || "No active phase"}
              </div>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">
                This Phase Eligibility
              </div>
              <div
                className={`mt-2 text-lg font-bold ${
                  summary?.this_phase_eligibility?.is_eligible === true
                    ? "text-green-700"
                    : summary?.this_phase_eligibility?.is_eligible === false
                      ? "text-red-700"
                      : "text-gray-700"
                }`}
              >
                {eligibilityText}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Earned: {summary?.this_phase_eligibility?.earned_points ?? 0}
                {" | "}
                Target: {summary?.this_phase_eligibility?.target_points ?? "Not set"}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold">Student Dashboard</h1>
      </div>
      <p>
        Welcome to the student dashboard! Here you can view your groups, assignments, and
        progress.
      </p>
    </div>
  );
};

export default StudentDashboard;
