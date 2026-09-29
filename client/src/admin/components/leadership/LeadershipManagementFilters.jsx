import React from "react";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import { getGroupOptionLabel } from "./leadership.constants";

export default function LeadershipManagementFilters({
  filteredCount,
  groupFilter,
  groups = [],
  q,
  requestedRoleFilter,
  requestedRoleOptions = [],
  setGroupFilter,
  setQ,
  setRequestedRoleFilter,
  totalCount
}) {
  const hasActiveFilters = Boolean(q || groupFilter || requestedRoleFilter);

  const resetAll = () => {
    setQ("");
    setGroupFilter("");
    setRequestedRoleFilter("");
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3 dark:border-slate-800 dark:bg-slate-900">
      {/* 1. Presets Header */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <FilterListRoundedIcon sx={{ fontSize: 15 }} />
            Role:
          </span>

          <button
            type="button"
            onClick={() => setRequestedRoleFilter("")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              !requestedRoleFilter
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            All Roles
          </button>

          <button
            type="button"
            onClick={() => setRequestedRoleFilter(requestedRoleFilter === "CAPTAIN" ? "" : "CAPTAIN")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              requestedRoleFilter === "CAPTAIN"
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            👑 Captain Only
          </button>

          <button
            type="button"
            onClick={() => setRequestedRoleFilter(requestedRoleFilter === "VICE_CAPTAIN" ? "" : "VICE_CAPTAIN")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              requestedRoleFilter === "VICE_CAPTAIN"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            🛡️ Vice Captain Only
          </button>

          {/* Custom options */}
          {requestedRoleOptions
            .filter((r) => r !== "CAPTAIN" && r !== "VICE_CAPTAIN")
            .map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setRequestedRoleFilter(requestedRoleFilter === role ? "" : role)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  requestedRoleFilter === role
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {role.replaceAll("_", " ")}
              </button>
            ))}
        </div>

        {/* Counter & Reset */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-900 dark:text-white">{filteredCount}</strong> of {totalCount} requests
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 cursor-pointer"
            >
              <CloseRoundedIcon sx={{ fontSize: 14 }} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 2. Search & Select Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <SearchRoundedIcon
            sx={{ fontSize: 18 }}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by student name, ID, email, group name or code..."
            className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 py-2.5 pl-10 pr-9 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-3 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-850 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:bg-slate-900"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <CloseRoundedIcon sx={{ fontSize: 16 }} />
            </button>
          )}
        </div>

        {/* Squad Dropdown */}
        <div className="min-w-[200px]">
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-3 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-200 dark:focus:border-indigo-400 dark:focus:bg-slate-900 cursor-pointer"
          >
            <option value="">All Squads ({groups.length})</option>
            {groups.map((group) => (
              <option key={group.group_id} value={group.group_id}>
                {getGroupOptionLabel(group)}
              </option>
            ))}
          </select>
        </div>

        {/* Role Select Dropdown */}
        <div className="min-w-[170px]">
          <select
            value={requestedRoleFilter}
            onChange={(e) => setRequestedRoleFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-3 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-200 dark:focus:border-indigo-400 dark:focus:bg-slate-900 cursor-pointer"
          >
            <option value="">All Requested Roles</option>
            {requestedRoleOptions.map((role) => (
              <option key={role} value={role}>
                {role.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
