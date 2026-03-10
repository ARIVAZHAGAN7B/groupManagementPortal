import React, { useEffect, useMemo, useState } from "react";

const TIERS = ["D", "C", "B", "A"];
const STATUSES = ["ACTIVE", "INACTIVE", "FROZEN"];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#7d95d8] focus:ring-2 focus:ring-[#d8e2ff] disabled:cursor-not-allowed disabled:bg-slate-50";

const labelClass = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500";

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Group Code</label>
            <input
              value={values.group_code}
              onChange={set("group_code")}
              disabled={disabled}
              className={inputClass}
              placeholder="Example: GRP001"
            />
          </div>

          <div>
            <label className={labelClass}>Tier</label>
            <select
              value={values.tier}
              onChange={set("tier")}
              disabled={disabled}
              className={inputClass}
            >
              {TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  Tier {tier}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Group Name</label>
            <input
              value={values.group_name}
              onChange={set("group_name")}
              disabled={disabled}
              className={inputClass}
              placeholder="Example: Group Alpha"
            />
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select
              value={values.status}
              onChange={set("status")}
              disabled={disabled || !allowStatusEdit}
              className={inputClass}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            {!allowStatusEdit ? (
              <p className="mt-1 text-xs text-slate-500">
                Use activate/freeze actions from the management list.
              </p>
            ) : null}
          </div>
        </div>
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
    </form>
  );
}
