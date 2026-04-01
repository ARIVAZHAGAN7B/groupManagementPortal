import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import StudentManagementBadge from "../components/students/StudentManagementBadge";
import {
  formatDate,
  formatNumber,
  GROUP_STATUS_STYLES,
  ROLE_STYLES,
  TIER_STYLES
} from "../components/students/studentManagement.constants";
import AdminWorkspaceHero, {
  AdminWorkspaceHeroActionButton
} from "../components/ui/AdminWorkspaceHero";
import { fetchAdminStudentProfile } from "../../service/eligibility.api";

const MEMBERSHIP_STATUS_STYLES = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  LEFT: "border-slate-200 bg-slate-100 text-slate-600"
};

const TEAM_STATUS_STYLES = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  COMPLETED: "border-[#bfd2ff] bg-[#e8efff] text-[#1754cf]",
  INACTIVE: "border-slate-200 bg-slate-100 text-slate-600",
  FROZEN: "border-sky-200 bg-sky-50 text-sky-700",
  ARCHIVED: "border-amber-200 bg-amber-50 text-amber-700"
};

const TEAM_TYPE_STYLES = {
  TEAM: "border-[#bfd2ff] bg-[#e8efff] text-[#1754cf]",
  HUB: "border-slate-200 bg-slate-100 text-slate-700",
  EVENT: "border-emerald-200 bg-emerald-50 text-emerald-700"
};

const ELIGIBILITY_STYLES = {
  ELIGIBLE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  NOT_ELIGIBLE: "border-rose-200 bg-rose-50 text-rose-700",
  NOT_AVAILABLE: "border-slate-200 bg-slate-100 text-slate-600"
};

const tableHeaderClass =
  "whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500";
const tableCellClass = "px-4 py-3 align-top text-xs text-slate-700";
const compactTableHeaderClass =
  "whitespace-nowrap px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500";
const compactTableCellClass = "whitespace-nowrap px-3 py-2.5 align-top text-[11px] text-slate-700";

const getEligibilityValue = (value) => {
  if (value === true) return "ELIGIBLE";
  if (value === false) return "NOT_ELIGIBLE";
  return "NOT_AVAILABLE";
};

const getPhaseLabel = (row) => String(row?.phase_name || "").trim() || "Noname";

const getShortPhaseId = (phaseId) => {
  const value = String(phaseId || "").trim();
  return value ? value.slice(0, 8).toUpperCase() : "";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

function SectionCard({ title, description = null, children, action = null }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {action}
      </div>

      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

function StatCard({ label, value, accentClassName = "text-slate-900", meta = null }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-bold ${accentClassName}`}>{value}</div>
      {meta ? <div className="mt-1 text-xs text-slate-500">{meta}</div> : null}
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
      <div className="mt-0.5 text-slate-400">
        <Icon sx={{ fontSize: 18 }} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </div>
        <div className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</div>
      </div>
    </div>
  );
}

function MetricTile({ label, value, accentClassName = "text-slate-900" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className={`mt-1 text-base font-bold ${accentClassName}`}>{value}</div>
    </div>
  );
}

function EmptyPanel({ message }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-5">
      <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}

export default function StudentManagementDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    if (!studentId) {
      setError("Student id is missing");
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await fetchAdminStudentProfile(studentId);
      setProfile(data || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load student dashboard");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [studentId]);

  const student = profile?.student || null;
  const summary = profile?.summary || null;
  const currentGroup = profile?.group_memberships?.current || summary?.group || null;
  const allGroupMemberships = profile?.group_memberships?.all || [];
  const allNetworkMemberships = profile?.team_memberships?.all || [];
  const phaseTimeline = profile?.phase_timeline || [];
  const basePointHistory = profile?.base_points?.history || [];
  const phaseLabelCounts = useMemo(() => {
    const counts = new Map();

    phaseTimeline.forEach((row) => {
      const label = getPhaseLabel(row);
      counts.set(label, (counts.get(label) || 0) + 1);
    });

    return counts;
  }, [phaseTimeline]);

  const titleMeta = useMemo(
    () => (
      <div className="flex flex-wrap gap-2">
        <StudentManagementBadge value={student?.student_id} map={{}} />
        {summary?.this_phase_eligibility?.phase_name ? (
          <StudentManagementBadge
            value={summary.this_phase_eligibility.phase_name}
            map={{}}
          />
        ) : null}
        {currentGroup?.group_tier ? (
          <StudentManagementBadge value={currentGroup.group_tier} map={TIER_STYLES} />
        ) : null}
      </div>
    ),
    [currentGroup?.group_tier, student?.student_id, summary?.this_phase_eligibility?.phase_name]
  );

  const heroActions = (
    <div className="flex flex-wrap gap-2">
      <AdminWorkspaceHeroActionButton
        type="button"
        onClick={() => navigate("/student-management")}
        className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      >
        <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
        Back
      </AdminWorkspaceHeroActionButton>

      <AdminWorkspaceHeroActionButton
        type="button"
        onClick={() => void load()}
        disabled={loading}
        className="bg-[#1754cf] text-white hover:bg-[#0f45ad]"
      >
        <RefreshRoundedIcon sx={{ fontSize: 18 }} />
        {loading ? "Refreshing..." : "Refresh"}
      </AdminWorkspaceHeroActionButton>
    </div>
  );

  const activeCollectionCount =
    (summary?.stats?.active_team_count || 0) +
    (summary?.stats?.active_hub_count || 0) +
    (summary?.stats?.active_event_team_count || 0);

  const currentPhase = summary?.this_phase_eligibility || null;
  const currentIndividualEligibility = currentPhase?.individual || null;
  const currentGroupEligibility = currentPhase?.group || null;

  return (
    <section className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 font-[Inter] text-slate-900 md:px-6">
      <AdminWorkspaceHero
        eyebrow="Student Management"
        title={student?.name || "Student Detail"}
        titleMeta={student ? titleMeta : null}
        description={
          student
            ? `${student.email || "No email"} | ${student.department || "No department"}${student.year ? ` | Year ${student.year}` : ""}`
            : "Detailed student performance, membership, and eligibility dashboard"
        }
        actions={heroActions}
      />

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading && !profile ? (
        <LoadingState />
      ) : profile ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Base Points"
              value={formatNumber(summary?.base_points)}
              meta={`Recent entries: ${formatNumber(basePointHistory.length)}`}
            />
            <StatCard
              label="Eligibility Bonus"
              value={formatNumber(summary?.eligibility_points)}
              accentClassName="text-[#1754cf]"
              meta={`Eligible phases: ${formatNumber(summary?.stats?.individual_eligible_phase_count)}`}
            />
            <StatCard
              label="Total Points"
              value={formatNumber(summary?.total_points)}
              accentClassName="text-emerald-700"
              meta={`This phase: ${formatNumber(summary?.this_phase_base_points)}`}
            />
            <StatCard
              label="Active Network"
              value={formatNumber(activeCollectionCount)}
              meta={`${formatNumber(summary?.stats?.active_team_count)} teams | ${formatNumber(summary?.stats?.active_hub_count)} hubs | ${formatNumber(summary?.stats?.active_event_team_count)} event groups`}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <SectionCard
              title="Student Profile"
              description="Core details and current membership position."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailItem
                  icon={MailOutlineRoundedIcon}
                  label="Email"
                  value={student?.email || "-"}
                />
                <DetailItem
                  icon={SchoolRoundedIcon}
                  label="Academic"
                  value={`${student?.department || "-"}${student?.year ? ` | Year ${student.year}` : ""}`}
                />
                <DetailItem
                  icon={GroupRoundedIcon}
                  label="Current Group"
                  value={currentGroup?.group_name || "No active group"}
                />
                <DetailItem
                  icon={WorkspacePremiumRoundedIcon}
                  label="Role"
                  value={currentGroup?.role || currentGroup?.membership_role || "-"}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <StudentManagementBadge
                  value={currentGroup?.group_tier || currentGroup?.tier}
                  map={TIER_STYLES}
                />
                <StudentManagementBadge
                  value={currentGroup?.group_status}
                  map={GROUP_STATUS_STYLES}
                />
                <StudentManagementBadge
                  value={currentGroup?.status || currentGroup?.membership_status}
                  map={MEMBERSHIP_STATUS_STYLES}
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Current Performance"
              description="Live points and current phase eligibility snapshot."
            >
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                      Active Phase
                    </div>
                    <div className="mt-1 text-lg font-bold text-slate-900">
                      {currentPhase?.phase_name || "No active phase"}
                    </div>
                  </div>
                  <StudentManagementBadge
                    value={getEligibilityValue(currentIndividualEligibility?.is_eligible)}
                    map={ELIGIBILITY_STYLES}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MetricTile
                    label="Individual Earned"
                    value={formatNumber(currentIndividualEligibility?.earned_points)}
                    accentClassName="text-[#1754cf]"
                  />
                  <MetricTile
                    label="Individual Target"
                    value={
                      currentIndividualEligibility?.target_points === null ||
                      currentIndividualEligibility?.target_points === undefined
                        ? "Not set"
                        : formatNumber(currentIndividualEligibility.target_points)
                    }
                  />
                  <MetricTile
                    label="Group Earned"
                    value={
                      currentGroupEligibility
                        ? formatNumber(currentGroupEligibility.earned_points)
                        : "No group"
                    }
                    accentClassName="text-emerald-700"
                  />
                  <MetricTile
                    label="Group Target"
                    value={
                      currentGroupEligibility?.target_points === null ||
                      currentGroupEligibility?.target_points === undefined
                        ? currentGroupEligibility
                          ? "Not set"
                          : "No group"
                        : formatNumber(currentGroupEligibility.target_points)
                    }
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <StudentManagementBadge
                    value={getEligibilityValue(currentIndividualEligibility?.is_eligible)}
                    map={ELIGIBILITY_STYLES}
                  />
                  {currentGroupEligibility ? (
                    <StudentManagementBadge
                      value={getEligibilityValue(currentGroupEligibility.is_eligible)}
                      map={ELIGIBILITY_STYLES}
                    />
                  ) : null}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {["1.1", "1.2", "1.3", "1.4"].map((multiplier) => (
                    <div key={multiplier} className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                        {multiplier}x Count
                      </div>
                      <div className="mt-1 text-sm font-bold text-slate-900">
                        {formatNumber(summary?.multiplier_counts?.[multiplier])}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="Group Journey"
            description="Current group plus the full group membership history."
          >
            {currentGroup ? (
              <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-bold text-slate-900">
                      {currentGroup.group_name || "Unnamed group"}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {currentGroup.group_code || "No code"} | Joined {formatDate(currentGroup.join_date)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StudentManagementBadge
                      value={currentGroup.group_tier || currentGroup.tier}
                      map={TIER_STYLES}
                    />
                    <StudentManagementBadge
                      value={currentGroup.role || currentGroup.membership_role}
                      map={ROLE_STYLES}
                    />
                    <StudentManagementBadge
                      value={currentGroup.group_status}
                      map={GROUP_STATUS_STYLES}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <EmptyPanel message="This student does not have an active group right now." />
              </div>
            )}

            {allGroupMemberships.length === 0 ? (
              <EmptyPanel message="No group memberships found." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[820px] w-full">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className={tableHeaderClass}>Group</th>
                      <th className={tableHeaderClass}>Tier</th>
                      <th className={tableHeaderClass}>Role</th>
                      <th className={tableHeaderClass}>Status</th>
                      <th className={tableHeaderClass}>Joined</th>
                      <th className={tableHeaderClass}>Left</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allGroupMemberships.map((row) => (
                      <tr key={row.membership_id} className="hover:bg-slate-50/70">
                        <td className={tableCellClass}>
                          <div className="font-semibold text-slate-900">
                            {row.group_name || "Unnamed group"}
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500">
                            {row.group_code || "No code"}
                          </div>
                        </td>
                        <td className={tableCellClass}>
                          <StudentManagementBadge value={row.group_tier} map={TIER_STYLES} />
                        </td>
                        <td className={tableCellClass}>
                          <StudentManagementBadge value={row.role} map={ROLE_STYLES} />
                        </td>
                        <td className={tableCellClass}>
                          <div className="flex flex-wrap gap-2">
                            <StudentManagementBadge
                              value={row.status}
                              map={MEMBERSHIP_STATUS_STYLES}
                            />
                            <StudentManagementBadge
                              value={row.group_status}
                              map={GROUP_STATUS_STYLES}
                            />
                          </div>
                        </td>
                        <td className={tableCellClass}>{formatDate(row.join_date)}</td>
                        <td className={tableCellClass}>
                          {row.leave_date ? formatDate(row.leave_date) : "Current"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Teams, Hubs & Event Groups"
            description="All network memberships in one table."
          >
            {allNetworkMemberships.length === 0 ? (
              <EmptyPanel message="No team, hub, or event group memberships found." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className={tableHeaderClass}>Type</th>
                      <th className={tableHeaderClass}>Name</th>
                      <th className={tableHeaderClass}>Event</th>
                      <th className={tableHeaderClass}>Role</th>
                      <th className={tableHeaderClass}>Status</th>
                      <th className={tableHeaderClass}>Record</th>
                      <th className={tableHeaderClass}>Joined</th>
                      <th className={tableHeaderClass}>Left</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allNetworkMemberships.map((row) => (
                      <tr key={row.team_membership_id} className="hover:bg-slate-50/70">
                        <td className={tableCellClass}>
                          <StudentManagementBadge value={row.team_type} map={TEAM_TYPE_STYLES} />
                        </td>
                        <td className={tableCellClass}>
                          <div className="font-semibold text-slate-900">
                            {row.team_name || "Unnamed record"}
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500">
                            {row.team_code || "No code"}
                          </div>
                        </td>
                        <td className={tableCellClass}>{row.event_name || "-"}</td>
                        <td className={tableCellClass}>
                          <StudentManagementBadge value={row.role} map={ROLE_STYLES} />
                        </td>
                        <td className={tableCellClass}>
                          <StudentManagementBadge
                            value={row.status}
                            map={MEMBERSHIP_STATUS_STYLES}
                          />
                        </td>
                        <td className={tableCellClass}>
                          <StudentManagementBadge
                            value={row.team_status}
                            map={TEAM_STATUS_STYLES}
                          />
                        </td>
                        <td className={tableCellClass}>{formatDate(row.join_date)}</td>
                        <td className={tableCellClass}>
                          {row.leave_date ? formatDate(row.leave_date) : "Current"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Phase Timeline"
            description="For every phase: student points, group in that phase, and individual plus group eligibility."
          >
            {phaseTimeline.length === 0 ? (
              <EmptyPanel message="No phase timeline is available for this student yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1440px] w-full">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className={compactTableHeaderClass}>Phase</th>
                      <th className={compactTableHeaderClass}>Start</th>
                      <th className={compactTableHeaderClass}>End</th>
                      <th className={compactTableHeaderClass}>Grp Name</th>
                      <th className={compactTableHeaderClass}>Tier</th>
                      <th className={compactTableHeaderClass}>Role</th>
                      <th className={compactTableHeaderClass}>Status</th>
                      <th className={compactTableHeaderClass}>Ind Target</th>
                      <th className={compactTableHeaderClass}>Grp Target</th>
                      <th className={compactTableHeaderClass}>Ind Earned</th>
                      <th className={compactTableHeaderClass}>Grp Earned</th>
                      <th className={compactTableHeaderClass}>Ind Status</th>
                      <th className={compactTableHeaderClass}>Grp Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {phaseTimeline.map((row) => {
                      const phaseLabel = getPhaseLabel(row);
                      const isDuplicatePhaseLabel = (phaseLabelCounts.get(phaseLabel) || 0) > 1;
                      const phaseDisplayLabel = isDuplicatePhaseLabel
                        ? `${phaseLabel} · ${getShortPhaseId(row.phase_id)}`
                        : phaseLabel;

                      return (
                      <tr key={String(row.phase_id)} className="hover:bg-slate-50/70">
                        <td
                          className={`${compactTableCellClass} font-semibold text-slate-900`}
                          title={
                            isDuplicatePhaseLabel && row.phase_id
                              ? `${phaseLabel} | ${row.phase_id}`
                              : phaseLabel
                          }
                        >
                          {phaseDisplayLabel}
                        </td>
                        <td className={compactTableCellClass}>{formatDate(row.phase_start_date)}</td>
                        <td className={compactTableCellClass}>{formatDate(row.phase_end_date)}</td>
                        <td className={compactTableCellClass}>
                          <span
                            className="block max-w-[180px] truncate"
                            title={row.group?.group_name || "No group"}
                          >
                            {row.group?.group_name || "No group"}
                          </span>
                        </td>
                        <td className={compactTableCellClass}>
                          <StudentManagementBadge value={row.group?.tier} map={TIER_STYLES} />
                        </td>
                        <td className={compactTableCellClass}>
                          <StudentManagementBadge
                            value={row.group?.membership_role}
                            map={ROLE_STYLES}
                          />
                        </td>
                        <td className={compactTableCellClass}>
                          <StudentManagementBadge
                            value={row.group?.membership_status}
                            map={MEMBERSHIP_STATUS_STYLES}
                          />
                        </td>
                        <td className={`${compactTableCellClass} font-semibold`}>
                          {row.individual.target_points === null
                            ? "Not set"
                            : formatNumber(row.individual.target_points)}
                        </td>
                        <td className={`${compactTableCellClass} font-semibold`}>
                          {row.group_eligibility?.target_points === null ||
                          row.group_eligibility?.target_points === undefined
                            ? row.group ? "Not set" : "-"
                            : formatNumber(row.group_eligibility.target_points)}
                        </td>
                        <td className={`${compactTableCellClass} font-semibold text-[#1754cf]`}>
                          {formatNumber(row.individual.earned_points)}
                        </td>
                        <td className={`${compactTableCellClass} font-semibold text-emerald-700`}>
                          {row.group_eligibility
                            ? formatNumber(row.group_eligibility.earned_points)
                            : "-"}
                        </td>
                        <td className={compactTableCellClass}>
                          <StudentManagementBadge
                            value={getEligibilityValue(row.individual.is_eligible)}
                            map={ELIGIBILITY_STYLES}
                          />
                        </td>
                        <td className={compactTableCellClass}>
                          <StudentManagementBadge
                            value={getEligibilityValue(row.group_eligibility?.is_eligible)}
                            map={ELIGIBILITY_STYLES}
                          />
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Base Point History"
            description="Recent point entries recorded for this student."
          >
            {basePointHistory.length === 0 ? (
              <EmptyPanel message="No base point history found." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[780px] w-full">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className={tableHeaderClass}>Activity</th>
                      <th className={tableHeaderClass}>Points</th>
                      <th className={tableHeaderClass}>Reason</th>
                      <th className={tableHeaderClass}>Recorded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {basePointHistory.map((row) => (
                      <tr key={row.history_id} className="hover:bg-slate-50/70">
                        <td className={tableCellClass}>{formatDateTime(row.activity_at || row.activity_date)}</td>
                        <td className={`${tableCellClass} font-semibold text-[#1754cf]`}>
                          {formatNumber(row.points)}
                        </td>
                        <td className={tableCellClass}>{row.reason || "-"}</td>
                        <td className={tableCellClass}>{formatDateTime(row.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </>
      ) : null}

      {!loading && !profile && !error ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
          Student detail is not available.
        </div>
      ) : null}
    </section>
  );
}
