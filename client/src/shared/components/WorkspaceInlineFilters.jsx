import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

const joinClasses = (...values) => values.filter(Boolean).join(" ");
const SEARCH_PREFIX_PATTERN = /^search(?:\s+by)?\b[:\s-]*/i;

const fieldLabelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500";
const fieldInputClass =
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

export function WorkspaceInlineFilters({ children, className = "" }) {
  return (
    <section
      className={joinClasses(
        "rounded-xl border border-slate-200 bg-white p-3 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-end">{children}</div>
    </section>
  );
}

export function WorkspaceInlineSearchField({
  hideLabel,
  label = "Search",
  onChange,
  placeholder = "Search",
  value,
  wrapperClassName = "w-full xl:min-w-[18rem] xl:max-w-[24rem] xl:flex-1"
}) {
  const shouldHideLabel =
    hideLabel ?? String(label || "").trim().toLowerCase() === "search";

  return (
    <label className={wrapperClassName}>
      {shouldHideLabel ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span className={fieldLabelClass}>{label}</span>
      )}
      <span className="relative block">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
          <SearchRoundedIcon sx={{ fontSize: 18 }} />
        </span>
        <input
          value={value}
          onChange={onChange}
          placeholder={normalizeSearchPlaceholder(placeholder)}
          aria-label={label}
          className={joinClasses(fieldInputClass, "pl-10")}
        />
      </span>
    </label>
  );
}

export function WorkspaceInlineSelectField({
  children,
  label,
  onChange,
  value,
  wrapperClassName = "w-full sm:w-[180px]"
}) {
  return (
    <label className={wrapperClassName}>
      <span className={fieldLabelClass}>{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={onChange}
          className={joinClasses(fieldInputClass, "appearance-none pr-10")}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
          <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18 }} />
        </span>
      </span>
    </label>
  );
}

export function WorkspaceInlineInputField({
  inputType = "text",
  label,
  max,
  min,
  onChange,
  placeholder,
  step,
  value,
  wrapperClassName = "w-full sm:w-[180px]"
}) {
  return (
    <label className={wrapperClassName}>
      <span className={fieldLabelClass}>{label}</span>
      <input
        type={inputType}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className={fieldInputClass}
      />
    </label>
  );
}

export function WorkspaceInlineActionButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={joinClasses(
        "inline-flex min-h-[38px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}

export function WorkspaceFilterBar({
  className = "",
  fields = [],
  hasActiveFilters = false,
  onReset,
  resetLabel = "Clear Filters",
  resetWrapperClassName = "gap-2 xl:min-w-[9rem]",
  showReset = true
}) {
  return (
    <WorkspaceInlineFilters className={className}>
      {fields.map((field) => {
        const key = field.key || field.label;

        if (field.type === "search") {
          return (
            <WorkspaceInlineSearchField
              key={key}
              label={field.label}
              value={field.value}
              placeholder={field.placeholder}
              wrapperClassName={field.wrapperClassName}
              onChange={(event) => field.onChangeValue?.(event.target.value, event)}
            />
          );
        }

        if (field.type === "select") {
          return (
            <WorkspaceInlineSelectField
              key={key}
              label={field.label}
              value={field.value}
              wrapperClassName={field.wrapperClassName}
              onChange={(event) => field.onChangeValue?.(event.target.value, event)}
            >
              {(Array.isArray(field.options) ? field.options : []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </WorkspaceInlineSelectField>
          );
        }

        if (field.type === "input") {
          return (
            <WorkspaceInlineInputField
              key={key}
              label={field.label}
              value={field.value}
              placeholder={field.placeholder}
              wrapperClassName={field.wrapperClassName}
              inputType={field.inputType}
              min={field.min}
              max={field.max}
              step={field.step}
              onChange={(event) => field.onChangeValue?.(event.target.value, event)}
            />
          );
        }

        return null;
      })}

      {showReset ? (
        <WorkspaceInlineActionButton
          type="button"
          onClick={onReset}
          disabled={!hasActiveFilters}
          className={resetWrapperClassName}
        >
          <RestartAltRoundedIcon sx={{ fontSize: 18 }} />
          {resetLabel}
        </WorkspaceInlineActionButton>
      ) : null}
    </WorkspaceInlineFilters>
  );
}
