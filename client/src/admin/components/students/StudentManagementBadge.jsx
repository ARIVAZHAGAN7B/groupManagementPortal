import { getBadgeClass } from "./studentManagement.constants";

export default function StudentManagementBadge({ value, map }) {
  if (!value) {
    return <span className="text-xs font-medium text-slate-300">-</span>;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${getBadgeClass(
        value,
        map
      )}`}
    >
      {String(value).replace(/_/g, " ")}
    </span>
  );
}
