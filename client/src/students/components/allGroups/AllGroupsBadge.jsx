import { ALL_GROUPS_BADGE_STYLES } from "./allGroups.constants";

export default function AllGroupsBadge({ fallback = "-", value }) {
  const text = String(value || fallback);
  const key = text.toUpperCase().replace(/\s+/g, "_");
  const cls = ALL_GROUPS_BADGE_STYLES[key] || ALL_GROUPS_BADGE_STYLES.UNKNOWN;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}
    >
      {text.replace(/_/g, " ")}
    </span>
  );
}
