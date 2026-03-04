import { useEffect, useMemo, useState } from "react";
import { fetchAuditLogs } from "../../service/audit.api";
import { getProfile } from "../../service/joinRequests.api";

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
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

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
    let mounted = true;

    const loadProfile = async () => {
      setProfileLoading(true);

      try {
        const data = await getProfile();
        if (!mounted) return;
        setProfile(data || null);
      } catch {
        if (!mounted) return;
        setProfile(null);
      } finally {
        if (!mounted) return;
        setProfileLoading(false);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    void load(1, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((value) => hasValue(value)).length,
    [filters]
  );

  const actorCoverage = useMemo(
    () => rows.filter((row) => hasValue(row.actor_user_id)).length,
    [rows]
  );

  const currentUserId = profile?.userId || "-";
  const currentReferenceId = profile?.adminId || profile?.studentId || profile?.userId || "-";
  const currentReferenceLabel = profile?.adminId
    ? "Admin ID"
    : profile?.studentId
    ? "Student ID"
    : "User ID";

  const summary = useMemo(
    () => [
      {
        label: "Total Records",
        value: total,
        helper: "Rows matching the current filters"
      },
      {
        label: "Visible Rows",
        value: rows.length,
        helper: `Page ${page} of ${pageCount}`
      },
      {
        label: "Rows With User ID",
        value: `${actorCoverage}/${rows.length || 0}`,
        helper:
          actorCoverage === rows.length
            ? "Audit actor data present"
            : "Some rows are still missing actor data"
      }
    ],
    [actorCoverage, page, pageCount, rows.length, total]
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
      {/* <section className="rounded-[28px] border border-blue-200 bg-white p-5 shadow-sm shadow-blue-100/70 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-blue-500">
              Audit Monitoring
            </p>
            <div>
              <h1 className="text-2xl font-semibold text-blue-950 sm:text-3xl">Audit Logs</h1>
              <p className="mt-2 max-w-2xl text-sm text-blue-700">
                {profileLoading
                  ? "Loading admin profile..."
                  : `Signed in as ${profile?.name || "Admin"} | ${currentReferenceLabel}: ${currentReferenceId}`}
              </p>
              <p className="mt-1 break-all text-xs text-blue-500">User ID: {currentUserId}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <div className="font-semibold text-blue-950">
                {profile?.name || "Admin"}
              </div>
              <div>{formatRoleLabel(profile?.role || "ADMIN")}</div>
            </div>
            <button
              onClick={() => load(page, limit)}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-2xl border border-blue-300 px-4 py-2.5 text-sm font-medium text-blue-800 transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {summary.map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-blue-200 bg-blue-50/80 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-500">
                {item.label}
              </p>
              <p className="mt-3 text-3xl font-semibold text-blue-950">{item.value}</p>
              <p className="mt-2 text-sm text-blue-700">{item.helper}</p>
            </div>
          ))}
        </div>
      </section> */}

      <form
        onSubmit={onSearch}
        className="rounded-[28px] border border-blue-200 bg-white p-5 shadow-sm shadow-blue-100/70 sm:p-6"
      >
        <div className="flex flex-col gap-2 border-b border-blue-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-blue-950">Filters</h2>
            <p className="text-sm text-blue-700">
              Search by action, entity, actor, UUID, or date range.
            </p>
          </div>
          <div className="text-sm text-blue-500">
            Active filters: <span className="font-semibold text-blue-950">{activeFilterCount}</span>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-blue-800">Search</span>
            <input
              className="w-full rounded-2xl border border-blue-200 bg-blue-50/40 px-4 py-3 text-sm text-blue-950 outline-none transition placeholder:text-blue-300 focus:border-blue-400"
              placeholder="Action, entity, actor, reason"
              value={filters.q}
              onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-blue-800">Action</span>
            <input
              className="w-full rounded-2xl border border-blue-200 bg-blue-50/40 px-4 py-3 text-sm text-blue-950 outline-none transition placeholder:text-blue-300 focus:border-blue-400"
              placeholder="GROUP_CREATED"
              value={filters.action}
              onChange={(event) => setFilters((prev) => ({ ...prev, action: event.target.value }))}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-blue-800">Entity Type</span>
            <input
              className="w-full rounded-2xl border border-blue-200 bg-blue-50/40 px-4 py-3 text-sm text-blue-950 outline-none transition placeholder:text-blue-300 focus:border-blue-400"
              placeholder="GROUP, MEMBERSHIP"
              value={filters.entity_type}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, entity_type: event.target.value }))
              }
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-blue-800">Actor Role</span>
            <input
              className="w-full rounded-2xl border border-blue-200 bg-blue-50/40 px-4 py-3 text-sm text-blue-950 outline-none transition placeholder:text-blue-300 focus:border-blue-400"
              placeholder="ADMIN"
              value={filters.actor_role}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, actor_role: event.target.value }))
              }
            />
          </label>

          <label className="space-y-2 md:col-span-2 xl:col-span-1">
            <span className="text-sm font-medium text-blue-800">Actor User ID</span>
            <input
              className="w-full rounded-2xl border border-blue-200 bg-blue-50/40 px-4 py-3 text-sm text-blue-950 outline-none transition placeholder:text-blue-300 focus:border-blue-400"
              placeholder="UUID user id"
              value={filters.actor_user_id}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, actor_user_id: event.target.value }))
              }
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-blue-800">From Date</span>
            <input
              type="date"
              className="w-full rounded-2xl border border-blue-200 bg-blue-50/40 px-4 py-3 text-sm text-blue-950 outline-none transition focus:border-blue-400"
              value={filters.from_date}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, from_date: event.target.value }))
              }
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-blue-800">To Date</span>
            <input
              type="date"
              className="w-full rounded-2xl border border-blue-200 bg-blue-50/40 px-4 py-3 text-sm text-blue-950 outline-none transition focus:border-blue-400"
              value={filters.to_date}
              onChange={(event) => setFilters((prev) => ({ ...prev, to_date: event.target.value }))}
            />
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-blue-200 pt-4 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-2xl bg-blue-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Loading..." : "Apply Filters"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center rounded-2xl border border-blue-300 px-4 py-2.5 text-sm font-medium text-blue-800 transition hover:border-blue-400 hover:bg-blue-50"
          >
            Reset
          </button>
          <div className="text-sm text-blue-500 sm:ml-auto">Current result count: {total}</div>
        </div>
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
