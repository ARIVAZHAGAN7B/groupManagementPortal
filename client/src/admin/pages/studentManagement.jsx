import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentManagementDesktopTable from "../components/students/StudentManagementDesktopTable";
import StudentManagementFilters from "../components/students/StudentManagementFilters";
import StudentManagementHero from "../components/students/StudentManagementHero";
import StudentManagementMobileCards from "../components/students/StudentManagementMobileCards";
import AdminPaginationBar from "../components/ui/AdminPaginationBar";
import useClientPagination from "../../hooks/useClientPagination";
import {
  getMembershipState
} from "../components/students/studentManagement.constants";
import { fetchAdminStudentOverview } from "../../service/eligibility.api";

export default function StudentManagement() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [phase, setPhase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchAdminStudentOverview();
      setRows(Array.isArray(data?.students) ? data.students : []);
      setPhase(data?.phase || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load student management data");
      setRows([]);
      setPhase(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const yearOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => String(row?.year || "").trim())
            .filter(Boolean)
        )
      ).sort((a, b) => Number(a) - Number(b)),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const search = String(q || "").trim().toLowerCase();

    return rows.filter((row) => {
      const membershipState = getMembershipState(row);
      const rowYear = String(row?.year || "").trim();

      if (groupFilter !== "ALL" && membershipState !== groupFilter) return false;
      if (yearFilter !== "ALL" && rowYear !== yearFilter) return false;

      if (!search) return true;

      return [
        row.student_id,
        row.name,
        row.email,
        row.department,
        row.year,
        row.group_code,
        row.group_name,
        row.group_tier,
        row.group_status,
        row.membership_role,
        row.membership_status
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .some((value) => value.includes(search));
    });
  }, [groupFilter, q, rows, yearFilter]);

  const {
    limit,
    page,
    pageCount,
    pagedItems: pagedRows,
    setLimit,
    setPage
  } = useClientPagination(filteredRows);

  useEffect(() => {
    setPage(1);
  }, [groupFilter, q, setPage, yearFilter]);

  const stats = useMemo(() => {
    const totalStudents = rows.length;
    const inGroup = rows.filter((row) => Boolean(row?.group_id)).length;
    const ungrouped = totalStudents - inGroup;
    const totalBasePoints = rows.reduce(
      (sum, row) => sum + (Number(row?.total_base_points) || 0),
      0
    );
    const totalPhasePoints = rows.reduce(
      (sum, row) => sum + (Number(row?.this_phase_base_points) || 0),
      0
    );

    return {
      totalStudents,
      inGroup,
      ungrouped,
      totalBasePoints,
      totalPhasePoints
    };
  }, [rows]);

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 font-[Inter] text-slate-900 md:px-6">
      <StudentManagementHero
        filteredCount={filteredRows.length}
        loading={loading}
        onRefresh={load}
        phase={phase}
        stats={stats}
      />

      <StudentManagementFilters
        filteredCount={filteredRows.length}
        groupFilter={groupFilter}
        q={q}
        setGroupFilter={setGroupFilter}
        setQ={setQ}
        setYearFilter={setYearFilter}
        totalCount={stats.totalStudents}
        yearFilter={yearFilter}
        yearOptions={yearOptions}
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
          Loading students...
        </div>
      ) : (
        <>
          <StudentManagementMobileCards students={pagedRows} />
          <StudentManagementMobileCards
            students={pagedRows}
            onView={(studentId) => navigate(`/student-management/${studentId}`)}
          />
          <StudentManagementDesktopTable
            students={pagedRows}
            onView={(studentId) => navigate(`/student-management/${studentId}`)}
          />
        </>
      )}

      <AdminPaginationBar
        itemLabel="students"
        limit={limit}
        loading={loading}
        onLimitChange={setLimit}
        onPageChange={setPage}
        page={page}
        pageCount={pageCount}
        shownCount={pagedRows.length}
        totalCount={filteredRows.length}
      />
    </section>
  );
}
