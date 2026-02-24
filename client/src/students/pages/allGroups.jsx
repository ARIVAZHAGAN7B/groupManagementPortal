import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchGroups } from "../../service/groups.api";

const AllGroups = () => {
  const nav = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await fetchGroups();
      setGroups(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return groups;
    return groups.filter((g) => {
      const code = String(g.group_code || "").toLowerCase();
      const name = String(g.group_name || "").toLowerCase();
      const tier = String(g.tier || "").toLowerCase();
      const status = String(g.status || "").toLowerCase();
      return (
        code.includes(s) ||
        name.includes(s) ||
        tier.includes(s) ||
        status.includes(s)
      );
    });
  }, [groups, q]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">All Groups</h1>
        <button onClick={load} className="px-3 py-2 rounded border">
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full max-w-md border rounded px-3 py-2"
          placeholder="Search by code, name, tier, status..."
        />
      </div>

      {err ? (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700">
          {err}
        </div>
      ) : null}

      {loading ? (
        <div className="p-3 border rounded">Loading...</div>
      ) : (
        <div className="overflow-auto border rounded">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 border-b">ID</th>
                <th className="text-left p-3 border-b">Code</th>
                <th className="text-left p-3 border-b">Name</th>
                <th className="text-left p-3 border-b">Tier</th>
                <th className="text-left p-3 border-b">Status</th>
                <th className="text-left p-3 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.group_id} className="hover:bg-gray-50">
                  <td className="p-3 border-b">{g.group_id}</td>
                  <td className="p-3 border-b">{g.group_code}</td>
                  <td className="p-3 border-b">{g.group_name}</td>
                  <td className="p-3 border-b">{g.tier}</td>
                  <td className="p-3 border-b">{g.status}</td>
                  <td className="p-3 border-b">
                    <button
                      className="px-3 py-1 rounded border"
                      onClick={() => nav(`/groups/${g.group_id}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td className="p-3" colSpan={6}>
                    No groups found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllGroups;
