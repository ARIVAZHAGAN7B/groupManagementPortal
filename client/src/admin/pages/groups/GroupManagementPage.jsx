import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  activateGroup,
  deleteGroup,
  fetchGroups,
  freezeGroup
} from "../../../service/groups.api";
import GroupManagementActionModal from "../../components/groups/GroupManagementActionModal";
import GroupManagementDesktopTable from "../../components/groups/GroupManagementDesktopTable";
import GroupManagementFilters from "../../components/groups/GroupManagementFilters";
import GroupManagementHero from "../../components/groups/GroupManagementHero";
import GroupManagementMobileCards from "../../components/groups/GroupManagementMobileCards";
import { GROUP_TIER_OPTIONS } from "../../components/groups/groupManagement.constants";

export default function GroupManagementPage() {
  const nav = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionBusy, setActionBusy] = useState(false);
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
    setErr("");

    try {
      const data = await fetchGroups();
      setGroups(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load groups");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const tierOptions = GROUP_TIER_OPTIONS;

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (Array.isArray(groups) ? groups : [])
            .map((group) => String(group?.status || "").toUpperCase())
            .filter(Boolean)
        )
      ).sort(),
    [groups]
  );

  const filtered = useMemo(() => {
    const search = String(q || "").trim().toLowerCase();

    return (Array.isArray(groups) ? groups : []).filter((group) => {
      const tier = String(group?.tier || "").toUpperCase();
      const status = String(group?.status || "").toUpperCase();

      if (tierFilter !== "ALL" && tier !== tierFilter) return false;
      if (statusFilter !== "ALL" && status !== statusFilter) return false;

      if (!search) return true;

      return [group.group_code, group.group_name, group.tier, group.status]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(search));
    });
  }, [groups, q, tierFilter, statusFilter]);

  const stats = useMemo(() => {
    const all = Array.isArray(groups) ? groups : [];

    return {
      total: all.length,
      active: all.filter((group) => String(group?.status || "").toUpperCase() === "ACTIVE")
        .length,
      frozen: all.filter((group) => String(group?.status || "").toUpperCase() === "FROZEN")
        .length,
      inactive: all.filter((group) => String(group?.status || "").toUpperCase() === "INACTIVE")
        .length
    };
  }, [groups]);

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

  const runAction = async (fn, id, successMessage = "") => {
    setActionBusy(true);
    try {
      await fn(id);
      await load();
      if (successMessage) {
        openAlertModal({
          title: "Action completed",
          message: successMessage,
          tone: "success"
        });
      }
    } catch (e) {
      openAlertModal({
        title: "Action failed",
        message: e?.response?.data?.error || "Action failed",
        tone: "error"
      });
    } finally {
      setActionBusy(false);
    }
  };

  const requestDelete = (groupId) => {
    setModalState({
      open: true,
      mode: "confirm",
      tone: "danger",
      title: "Set group inactive?",
      message: "This will soft-delete the group by changing its status to INACTIVE.",
      confirmLabel: "Set Inactive",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        await runAction(deleteGroup, groupId, "The group has been set to INACTIVE.");
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
      <GroupManagementHero
        filteredCount={filtered.length}
        loading={loading}
        onCreate={() => nav("/groups/new")}
        onRefresh={load}
        stats={stats}
      />

      <GroupManagementFilters
        filteredCount={filtered.length}
        q={q}
        setQ={setQ}
        statsTotal={stats.total}
        statusFilter={statusFilter}
        statusOptions={statusOptions}
        setStatusFilter={setStatusFilter}
        tierFilter={tierFilter}
        tierOptions={tierOptions}
        setTierFilter={setTierFilter}
      />

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
          Loading groups...
        </div>
      ) : (
        <>
          <GroupManagementMobileCards
            groups={filtered}
            onActivate={(groupId) =>
              runAction(activateGroup, groupId, "The group has been activated.")
            }
            onDelete={requestDelete}
            onEdit={(groupId) => nav(`/groups/${groupId}/edit`)}
            onFreeze={(groupId) =>
              runAction(freezeGroup, groupId, "The group has been frozen.")
            }
            onView={(groupId) => nav(`/groups/${groupId}`)}
          />

          <div className="hidden lg:block">
            <GroupManagementDesktopTable
              groups={filtered}
              onActivate={(groupId) =>
                runAction(activateGroup, groupId, "The group has been activated.")
              }
              onDelete={requestDelete}
              onEdit={(groupId) => nav(`/groups/${groupId}/edit`)}
              onFreeze={(groupId) =>
                runAction(freezeGroup, groupId, "The group has been frozen.")
              }
              onView={(groupId) => nav(`/groups/${groupId}`)}
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
