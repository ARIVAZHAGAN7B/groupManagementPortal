import { WorkspaceFilterBar } from "./WorkspaceInlineFilters";

export default function OnDutyFiltersPanel({
  filters = [],
  footer = null,
  onReset = null,
  resetLabel = "Reset Filters",
  searchPlaceholder = "Search",
  searchValue = "",
  onSearchChange
}) {
  const fields = [
    {
      key: "search",
      type: "search",
      label: "Search",
      value: searchValue,
      placeholder: searchPlaceholder,
      onChangeValue: onSearchChange
    },
    ...filters.map((filter) => ({
      key: filter.label,
      type: "select",
      label: filter.label,
      value: filter.value,
      onChangeValue: filter.onChange,
      options: filter.options
    }))
  ];

  return (
    <section className="space-y-3">
      <WorkspaceFilterBar
        fields={fields}
        onReset={onReset}
        showReset={Boolean(onReset)}
        resetLabel={resetLabel}
        hasActiveFilters={Boolean(
          String(searchValue || "").trim() ||
            filters.some((filter) => String(filter.value || "") !== "ALL")
        )}
      />
      {footer ? <div className="mt-3 text-xs text-slate-500">{footer}</div> : null}
    </section>
  );
}
