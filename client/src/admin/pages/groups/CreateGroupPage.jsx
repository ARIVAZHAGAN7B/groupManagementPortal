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
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Create Group</h1>
        <button onClick={() => nav("/groups")} className="px-3 py-2 rounded border">
          Back
        </button>
      </div>

      {serverError ? (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700">
          {serverError}
        </div>
      ) : null}

      <GroupForm
        submitLabel={loading ? "Creating..." : "Create"}
        disabled={loading}
        allowStatusEdit={true} // you allow setting INACTIVE/ACTIVE on create if you want
        onSubmit={onSubmit}
      />
    </div>
  );
}
