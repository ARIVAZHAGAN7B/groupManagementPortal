import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminStudentOverview,
  fetchStudentBasePoints,
  recordStudentBasePoints
} from "../../service/eligibility.api";

const todayIso = () => new Date().toISOString().slice(0, 10);

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

export default function BasePointsManagement() {
  const [students, setStudents] = useState([]);
  const [phase, setPhase] = useState(null);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState("");

  const [query, setQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [form, setForm] = useState({
    student_id: "",
    points: "",
    reason: "",
    activity_date: todayIso()
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const loadStudents = async () => {
    setStudentsLoading(true);
    setStudentsError("");
    try {
      const data = await fetchAdminStudentOverview();
      const nextStudents = Array.isArray(data?.students) ? data.students : [];
      setStudents(nextStudents);
      setPhase(data?.phase || null);

      setSelectedStudentId((prev) => {
        if (prev && nextStudents.some((row) => String(row.student_id) === String(prev))) {
          return prev;
        }
        return "";
      });
    } catch (err) {
      setStudents([]);
      setPhase(null);
      setSelectedStudentId("");
      setStudentsError(err?.response?.data?.message || "Failed to load students");
    } finally {
      setStudentsLoading(false);
    }
  };

  const loadStudentDetails = async (studentId) => {
    if (!studentId) {
      setDetails(null);
      setDetailsError("");
      setDetailsLoading(false);
      return;
    }

    setDetailsLoading(true);
    setDetailsError("");
    try {
      const data = await fetchStudentBasePoints(studentId, { limit: 20 });
      setDetails(data || null);
    } catch (err) {
      setDetails(null);
      setDetailsError(err?.response?.data?.message || "Failed to load base point history");
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    const normalized = String(selectedStudentId || "");
    setForm((prev) =>
      prev.student_id === normalized
        ? prev
        : {
            ...prev,
            student_id: normalized
          }
    );

    if (!selectedStudentId) {
      setDetails(null);
      setDetailsError("");
      return;
    }

    setDetails(null);
    loadStudentDetails(selectedStudentId);
  }, [selectedStudentId]);

  const studentMap = useMemo(
    () => new Map(students.map((row) => [String(row.student_id), row])),
    [students]
  );

  const selectedStudent = selectedStudentId ? studentMap.get(String(selectedStudentId)) || null : null;

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((row) =>
      [
        row.student_id,
        row.name,
        row.email,
        row.department,
        row.year,
        row.group_name,
        row.group_code
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .join(" ")
        .includes(q)
    );
  }, [students, query]);

  const selectStudent = (studentId) => {
    const id = String(studentId || "");
    setSelectedStudentId(id);
    setSubmitError("");
    setSubmitSuccess("");
    setForm((prev) => ({
      ...prev,
      student_id: id
    }));
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    const studentId = String(form.student_id || selectedStudentId || "").trim();
    const rawPoints = String(form.points ?? "").trim();
    const pointsValue = Number(rawPoints);
    const reason = String(form.reason || "").trim();

    if (!studentId) {
      setSubmitError("Select a student");
      return;
    }

    if (rawPoints === "" || !Number.isInteger(pointsValue)) {
      setSubmitError("Points must be an integer");
      return;
    }

    if (reason.length < 3) {
      setSubmitError("Reason must be at least 3 characters");
      return;
    }

    setSubmitting(true);
    try {
      const response = await recordStudentBasePoints({
        student_id: studentId,
        points: pointsValue,
        reason,
        ...(form.activity_date ? { activity_date: form.activity_date } : {})
      });

      const result = response?.data || {};
      const total = Number(result?.total_base_points);
      setSubmitSuccess(
        Number.isFinite(total)
          ? `Recorded ${pointsValue} points for ${studentId}. Total: ${total.toLocaleString()}`
          : `Recorded ${pointsValue} points for ${studentId}`
      );

      setSelectedStudentId(studentId);
      setForm((prev) => ({
        ...prev,
        student_id: studentId,
        points: "",
        reason: ""
      }));

      await Promise.all([loadStudents(), loadStudentDetails(studentId)]);
    } catch (err) {
      setSubmitError(err?.response?.data?.message || "Failed to record base points");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-900">Base Points</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Add or adjust base points for students and review recent point history.
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            {phase?.phase_id
              ? `Active phase: ${formatDate(phase.start_date)} - ${formatDate(phase.end_date)}`
              : "No active phase found"}
          </p>
        </div>
        <button
          type="button"
          onClick={loadStudents}
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors w-fit"
          disabled={studentsLoading}
        >
          {studentsLoading ? "Loading..." : "Refresh Students"}
        </button>
      </div>

      {studentsError ? (
        <div className="px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          {studentsError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6">
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-100 bg-white">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Add Base Points</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Select a student, enter integer points, and save.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Student</label>
                <select
                  value={form.student_id}
                  onChange={(e) => selectStudent(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                  disabled={studentsLoading || students.length === 0}
                >
                  <option value="">{studentsLoading ? "Loading students..." : "Select a student"}</option>
                  {students.map((student) => (
                    <option key={student.student_id} value={student.student_id}>
                      {student.student_id} - {student.name || "Unknown"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Points</label>
                  <input
                    type="number"
                    step="1"
                    value={form.points}
                    onChange={(e) => updateForm("points", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="e.g. 10 or -5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Activity Date</label>
                  <input
                    type="date"
                    value={form.activity_date}
                    onChange={(e) => updateForm("activity_date", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Reason</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => updateForm("reason", e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Reason for awarding or adjusting points"
                />
              </div>

              {submitError ? (
                <div className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
                  {submitError}
                </div>
              ) : null}

              {submitSuccess ? (
                <div className="px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-sm text-emerald-700">
                  {submitSuccess}
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Save Base Points"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      points: "",
                      reason: "",
                      activity_date: todayIso()
                    }))
                  }
                  className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50"
                >
                  Reset Fields
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Selected Student</h2>
            </div>
            <div className="p-4">
              {selectedStudent ? (
                <div className="space-y-2 text-sm">
                  <div className="font-semibold text-gray-900">{selectedStudent.name || "-"}</div>
                  <div className="text-xs text-gray-500 font-mono">{selectedStudent.student_id}</div>
                  <div className="text-xs text-gray-600">
                    {selectedStudent.department || "-"} | Year {selectedStudent.year ?? "-"}
                  </div>
                  <div className="text-xs text-gray-600">
                    Group: {selectedStudent.group_name || "No group"}
                    {selectedStudent.group_code ? ` (${selectedStudent.group_code})` : ""}
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <div className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">
                        Total Base
                      </div>
                      <div className="text-base font-bold text-gray-800">
                        {(Number(selectedStudent.total_base_points) || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <div className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">
                        This Phase
                      </div>
                      <div className="text-base font-bold text-indigo-600">
                        {(Number(selectedStudent.this_phase_base_points) || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">Select a student to view details.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-100 bg-white">
            <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Students</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Pick a student from the list to add points and review history.
                </p>
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full sm:w-72 border border-gray-200 rounded-lg px-3 py-1.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Search student, group, or email"
              />
            </div>

            {studentsLoading ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">Loading students...</div>
            ) : (
              <div className="overflow-auto">
                <table className="min-w-[900px] w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["Student", "Email", "Group", "Total Base", "Phase", "Action"].map((header) => (
                        <th
                          key={header}
                          className="text-left px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-gray-400"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredStudents.map((row) => {
                      const isSelected = String(row.student_id) === String(selectedStudentId);
                      return (
                        <tr key={row.student_id} className={isSelected ? "bg-blue-50/40" : "hover:bg-gray-50"}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-800">{row.name || "-"}</div>
                            <div className="text-[11px] text-gray-400 font-mono">{row.student_id}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{row.email || "-"}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {row.group_name || "No group"}
                            {row.group_code ? ` (${row.group_code})` : ""}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-700 tabular-nums">
                            {(Number(row.total_base_points) || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-semibold text-indigo-600 tabular-nums">
                            {(Number(row.this_phase_base_points) || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => selectStudent(row.student_id)}
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                                isSelected
                                  ? "border-blue-200 bg-blue-100 text-blue-700"
                                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {isSelected ? "Selected" : "Select"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                          No students found{query ? ` for "${query}"` : ""}.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-100 bg-white">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Recent Base Point History</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedStudentId ? `Student: ${selectedStudentId}` : "Select a student to load history"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => loadStudentDetails(selectedStudentId)}
                disabled={!selectedStudentId || detailsLoading}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
              >
                {detailsLoading ? "Loading..." : "Refresh History"}
              </button>
            </div>

            {detailsError ? (
              <div className="m-4 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
                {detailsError}
              </div>
            ) : null}

            {!selectedStudentId ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Select a student to view base point history.
              </div>
            ) : detailsLoading && !details ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">Loading history...</div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-4 text-xs">
                  <div className="text-gray-500">
                    Total Base:{" "}
                    <span className="font-semibold text-gray-800">
                      {(Number(details?.summary?.total_base_points) || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-gray-500">
                    Last Updated:{" "}
                    <span className="font-semibold text-gray-800">
                      {formatDateTime(details?.summary?.last_updated)}
                    </span>
                  </div>
                </div>

                <div className="overflow-auto">
                  <table className="min-w-[720px] w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {["Activity Date", "Points", "Reason", "Recorded At"].map((header) => (
                          <th
                            key={header}
                            className="text-left px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-gray-400"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(Array.isArray(details?.history) ? details.history : []).map((row) => (
                        <tr key={row.history_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">{formatDate(row.activity_date)}</td>
                          <td
                            className={`px-4 py-3 font-semibold tabular-nums ${
                              Number(row.points) >= 0 ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            {Number(row.points) > 0 ? "+" : ""}
                            {Number(row.points) || 0}
                          </td>
                          <td className="px-4 py-3 text-gray-700">{row.reason || "-"}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {formatDateTime(row.created_at)}
                          </td>
                        </tr>
                      ))}

                      {(Array.isArray(details?.history) ? details.history.length : 0) === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                            No base point history found for this student.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
