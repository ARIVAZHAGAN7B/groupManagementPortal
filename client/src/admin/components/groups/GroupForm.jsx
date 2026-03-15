import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import React, { useEffect, useMemo, useState } from "react";
import { inputClass as managementInputClass } from "./groupManagement.constants";

const TIERS = ["A", "B", "C", "D"];
const STATUSES = ["ACTIVE", "INACTIVE", "FROZEN"];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#7d95d8] focus:ring-2 focus:ring-[#d8e2ff] disabled:cursor-not-allowed disabled:bg-slate-50";

const labelClass = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500";
const workspaceLabelClass = "mb-2 block text-sm font-semibold text-slate-700";

function FieldGroup({ children, helperText, label, labelClassName = labelClass }) {
  return (
    <div>
      <label className={labelClassName}>{label}</label>
      {children}
      {helperText ? <p className="mt-1.5 text-xs text-slate-500">{helperText}</p> : null}
    </div>
  );
}

function SelectField({ children, className = "", disabled = false, onChange, value }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`${className} appearance-none pr-10`}
      >
        {children}
      </select>

      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
        <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20 }} />
      </span>
    </div>
  );
}

export default function GroupForm({
  initialValues,
  submitLabel = "Save",
  onSubmit,
  disabled = false,
  allowStatusEdit = true,
  variant = "classic",
  compact = false,
}) {
  const init = useMemo(
    () => ({
      group_code: initialValues?.group_code ?? "",
      group_name: initialValues?.group_name ?? "",
      tier: initialValues?.tier ?? "D",
      status: initialValues?.status ?? "INACTIVE",
    }),
    [initialValues]
  );

  const [values, setValues] = useState(init);
  const [error, setError] = useState("");

  useEffect(() => {
    setValues(init);
  }, [init]);

  const set = (k) => (e) => {
    setValues((prev) => ({ ...prev, [k]: e.target.value }));
  };

  const validate = () => {
    if (!values.group_code.trim()) return "Group code is required";
    if (!values.group_name.trim()) return "Group name is required";
    if (!TIERS.includes(values.tier)) return "Invalid tier";
    if (!STATUSES.includes(values.status)) return "Invalid status";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    await onSubmit({
      group_code: values.group_code.trim(),
      group_name: values.group_name.trim(),
      tier: values.tier,
      status: values.status,
    });
  };

  const isWorkspaceVariant = variant === "workspace";
  const isCompactWorkspace = isWorkspaceVariant && compact;
  const workspaceInputClass = isCompactWorkspace
    ? "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1754cf] focus:ring-4 focus:ring-[#1754cf]/10 disabled:cursor-not-allowed disabled:opacity-70"
    : `${managementInputClass} disabled:cursor-not-allowed disabled:opacity-70`;
  const fieldInputClass = isWorkspaceVariant ? workspaceInputClass : inputClass;
  const currentLabelClass = isWorkspaceVariant
    ? `${workspaceLabelClass} ${isCompactWorkspace ? "mb-1.5" : ""}`
    : labelClass;
  const fields = (
    <div
      className={
        isWorkspaceVariant
          ? `grid grid-cols-1 md:grid-cols-2 ${isCompactWorkspace ? "gap-4 p-5" : "gap-5 p-6"}`
          : "grid grid-cols-1 gap-4 md:grid-cols-2"
      }
    >
      <FieldGroup label="Group Code" labelClassName={currentLabelClass}>
        <input
          value={values.group_code}
          onChange={set("group_code")}
          disabled={disabled}
          className={`${fieldInputClass} ${isWorkspaceVariant ? "font-mono font-semibold text-[#1754cf]" : ""}`}
          placeholder="Example: GRP001"
        />
      </FieldGroup>

      <FieldGroup label="Tier" labelClassName={currentLabelClass}>
        <SelectField
          value={values.tier}
          onChange={set("tier")}
          disabled={disabled}
          className={fieldInputClass}
        >
          {TIERS.map((tier) => (
            <option key={tier} value={tier}>
              Tier {tier}
            </option>
          ))}
        </SelectField>
      </FieldGroup>

      <div className="md:col-span-2">
        <FieldGroup label="Group Name" labelClassName={currentLabelClass}>
          <input
            value={values.group_name}
            onChange={set("group_name")}
            disabled={disabled}
            className={fieldInputClass}
            placeholder="Example: Group Alpha"
          />
        </FieldGroup>
      </div>

      <FieldGroup
        label="Status"
        labelClassName={currentLabelClass}
        helperText={!isWorkspaceVariant && !allowStatusEdit ? "Use activate/freeze actions from the management list." : ""}
      >
        <SelectField
          value={values.status}
          onChange={set("status")}
          disabled={disabled || !allowStatusEdit}
          className={fieldInputClass}
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </SelectField>
      </FieldGroup>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${isWorkspaceVariant ? "font-[Inter]" : ""}`}>
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isWorkspaceVariant ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className={`border-b border-slate-200 ${isCompactWorkspace ? "px-5 py-4" : "px-6 py-5"}`}>
            <h2 className="text-lg font-bold text-slate-900">Group Profile</h2>
          </div>

          {fields}

          <div
            className={`flex justify-end border-t border-slate-200 bg-slate-50 ${
              isCompactWorkspace ? "px-5 py-3" : "px-6 py-4"
            }`}
          >
            <button
              type="submit"
              disabled={disabled}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1754cf] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#1754cf]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <SaveRoundedIcon sx={{ fontSize: 18 }} />
              {submitLabel}
            </button>
          </div>
        </section>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-[0_16px_34px_-26px_rgba(15,23,42,0.55)] md:p-6">
            <div className="mb-4">
              <h2
                className="text-xl text-slate-900"
                style={{ fontFamily: "\"Georgia\", \"Times New Roman\", serif" }}
              >
                Group Profile
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Configure identity, tier, and lifecycle status.
              </p>
            </div>

            {fields}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={disabled}
              className="inline-flex items-center rounded-xl border border-[#7d95d8] bg-[#e9efff] px-4 py-2 text-sm font-semibold text-[#23366f] transition hover:bg-[#dbe5ff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitLabel}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
