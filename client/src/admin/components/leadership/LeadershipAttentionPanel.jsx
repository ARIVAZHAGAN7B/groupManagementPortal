export default function LeadershipAttentionPanel({ groups, onOpenGroup }) {
  if (!Array.isArray(groups) || groups.length === 0) return null;

  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
            Needs Leadership
          </p>
          <p className="mt-1 text-sm font-medium text-red-700">
            {groups.length} group{groups.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {groups.map((group) => (
            <button
              key={`leadership-alert-${group.group_id}`}
              type="button"
              onClick={() => onOpenGroup(group.group_id)}
              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
            >
              {group.group_name || group.group_code || `Group ${group.group_id}`}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
