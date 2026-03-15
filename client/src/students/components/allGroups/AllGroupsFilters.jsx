import { useEffect, useMemo, useRef, useState } from "react";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

function SelectField({ children, onChange, value }) {
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={onChange}
        className="w-full appearance-none rounded-2xl border border-slate-300 bg-[#f3f4f6] px-4 py-3 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
        <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18 }} />
      </span>
    </div>
  );
}

function SummaryChip({ label }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
      {label}
    </span>
  );
}

const VACANCY_LABELS = {
  ALL: "All vacancy states",
  HAS_VACANCY: "Has vacancy",
  FULL: "Full"
};

const ACCEPTING_LABELS = {
  ALL: "All application states",
  YES: "Accepting applications",
  NO: "Not accepting applications"
};

const ELIGIBILITY_LABELS = {
  ALL: "All eligibility states",
  ELIGIBLE: "Eligible",
  NOT_ELIGIBLE: "Not eligible",
  NOT_EVALUATED: "Not evaluated"
};

const RANK_LABELS = {
  ALL: "All rank states",
  RANKED: "Ranked only",
  UNRANKED: "Unranked only"
};

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
  resultCount = 0,
  statusFilter,
  statusOptions,
  tierFilter,
  tierOptions,
  totalCount = 0,
  vacancyFilter,
  withDivider = true
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

  const activeFilters = useMemo(() => {
    const items = [];
    const trimmedGroupQuery = String(groupQuery || "").trim();
    const trimmedCaptainQuery = String(captainFilter || "").trim();
    const trimmedPointsMin = String(pointsMinFilter || "").trim();

    if (trimmedGroupQuery) {
      items.push(`Group: ${trimmedGroupQuery}`);
    }
    if (tierFilter !== "ALL") {
      items.push(`Tier ${tierFilter}`);
    }
    if (statusFilter !== "ALL") {
      items.push(`Status: ${statusFilter}`);
    }
    if (eligibilityFilter !== "ALL") {
      items.push(`Eligibility: ${ELIGIBILITY_LABELS[eligibilityFilter] || eligibilityFilter}`);
    }
    if (trimmedCaptainQuery) {
      items.push(`Captain: ${trimmedCaptainQuery}`);
    }
    if (rankFilter !== "ALL") {
      items.push(RANK_LABELS[rankFilter] || rankFilter);
    }
    if (vacancyFilter !== "ALL") {
      items.push(VACANCY_LABELS[vacancyFilter] || vacancyFilter);
    }
    if (trimmedPointsMin) {
      items.push(`Min points: ${trimmedPointsMin}`);
    }
    if (acceptingFilter !== "ALL") {
      items.push(ACCEPTING_LABELS[acceptingFilter] || acceptingFilter);
    }

    return items;
  }, [
    acceptingFilter,
    captainFilter,
    eligibilityFilter,
    groupQuery,
    pointsMinFilter,
    rankFilter,
    statusFilter,
    tierFilter,
    vacancyFilter
  ]);

  const activeFilterCount = activeFilters.length;
  const showingText =
    totalCount > 0
      ? `Showing ${resultCount} of ${totalCount} groups`
      : `Showing ${resultCount} groups`;
  const currentViewText =
    activeFilters.length > 0
      ? activeFilters.join(" | ")
      : "No filters applied. Showing the full group list.";

  return (
    <div
      ref={rootRef}
      className={`relative bg-slate-50/80 px-4 py-3 ${withDivider ? "border-b border-slate-200" : ""}`.trim()}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">{showingText}</div>
          <div className="mt-1 truncate text-xs text-slate-500">{currentViewText}</div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <FilterAltOutlinedIcon sx={{ fontSize: 18 }} />
          {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : "Filters"}
        </button>
      </div>

      {open ? (
        <div className="absolute right-4 top-[calc(100%+10px)] z-20 w-[min(92vw,440px)] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Filter Groups</h3>
              <p className="mt-1 text-xs text-slate-500">
                Changes apply instantly to the current list.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Current View
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">{showingText}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeFilters.length > 0 ? (
                activeFilters.map((item) => <SummaryChip key={item} label={item} />)
              ) : (
                <SummaryChip label="All groups" />
              )}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Group
              </span>
              <span className="relative block">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                  <SearchRoundedIcon sx={{ fontSize: 20 }} />
                </span>
                <input
                  value={groupQuery}
                  onChange={onGroupQueryChange}
                  placeholder="Name, code, or id"
                  className="w-full rounded-2xl border border-slate-300 bg-[#f3f4f6] py-3 pl-12 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10"
                />
              </span>
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Tier
                </span>
                <SelectField value={tierFilter} onChange={onTierChange}>
                  <option value="ALL">All Tiers</option>
                  {tierOptions.map((tier) => (
                    <option key={tier} value={tier}>
                      Tier {tier}
                    </option>
                  ))}
                </SelectField>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Status
                </span>
                <SelectField value={statusFilter} onChange={onStatusChange}>
                  <option value="ALL">All Statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </SelectField>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Eligibility
                </span>
                <SelectField value={eligibilityFilter} onChange={onEligibilityChange}>
                  <option value="ALL">All Eligibility States</option>
                  {eligibilityOptions.map((status) => (
                    <option key={status} value={status}>
                      {ELIGIBILITY_LABELS[status] || status}
                    </option>
                  ))}
                </SelectField>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Captain
                </span>
                <input
                  value={captainFilter}
                  onChange={onCaptainChange}
                  placeholder="Captain name"
                  className="w-full rounded-2xl border border-slate-300 bg-[#f3f4f6] px-4 py-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Rank
                </span>
                <SelectField value={rankFilter} onChange={onRankChange}>
                  <option value="ALL">All Rank States</option>
                  {rankOptions.map((status) => (
                    <option key={status} value={status}>
                      {RANK_LABELS[status] || status}
                    </option>
                  ))}
                </SelectField>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Vacancy
                </span>
                <SelectField value={vacancyFilter} onChange={onVacancyChange}>
                  <option value="ALL">All</option>
                  <option value="HAS_VACANCY">Has Vacancy</option>
                  <option value="FULL">Full</option>
                </SelectField>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Accepting
                </span>
                <SelectField value={acceptingFilter} onChange={onAcceptingChange}>
                  <option value="ALL">All</option>
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </SelectField>
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Minimum Points
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={pointsMinFilter}
                  onChange={onPointsMinChange}
                  placeholder="0"
                  className="w-full rounded-2xl border border-slate-300 bg-[#f3f4f6] px-4 py-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10"
                />
              </label>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {activeFilterCount > 0
                ? `${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} active`
                : "All filters are cleared"}
            </div>

            <button
              type="button"
              onClick={onReset}
              disabled={!canReset}
              title="Reset filters"
              aria-label="Reset filters"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-[#f3f4f6] px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-[#eceef2] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-300"
            >
              <RestartAltRoundedIcon sx={{ fontSize: 18 }} />
              Reset
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
