import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
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

export default function StudentManagementMobileCards({ students }) {
  if (students.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm lg:hidden">
        No students found for current filters.
      </div>
    );
  }

  return (
    <section className="space-y-4 lg:hidden">
      {students.map((row) => (
        <article
          key={String(row.student_id)}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-slate-900">{row.name || "-"}</h3>
              <p className="mt-1 font-mono text-[11px] font-bold uppercase text-[#1754cf]">
                {row.student_id}
              </p>
            </div>

            <StudentManagementBadge
              value={getStatusValue(row)}
              map={GROUP_STATUS_STYLES}
            />
          </div>

          <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <MailOutlineRoundedIcon sx={{ fontSize: 16 }} className="mt-0.5 text-slate-400" />
              <span className="break-all">{row.email || "-"}</span>
            </div>

            <div className="flex items-start gap-2">
              <SchoolRoundedIcon sx={{ fontSize: 16 }} className="mt-0.5 text-slate-400" />
              <span>{getAcademicMeta(row)}</span>
            </div>

            <div className="flex items-start gap-2">
              <WorkspacePremiumRoundedIcon
                sx={{ fontSize: 16 }}
                className="mt-0.5 text-slate-400"
              />
              <div>
                <div className="font-semibold text-slate-800">{getGroupLabel(row)}</div>
                <div className="mt-0.5 font-mono text-[10px] text-slate-400">
                  {getGroupMeta(row)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <StudentManagementBadge value={row.group_tier} map={TIER_STYLES} />
            <StudentManagementBadge value={row.membership_role} map={ROLE_STYLES} />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Base
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {formatNumber(row.total_base_points)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Phase
              </p>
              <p className="mt-1 text-sm font-bold text-[#1754cf]">
                {formatNumber(row.this_phase_base_points)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Joined
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900">{formatDate(row.join_date)}</p>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
