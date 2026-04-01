import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRealtimeEvents } from "../../hooks/useRealtimeEvents";
import { REALTIME_EVENTS } from "../../lib/realtime";
import MembershipManagementDesktopTable from "../components/membershipManagement/MembershipManagementDesktopTable";
import MembershipManagementFilters from "../components/membershipManagement/MembershipManagementFilters";
import MembershipManagementHero from "../components/membershipManagement/MembershipManagementHero";
import MembershipManagementMobileCards from "../components/membershipManagement/MembershipManagementMobileCards";
import MembershipRemovalModal from "../components/membershipManagement/MembershipRemovalModal";
import AdminPaginationBar from "../components/ui/AdminPaginationBar";
import { DEFAULT_PAGE_SIZE } from "../../shared/constants/pagination";
import {
  ROLE_STYLES,
  buildMembershipStatCards,
  filterMembershipRows
} from "../components/membershipManagement/membershipManagement.constants";
import { deleteMembership, fetchAllMemberships } from "../../service/membership.api";

const DEFAULT_YEAR_OPTIONS = ["1", "2", "3", "4"];
const DEFAULT_LIMIT = DEFAULT_PAGE_SIZE;

export default function MembershipManagement() {
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [actionBusyId, setActionBusyId] = useState(null);
  const [removeDialog, setRemoveDialog] = useState({
    row: null,
    reason: "",
    error: ""
  });

  const loadMemberships = async ({ nextPage = page, nextLimit = limit, showLoader = true } = {}) => {
    if (showLoader) setLoading(true);
    setError("");

    try {
      const data = await fetchAllMemberships({
        page: nextPage,
        limit: nextLimit,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        role: roleFilter !== "ALL" ? roleFilter : undefined
      });
      const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      const resolvedTotal = Array.isArray(data) ? items.length : Number(data?.total) || items.length;
      const resolvedLimit = Array.isArray(data) ? nextLimit : Number(data?.limit) || nextLimit;
      const resolvedPageCount = Array.isArray(data)
        ? 1
        : Math.max(1, Number(data?.total_pages) || Math.ceil(resolvedTotal / resolvedLimit) || 1);
      const resolvedPage = Array.isArray(data)
        ? nextPage
        : Math.min(Math.max(1, Number(data?.page) || nextPage), resolvedPageCount);

      if (items.length === 0 && resolvedTotal > 0 && nextPage > resolvedPageCount) {
        setPage(resolvedPageCount);
        return;
      }

      setRows(items);
      setTotalCount(resolvedTotal);
      setPageCount(resolvedPageCount);
      if (resolvedPage !== page) setPage(resolvedPage);
      if (resolvedLimit !== limit) setLimit(resolvedLimit);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load memberships");
      setRows([]);
      setTotalCount(0);
      setPageCount(1);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    void loadMemberships();
  }, [page, limit, roleFilter, statusFilter]);

  useRealtimeEvents(REALTIME_EVENTS.MEMBERSHIPS, () => {
    void loadMemberships({ showLoader: false });
  });

  const roleOptions = useMemo(
    () => Object.keys(ROLE_STYLES),
    []
  );

  const yearOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [...DEFAULT_YEAR_OPTIONS, ...rows
            .map((row) => String(row?.year ?? "").trim())
            .filter(Boolean)]
        )
      ).sort((a, b) => Number(a) - Number(b)),
    [rows]
  );

  useEffect(() => {
    if (yearFilter === "ALL") return;
    if (yearOptions.includes(yearFilter)) return;
    setYearFilter("ALL");
  }, [yearFilter, yearOptions]);

  const filteredRows = useMemo(
    () => filterMembershipRows(rows, { query, roleFilter, statusFilter, yearFilter }),
    [rows, query, roleFilter, statusFilter, yearFilter]
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
      await loadMemberships({ showLoader: false });
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

  const handleRoleFilterChange = (value) => {
    setRoleFilter(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleLimitChange = (value) => {
    setLimit(value);
    setPage(1);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 font-[Inter] md:px-6">
        <MembershipManagementHero
          filteredCount={filteredRows.length}
          loading={loading}
          onRefresh={() => loadMemberships()}
          statCards={statCards}
          totalCount={totalCount}
        />

        <MembershipManagementFilters
          query={query}
          roleFilter={roleFilter}
          roleOptions={roleOptions}
          setQuery={setQuery}
          setRoleFilter={handleRoleFilterChange}
          setStatusFilter={handleStatusFilterChange}
          setYearFilter={setYearFilter}
          statusFilter={statusFilter}
          yearFilter={yearFilter}
          yearOptions={yearOptions}
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
