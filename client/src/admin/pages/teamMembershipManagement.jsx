import { useEffect, useMemo, useState } from "react";
import { useRealtimeEvents } from "../../hooks/useRealtimeEvents";
import { REALTIME_EVENTS } from "../../lib/realtime";
import GroupManagementActionModal from "../components/groups/GroupManagementActionModal";
import TeamMembershipManagementDesktopTable from "../components/teamMembershipManagement/TeamMembershipManagementDesktopTable";
import TeamMembershipManagementFilters from "../components/teamMembershipManagement/TeamMembershipManagementFilters";
import TeamMembershipManagementHero from "../components/teamMembershipManagement/TeamMembershipManagementHero";
import TeamMembershipManagementMobileCards from "../components/teamMembershipManagement/TeamMembershipManagementMobileCards";
import AdminPaginationBar from "../components/ui/AdminPaginationBar";
import { DEFAULT_PAGE_SIZE } from "../../shared/constants/pagination";
import {
  MEMBERSHIP_STATUS_ORDER,
  buildTeamMembershipStatCards,
  filterTeamMembershipRows,
  formatLabel,
  getTeamMembershipScopeConfig,
  normalizeTeamMembershipKey,
  sortByPreferredOrder
} from "../components/teamMembershipManagement/teamMembershipManagement.constants";
import {
  fetchAllTeamMemberships,
  leaveTeamMembership,
  updateTeamMembership
} from "../../service/teams.api";

const DEFAULT_LIMIT = DEFAULT_PAGE_SIZE;

export default function TeamMembershipManagement({ scope = "TEAM" }) {
  const scopeConfig = getTeamMembershipScopeConfig(scope);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [editedRoleByMembershipId, setEditedRoleByMembershipId] = useState({});
  const [busyMembershipId, setBusyMembershipId] = useState(null);
  const [busyAction, setBusyAction] = useState(null);
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

  const loadMemberships = async ({
    nextPage = page,
    nextLimit = limit,
    showLoader = true
  } = {}) => {
    if (showLoader) setLoading(true);
    setError("");

    try {
      const data = await fetchAllTeamMemberships({
        team_type: scopeConfig.teamType,
        page: nextPage,
        limit: nextLimit,
        status: statusFilter !== "ALL" ? statusFilter : undefined
      });
      const normalizedRows = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : [];
      const resolvedTotal = Array.isArray(data)
        ? normalizedRows.length
        : Number(data?.total) || normalizedRows.length;
      const resolvedLimit = Array.isArray(data) ? nextLimit : Number(data?.limit) || nextLimit;
      const resolvedPageCount = Array.isArray(data)
        ? 1
        : Math.max(1, Number(data?.total_pages) || Math.ceil(resolvedTotal / resolvedLimit) || 1);
      const resolvedPage = Array.isArray(data)
        ? nextPage
        : Math.min(Math.max(1, Number(data?.page) || nextPage), resolvedPageCount);

      if (normalizedRows.length === 0 && resolvedTotal > 0 && nextPage > resolvedPageCount) {
        setPage(resolvedPageCount);
        return;
      }

      setRows(normalizedRows);
      setTotalCount(resolvedTotal);
      setPageCount(resolvedPageCount);
      if (resolvedPage !== page) setPage(resolvedPage);
      if (resolvedLimit !== limit) setLimit(resolvedLimit);
      setEditedRoleByMembershipId(
        normalizedRows.reduce((acc, row) => {
          acc[row.team_membership_id] = normalizeTeamMembershipKey(row.role) || "MEMBER";
          return acc;
        }, {})
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          `Failed to load ${String(scopeConfig.scopeLabelPlural || "team memberships").toLowerCase()}`
      );
      setRows([]);
      setTotalCount(0);
      setPageCount(1);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    void loadMemberships();
  }, [scopeConfig.teamType, page, limit, statusFilter]);

  useRealtimeEvents(REALTIME_EVENTS.TEAM_MEMBERSHIPS, () => {
    void loadMemberships({ showLoader: false });
  });

  const filteredRows = useMemo(
    () => filterTeamMembershipRows(rows, { query, statusFilter }),
    [rows, query, statusFilter]
  );

  const statCards = useMemo(() => buildTeamMembershipStatCards(rows, scopeConfig), [rows, scopeConfig]);

  const statusOptions = useMemo(
    () => sortByPreferredOrder(MEMBERSHIP_STATUS_ORDER, MEMBERSHIP_STATUS_ORDER),
    []
  );

  const closeModal = () => {
    if (busyMembershipId !== null) return;

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

  const runMembershipAction = async ({
    membershipId,
    actionType,
    errorFallback,
    perform,
    successMessage,
    successTitle
  }) => {
    setBusyMembershipId(Number(membershipId));
    setBusyAction(actionType);
    setError("");

    try {
      await perform();
      await loadMemberships({ showLoader: false });
      openAlertModal({
        title: successTitle,
        message: successMessage,
        tone: "success"
      });
    } catch (err) {
      openAlertModal({
        title: "Action failed",
        message: err?.response?.data?.message || errorFallback,
        tone: "error"
      });
    } finally {
      setBusyMembershipId(null);
      setBusyAction(null);
    }
  };

  const onRoleChange = (membershipId, role) => {
    setEditedRoleByMembershipId((prev) => ({
      ...prev,
      [membershipId]: role
    }));
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleLimitChange = (value) => {
    setLimit(value);
    setPage(1);
  };

  const onSaveRole = async (row) => {
    const membershipId = row?.team_membership_id;
    if (!membershipId) return;

    const currentRole = normalizeTeamMembershipKey(row.role) || "MEMBER";
    const nextRole =
      normalizeTeamMembershipKey(editedRoleByMembershipId[membershipId]) || currentRole;

    if (nextRole === currentRole) return;

    await runMembershipAction({
      membershipId,
      actionType: "role",
      errorFallback: "Failed to update team membership role",
      perform: () => updateTeamMembership(membershipId, { role: nextRole }),
      successMessage: `${row.student_name || "Membership"} is now ${formatLabel(
        nextRole,
        "Member"
      )} in ${row.team_name || `the selected ${String(scopeConfig.scopeSearchLabel || "team")}`}.`,
      successTitle: "Role updated"
    });
  };

  const requestMarkLeft = (row) => {
    const membershipId = row?.team_membership_id;
    if (!membershipId) return;

    setModalState({
      open: true,
      mode: "confirm",
      tone: "danger",
      title: "Mark membership as left?",
      message: `${row.student_name || "This student"} will be moved to LEFT for ${
        row.team_name || `this ${String(scopeConfig.scopeSearchLabel || "team")}`
      }. This screen does not provide an undo action.`,
      confirmLabel: "Mark Left",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        await runMembershipAction({
          membershipId,
          actionType: "leave",
          errorFallback: "Failed to mark team membership as LEFT",
          perform: () => leaveTeamMembership(membershipId),
          successMessage: `${row.student_name || "The student"} has been marked LEFT in ${
            row.team_name || `the selected ${String(scopeConfig.scopeSearchLabel || "team")}`
          }.`,
          successTitle: "Membership updated"
        });
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
        <TeamMembershipManagementHero
          filteredCount={filteredRows.length}
          loading={loading}
          onRefresh={() => loadMemberships()}
          scopeConfig={scopeConfig}
          statCards={statCards}
          totalCount={totalCount}
        />

        <TeamMembershipManagementFilters
          filteredCount={filteredRows.length}
          query={query}
          scopeConfig={scopeConfig}
          setQuery={setQuery}
          setStatusFilter={handleStatusFilterChange}
          statusFilter={statusFilter}
          statusOptions={statusOptions}
          totalCount={totalCount}
        />

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
            {`Loading ${String(scopeConfig.scopeLabelPlural || "team memberships").toLowerCase()}...`}
          </div>
        ) : (
          <>
            <TeamMembershipManagementMobileCards
              busyAction={busyAction}
              busyMembershipId={busyMembershipId}
              editedRoleByMembershipId={editedRoleByMembershipId}
              onMarkLeft={requestMarkLeft}
              onRoleChange={onRoleChange}
              onSaveRole={onSaveRole}
              scopeConfig={scopeConfig}
              rows={filteredRows}
            />

            <div className="hidden lg:block">
              <TeamMembershipManagementDesktopTable
                busyAction={busyAction}
                busyMembershipId={busyMembershipId}
                editedRoleByMembershipId={editedRoleByMembershipId}
                onMarkLeft={requestMarkLeft}
                onRoleChange={onRoleChange}
                onSaveRole={onSaveRole}
                rows={filteredRows}
                scopeConfig={scopeConfig}
              />
            </div>
          </>
        )}

        <AdminPaginationBar
          itemLabel="memberships"
          limit={limit}
          loading={loading}
          onLimitChange={handleLimitChange}
          onPageChange={setPage}
          page={page}
          pageCount={pageCount}
          shownCount={filteredRows.length}
          totalCount={totalCount}
        />
      </div>

      <GroupManagementActionModal
        busy={busyMembershipId !== null}
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
