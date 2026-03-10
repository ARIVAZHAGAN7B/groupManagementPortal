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

  if (loading) {
    return <div className="p-8 text-sm text-slate-500">Loading group...</div>;
  }

  if (err && !group) {
    return (
      <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
        {err}
      </div>
    );
  }

  if (!group) {
    return <div className="p-8 text-sm text-slate-500">Group not found.</div>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-5 md:px-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-[#f6f9ff] via-[#f3f7ff] to-[#edf3ff] p-5 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.7)] md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Group Workspace
            </p>
            <h1
              className="mt-1 text-2xl text-slate-900"
              style={{ fontFamily: "\"Georgia\", \"Times New Roman\", serif" }}
            >
              Edit Group
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {group.group_code} - ID {group.group_id}
            </p>
          </div>

          <button
            onClick={() => nav("/groups")}
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back to Groups
          </button>
        </div>
      </div>

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_34px_-26px_rgba(15,23,42,0.55)] md:p-6">
        <GroupForm
          initialValues={group}
          submitLabel={saving ? "Saving..." : "Save Changes"}
          disabled={saving}
          allowStatusEdit={true}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
