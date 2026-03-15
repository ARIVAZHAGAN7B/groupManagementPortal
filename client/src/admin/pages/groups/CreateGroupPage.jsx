import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
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
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 font-[Inter] md:px-6">
      <section className="relative overflow-hidden rounded-2xl border border-[#1754cf]/10 bg-[#1754cf]/5 p-8">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1754cf]">
              Group Workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Create Group
            </h1>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <button
              type="button"
              onClick={() => nav("/groups")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
              Back to Groups
            </button>
          </div>
        </div>

        <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-[#1754cf]/10 blur-3xl" />
      </section>

      {serverError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      ) : null}

      <div className="max-w-4xl">
        <GroupForm
          submitLabel={loading ? "Creating..." : "Create Group"}
          disabled={loading}
          allowStatusEdit={true}
          onSubmit={onSubmit}
          variant="workspace"
          compact={true}
        />
      </div>
    </div>
  );
}
