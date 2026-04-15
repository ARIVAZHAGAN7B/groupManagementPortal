import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import TeamManagementDesktopTable from "../components/teamManagement/TeamManagementDesktopTable";
import TeamManagementFilters from "../components/teamManagement/TeamManagementFilters";
import TeamManagementFormCard from "../components/teamManagement/TeamManagementFormCard";
import TeamManagementHero from "../components/teamManagement/TeamManagementHero";
import TeamManagementMembersModal from "../components/teamManagement/TeamManagementMembersModal";
import TeamManagementMobileCards from "../components/teamManagement/TeamManagementMobileCards";
import AdminFormModal from "../components/ui/AdminFormModal";
import AdminPaginationBar from "../components/ui/AdminPaginationBar";
import useClientPagination from "../../hooks/useClientPagination";
import {
  buildStatCards,
  filterTeamRows
} from "../components/teamManagement/teamManagement.constants";
import {
  activateHub,
  archiveHub,
  createHub,
  deleteHub,
  fetchHubMemberships,
  fetchHubs,
  freezeHub,
  updateHub
} from "../../service/hubs.api";
import { HUB_MANAGEMENT_SCOPE_CONFIG } from "../components/hubManagement/hubManagement.constants";

const buildInitialForm = () => ({
  team_code: "",
  team_name: "",
  team_type: "HUB",
  hub_priority: "",
  status: "ACTIVE",
  description: ""
});

export default function HubManagement() {
  const scopeConfig = HUB_MANAGEMENT_SCOPE_CONFIG;
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [saving, setSaving] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewTeam, setViewTeam] = useState<any | null>(null);
  const [viewMembers, setViewMembers] = useState<any[]>([]);
  const [viewMembersLoading, setViewMembersLoading] = useState(false);
  const [viewMembersError, setViewMembersError] = useState("");
  const [viewBusyTeamId, setViewBusyTeamId] = useState<number | null>(null);
  const [form, setForm] = useState(buildInitialForm());

  const resetForm = () => {
    setForm(buildInitialForm());
    setEditingId(null);
  };

  const loadRows = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchHubs();
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load hubs");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const editingRow = useMemo(
    () => rows.find((row) => Number(row.team_id) === editingId) || null,
    [rows, editingId]
  );
  const filteredRows = useMemo(
    () => filterTeamRows(rows, { query, statusFilter }),
    [rows, query, statusFilter]
  );
  const {
    limit,
    page,
    pageCount,
    pagedItems: pagedRows,
    setLimit,
    setPage
  } = useClientPagination(filteredRows);

  useEffect(() => {
    setPage(1);
  }, [query, setPage, statusFilter]);

  const statCards = useMemo(() => buildStatCards(rows, "HUB"), [rows]);

  const onChangeField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const closeFormModal = ({ preserveMessage = true } = {}) => {
    if (saving) return;
    resetForm();
    setFormModalOpen(false);
    if (!preserveMessage) {
      setSuccessMessage("");
      setError("");
    }
  };

  const handleStartCreate = () => {
    resetForm();
    setError("");
    setSuccessMessage("");
    setFormModalOpen(true);
  };

  const handleEdit = (row: any) => {
    setEditingId(Number(row.team_id));
    setForm({
      team_code: row.team_code || "",
      team_name: row.team_name || "",
      team_type: "HUB",
      hub_priority: row.hub_priority || "",
      status: row.status || "ACTIVE",
      description: row.description || ""
    });
    setError("");
    setSuccessMessage("");
    setFormModalOpen(true);
  };

  const handleReset = () => {
    if (editingRow) {
      handleEdit(editingRow);
      return;
    }
    resetForm();
  };

  const closeViewMembers = () => {
    setViewTeam(null);
    setViewMembers([]);
    setViewMembersLoading(false);
    setViewMembersError("");
    setViewBusyTeamId(null);
  };

  const handleViewMembers = async (row: any) => {
    if (!row?.team_id) return;
    setViewTeam(row);
    setViewMembers([]);
    setViewMembersError("");
    setViewMembersLoading(true);
    setViewBusyTeamId(Number(row.team_id));
    try {
      const memberships = await fetchHubMemberships(row.team_id, { status: "ACTIVE" });
      setViewMembers(Array.isArray(memberships) ? memberships : []);
    } catch (err: any) {
      setViewMembersError(err?.response?.data?.message || "Failed to load hub members");
      setViewMembers([]);
    } finally {
      setViewMembersLoading(false);
      setViewBusyTeamId(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");
    try {
      const payload = {
        team_code: String(form.team_code || "").trim().toUpperCase(),
        team_name: String(form.team_name || "").trim(),
        team_type: "HUB",
        hub_priority: String(form.hub_priority || "").trim().toUpperCase(),
        status: form.status,
        description: String(form.description || "").trim()
      };
      if (!payload.team_code || !payload.team_name) {
        throw new Error("Hub code and name are required");
      }
      if (!payload.hub_priority) {
        throw new Error("Hub priority is required");
      }
      if (editingId) {
        await updateHub(editingId, payload);
      } else {
        await createHub(payload);
      }
      setSuccessMessage(editingId ? "Hub updated successfully." : "Hub created successfully.");
      resetForm();
      setFormModalOpen(false);
      await loadRows();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to save hub");
    } finally {
      setSaving(false);
    }
  };

  const runRowAction = async (
    row: any,
    action: (id: number) => Promise<any>,
    successText: string,
    confirmMessage?: string
  ) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    const teamId = Number(row.team_id);
    setActionBusyId(teamId);
    setError("");
    setSuccessMessage("");
    try {
      await action(teamId);
      await loadRows();
      setSuccessMessage(successText);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Action failed");
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 md:px-6">
      <TeamManagementHero
        filteredCount={filteredRows.length}
        loading={loading}
        onCreate={handleStartCreate}
        onRefresh={loadRows}
        scopeConfig={scopeConfig}
        statCards={statCards}
        totalCount={rows.length}
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}
      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <TeamManagementFilters
        filteredCount={filteredRows.length}
        query={query}
        scopeConfig={scopeConfig}
        setQuery={setQuery}
        setStatusFilter={setStatusFilter}
        statusFilter={statusFilter}
        totalCount={rows.length}
      />

      <AdminFormModal
        busy={saving}
        onClose={() => closeFormModal({ preserveMessage: true })}
        open={formModalOpen}
      >
        <TeamManagementFormCard
          editingRow={editingRow}
          form={form}
          onCancelEdit={() => closeFormModal({ preserveMessage: true })}
          onChangeField={onChangeField}
          onReset={handleReset}
          onSubmit={handleSubmit}
          saving={saving}
          scopeConfig={scopeConfig}
        />
      </AdminFormModal>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
          Loading hubs...
        </div>
      ) : (
        <>
          <TeamManagementMobileCards
            actionBusyId={actionBusyId}
            onActivate={(row) => runRowAction(row, activateHub, `Hub ${row.team_code} is now ACTIVE.`)}
            onArchive={(row) =>
              runRowAction(row, archiveHub, `Hub ${row.team_code} has been moved to ARCHIVED.`, `Archive hub ${row.team_code}?`)
            }
            onDeactivate={(row) =>
              runRowAction(row, deleteHub, `Hub ${row.team_code} is now INACTIVE.`, `Mark hub ${row.team_code} as INACTIVE?`)
            }
            onEdit={handleEdit}
            onFreeze={(row) => runRowAction(row, freezeHub, `Hub ${row.team_code} has been frozen.`)}
            onViewMembers={handleViewMembers}
            rows={pagedRows}
            scopeConfig={scopeConfig}
            viewBusyTeamId={viewBusyTeamId}
          />

          <div className="hidden lg:block">
            <TeamManagementDesktopTable
              actionBusyId={actionBusyId}
              onActivate={(row) => runRowAction(row, activateHub, `Hub ${row.team_code} is now ACTIVE.`)}
              onArchive={(row) =>
                runRowAction(row, archiveHub, `Hub ${row.team_code} has been moved to ARCHIVED.`, `Archive hub ${row.team_code}?`)
              }
              onDeactivate={(row) =>
                runRowAction(row, deleteHub, `Hub ${row.team_code} is now INACTIVE.`, `Mark hub ${row.team_code} as INACTIVE?`)
              }
              onEdit={handleEdit}
              onFreeze={(row) => runRowAction(row, freezeHub, `Hub ${row.team_code} has been frozen.`)}
              onViewMembers={handleViewMembers}
              rows={pagedRows}
              scopeConfig={scopeConfig}
              viewBusyTeamId={viewBusyTeamId}
            />
          </div>
        </>
      )}

      <AdminPaginationBar
        itemLabel="hubs"
        limit={limit}
        loading={loading}
        onLimitChange={setLimit}
        onPageChange={setPage}
        page={page}
        pageCount={pageCount}
        shownCount={pagedRows.length}
        totalCount={filteredRows.length}
      />

      <TeamManagementMembersModal
        error={viewMembersError}
        loading={viewMembersLoading}
        onClose={closeViewMembers}
        rows={viewMembers}
        scopeConfig={scopeConfig}
        team={viewTeam}
      />
    </div>
  );
}
