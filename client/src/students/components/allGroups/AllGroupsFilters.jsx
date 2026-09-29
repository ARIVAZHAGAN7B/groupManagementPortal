import React, { useState } from "react";
import ViewModuleRoundedIcon from "@mui/icons-material/ViewModuleRounded";
import TableRowsRoundedIcon from "@mui/icons-material/TableRowsRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";

export default function AllGroupsFilters({
  acceptingFilter,
  captainFilter,
  canReset = false,
  eligibilityFilter,
  eligibilityOptions = [],
  groupQuery,
  onCaptainChange,
  onAcceptingChange,
  onEligibilityChange,
  onGroupQueryChange,
  onPointsMinChange,
  onRankChange,
  onReset,
  onStatusChange,
  onTierChange,
  onVacancyChange,
  pointsMinFilter,
  rankFilter,
  rankOptions = [],
  statusFilter,
  statusOptions = [],
  tierFilter,
  tierOptions = [],
  vacancyFilter,
  viewMode = "cards",
  onViewModeChange
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-4 dark:border-slate-800 dark:bg-slate-900">
      {/* 1. Presets & View Mode Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        {/* Preset Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 mr-1">Presets:</span>

          <button
            type="button"
            onClick={onReset}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              !canReset && tierFilter === "ALL" && statusFilter === "ALL" && acceptingFilter === "ALL" && vacancyFilter === "ALL"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            All Squads
          </button>

          <button
            type="button"
            onClick={() => {
              onAcceptingChange?.({ target: { value: "YES" } });
              onStatusChange?.({ target: { value: "ACTIVE" } });
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              acceptingFilter === "YES"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            Recruiting Now ⚡
          </button>

          <button
            type="button"
            onClick={() => onVacancyChange?.({ target: { value: "HAS_VACANCY" } })}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              vacancyFilter === "HAS_VACANCY"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            Has Vacancies
          </button>

          {["A", "B", "C", "D"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTierChange?.({ target: { value: tierFilter === t ? "ALL" : t } })}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                tierFilter === t
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              Tier {t}
            </button>
          ))}
        </div>

        {/* View Mode Switcher (Cards vs Table) */}
        {onViewModeChange && (
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-850 shrink-0">
            <button
              type="button"
              onClick={() => onViewModeChange("cards")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === "cards"
                  ? "bg-white text-indigo-700 shadow-2xs dark:bg-slate-800 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              <ViewModuleRoundedIcon sx={{ fontSize: 16 }} />
              <span>Cards</span>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === "table"
                  ? "bg-white text-indigo-700 shadow-2xs dark:bg-slate-800 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              <TableRowsRoundedIcon sx={{ fontSize: 16 }} />
              <span>Table</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Primary Search Bar & Fast Filters */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {/* Search */}
        <div className="md:col-span-2">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={groupQuery || ""}
              onChange={onGroupQueryChange}
              placeholder="Search squad name, code (GRP-xxx), or captain..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-9 text-xs text-slate-900 focus:bg-white focus:outline-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Tier dropdown */}
        <div>
          <select
            value={tierFilter || "ALL"}
            onChange={onTierChange}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="ALL">All Tiers</option>
            {tierOptions.map((tier) => (
              <option key={tier} value={tier}>
                Tier {tier}
              </option>
            ))}
          </select>
        </div>

        {/* Advanced Filters Toggle & Reset */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition ${
              showAdvanced || canReset
                ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <FilterListRoundedIcon sx={{ fontSize: 16 }} />
            <span>Filters</span>
          </button>

          {canReset && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 shrink-0"
              title="Reset all filters"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 3. Collapsible Advanced Filters */}
      {showAdvanced && (
        <div className="grid gap-3 pt-2 sm:grid-cols-2 md:grid-cols-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-500">Status</label>
            <select
              value={statusFilter || "ALL"}
              onChange={onStatusChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="ALL">All Statuses</option>
              {statusOptions.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-500">Eligibility Status</label>
            <select
              value={eligibilityFilter || "ALL"}
              onChange={onEligibilityChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="ALL">All Eligibility</option>
              {eligibilityOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-500">Captain Name</label>
            <input
              type="text"
              value={captainFilter || ""}
              onChange={onCaptainChange}
              placeholder="e.g. Student 001"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-500">Min Squad Points</label>
            <input
              type="number"
              min="0"
              value={pointsMinFilter || ""}
              onChange={onPointsMinChange}
              placeholder="e.g. 500"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}
