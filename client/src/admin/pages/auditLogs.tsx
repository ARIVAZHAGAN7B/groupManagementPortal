import { useEffect, useMemo, useState } from "react";
import { fetchAuditLogs } from "../../service/audit.api";

const prettyJson = (value) => {
  if (!value) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch (_error) {
    return String(value);
  }
};

export default function AuditLogs() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const [filters, setFilters] = useState({
    q: "",
    action: "",
    entity_type: "",
    actor_role: "",
    from_date: "",
    to_date: ""
  });

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
    load(1, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const onSearch = async (e) => {
    e.preventDefault();
    await load(1, limit);
  };

  return (
    <div className="p-6 space-y-4 max-w-7xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-500">
            View approve/reject/remove actions and admin policy changes.
          </p>
        </div>
        <button onClick={() => load(page, limit)} className="px-3 py-2 rounded border">
          Refresh
        </button>
      </div>

      <form onSubmit={onSearch} className="rounded border p-4 bg-white space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Search action/entity/details"
            value={filters.q}
            onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
          />
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Action"
            value={filters.action}
            onChange={(e) => setFilters((p) => ({ ...p, action: e.target.value }))}
          />
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Entity Type"
            value={filters.entity_type}
            onChange={(e) => setFilters((p) => ({ ...p, entity_type: e.target.value }))}
          />
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Actor Role"
            value={filters.actor_role}
            onChange={(e) => setFilters((p) => ({ ...p, actor_role: e.target.value }))}
          />
          <input
            type="date"
            className="border rounded px-3 py-2 text-sm"
            value={filters.from_date}
            onChange={(e) => setFilters((p) => ({ ...p, from_date: e.target.value }))}
          />
          <input
            type="date"
            className="border rounded px-3 py-2 text-sm"
            value={filters.to_date}
            onChange={(e) => setFilters((p) => ({ ...p, to_date: e.target.value }))}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-2 rounded bg-blue-600 text-white text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Loading..." : "Apply Filters"}
          </button>
          <button
            type="button"
            onClick={() => {
              const reset = {
              q: "",
              action: "",
              entity_type: "",
              actor_role: "",
              from_date: "",
              to_date: ""
              };
              setFilters(reset);
              void load(1, limit, reset);
            }}
            className="px-3 py-2 rounded border text-sm"
          >
            Reset
          </button>
          <div className="ml-auto text-sm text-gray-500">Total: {total}</div>
        </div>
      </form>

      {error ? (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700">{error}</div>
      ) : null}

      <div className="overflow-auto rounded border bg-white">
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left border-b">Time</th>
              <th className="p-3 text-left border-b">Action</th>
              <th className="p-3 text-left border-b">Entity</th>
              <th className="p-3 text-left border-b">Entity ID</th>
              <th className="p-3 text-left border-b">Actor</th>
              <th className="p-3 text-left border-b">Reason</th>
              <th className="p-3 text-left border-b">IP</th>
              <th className="p-3 text-left border-b">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.audit_id} className="align-top hover:bg-gray-50">
                <td className="p-3 border-b whitespace-nowrap">
                  {row.created_at ? new Date(row.created_at).toLocaleString() : "-"}
                </td>
                <td className="p-3 border-b font-medium">{row.action}</td>
                <td className="p-3 border-b">{row.entity_type}</td>
                <td className="p-3 border-b font-mono text-xs">{row.entity_id || "-"}</td>
                <td className="p-3 border-b">
                  <div>{row.actor_role || "-"}</div>
                  <div className="text-xs text-gray-500">
                    user_id: {row.actor_user_id ?? "-"}
                  </div>
                </td>
                <td className="p-3 border-b">{row.reason_code || "-"}</td>
                <td className="p-3 border-b text-xs font-mono">{row.ip_address || "-"}</td>
                <td className="p-3 border-b max-w-[420px]">
                  {row.details ? (
                    <details>
                      <summary className="cursor-pointer text-blue-700">View</summary>
                      <pre className="mt-2 text-xs whitespace-pre-wrap break-words bg-gray-50 border rounded p-2">
                        {prettyJson(row.details)}
                      </pre>
                    </details>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}

            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">
                  No audit logs found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <button
          disabled={loading || page <= 1}
          onClick={() => load(page - 1, limit)}
          className="px-3 py-2 rounded border disabled:opacity-50"
        >
          Prev
        </button>
        <div className="text-sm text-gray-600">
          Page {page} / {pageCount}
        </div>
        <button
          disabled={loading || page >= pageCount}
          onClick={() => load(page + 1, limit)}
          className="px-3 py-2 rounded border disabled:opacity-50"
        >
          Next
        </button>
        <select
          className="ml-auto border rounded px-2 py-2 text-sm"
          value={limit}
          onChange={(e) => {
            const nextLimit = Number(e.target.value) || 50;
            void load(1, nextLimit);
          }}
        >
          {[25, 50, 100, 200].map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
