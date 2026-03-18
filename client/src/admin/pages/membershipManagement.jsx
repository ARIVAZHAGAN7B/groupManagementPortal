import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MembershipManagementDesktopTable from "../components/membershipManagement/MembershipManagementDesktopTable";
import MembershipManagementFilters from "../components/membershipManagement/MembershipManagementFilters";
import MembershipManagementHero from "../components/membershipManagement/MembershipManagementHero";
import MembershipManagementMobileCards from "../components/membershipManagement/MembershipManagementMobileCards";
import MembershipRemovalModal from "../components/membershipManagement/MembershipRemovalModal";
import {
  buildMembershipStatCards,
  filterMembershipRows,
  normalizeBadgeKey
} from "../components/membershipManagement/membershipManagement.constants";
import { deleteMembership, fetchAllMemberships } from "../../service/membership.api";

export default function MembershipManagement() {
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionBusyId, setActionBusyId] = useState(null);
  const [removeDialog, setRemoveDialog] = useState({
    row: null,
    reason: "",
    error: ""
  });

  const loadMemberships = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchAllMemberships();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load memberships");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemberships();
  }, []);

  const roleOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => normalizeBadgeKey(row?.role))
            .filter(Boolean)
        )
      ).sort(),
    [rows]
  );

  const filteredRows = useMemo(
    () => filterMembershipRows(rows, { query, roleFilter, statusFilter }),
    [rows, query, roleFilter, statusFilter]
  );

  const statCards = useMemo(() => buildMembershipStatCards(rows), [rows]);

  const onManage = (row) => {
    if (!row?.group_id) {
      setError("This membership is not linked to an active group.");
      return;
    }

    const params = new URLSearchParams();
    if (row.student_id != null) params.set("highlightStudentId", String(row.student_id));
    if (row.membership_id != null) params.set("highlightMembershipId", String(row.membership_id));
    nav(`/groups/${row.group_id}?${params.toString()}`);
  };

  const openRemoveDialog = (row) => {
    setRemoveDialog({
      row,
      reason: "",
      error: ""
    });
  };

  const closeRemoveDialog = () => {
    if (actionBusyId !== null) return;
    setRemoveDialog({
      row: null,
      reason: "",
      error: ""
    });
  };

  const confirmRemove = async () => {
    const row = removeDialog.row;
    if (!row?.membership_id) return;

    const reason = String(removeDialog.reason || "").trim();
    if (!reason) {
      setRemoveDialog((prev) => ({
        ...prev,
        error: "Removal reason is required."
      }));
      return;
    }

    setActionBusyId(row.membership_id);
    setError("");

    try {
      await deleteMembership(row.membership_id, reason);
      closeRemoveDialog();
      await loadMemberships();
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to remove membership";
      setRemoveDialog((prev) => ({
        ...prev,
        error: message
      }));
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <>
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 font-[Inter] md:px-6">
        <MembershipManagementHero
          filteredCount={filteredRows.length}
          loading={loading}
          onRefresh={loadMemberships}
          statCards={statCards}
          totalCount={rows.length}
        />

        <MembershipManagementFilters
          filteredCount={filteredRows.length}
          query={query}
          roleFilter={roleFilter}
          roleOptions={roleOptions}
          setQuery={setQuery}
          setRoleFilter={setRoleFilter}
          setStatusFilter={setStatusFilter}
          statusFilter={statusFilter}
          totalCount={rows.length}
        />

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
            Loading memberships...
          </div>
        ) : (
          <>
            <MembershipManagementMobileCards
              actionBusyId={actionBusyId}
              onManage={onManage}
              onRemove={openRemoveDialog}
              rows={filteredRows}
            />
            <div className="hidden lg:block">
              <MembershipManagementDesktopTable
                actionBusyId={actionBusyId}
                onManage={onManage}
                onRemove={openRemoveDialog}
                rows={filteredRows}
                totalCount={rows.length}
              />
            </div>
          </>
        )}
      </div>

      <MembershipRemovalModal
        busy={actionBusyId !== null}
        error={removeDialog.error}
        onCancel={closeRemoveDialog}
        onConfirm={confirmRemove}
        onReasonChange={(value) =>
          setRemoveDialog((prev) => ({
            ...prev,
            reason: value,
            error: ""
          }))
        }
        open={Boolean(removeDialog.row)}
        reason={removeDialog.reason}
        row={removeDialog.row}
      />
    </>
  );
}
