import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  decideLeadershipRoleRequest,
  fetchAdminLeadershipNotifications,
  getAllPendingLeadershipRequests
} from "../../service/leadershipRequests.api";
import GroupManagementActionModal from "../components/groups/GroupManagementActionModal";
import LeadershipAttentionPanel from "../components/leadership/LeadershipAttentionPanel";
import LeadershipManagementDesktopTable from "../components/leadership/LeadershipManagementDesktopTable";
import LeadershipManagementFilters from "../components/leadership/LeadershipManagementFilters";
import LeadershipManagementHero from "../components/leadership/LeadershipManagementHero";
import LeadershipManagementMobileCards from "../components/leadership/LeadershipManagementMobileCards";
import { getRequestSearchText } from "../components/leadership/leadership.constants";

export default function LeadershipRequestManagement() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [notifications, setNotifications] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [requestedRoleFilter, setRequestedRoleFilter] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [decisionBusyId, setDecisionBusyId] = useState(null);
  const [modalState, setModalState] = useState({
    open: false,
    mode: "alert",
    tone: "error",
    title: "",
    message: "",
    confirmLabel: "OK",
    cancelLabel: "Cancel",
    onConfirm: null
  });

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [pendingRows, notificationSummary] = await Promise.all([
        getAllPendingLeadershipRequests(),
        fetchAdminLeadershipNotifications().catch(() => null)
      ]);

      setRows(Array.isArray(pendingRows) ? pendingRows : []);
      setNotifications(notificationSummary || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load leadership requests");
      setRows([]);
      setNotifications(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const distinctGroups = useMemo(() => {
    const map = new Map();

    for (const row of rows) {
      const key = String(row?.group_id || "");
      if (!key || map.has(key)) continue;

      map.set(key, {
        group_id: row.group_id,
        group_name: row.group_name,
        group_code: row.group_code
      });
    }

    return Array.from(map.values());
  }, [rows]);

  const requestedRoleOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (Array.isArray(rows) ? rows : [])
            .map((row) => String(row?.requested_role || "").toUpperCase())
            .filter(Boolean)
        )
      ).sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const search = String(q || "").trim().toLowerCase();

    return (Array.isArray(rows) ? rows : []).filter((row) => {
      const rowGroupId = String(row?.group_id || "");
      const requestedRole = String(row?.requested_role || "").toUpperCase();

      if (groupFilter && rowGroupId !== String(groupFilter)) return false;
      if (requestedRoleFilter && requestedRole !== String(requestedRoleFilter)) return false;
      if (!search) return true;

      return getRequestSearchText(row).includes(search);
    });
  }, [groupFilter, q, requestedRoleFilter, rows]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      uniqueGroups: distinctGroups.length,
      withoutLeadership:
        Number(
          notifications?.groups_with_missing_leadership_count ??
            notifications?.groups_without_leadership_count
        ) || 0
    }),
    [distinctGroups.length, notifications, rows.length]
  );

  const closeModal = () => {
    if (actionBusy) return;

    setModalState((prev) => ({
      ...prev,
      open: false,
      onConfirm: null
    }));
  };

  const openAlertModal = ({ message, title, tone = "error" }) => {
    setModalState({
      open: true,
      mode: "alert",
      tone,
      title,
      message,
      confirmLabel: "OK",
      cancelLabel: "Cancel",
      onConfirm: null
    });
  };

  const runDecision = async (row, status) => {
    const requestId = row?.leadership_request_id;
    if (!requestId) return;

    setActionBusy(true);
    setDecisionBusyId(requestId);

    try {
      const reason =
        status === "APPROVED"
          ? "Approved leadership role request by admin"
          : "Rejected leadership role request by admin";

      await decideLeadershipRoleRequest(requestId, status, reason);
      await load();

      openAlertModal({
        title: "Action completed",
        message:
          status === "APPROVED"
            ? "Leadership request approved."
            : "Leadership request rejected.",
        tone: status === "APPROVED" ? "success" : "danger"
      });
    } catch (err) {
      openAlertModal({
        title: "Action failed",
        message: err?.response?.data?.message || "Failed to update leadership request",
        tone: "error"
      });
    } finally {
      setActionBusy(false);
      setDecisionBusyId(null);
    }
  };

  const requestDecision = (row, status) => {
    const isApprove = status === "APPROVED";
    const studentName = row?.student_name || "this student";
    const role = String(row?.requested_role || "role").replaceAll("_", " ");
    const groupName = row?.group_name || "this group";

    setModalState({
      open: true,
      mode: "confirm",
      tone: isApprove ? "success" : "danger",
      title: isApprove ? "Approve request?" : "Reject request?",
      message: isApprove
        ? `Assign ${role} to ${studentName} in ${groupName}.`
        : `Reject ${studentName}'s ${role} request for ${groupName}.`,
      confirmLabel: isApprove ? "Approve" : "Reject",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        await runDecision(row, status);
      }
    });
  };

  const handleModalConfirm = async () => {
    if (typeof modalState.onConfirm !== "function") {
      closeModal();
      return;
    }

    await modalState.onConfirm();
  };

  return (
    <>
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 font-[Inter] md:px-6">
        <LeadershipManagementHero
          filteredCount={filtered.length}
          loading={loading}
          onRefresh={load}
          stats={stats}
        />

        <LeadershipManagementFilters
          filteredCount={filtered.length}
          groupFilter={groupFilter}
          groups={distinctGroups}
          q={q}
          requestedRoleFilter={requestedRoleFilter}
          requestedRoleOptions={requestedRoleOptions}
          setGroupFilter={setGroupFilter}
          setQ={setQ}
          setRequestedRoleFilter={setRequestedRoleFilter}
          totalCount={stats.total}
        />

        <LeadershipAttentionPanel
          groups={
            notifications?.groups_with_missing_leadership ||
            notifications?.groups_without_leadership ||
            []
          }
          onOpenGroup={(groupId) => navigate(`/groups/${groupId}`)}
        />

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
            Loading leadership requests...
          </div>
        ) : (
          <>
            <LeadershipManagementMobileCards
              busyRequestId={decisionBusyId}
              onApprove={(row) => requestDecision(row, "APPROVED")}
              onOpenGroup={(groupId) => navigate(`/groups/${groupId}`)}
              onReject={(row) => requestDecision(row, "REJECTED")}
              rows={filtered}
            />

            <div className="hidden lg:block">
              <LeadershipManagementDesktopTable
                busyRequestId={decisionBusyId}
                onApprove={(row) => requestDecision(row, "APPROVED")}
                onOpenGroup={(groupId) => navigate(`/groups/${groupId}`)}
                onReject={(row) => requestDecision(row, "REJECTED")}
                rows={filtered}
                totalCount={stats.total}
              />
            </div>
          </>
        )}
      </div>

      <GroupManagementActionModal
        busy={actionBusy}
        cancelLabel={modalState.cancelLabel}
        confirmLabel={modalState.confirmLabel}
        message={modalState.message}
        mode={modalState.mode}
        onCancel={closeModal}
        onConfirm={handleModalConfirm}
        open={modalState.open}
        title={modalState.title}
        tone={modalState.tone}
      />
    </>
  );
}
