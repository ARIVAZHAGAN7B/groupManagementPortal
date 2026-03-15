export const normalizeValue = (value) => String(value || "").trim().toUpperCase();

export const formatLabel = (value, fallback = "-") => {
  if (!value) return fallback;

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

export const formatShortDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
};

export const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
};

export const formatMemberCount = (value) => {
  const count = Number(value);
  if (!Number.isFinite(count)) return "-";
  return `${count} member${count === 1 ? "" : "s"}`;
};

export const getUniqueCount = (rows, selector) => {
  return new Set(
    (Array.isArray(rows) ? rows : [])
      .map(selector)
      .filter((value) => value !== null && value !== undefined && value !== "")
      .map((value) => String(value))
  ).size;
};
