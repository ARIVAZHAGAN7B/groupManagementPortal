import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

const joinClasses = (...values) => values.filter(Boolean).join(" ");
const SEARCH_PREFIX_PATTERN = /^search(?:\s+by)?\b[:\s-]*/i;
const baseInputClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0f6cbd] focus:ring-4 focus:ring-[#0f6cbd]/10";

const normalizeSearchPlaceholder = (placeholder) => {
  const rawValue = String(placeholder || "");
  const trimmedValue = rawValue.trim();
  const strippedValue = trimmedValue.replace(SEARCH_PREFIX_PATTERN, "");

  if (!strippedValue || strippedValue === trimmedValue) {
    return rawValue;
  }

  return strippedValue.charAt(0).toUpperCase() + strippedValue.slice(1);
};

export function AdminFilterBar({
  children,
  className = "flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:flex-wrap md:items-center"
}) {
  return <section className={className}>{children}</section>;
}

export function AdminSearchField({
  inputClassName,
  onChange,
  onChangeValue,
  placeholder,
  value,
  wrapperClassName = "relative w-full md:min-w-[320px] md:flex-1"
}) {
  const handleChange = (event) => {
    onChange?.(event);
    onChangeValue?.(event.target.value, event);
  };

  return (
    <div className={wrapperClassName}>
      <SearchRoundedIcon
        sx={{ fontSize: 20 }}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        value={value}
        onChange={handleChange}
        className={joinClasses(baseInputClassName, inputClassName, "pl-10")}
        placeholder={normalizeSearchPlaceholder(placeholder)}
        aria-label="Search"
      />
    </div>
  );
}

export function AdminFilterSelect({
  children,
  onChange,
  onChangeValue,
  selectClassName,
  value,
  wrapperClassName = "relative w-full sm:w-[180px]"
}) {
  const handleChange = (event) => {
    onChange?.(event);
    onChangeValue?.(event.target.value, event);
  };

  return (
    <div className={wrapperClassName}>
      <select
        value={value}
        onChange={handleChange}
        className={joinClasses(baseInputClassName, "appearance-none pr-9", selectClassName)}
      >
        {children}
      </select>

      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
        <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20 }} />
      </span>
    </div>
  );
}
