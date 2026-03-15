import { BADGE_STYLES } from "./myGroup.constants";

export default function MyGroupBadge({ fallback = "-", value }) {
  const text = String(value || fallback);
  const key = text.toUpperCase().replace(/\s+/g, "_");
  const cls = BADGE_STYLES[key] || BADGE_STYLES.UNKNOWN;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}
    >
      {text.replace(/_/g, " ")}
    </span>
  );
}
