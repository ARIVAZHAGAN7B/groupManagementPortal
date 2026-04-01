import {
  formatDate,
  formatLabel,
  getMembershipStatusConfig,
  getRoleOptionsForTeamType,
  getRoleSelectClass,
  getTeamStatusBadgeClass,
  normalizeTeamMembershipKey
} from "./teamMembershipManagement.constants";
import {
  AdminBadge,
  AdminStatusDotBadge,
  AdminTextActionButton
} from "../ui/AdminUiPrimitives";

function RoleSelect({ disabled, membershipId, onChange, teamType, value }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(membershipId, event.target.value)}
      disabled={disabled}
      className={`w-full min-w-[10rem] ${getRoleSelectClass(value)}`}
    >
      {getRoleOptionsForTeamType(teamType).map((role) => (
        <option key={role} value={role}>
          {formatLabel(role, role)}
        </option>
      ))}
    </select>
  );
}

export default function TeamMembershipManagementDesktopTable({
  busyAction,
  busyMembershipId,
  editedRoleByMembershipId,
  onMarkLeft,
  onRoleChange,
  onSaveRole,
  rows,
  scopeConfig
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1180px] w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">{scopeConfig?.scopeLabel || "Team"}</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Individual Status</th>
              <th className="px-6 py-4">{scopeConfig?.scopeLabel || "Team"} Status</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4">Left</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.length > 0 ? (
              rows.map((row) => {
                const membershipId = Number(row.team_membership_id);
                const currentRole = normalizeTeamMembershipKey(row.role) || "MEMBER";
                const selectedRole =
                  normalizeTeamMembershipKey(editedRoleByMembershipId[membershipId]) || currentRole;
                const isActive = normalizeTeamMembershipKey(row.status) === "ACTIVE";
                const busy = busyMembershipId === membershipId;
                const savingRole = busy && busyAction === "role";
                const leavingMembership = busy && busyAction === "leave";

                return (
                  <tr key={membershipId} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">
                        {row.student_name || "-"}
                      </div>
                      <div className="mt-1 text-[10px] font-mono font-bold text-[#1754cf]">
                        {row.student_id || "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">
                        {row.team_name || "-"}
                      </div>
                      <div className="mt-1 text-[10px] font-mono font-bold text-[#1754cf]">
                        ID {row.team_id || "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <RoleSelect
                        disabled={!isActive || busy}
                        membershipId={membershipId}
                        onChange={onRoleChange}
                        teamType={row.team_type}
                        value={selectedRole}
                      />
                    </td>

                    <td className="px-6 py-4">
                      <AdminStatusDotBadge config={getMembershipStatusConfig(row.status)} />
                    </td>

                    <td className="px-6 py-4">
                      <AdminBadge
                        className={getTeamStatusBadgeClass(row.team_status)}
                      >
                        {formatLabel(row.team_status, "Unknown")}
                      </AdminBadge>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(row.join_date)}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(row.leave_date)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="ml-auto grid w-[11rem] grid-cols-2 gap-2">
                        <AdminTextActionButton
                          onClick={() => onSaveRole(row)}
                          disabled={!isActive || busy || selectedRole === currentRole}
                          label={savingRole ? "Saving..." : "Save Role"}
                          className="w-full whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-1 text-center text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        />
                        <AdminTextActionButton
                          onClick={() => onMarkLeft(row)}
                          disabled={!isActive || busy}
                          label={leavingMembership ? "Marking..." : "Mark Left"}
                          className="w-full whitespace-nowrap rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-center text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-12 text-center text-sm text-slate-500"
                >
                  {scopeConfig?.emptyState || "No team memberships found for the current filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
