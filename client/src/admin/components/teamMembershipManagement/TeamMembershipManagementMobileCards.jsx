import {
  formatDate,
  formatLabel,
  getMembershipStatusConfig,
  getRoleOptionsForTeamType,
  getRoleSelectClass,
  getTeamStatusBadgeClass,
  normalizeTeamMembershipKey
} from "./teamMembershipManagement.constants";

function Badge({ className, label }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${className}`}>
      {label}
    </span>
  );
}

function StatusBadge({ value }) {
  const config = getMembershipStatusConfig(value);

  return (
    <span className={`flex items-center gap-1.5 text-[10px] font-bold ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export default function TeamMembershipManagementMobileCards({
  busyAction,
  busyMembershipId,
  editedRoleByMembershipId,
  onMarkLeft,
  onRoleChange,
  onSaveRole,
  scopeConfig,
  rows
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
        {scopeConfig?.emptyState || "No team memberships found for the current filters."}
      </div>
    );
  }

  return (
    <section className="space-y-4 lg:hidden">
      {rows.map((row) => {
        const membershipId = Number(row.team_membership_id);
        const currentRole = normalizeTeamMembershipKey(row.role) || "MEMBER";
        const selectedRole =
          normalizeTeamMembershipKey(editedRoleByMembershipId[membershipId]) || currentRole;
        const isActive = normalizeTeamMembershipKey(row.status) === "ACTIVE";
        const busy = busyMembershipId === membershipId;
        const savingRole = busy && busyAction === "role";
        const leavingMembership = busy && busyAction === "leave";

        return (
          <article
            key={membershipId}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-4">
              <div>
                <h4 className="font-bold text-slate-900">{row.student_name || "-"}</h4>
                <p className="mt-1 text-xs font-mono font-bold uppercase text-[#1754cf]">
                  {row.student_id || "-"}
                </p>
              </div>
            </div>

            <div className="flex items-start justify-between border-t border-slate-100 py-2 text-xs">
              <span className="text-slate-500">{scopeConfig?.scopeLabel || "Team"}</span>
              <div className="text-right">
                <div className="font-bold text-slate-900">{row.team_name || "-"}</div>
                <div className="text-[10px] font-mono font-bold text-[#1754cf]">ID {row.team_id || "-"}</div>
              </div>
            </div>

            {scopeConfig?.scope === "EVENT_GROUP" ? (
              <div className="flex items-start justify-between border-t border-slate-100 py-2 text-xs">
                <span className="text-slate-500">Event</span>
                <div className="text-right">
                  <div className="font-bold text-slate-900">
                    {row.event_id ? row.event_name || "-" : "Not linked"}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {row.event_id ? row.event_code || "No event code" : "Standalone record"}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex items-start justify-between border-t border-slate-100 py-2 text-xs">
              <span className="text-slate-500">Individual Status</span>
              <StatusBadge value={row.status} />
            </div>

            <div className="flex items-start justify-between border-t border-slate-100 py-2 text-xs">
              <span className="text-slate-500">{scopeConfig?.scopeLabel || "Team"} Status</span>
              <Badge
                className={getTeamStatusBadgeClass(row.team_status)}
                label={formatLabel(row.team_status, "Unknown")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 py-3 text-xs">
              <div>
                <p className="text-slate-500">Joined</p>
                <p className="mt-1 font-bold text-slate-900">{formatDate(row.join_date)}</p>
              </div>
              <div>
                <p className="text-slate-500">Left</p>
                <p className="mt-1 font-bold text-slate-900">{formatDate(row.leave_date)}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(event) => onRoleChange(membershipId, event.target.value)}
                disabled={!isActive || busy}
                className={`w-full text-sm ${getRoleSelectClass(selectedRole)}`}
              >
                {getRoleOptionsForTeamType(row.team_type).map((role) => (
                  <option key={role} value={role}>
                    {formatLabel(role, role)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => onSaveRole(row)}
                disabled={!isActive || busy || selectedRole === currentRole}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {savingRole ? "Saving..." : "Save Role"}
              </button>
              <button
                type="button"
                onClick={() => onMarkLeft(row)}
                disabled={!isActive || busy}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {leavingMembership ? "Marking..." : "Mark Left"}
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
