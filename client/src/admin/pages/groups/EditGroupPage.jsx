import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

  if (loading)
    return <div className="p-8 text-sm text-gray-400">Loading group…</div>;
  if (err && !group)
    return <div className="p-8 text-sm text-red-600 bg-red-50 rounded-lg m-6">{err}</div>;
  if (!group)
    return <div className="p-8 text-sm text-gray-400">Group not found.</div>;

  return (
    <div className="p-6 space-y-5 max-w-2xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">Edit Group</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {group.group_code} · {group.group_id}
          </p>
        </div>
        <button
          onClick={() => nav("/groups")}
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* Error */}
      {err && (
        <div className="px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* Form card */}
      <div className="rounded-xl border border-gray-100 bg-white p-5">
        <GroupForm
          initialValues={group}
          submitLabel={saving ? "Saving…" : "Save Changes"}
          disabled={saving}
          allowStatusEdit={true}
          onSubmit={onSubmit}
        />
      </div>

    </div>
  );
}