import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

const joinClasses = (...values) => values.filter(Boolean).join(" ");

export function AdminFilterBar({
  children,
  className = "flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row"
}) {
  return <section className={className}>{children}</section>;
}

export function AdminSearchField({
  inputClassName,
  onChange,
  onChangeValue,
  placeholder,
  value,
  wrapperClassName = "relative w-full md:flex-1"
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
        className={joinClasses(inputClassName, "pl-10")}
        placeholder={placeholder}
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
  wrapperClassName = "relative min-w-32"
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
        className={selectClassName}
      >
        {children}
      </select>

      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
        <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20 }} />
      </span>
    </div>
  );
}
