const LEADERSHIP_ROLES = ["CAPTAIN", "VICE_CAPTAIN", "STRATEGIST", "MANAGER"];

const LEADERSHIP_ROLE_SHORT_LABELS = {
  CAPTAIN: "C",
  VICE_CAPTAIN: "VC",
  STRATEGIST: "SRT",
  MANAGER: "MGR",
};

export const getMissingLeadershipRoles = (members) => {
  const activeRoles = new Set(
    (Array.isArray(members) ? members : [])
      .map((member) => String(member?.role || "").toUpperCase())
      .filter(Boolean)
  );

  return LEADERSHIP_ROLES.filter((role) => !activeRoles.has(role));
};

export default function LeadershipGapChips({ className = "", roles }) {
  if (!Array.isArray(roles) || roles.length === 0) return null;

  return (
    <div
      aria-label="Missing leadership roles"
      title="Missing leadership roles"
      className={`flex flex-wrap gap-1.5 ${className}`.trim()}
    >
      {roles.map((role) => {
        const normalizedRole = String(role || "").toUpperCase();

        return (
          <div
            key={normalizedRole}
            title={`${normalizedRole.replace("_", " ")} missing`}
            className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-red-600 bg-white text-[9px] font-extrabold tracking-[0.02em] text-red-700"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-[-6px] right-[-6px] top-1/2 z-0 h-[2px] -translate-y-1/2 -rotate-[28deg] bg-red-600"
            />
            <span className="relative z-10">
              {LEADERSHIP_ROLE_SHORT_LABELS[normalizedRole] || normalizedRole}
            </span>
          </div>
        );
      })}
    </div>
  );
}
