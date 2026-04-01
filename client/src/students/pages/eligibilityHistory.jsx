import { useDeferredValue, useEffect, useMemo, useState } from "react";
import HistoryEduRoundedIcon from "@mui/icons-material/HistoryEduRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { fetchMyEligibilityHistory } from "../../service/eligibility.api";

const ELIGIBILITY_FILTERS = [
  { value: "ALL", label: "All results" },
  { value: "ELIGIBLE", label: "Eligible" },
  { value: "NOT_ELIGIBLE", label: "Not eligible" },
  { value: "NOT_AVAILABLE", label: "Not available" }
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1754cf] focus:ring-4 focus:ring-[#1754cf]/10";

const tableHeaderClass =
  "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500";
const tableCellClass = "px-4 py-4 align-top text-sm text-slate-700";

const toTimestamp = (value) => {
  if (!value) return 0;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  });
};

const formatPoints = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "0";

  return numericValue.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(numericValue) ? 0 : 2,
    maximumFractionDigits: 2
  });
};

const formatReasonLabel = (value) => {
  const text = String(value || "").trim();
  if (!text) return "No reason recorded";

  return text
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
};

const getEligibilityKey = (value) => {
  if (value === true) return "ELIGIBLE";
  if (value === false) return "NOT_ELIGIBLE";
  return "NOT_AVAILABLE";
};

const getEligibilityLabel = (value) => {
  if (value === true) return "Eligible";
  if (value === false) return "Not Eligible";
  return "Not Available";
};

const getEligibilityBadgeClass = (value) => {
  if (value === true) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (value === false) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
};

const getPhaseStatusBadgeClass = (value) => {
  const status = String(value || "").toUpperCase();

  if (status === "COMPLETED") {
    return "border-[#1754cf]/15 bg-[#1754cf]/10 text-[#1754cf]";
  }

  if (status === "ACTIVE") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
};

function PageHero({ loading, onRefresh }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#1754cf]/10 bg-[#1754cf]/5 px-5 py-5 shadow-sm md:px-6 md:py-6">
      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
            Student Workspace
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[2rem]">
              Eligibility History
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
        >
          <RefreshRoundedIcon sx={{ fontSize: 18 }} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="absolute -bottom-14 -right-10 h-52 w-52 rounded-full bg-[#1754cf]/10 blur-3xl" />
      <div className="absolute -top-12 left-16 h-36 w-36 rounded-full bg-white/30 blur-3xl" />
    </section>
  );
}

function FiltersBar({ eligibilityFilter, onEligibilityChange, onQueryChange, query }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <SearchRoundedIcon
            sx={{ fontSize: 18 }}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className={`${inputClass} pl-10`}
            placeholder="Search by phase, reason, or result"
          />
        </div>

        <div className="w-full lg:w-64">
          <select
            value={eligibilityFilter}
            onChange={(event) => onEligibilityChange(event.target.value)}
            className={inputClass}
          >
            {ELIGIBILITY_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}

function EmptyState({ filtered }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#1754cf]/10 text-[#1754cf]">
        <HistoryEduRoundedIcon sx={{ fontSize: 28 }} />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-900">
        {filtered ? "No matching history entries" : "No eligibility history yet"}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        {filtered
          ? "Try a different search phrase or change the outcome filter to broaden the results."
          : "Eligibility records appear after a phase is completed and evaluated for your account."}
      </p>
    </section>
  );
}

function LoadingState() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="animate-pulse space-y-3">
        <div className="h-5 w-48 rounded bg-slate-200" />
        <div className="h-20 rounded-2xl bg-slate-100" />
        <div className="h-20 rounded-2xl bg-slate-100" />
        <div className="h-20 rounded-2xl bg-slate-100" />
      </div>
    </section>
  );
}

function MobileHistoryCard({ row }) {
  const eligibilityLabel = getEligibilityLabel(row.is_eligible);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">
              {row.phase_name || "No phase name"}
            </h2>
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${getPhaseStatusBadgeClass(
                row.phase_status
              )}`}
            >
              {row.phase_status || "Unknown"}
            </span>
          </div>
        </div>

        <span
          className={`inline-flex w-fit whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${getEligibilityBadgeClass(
            row.is_eligible
          )}`}
        >
          {eligibilityLabel}
        </span>
      </div>

      <dl className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/70 px-3">
        <div className="flex items-center justify-between gap-3 py-3">
          <dt className="text-sm text-slate-500">Start Date</dt>
          <dd className="text-sm font-semibold text-slate-900">{formatDate(row.phase_start_date)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <dt className="text-sm text-slate-500">End Date</dt>
          <dd className="text-sm font-semibold text-slate-900">{formatDate(row.phase_end_date)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <dt className="text-sm text-slate-500">Phase Base</dt>
          <dd className="text-sm font-semibold text-[#1754cf]">
            {formatPoints(row.this_phase_base_points)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <dt className="text-sm text-slate-500">Multiplier</dt>
          <dd className="text-sm font-semibold text-slate-900">
            {row.eligibility_multiplier ? `x${Number(row.eligibility_multiplier).toFixed(2)}` : "-"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <dt className="text-sm text-slate-500">Bonus</dt>
          <dd className="text-sm font-semibold text-slate-900">
            {formatPoints(row.eligibility_awarded_points)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <dt className="text-sm text-slate-500">Target</dt>
          <dd className="text-sm font-semibold text-slate-900">
            {row.target_points === null || row.target_points === undefined
              ? "Not set"
              : formatPoints(row.target_points)}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3 py-3">
          <dt className="text-sm text-slate-500">Reason</dt>
          <dd className="max-w-[60%] text-right text-sm font-semibold text-slate-900">
            {formatReasonLabel(row.reason_code)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <dt className="text-sm text-slate-500">Evaluated Date</dt>
          <dd className="text-right text-sm font-semibold text-slate-900">
            {formatDate(row.evaluated_at)}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function DesktopHistoryTable({ rows }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1280px] w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className={tableHeaderClass}>Phase</th>
              <th className={tableHeaderClass}>Start Date</th>
              <th className={tableHeaderClass}>End Date</th>
              <th className={tableHeaderClass}>Phase Base</th>
              <th className={tableHeaderClass}>Multiplier</th>
              <th className={tableHeaderClass}>Bonus</th>
              <th className={tableHeaderClass}>Target</th>
              <th className={tableHeaderClass}>Result</th>
              <th className={tableHeaderClass}>Reason</th>
              <th className={tableHeaderClass}>Evaluated Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              return (
                <tr
                  key={row.eligibility_id || `${row.phase_id}-${row.student_id}`}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  <td className={tableCellClass}>
                    <div className="font-semibold text-slate-900">
                      {row.phase_name || "No phase name"}
                    </div>
                    <div className="mt-1">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${getPhaseStatusBadgeClass(
                          row.phase_status
                        )}`}
                      >
                        {row.phase_status || "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td className={tableCellClass}>{formatDate(row.phase_start_date)}</td>
                  <td className={tableCellClass}>{formatDate(row.phase_end_date)}</td>
                  <td className={`${tableCellClass} font-semibold text-[#1754cf]`}>
                    {formatPoints(row.this_phase_base_points)}
                  </td>
                  <td className={tableCellClass}>
                    {row.eligibility_multiplier
                      ? `x${Number(row.eligibility_multiplier).toFixed(2)}`
                      : "-"}
                  </td>
                  <td className={`${tableCellClass} font-semibold text-slate-900`}>
                    {formatPoints(row.eligibility_awarded_points)}
                  </td>
                  <td className={tableCellClass}>
                    {row.target_points === null || row.target_points === undefined
                      ? "Not set"
                      : formatPoints(row.target_points)}
                  </td>
                  <td className={tableCellClass}>
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${getEligibilityBadgeClass(
                        row.is_eligible
                      )}`}
                    >
                      {getEligibilityLabel(row.is_eligible)}
                    </span>
                  </td>
                  <td className={tableCellClass}>
                    <span title={row.reason_code || ""}>{formatReasonLabel(row.reason_code)}</span>
                  </td>
                  <td className={tableCellClass}>{formatDate(row.evaluated_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function EligibilityHistoryPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [eligibilityFilter, setEligibilityFilter] = useState("ALL");
  const deferredQuery = useDeferredValue(query);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMyEligibilityHistory();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load eligibility history");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const previousRows = useMemo(
    () => rows.filter((row) => String(row.phase_status || "").toUpperCase() !== "ACTIVE"),
    [rows]
  );

  const historyRows = useMemo(() => {
    const baseRows = previousRows.length > 0 ? previousRows : rows;

    return [...baseRows].sort((left, right) => {
      const rightStamp =
        toTimestamp(right.phase_end_date) ||
        toTimestamp(right.evaluated_at) ||
        toTimestamp(right.phase_start_date);
      const leftStamp =
        toTimestamp(left.phase_end_date) ||
        toTimestamp(left.evaluated_at) ||
        toTimestamp(left.phase_start_date);

      return rightStamp - leftStamp;
    });
  }, [previousRows, rows]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = String(deferredQuery || "").trim().toLowerCase();

    return historyRows.filter((row) => {
      const eligibilityKey = getEligibilityKey(row.is_eligible);
      if (eligibilityFilter !== "ALL" && eligibilityKey !== eligibilityFilter) {
        return false;
      }

      if (!normalizedQuery) return true;

      return [
        row.phase_name,
        row.phase_id,
        row.phase_status,
        row.reason_code,
        formatReasonLabel(row.reason_code),
        getEligibilityLabel(row.is_eligible)
      ]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(normalizedQuery));
    });
  }, [deferredQuery, eligibilityFilter, historyRows]);

  const activePhaseHidden = rows.length > previousRows.length && previousRows.length > 0;
  const hasFilters = Boolean(String(query || "").trim()) || eligibilityFilter !== "ALL";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 font-[Inter] md:px-6">
      <PageHero loading={loading} onRefresh={load} />

      {activePhaseHidden ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Current active phase eligibility is intentionally hidden here so this page stays focused
          on completed phase history.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <FiltersBar
        eligibilityFilter={eligibilityFilter}
        onEligibilityChange={setEligibilityFilter}
        onQueryChange={setQuery}
        query={query}
      />

      {loading && historyRows.length === 0 ? (
        <LoadingState />
      ) : filteredRows.length === 0 ? (
        <EmptyState filtered={hasFilters} />
      ) : (
        <>
          <div className="grid gap-4 lg:hidden">
            {filteredRows.map((row) => (
              <MobileHistoryCard
                key={row.eligibility_id || `${row.phase_id}-${row.student_id}`}
                row={row}
              />
            ))}
          </div>

          <div className="hidden lg:block">
            <DesktopHistoryTable rows={filteredRows} />
          </div>
        </>
      )}
    </div>
  );
}
