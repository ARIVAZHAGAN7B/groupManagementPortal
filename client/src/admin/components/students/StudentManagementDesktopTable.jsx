import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import StudentManagementBadge from "./StudentManagementBadge";
import { AdminIconActionButton } from "../ui/AdminUiPrimitives";
import {
  formatDate,
  formatNumber,
  getAcademicMeta,
  getGroupLabel,
  ROLE_STYLES,
  TIER_STYLES
} from "./studentManagement.constants";

const getStudentLabel = (row) => {
  const name = row?.name || "-";
  const studentId = row?.student_id ? ` (${row.student_id})` : "";
  return `${name}${studentId}`;
};

export default function StudentManagementDesktopTable({ students, onView }) {
  return (
    <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
      <div className="overflow-x-auto">
        <table className="min-w-[1220px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {[
                "Student",
                "Email",
                "Academic",
                "Group",
                "Tier",
                "Role",
                "Base Points",
                "Phase Points",
                "Joined",
                "View"
              ].map((header) => (
                <th
                  key={header}
                  className="whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {students.length > 0 ? (
              students.map((row) => (
                <tr
                  key={String(row.student_id)}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  <td className="max-w-[200px] px-4 py-3 text-xs font-semibold text-slate-900">
                    <span className="block truncate whitespace-nowrap" title={getStudentLabel(row)}>
                      {getStudentLabel(row)}
                    </span>
                  </td>

                  <td className="max-w-[220px] px-4 py-3 text-xs text-slate-600">
                    <span className="block truncate whitespace-nowrap" title={row.email || "-"}>
                      {row.email || "-"}
                    </span>
                  </td>

                  <td className="max-w-[190px] px-4 py-3 text-xs text-slate-600">
                    <span
                      className="block truncate whitespace-nowrap"
                      title={getAcademicMeta(row)}
                    >
                      {getAcademicMeta(row)}
                    </span>
                  </td>

                  <td className="max-w-[180px] px-4 py-3 text-xs font-medium text-slate-700">
                    <span
                      className="block truncate whitespace-nowrap"
                      title={getGroupLabel(row)}
                    >
                      {getGroupLabel(row)}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-xs">
                    <StudentManagementBadge value={row.group_tier} map={TIER_STYLES} />
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-xs">
                    <StudentManagementBadge value={row.membership_role} map={ROLE_STYLES} />
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-slate-900 tabular-nums">
                    {formatNumber(row.total_base_points)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-[#1754cf] tabular-nums">
                    {formatNumber(row.this_phase_base_points)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-slate-600">
                    {formatDate(row.join_date)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <AdminIconActionButton
                      label={`View ${row.name || row.student_id}`}
                      onClick={() => onView?.(row.student_id)}
                      className="rounded-full border border-slate-200 bg-white text-slate-500 hover:border-[#1754cf] hover:text-[#1754cf]"
                    >
                      <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                    </AdminIconActionButton>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-sm text-slate-500">
                  No students found for current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
