import { useEffect, useRef, useState } from "react";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import UnfoldMoreRoundedIcon from "@mui/icons-material/UnfoldMoreRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AllGroupsBadge from "./AllGroupsBadge";
import {
  formatEligibilityLabel,
  formatPoints,
  formatRankValue,
  formatVacancyCount,
} from "./allGroups.constants";

const ACCEPTING_LABELS = {
  ALL: "All application states",
  YES: "Accepting applications",
  NO: "Not accepting applications"
};

function SelectField({ children, onChange, value }) {
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={onChange}
        className="w-full appearance-none rounded-2xl border border-slate-300 bg-[#f3f4f6] px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
        <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18 }} />
      </span>
    </div>
  );
}

function HeaderFilterButton({
  active = false,
  align = "left",
  children,
  label,
  panelWidthClass = "w-72"
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex items-center gap-1.5">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={`Filter ${label}`}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition ${
          active || open
            ? "border-[#1754cf]/20 bg-[#1754cf]/10 text-[#1754cf]"
            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
        }`}
      >
        <FilterAltOutlinedIcon sx={{ fontSize: 16 }} />
      </button>

      {open ? (
        <div
          className={`absolute top-[calc(100%+10px)] z-30 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl ${panelWidthClass} ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

function SortIndicator({ active = false, direction = null }) {
  if (active && direction === "asc") {
    return <KeyboardArrowUpRoundedIcon sx={{ fontSize: 18 }} />;
  }

  if (active && direction === "desc") {
    return <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18 }} />;
  }

  return <UnfoldMoreRoundedIcon sx={{ fontSize: 16 }} />;
}

function HeaderSortButton({
  active = false,
  indicator,
  label,
  onClick,
  title
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title || label}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-1.5 py-1 transition ${
        active ? "text-[#1754cf]" : "text-current hover:text-slate-800"
      }`}
    >
      <span>{label}</span>
      {indicator}
    </button>
  );
}

function FilterPanel({ currentText, helperText, title, children }) {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {title}
        </div>
        <div className="mt-1 text-sm font-semibold text-slate-900">{currentText}</div>
        <div className="mt-1 text-xs text-slate-500">{helperText}</div>
      </div>
      {children}
    </div>
  );
}

const getGroupPoints = (group) => {
  if (group?.total_base_points !== null && group?.total_base_points !== undefined) {
    return formatPoints(group.total_base_points);
  }

  if (group?.total_points !== null && group?.total_points !== undefined) {
    return formatPoints(group.total_points);
  }

  return "-";
};

function HeaderStatusButton({ onClick, statusFilter = "ALL" }) {
  const isActive = statusFilter !== "ALL";
  const dotClassName =
    statusFilter === "ACTIVE"
      ? "bg-emerald-500"
      : statusFilter === "INACTIVE"
        ? "bg-red-500"
        : "bg-slate-300";

  return (
    <button
      type="button"
      onClick={onClick}
      title="Click to cycle status: ACTIVE, INACTIVE, All groups."
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-1.5 py-1 transition ${
        isActive ? "text-[#1754cf]" : "text-current hover:text-slate-800"
      }`}
    >
      <span>Status</span>
      <span className={`relative top-px h-2.5 w-2.5 rounded-full ${dotClassName}`} />
    </button>
  );
}

export default function AllGroupsDesktopTable({
  filterProps,
  onJoin,
  onView,
  resolveJoinAction,
  rows
}) {
  const {
    acceptingFilter = "ALL",
    canReset = false,
    groupQuery = "",
    onReset,
    onAcceptingChange,
    onGroupQueryChange,
    onStatusHeaderClick,
    onCaptainSort,
    onPointsSort,
    onRankSort,
    onTierHeaderClick,
    onVacancySort,
    sortState = { key: null, direction: null },
    statusFilter = "ALL",
    tierFilter = "ALL",
  } = filterProps || {};

  const renderSortIndicator = (key) => (
    <SortIndicator
      active={sortState?.key === key}
      direction={sortState?.key === key ? sortState?.direction : null}
    />
  );

  const tierIndicator =
    tierFilter !== "ALL" ? (
      <span className="rounded-full bg-[#1754cf]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#1754cf]">
        {tierFilter}
      </span>
    ) : (
      renderSortIndicator("tier")
    );

  return (
    <div className="relative hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
      <div className="flex items-center justify-end border-b border-slate-200 bg-slate-50/80 px-4 py-2.5">
        <button
          type="button"
          onClick={onReset}
          disabled={!canReset}
          title="Reset filters and sorting"
          aria-label="Reset filters and sorting"
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
            canReset
              ? "cursor-pointer border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300"
          }`}
        >
          <RestartAltRoundedIcon sx={{ fontSize: 16 }} />
          Reset
        </button>
      </div>
      <div className="overflow-x-auto overflow-y-visible rounded-2xl">
        <table className="min-w-[1260px] w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                <HeaderFilterButton
                  active={String(groupQuery || "").trim().length > 0}
                  label="Group"
                  panelWidthClass="w-80"
                >
                  <FilterPanel
                    title="Group Filter"
                    currentText={
                      String(groupQuery || "").trim().length > 0 ? groupQuery : "All groups"
                    }
                    helperText="Search by group name, code, or id."
                  >
                    <label className="block">
                      <span className="relative block">
                        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                          <SearchRoundedIcon sx={{ fontSize: 18 }} />
                        </span>
                        <input
                          value={groupQuery}
                          onChange={onGroupQueryChange}
                          placeholder="Name, code, or id"
                          className="w-full rounded-2xl border border-slate-300 bg-[#f3f4f6] py-2.5 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10"
                        />
                      </span>
                    </label>
                  </FilterPanel>
                </HeaderFilterButton>
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                <HeaderSortButton
                  active={sortState?.key === "tier" || tierFilter !== "ALL"}
                  label="Tier"
                  title="Click to sort tiers, then cycle through each tier."
                  indicator={tierIndicator}
                  onClick={onTierHeaderClick}
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                <HeaderStatusButton
                  statusFilter={statusFilter}
                  onClick={onStatusHeaderClick}
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                <span>Eligibility</span>
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                <HeaderSortButton
                  active={sortState?.key === "captainPoints"}
                  label="Captain"
                  title="Click to sort by captain points."
                  indicator={renderSortIndicator("captainPoints")}
                  onClick={onCaptainSort}
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                <HeaderSortButton
                  active={sortState?.key === "rank"}
                  label="Rank"
                  title="Click to sort by rank."
                  indicator={renderSortIndicator("rank")}
                  onClick={onRankSort}
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                <HeaderSortButton
                  active={sortState?.key === "vacancies"}
                  label="Vacancies"
                  title="Click to sort by vacancies."
                  indicator={renderSortIndicator("vacancies")}
                  onClick={onVacancySort}
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                <HeaderSortButton
                  active={sortState?.key === "points"}
                  label="Points"
                  title="Click to sort by group points."
                  indicator={renderSortIndicator("points")}
                  onClick={onPointsSort}
                />
              </th>
              <th className="sticky right-0 z-10 bg-slate-50 px-4 py-3 text-left font-semibold whitespace-nowrap shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.14)]">
                <HeaderFilterButton
                  active={acceptingFilter !== "ALL"}
                  align="right"
                  label="Actions"
                >
                  <FilterPanel
                    title="Applications Filter"
                    currentText={ACCEPTING_LABELS[acceptingFilter] || acceptingFilter}
                    helperText="Filter by whether a group is accepting join requests."
                  >
                    <SelectField value={acceptingFilter} onChange={onAcceptingChange}>
                      <option value="ALL">All Application States</option>
                      <option value="YES">Accepting applications</option>
                      <option value="NO">Not accepting applications</option>
                    </SelectField>
                  </FilterPanel>
                </HeaderFilterButton>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.map((group) => {
              const joinAction = resolveJoinAction(group);

              return (
                <tr key={group.group_id} className="group hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{group.group_name || "-"}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{group.group_code || "No code"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <AllGroupsBadge value={group.tier || "-"} />
                  </td>
                  <td className="px-4 py-3">
                    <AllGroupsBadge value={group.status || "Unknown"} />
                  </td>
                  <td
                    className="px-4 py-3 font-semibold text-slate-800"
                    title={group.current_phase_eligibility_status || "-"}
                  >
                    {formatEligibilityLabel(group.current_phase_eligibility_status)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{group.captain_name || "No Captain"}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {group.captain_name && group.captain_points !== null && group.captain_points !== undefined
                        ? `${formatPoints(group.captain_points)} pts`
                        : "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{formatRankValue(group.group_rank)}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {formatVacancyCount(group.vacancies)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{getGroupPoints(group)}</td>
                  <td className="sticky right-0 z-[1] bg-white px-4 py-3 shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)] group-hover:bg-slate-50/80">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onView(group.group_id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                        title="View group"
                      >
                        <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onJoin(group)}
                        disabled={joinAction.disabled}
                        title={joinAction.title}
                        className="rounded-lg border border-[#1754cf]/15 bg-[#1754cf]/8 px-3 py-1.5 text-sm font-semibold text-[#1754cf] transition hover:bg-[#1754cf]/12 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        {joinAction.label}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={9}>
                  No groups found for the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
