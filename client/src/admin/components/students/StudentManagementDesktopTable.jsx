import StudentManagementBadge from "./StudentManagementBadge";
import {
  formatDate,
  formatNumber,
  getAcademicMeta,
  getGroupLabel,
  getGroupMeta,
  getStatusValue,
  GROUP_STATUS_STYLES,
  ROLE_STYLES,
  TIER_STYLES
} from "./studentManagement.constants";

export default function StudentManagementDesktopTable({ students }) {
  return (
    <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
      <div className="overflow-x-auto">
        <table className="min-w-[1180px] w-full border-collapse text-left">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Academic</th>
              <th className="px-6 py-4">Group</th>
              <th className="px-6 py-4 text-center">Tier</th>
              <th className="px-6 py-4 text-center">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Base Points</th>
              <th className="px-6 py-4 text-right">Phase Points</th>
              <th className="px-6 py-4">Joined</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {students.length > 0 ? (
              students.map((row) => (
                <tr
                  key={String(row.student_id)}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-slate-900">{row.name || "-"}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-[#1754cf]">
                      {row.student_id}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{row.email || "-"}</div>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600">{getAcademicMeta(row)}</td>

                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-slate-900">{getGroupLabel(row)}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-slate-400">
                      {getGroupMeta(row)}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <StudentManagementBadge value={row.group_tier} map={TIER_STYLES} />
                  </td>

                  <td className="px-6 py-4 text-center">
                    <StudentManagementBadge value={row.membership_role} map={ROLE_STYLES} />
                  </td>

                  <td className="px-6 py-4">
                    <StudentManagementBadge
                      value={getStatusValue(row)}
                      map={GROUP_STATUS_STYLES}
                    />
                  </td>

                  <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 tabular-nums">
                    {formatNumber(row.total_base_points)}
                  </td>

                  <td className="px-6 py-4 text-right text-sm font-bold text-[#1754cf] tabular-nums">
                    {formatNumber(row.this_phase_base_points)}
                  </td>

                  <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(row.join_date)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-500">
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
