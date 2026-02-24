import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchGroupById } from "../../service/groups.api";
import { fetchGroupMembers, joinGroup } from "../../service/membership.api";
import {applyJoinRequest} from "../../service/joinRequests.api";
import { fetchCurrentPhase } from "../../service/phase.api";
import { fetchGroupEligibilitySummary } from "../../service/eligibility.api";
import GroupMembersTable from "../../admin/components/membership/GroupMembersTable";

const GroupDetails = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState("");
  const [activeTab, setActiveTab] = useState("members");
  const [eligibility, setEligibility] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityErr, setEligibilityErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const [g, m] = await Promise.all([
        fetchGroupById(id),
        fetchGroupMembers(id),
      ]);
      setGroup(g || null);
      setMembers(Array.isArray(m) ? m : []);
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to load group details"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    setActiveTab("members");
    setEligibility(null);
    setEligibilityErr("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadEligibility = async () => {
    setEligibilityLoading(true);
    setEligibilityErr("");
    try {
      const phase = await fetchCurrentPhase();
      if (!phase?.phase_id) {
        setEligibility({
          phase_id: null,
          earned_points: 0,
          target_points: null,
          is_eligible: null
        });
        return;
      }

      const summary = await fetchGroupEligibilitySummary(phase.phase_id, id);
      setEligibility(summary || null);
    } catch (e) {
      setEligibilityErr(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to load eligibility"
      );
      setEligibility(null);
    } finally {
      setEligibilityLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "eligibility") return;
    loadEligibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id]);

  const onJoin = async () => {
    setBusy(true);
    setActionErr("");
    try {
      await applyJoinRequest(id);
      await load();
    } catch (e) {
      setActionErr(e?.response?.data?.message || "Join failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (err) return <div className="p-6 text-red-700">{err}</div>;
  if (!group) return <div className="p-6">Not found</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Group Details</h1>
        <div className="flex gap-2">
          <button
            onClick={() => nav("/groups")}
            className="px-3 py-2 rounded border"
          >
            Back
          </button>
          <button onClick={load} className="px-3 py-2 rounded border">
            Refresh
          </button>
        </div>
      </div>

      <div className="border rounded p-4 space-y-2">
        <div>
          <span className="font-medium">ID:</span> {group.group_id}
        </div>
        <div>
          <span className="font-medium">Code:</span> {group.group_code}
        </div>
        <div>
          <span className="font-medium">Name:</span> {group.group_name}
        </div>
        <div>
          <span className="font-medium">Tier:</span> {group.tier}
        </div>
        <div>
          <span className="font-medium">Status:</span> {group.status}
        </div>
        <div>
          <span className="font-medium">Active members:</span> {members.length}
        </div>
      </div>

      {actionErr ? (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700">
          {actionErr}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          disabled={busy}
          onClick={onJoin}
          className="px-4 py-2 rounded border"
          title="Student only (backend enforces)"
        >
          {busy ? "Working..." : "Join Group"}
        </button>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="border-b px-3 py-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`px-3 py-1.5 rounded text-sm font-semibold border ${
              activeTab === "members"
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            Members
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("eligibility")}
            className={`px-3 py-1.5 rounded text-sm font-semibold border ${
              activeTab === "eligibility"
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            Eligibility
          </button>
        </div>

        <div className="p-4">
          {activeTab === "members" ? (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Members</h2>
              <GroupMembersTable members={members} />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Eligibility</h2>
                <button
                  type="button"
                  onClick={loadEligibility}
                  className="px-3 py-2 rounded border text-sm"
                  disabled={eligibilityLoading}
                >
                  {eligibilityLoading ? "Loading..." : "Refresh Eligibility"}
                </button>
              </div>

              {eligibilityErr ? (
                <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700">
                  {eligibilityErr}
                </div>
              ) : null}

              {eligibilityLoading ? (
                <div className="p-3 border rounded">Loading eligibility...</div>
              ) : (
                <div className="overflow-auto border rounded">
                  <table className="min-w-[640px] w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 border-b">Phase ID</th>
                        <th className="text-left p-3 border-b">Earned</th>
                        <th className="text-left p-3 border-b">Target</th>
                        <th className="text-left p-3 border-b">Eligible</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-3 border-b break-all">
                          {eligibility?.phase_id || "No active phase"}
                        </td>
                        <td className="p-3 border-b">{eligibility?.earned_points ?? 0}</td>
                        <td className="p-3 border-b">{eligibility?.target_points ?? "Not set"}</td>
                        <td
                          className={`p-3 border-b font-semibold ${
                            eligibility?.is_eligible === true
                              ? "text-green-700"
                              : eligibility?.is_eligible === false
                                ? "text-red-700"
                                : "text-gray-700"
                          }`}
                        >
                          {eligibility?.is_eligible === true
                            ? "Yes"
                            : eligibility?.is_eligible === false
                              ? "No"
                              : "Not available"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;
