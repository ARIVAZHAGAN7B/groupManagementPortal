import { useEffect, useMemo, useState } from "react";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
import { useRealtimeEvents } from "../../hooks/useRealtimeEvents";
import { REALTIME_EVENTS } from "../../lib/realtime";
import { fetchAuditLogs } from "../../service/audit.api";
import {
  WorkspaceInlineActionButton,
  WorkspaceInlineFilters,
  WorkspaceInlineInputField,
  WorkspaceInlineSearchField
} from "../../shared/components/WorkspaceInlineFilters";

const emptyFilters = {
  q: "",
  action: "",
  entity_type: "",
  actor_role: "",
  actor_user_id: "",
  from_date: "",
  to_date: ""
};

const prettyJson = (value) => {
  if (!value) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch (_error) {
    return String(value);
  }
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const hasValue = (value) => value !== undefined && value !== null && value !== "";

const formatRoleLabel = (role) => {
  if (!role) return "Unknown";
  return String(role)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getActionTone = (action) => {
  const normalized = String(action || "").toUpperCase();

  if (normalized.includes("PENDING") || normalized.includes("APPLIED")) {
    return "bg-amber-50 text-amber-800 ring-amber-200";
  }

  if (
    normalized.includes("REJECT") ||
    normalized.includes("REMOVE") ||
    normalized.includes("DELETE") ||
    normalized.includes("FREEZE")
  ) {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }

  if (
    normalized.includes("APPROVE") ||
    normalized.includes("CREATE") ||
    normalized.includes("JOIN") ||
    normalized.includes("ACTIVATE")
  ) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  return "bg-blue-100 text-blue-900 ring-blue-200";
};

const getActorReferenceLabel = (row) => row.actor_reference_type || "User ID";

const getActorReferenceValue = (row) =>
  row.actor_reference_id || row.actor_user_id || "-";

function DetailsBlock({ details }) {
  if (!details) {
    return <span className="text-sm text-blue-300">No details</span>;
  }

  return (
    <details className="group rounded-2xl border border-blue-200 bg-blue-50/80 p-3">
      <summary className="cursor-pointer list-none text-sm font-medium text-blue-800">
        <span className="group-open:hidden">Show details</span>
        <span className="hidden group-open:inline">Hide details</span>
      </summary>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-white p-3 text-xs text-blue-900">
        {prettyJson(details)}
      </pre>
    </details>
  );
}

function ActorBlock({ row }) {
  return (
    <div className="space-y-1">
      <div className="font-medium text-blue-950">{row.actor_name || "-"}</div>
      <div className="text-xs text-blue-600">{formatRoleLabel(row.actor_role)}</div>
      <div className="break-all font-mono text-xs text-blue-500">
        {getActorReferenceLabel(row)}: {getActorReferenceValue(row)}
      </div>
    </div>
  );
}

function AuditCard({ row }) {
  return (
    <article className="space-y-4 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getActionTone(row.action)}`}
          >
            {row.action || "UNKNOWN"}
          </span>
          <div className="text-sm font-medium text-blue-950">
            {row.entity_type || "-"}
            {hasValue(row.entity_id) ? ` ${row.entity_id}` : ""}
          </div>
        </div>
        <div className="text-sm text-blue-500">{formatDateTime(row.created_at)}</div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-blue-50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
            Actor
          </dt>
          <dd className="mt-1">
            <ActorBlock row={row} />
          </dd>
        </div>
        <div className="rounded-2xl bg-blue-50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
            Reason
          </dt>
          <dd className="mt-1 text-sm text-blue-950">{row.reason_code || "-"}</dd>
        </div>
        <div className="rounded-2xl bg-blue-50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
            IP Address
          </dt>
          <dd className="mt-1 break-all font-mono text-xs text-blue-950">{row.ip_address || "-"}</dd>
        </div>
        <div className="rounded-2xl bg-blue-50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
            Entity ID
          </dt>
          <dd className="mt-1 break-all font-mono text-xs text-blue-950">{row.entity_id || "-"}</dd>
        </div>
      </dl>

      <DetailsBlock details={row.details} />
    </article>
  );
}

export default function AuditLogs() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [filters, setFilters] = useState(emptyFilters);

  const load = async (nextPage = page, nextLimit = limit, overrideFilters = null) => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchAuditLogs({
        ...(overrideFilters || filters),
        page: nextPage,
        limit: nextLimit
      });

      setRows(Array.isArray(data?.rows) ? data.rows : []);
      setTotal(Number(data?.total) || 0);
      setPage(Number(data?.page) || nextPage);
      setLimit(Number(data?.limit) || nextLimit);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load audit logs");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRealtimeRefresh = useDebouncedCallback(() => {
    void load(page, limit);
  }, 300);

  useRealtimeEvents(REALTIME_EVENTS.AUDIT, handleRealtimeRefresh);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);
  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((value) => hasValue(value)),
    [filters]
  );

  const onSearch = async (event) => {
    event.preventDefault();
    await load(1, limit);
  };

  const onReset = () => {
    setFilters(emptyFilters);
    void load(1, limit, emptyFilters);
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 bg-gradient-to-b from-blue-50 via-white to-blue-50/70 p-4 sm:p-6">
      <form
        onSubmit={onSearch}
        className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
      >
        <WorkspaceInlineFilters className="border-0 p-0 shadow-none">
          <WorkspaceInlineSearchField
            label="Search"
            value={filters.q}
            placeholder="Action, entity, actor, reason"
            onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
          />
          <WorkspaceInlineInputField
            label="Action"
            value={filters.action}
            placeholder="GROUP_CREATED"
            wrapperClassName="w-full sm:w-[180px]"
            onChange={(event) => setFilters((prev) => ({ ...prev, action: event.target.value }))}
          />
          <WorkspaceInlineInputField
            label="Entity Type"
            value={filters.entity_type}
            placeholder="GROUP, MEMBERSHIP"
            wrapperClassName="w-full sm:w-[180px]"
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, entity_type: event.target.value }))
            }
          />
          <WorkspaceInlineInputField
            label="Actor Role"
            value={filters.actor_role}
            placeholder="ADMIN"
            wrapperClassName="w-full sm:w-[180px]"
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, actor_role: event.target.value }))
            }
          />
          <WorkspaceInlineInputField
            label="Actor User ID"
            value={filters.actor_user_id}
            placeholder="UUID user id"
            wrapperClassName="w-full sm:w-[200px]"
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, actor_user_id: event.target.value }))
            }
          />
          <WorkspaceInlineInputField
            label="From Date"
            value={filters.from_date}
            inputType="date"
            wrapperClassName="w-full sm:w-[170px]"
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, from_date: event.target.value }))
            }
          />
          <WorkspaceInlineInputField
            label="To Date"
            value={filters.to_date}
            inputType="date"
            wrapperClassName="w-full sm:w-[170px]"
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, to_date: event.target.value }))
            }
          />
          <WorkspaceInlineActionButton
            type="submit"
            disabled={loading}
            className="gap-2 border-[#1754cf]/15 bg-[#1754cf]/8 text-[#1754cf] hover:bg-[#1754cf]/12 xl:min-w-[8rem]"
          >
            {loading ? "Loading..." : "Apply"}
          </WorkspaceInlineActionButton>
          <WorkspaceInlineActionButton
            type="button"
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="gap-2 xl:min-w-[9rem]"
          >
            Clear Filters
          </WorkspaceInlineActionButton>
        </WorkspaceInlineFilters>
      </form>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[28px] border border-blue-200 bg-white shadow-sm shadow-blue-100/70">
        <div className="flex flex-col gap-2 border-b border-blue-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-blue-950">Activity</h2>
            <p className="text-sm text-blue-700">
              Actor data now uses the same user source as profile lookup, with derived admin or
              student IDs when available.
            </p>
          </div>
          <div className="text-sm text-blue-500">
            Showing <span className="font-semibold text-blue-950">{rows.length}</span> rows on this
            page
          </div>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-sm text-blue-500 sm:px-6">Loading audit logs...</div>
        ) : null}

        {!loading && rows.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <p className="text-base font-medium text-blue-950">No audit logs found.</p>
            <p className="mt-2 text-sm text-blue-500">
              Try widening the date range or clearing one of the filters.
            </p>
          </div>
        ) : null}

        {!loading && rows.length > 0 ? (
          <>
            <div className="divide-y divide-blue-200 lg:hidden">
              {rows.map((row) => (
                <AuditCard key={row.audit_id} row={row} />
              ))}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-[1180px] w-full text-sm text-blue-800">
                <thead className="bg-blue-50 text-xs uppercase tracking-[0.16em] text-blue-500">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Time</th>
                    <th className="px-6 py-4 text-left font-semibold">Action</th>
                    <th className="px-6 py-4 text-left font-semibold">Entity</th>
                    <th className="px-6 py-4 text-left font-semibold">Actor</th>
                    <th className="px-6 py-4 text-left font-semibold">Reason</th>
                    <th className="px-6 py-4 text-left font-semibold">IP</th>
                    <th className="px-6 py-4 text-left font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-200">
                  {rows.map((row) => (
                    <tr key={row.audit_id} className="align-top transition hover:bg-blue-50/80">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700">
                        {formatDateTime(row.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getActionTone(row.action)}`}
                        >
                          {row.action || "UNKNOWN"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-blue-950">{row.entity_type || "-"}</div>
                        <div className="mt-1 break-all font-mono text-xs text-blue-500">
                          {row.entity_id || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <ActorBlock row={row} />
                      </td>
                      <td className="px-6 py-4 text-blue-700">{row.reason_code || "-"}</td>
                      <td className="px-6 py-4 break-all font-mono text-xs text-blue-500">
                        {row.ip_address || "-"}
                      </td>
                      <td className="px-6 py-4 max-w-[420px]">
                        <DetailsBlock details={row.details} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </section>

      <section className="rounded-[28px] border border-blue-200 bg-white p-4 shadow-sm shadow-blue-100/70 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="text-sm text-blue-700">
            Page <span className="font-semibold text-blue-950">{page}</span> of{" "}
            <span className="font-semibold text-blue-950">{pageCount}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={loading || page <= 1}
              onClick={() => load(page - 1, limit)}
              className="rounded-2xl border border-blue-300 px-4 py-2 text-sm font-medium text-blue-800 transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={loading || page >= pageCount}
              onClick={() => load(page + 1, limit)}
              className="rounded-2xl border border-blue-300 px-4 py-2 text-sm font-medium text-blue-800 transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>

          <label className="sm:ml-auto">
            <span className="sr-only">Rows per page</span>
            <select
              className="w-full rounded-2xl border border-blue-300 px-3 py-2 text-sm text-blue-950 outline-none transition focus:border-blue-400"
              value={limit}
              onChange={(event) => {
                const nextLimit = Number(event.target.value) || 50;
                void load(1, nextLimit);
              }}
            >
              {[25, 50, 100, 200].map((value) => (
                <option key={value} value={value}>
                  {value} / page
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
    </div>
  );
}
