import { useEffect, useMemo, useState } from "react";
import { fetchMyEligibilityHistory } from "../../service/eligibility.api";

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const formatEligible = (value) => {
  if (value === null || value === undefined) return "Not available";
  return value ? "Yes" : "No";
};

export default function EligibilityHistoryPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    () =>
      rows.filter((row) => String(row.phase_status || "").toUpperCase() !== "ACTIVE"),
    [rows]
  );

  const displayRows = previousRows.length > 0 ? previousRows : rows;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Eligibility History</h1>
          <p className="text-sm text-gray-600">
            Your evaluated eligibility across previous phases.
          </p>
        </div>
        <button onClick={load} className="px-3 py-2 rounded border w-fit" disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {rows.length > previousRows.length && previousRows.length > 0 ? (
        <div className="p-3 rounded border bg-blue-50 text-blue-700 text-sm">
          Current active phase eligibility is hidden here. This table focuses on previous phase history.
        </div>
      ) : null}

      {error ? (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="p-3 rounded border">Loading eligibility history...</div>
      ) : (
        <div className="overflow-auto border rounded">
          <table className="min-w-[1000px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 border-b">Phase ID</th>
                <th className="text-left p-3 border-b">Phase Dates</th>
                <th className="text-left p-3 border-b">Earned</th>
                <th className="text-left p-3 border-b">Target</th>
                <th className="text-left p-3 border-b">Eligible</th>
                <th className="text-left p-3 border-b">Reason</th>
                <th className="text-left p-3 border-b">Evaluated At</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row) => (
                <tr key={row.eligibility_id || `${row.phase_id}-${row.student_id}`} className="hover:bg-gray-50">
                  <td className="p-3 border-b">
                    <div className="font-medium">{row.phase_id || "-"}</div>
                    <div className="text-xs text-gray-500">{row.phase_status || "-"}</div>
                  </td>
                  <td className="p-3 border-b">
                    {formatDate(row.phase_start_date)} - {formatDate(row.phase_end_date)}
                  </td>
                  <td className="p-3 border-b font-semibold text-blue-700">
                    {Number(row.this_phase_base_points || 0).toLocaleString()}
                  </td>
                  <td className="p-3 border-b">
                    {row.target_points === null || row.target_points === undefined
                      ? "-"
                      : Number(row.target_points).toLocaleString()}
                  </td>
                  <td className="p-3 border-b">{formatEligible(row.is_eligible)}</td>
                  <td className="p-3 border-b">{row.reason_code || "-"}</td>
                  <td className="p-3 border-b">{formatDateTime(row.evaluated_at)}</td>
                </tr>
              ))}

              {displayRows.length === 0 ? (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={7}>
                    No eligibility history found yet. Eligibility appears after a phase is evaluated.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
