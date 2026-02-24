import React, { useMemo, useState } from "react";

const TIERS = ["D", "C", "B", "A"];
const STATUSES = ["ACTIVE", "INACTIVE", "FROZEN"];

export default function GroupForm({
  initialValues,
  submitLabel = "Save",
  onSubmit,
  disabled = false,
  allowStatusEdit = true,
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

  const set = (k) => (e) => {
    setValues((p) => ({ ...p, [k]: e.target.value }));
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
    if (msg) return setError(msg);

    await onSubmit({
      group_code: values.group_code.trim(),
      group_name: values.group_name.trim(),
      tier: values.tier,
      status: values.status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      {error ? (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-1">
        <label className="block text-sm font-medium">Group Code</label>
        <input
          value={values.group_code}
          onChange={set("group_code")}
          disabled={disabled}
          className="w-full border rounded px-3 py-2"
          placeholder="e.g. GRP001"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Group Name</label>
        <input
          value={values.group_name}
          onChange={set("group_name")}
          disabled={disabled}
          className="w-full border rounded px-3 py-2"
          placeholder="e.g. Group Alpha"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Tier</label>
          <select
            value={values.tier}
            onChange={set("tier")}
            disabled={disabled}
            className="w-full border rounded px-3 py-2"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Status</label>
          <select
            value={values.status}
            onChange={set("status")}
            disabled={disabled || !allowStatusEdit}
            className="w-full border rounded px-3 py-2"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {!allowStatusEdit ? (
            <p className="text-xs text-gray-500">
              Use Activate/Freeze buttons from management page.
            </p>
          ) : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="px-4 py-2 rounded border"
      >
        {submitLabel}
      </button>
    </form>
  );
}
