import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GroupEditHero from "../../components/groups/GroupEditHero";
import GroupEditStatsGrid from "../../components/groups/GroupEditStatsGrid";
import GroupForm from "../../components/groups/GroupForm";
import { fetchGroupById, updateGroup } from "../../../service/groups.api";

export default function EditGroupPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await fetchGroupById(id);
        setGroup(data);
      } catch (e) {
        setErr(e?.response?.data?.error || "Failed to load group");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onSubmit = async (payload) => {
    setSaving(true);
    setErr("");
    try {
      await updateGroup(id, {
        group_name: payload.group_name,
        tier: payload.tier,
        status: payload.status,
      });
      nav("/groups");
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to update group");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-5 font-[Inter] md:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
          Loading group...
        </div>
      </div>
    );
  }

  if (err && !group) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-5 font-[Inter] md:px-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-700 shadow-sm">
          {err}
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-5 font-[Inter] md:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
          Group not found.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 font-[Inter] md:px-6">
      <GroupEditHero group={group} onBack={() => nav("/groups")} />

      {/* <GroupEditStatsGrid group={group} /> */}

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <GroupForm
        initialValues={group}
        submitLabel={saving ? "Saving..." : "Save Changes"}
        disabled={saving}
        allowStatusEdit={true}
        onSubmit={onSubmit}
        variant="workspace"
      />
    </div>
  );
}
