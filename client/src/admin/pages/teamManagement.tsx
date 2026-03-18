import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import TeamManagementDesktopTable from "../components/teamManagement/TeamManagementDesktopTable";
import TeamManagementFilters from "../components/teamManagement/TeamManagementFilters";
import TeamManagementFormCard from "../components/teamManagement/TeamManagementFormCard";
import TeamManagementHero from "../components/teamManagement/TeamManagementHero";
import TeamManagementMobileCards from "../components/teamManagement/TeamManagementMobileCards";
import {
  buildStatCards,
  filterTeamRows,
  getScopeConfig
} from "../components/teamManagement/teamManagement.constants";
import {
  activateEventGroup,
  activateTeam,
  archiveEventGroup,
  archiveTeam,
  createTeam,
  deleteEventGroup,
  deleteTeam,
  fetchEventGroups,
  fetchTeams,
  freezeEventGroup,
  freezeTeam,
  updateEventGroup,
  updateTeam
} from "../../service/teams.api";

type ManagementScope = "TEAM" | "EVENT_GROUP";

type TeamManagementProps = {
  scope?: ManagementScope;
};

const buildInitialForm = (scope: ManagementScope) => ({
  team_code: "",
  team_name: "",
  team_type: scope === "EVENT_GROUP" ? "EVENT" : "TEAM",
  status: "ACTIVE",
  description: ""
});

export default function TeamManagement({ scope = "TEAM" }: TeamManagementProps) {
  const scopeConfig = getScopeConfig(scope);
  const isEventGroupScope = scopeConfig.scope === "EVENT_GROUP";
  const formSectionRef = useRef<HTMLDivElement | null>(null);

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [saving, setSaving] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(buildInitialForm(scope));

  const resetForm = () => {
    setForm(buildInitialForm(scope));
    setEditingId(null);
  };

  useEffect(() => {
    resetForm();
    setTypeFilter("ALL");
  }, [scope]);

  const loadRows = async () => {
    setLoading(true);
    setError("");

    try {
      const data = isEventGroupScope
        ? await fetchEventGroups()
        : await fetchTeams({ exclude_team_type: "EVENT" });
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          `Failed to load ${scopeConfig.scopeLabelPlural.toLowerCase()}`
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, [isEventGroupScope]);

  const editingRow = useMemo(
    () => rows.find((row) => Number(row.team_id) === editingId) || null,
    [rows, editingId]
  );

  const filteredRows = useMemo(
    () => filterTeamRows(rows, { query, statusFilter, typeFilter }),
    [rows, query, statusFilter, typeFilter]
  );

  const statCards = useMemo(() => buildStatCards(rows, scope), [rows, scope]);

  const onChangeField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const scrollToForm = () => {
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleStartCreate = () => {
    resetForm();
    setError("");
    setSuccessMessage("");
    scrollToForm();
  };

  const handleEdit = (row: any) => {
    setEditingId(Number(row.team_id));
    setForm({
      team_code: row.team_code || "",
      team_name: row.team_name || "",
      team_type: isEventGroupScope ? "EVENT" : row.team_type || "TEAM",
      status: row.status || "ACTIVE",
      description: row.description || ""
    });
    setError("");
    setSuccessMessage("");
    scrollToForm();
  };

  const handleReset = () => {
    if (editingRow) {
      handleEdit(editingRow);
      return;
    }

    resetForm();
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
        team_type: isEventGroupScope ? "EVENT" : form.team_type,
        status: form.status,
        description: String(form.description || "").trim()
      };

      if (!payload.team_code || !payload.team_name) {
        throw new Error(`${scopeConfig.scopeLabel} code and name are required`);
      }

      if (isEventGroupScope && !editingId) {
        throw new Error("Event groups are created from the student side");
      }

      if (editingId) {
        if (isEventGroupScope) {
          await updateEventGroup(editingId, payload);
        } else {
          await updateTeam(editingId, payload);
        }
      } else {
        await createTeam(payload);
      }

      setSuccessMessage(
        editingId
          ? `${scopeConfig.scopeLabel} updated successfully.`
          : `${payload.team_type === "HUB" ? "Hub" : scopeConfig.scopeLabel} created successfully.`
      );
      resetForm();
      await loadRows();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          `Failed to save ${scopeConfig.scopeLabel.toLowerCase()}`
      );
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

  const activateHandler = isEventGroupScope ? activateEventGroup : activateTeam;
  const freezeHandler = isEventGroupScope ? freezeEventGroup : freezeTeam;
  const archiveHandler = isEventGroupScope ? archiveEventGroup : archiveTeam;
  const deactivateHandler = isEventGroupScope ? deleteEventGroup : deleteTeam;

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
        setTypeFilter={setTypeFilter}
        statusFilter={statusFilter}
        totalCount={rows.length}
        typeFilter={typeFilter}
      />

      <div ref={formSectionRef}>
        <TeamManagementFormCard
          editingRow={editingRow}
          form={form}
          onCancelEdit={resetForm}
          onChangeField={onChangeField}
          onReset={handleReset}
          onSubmit={handleSubmit}
          saving={saving}
          scopeConfig={scopeConfig}
        />
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
          Loading {scopeConfig.scopeLabelPlural.toLowerCase()}...
        </div>
      ) : (
        <>
          <TeamManagementMobileCards
            actionBusyId={actionBusyId}
            onActivate={(row) =>
              runRowAction(
                row,
                activateHandler,
                `${scopeConfig.scopeLabel} ${row.team_code} is now ACTIVE.`
              )
            }
            onArchive={(row) =>
              runRowAction(
                row,
                archiveHandler,
                `${scopeConfig.scopeLabel} ${row.team_code} has been archived.`,
                `Archive ${scopeConfig.scopeLabel.toLowerCase()} ${row.team_code}?`
              )
            }
            onDeactivate={(row) =>
              runRowAction(
                row,
                deactivateHandler,
                `${scopeConfig.scopeLabel} ${row.team_code} is now INACTIVE.`,
                `Set ${scopeConfig.scopeLabel.toLowerCase()} ${row.team_code} to INACTIVE?`
              )
            }
            onEdit={handleEdit}
            onFreeze={(row) =>
              runRowAction(
                row,
                freezeHandler,
                `${scopeConfig.scopeLabel} ${row.team_code} has been frozen.`
              )
            }
            rows={filteredRows}
            scopeConfig={scopeConfig}
          />

          <div className="hidden lg:block">
            <TeamManagementDesktopTable
              actionBusyId={actionBusyId}
              onActivate={(row) =>
                runRowAction(
                  row,
                  activateHandler,
                  `${scopeConfig.scopeLabel} ${row.team_code} is now ACTIVE.`
                )
              }
              onArchive={(row) =>
                runRowAction(
                  row,
                  archiveHandler,
                  `${scopeConfig.scopeLabel} ${row.team_code} has been archived.`,
                  `Archive ${scopeConfig.scopeLabel.toLowerCase()} ${row.team_code}?`
                )
              }
              onDeactivate={(row) =>
                runRowAction(
                  row,
                  deactivateHandler,
                  `${scopeConfig.scopeLabel} ${row.team_code} is now INACTIVE.`,
                  `Set ${scopeConfig.scopeLabel.toLowerCase()} ${row.team_code} to INACTIVE?`
                )
              }
              onEdit={handleEdit}
              onFreeze={(row) =>
                runRowAction(
                  row,
                  freezeHandler,
                  `${scopeConfig.scopeLabel} ${row.team_code} has been frozen.`
                )
              }
              rows={filteredRows}
              scopeConfig={scopeConfig}
              totalCount={rows.length}
            />
          </div>
        </>
      )}
    </div>
  );
}
