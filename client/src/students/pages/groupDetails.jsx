import { useEffect, useMemo, useState } from "react";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useNavigate, useParams } from "react-router-dom";
import { fetchGroupById } from "../../service/groups.api";
import { fetchGroupMembers } from "../../service/membership.api";
import { applyJoinRequest, getStudentIdByUserId } from "../../service/joinRequests.api";
import { fetchAllPhases } from "../../service/phase.api";
import { fetchGroupEligibilitySummary } from "../../service/eligibility.api";
import { getMissingLeadershipRoles } from "../../shared/components/LeadershipGapChips";
import StudentGroupHero from "../components/groups/StudentGroupHero";
import MyGroupEligibilitySection from "../components/myGroup/MyGroupEligibilitySection";
import MyGroupMembersSection from "../components/myGroup/MyGroupMembersSection";
import MyGroupBadge from "../components/myGroup/MyGroupBadge";

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
  const [eligibility, setEligibility] = useState([]);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityErr, setEligibilityErr] = useState("");
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const missingLeadershipRoles = useMemo(
    () => getMissingLeadershipRoles(members),
    [members]
  );

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
    setEligibility([]);
    setEligibilityErr("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    let mounted = true;

    const loadCurrentStudentId = async () => {
      const studentId = await getStudentIdByUserId();
      if (!mounted) return;
      setCurrentStudentId(studentId ? String(studentId) : null);
    };

    loadCurrentStudentId();

    return () => {
      mounted = false;
    };
  }, []);

  const loadEligibility = async () => {
    setEligibilityLoading(true);
    setEligibilityErr("");
    try {
      const phases = await fetchAllPhases();
      const completedPhases = Array.isArray(phases)
        ? phases
            .filter((phase) => String(phase?.status || "").toUpperCase() === "COMPLETED")
            .slice(0, 5)
        : [];

      if (completedPhases.length === 0) {
        setEligibility([]);
        return;
      }

      const rows = await Promise.all(
        completedPhases.map(async (phase) => {
          const baseRow = {
            phase_id: phase?.phase_id || null,
            phase_name: phase?.phase_name || null,
            start_date: phase?.start_date || null,
            end_date: phase?.end_date || null,
            tier: group?.tier || null,
            earned_points: 0,
            target_points: null,
            is_eligible: null,
            eligibility_error: ""
          };

          try {
            const summary = await fetchGroupEligibilitySummary(phase.phase_id, id);
            return {
              ...baseRow,
              ...summary
            };
          } catch (err) {
            return {
              ...baseRow,
              eligibility_error:
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Eligibility unavailable for this phase."
            };
          }
        })
      );

      setEligibility(rows);
    } catch (e) {
      setEligibilityErr(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to load eligibility"
      );
      setEligibility([]);
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

  const memberCount = members.length;
  const heroActions = (
    <>
      <button
        type="button"
        onClick={() => nav("/groups")}
        className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
      >
        Back
      </button>
      <button
        type="button"
        onClick={load}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
      >
        <RefreshRoundedIcon sx={{ fontSize: 18 }} />
        Refresh
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onJoin}
        title="Student only (backend enforces)"
        className="inline-flex items-center rounded-lg border border-[#1754cf] bg-[#1754cf] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1449b2] disabled:cursor-wait disabled:opacity-70"
      >
        {busy ? "Working..." : "Join Group"}
      </button>
    </>
  );

  const heroBadges = (
    <>
      <span className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-[#1754cf]">
        {group.group_code || "No code"}
      </span>
      <MyGroupBadge value={`Tier ${group.tier || "-"}`} />
      <MyGroupBadge value={group.status || "Unknown"} />
      <span className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
        ID {group.group_id || "-"}
      </span>
      <span className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
        {memberCount} Member{memberCount === 1 ? "" : "s"}
      </span>
    </>
  );

  return (
    <div className="max-w-screen-2xl space-y-4 p-4 md:p-6">
      <StudentGroupHero
        actions={heroActions}
        badges={heroBadges}
        eyebrow="Group Details"
        missingLeadershipRoles={missingLeadershipRoles}
        title={group.group_name || "Group Details"}
      />

      {actionErr ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {actionErr}
        </div>
      ) : null}

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
              <MyGroupMembersSection
                currentStudentId={currentStudentId}
                members={members}
              />
            </div>
          ) : (
            <MyGroupEligibilitySection
              description="Last 5 completed phase eligibility with target progress and final status."
              eligibility={eligibility}
              eligibilityErr={eligibilityErr}
              eligibilityLoading={eligibilityLoading}
              emptyMessage="No completed phases are available yet."
              onRefresh={loadEligibility}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;
