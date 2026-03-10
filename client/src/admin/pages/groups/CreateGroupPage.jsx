import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GroupForm from "../../components/groups/GroupForm";
import { createGroup } from "../../../service/groups.api";

export default function CreateGroupPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const onSubmit = async (payload) => {
    setLoading(true);
    setServerError("");
    try {
      await createGroup(payload);
      nav("/groups");
    } catch (e) {
      setServerError(e?.response?.data?.error || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

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
              Create New Group
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Add a new group with tier and status configuration.
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

      {serverError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      ) : null}

      <GroupForm
        submitLabel={loading ? "Creating..." : "Create Group"}
        disabled={loading}
        allowStatusEdit={true}
        onSubmit={onSubmit}
      />
    </div>
  );
}
