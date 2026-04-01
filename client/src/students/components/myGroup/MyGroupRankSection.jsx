import { useEffect, useMemo, useState } from "react";

const RULE_LABELS = {
  LOYALTY: "Loyalty",
  CONTRIBUTION: "Contribution",
  RELIABILITY: "Reliability"
};

const RULE_UNITS = {
  LOYALTY: "phases",
  CONTRIBUTION: "pts",
  RELIABILITY: "eligible phases"
};
const SCORE_DISTRIBUTION_TEXT = "Contribution 40, Loyalty 30, Reliability 30";

const formatNumber = (value) => (Number(value) || 0).toLocaleString();
const formatRank = (value) => `Rank ${Number(value) || 5}`;

const formatRuleValue = (ruleCode, value) => {
  const unit = RULE_UNITS[ruleCode] || "";
  const text = formatNumber(value);
  return unit ? `${text} ${unit}` : text;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

const tableHeaderClass =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500";
const tableCellClass = "px-3 py-2 align-top text-sm text-slate-700";

export default function MyGroupRankSection({
  currentStudentId,
  isCaptain = false,
  canOverrideRank = false,
  members = [],
  rankHistory = [],
  rankRules = null,
  loading = false,
  saving = false,
  error = "",
  onRefresh,
  onSaveRules
}) {
  const currentMember = useMemo(
    () =>
      (Array.isArray(members) ? members : []).find(
        (member) => String(member?.student_id) === String(currentStudentId)
      ) || null,
    [currentStudentId, members]
  );

  const eligibleMembers = useMemo(
    () =>
      (Array.isArray(members) ? members : [])
        .filter((member) => Boolean(member?.current_rank_review_eligible))
        .sort((a, b) => {
          const rankDiff = (Number(a?.member_rank) || 5) - (Number(b?.member_rank) || 5);
          if (rankDiff !== 0) return rankDiff;

          const scoreDiff = (Number(b?.current_total_score) || 0) - (Number(a?.current_total_score) || 0);
          if (scoreDiff !== 0) return scoreDiff;

          return String(a?.name || "").localeCompare(String(b?.name || ""));
        }),
    [members]
  );

  const myReviewHistory = useMemo(
    () =>
      (Array.isArray(rankHistory) ? rankHistory : [])
        .filter((row) => String(row?.student_id) === String(currentStudentId))
        .sort((a, b) => {
          const cycleDiff = (Number(b?.review_cycle_number) || 0) - (Number(a?.review_cycle_number) || 0);
          if (cycleDiff !== 0) return cycleDiff;
          return String(b?.review_phase_id || "").localeCompare(String(a?.review_phase_id || ""));
        }),
    [currentStudentId, rankHistory]
  );

  const effectiveRules = useMemo(
    () => (Array.isArray(rankRules?.effective_rules) ? rankRules.effective_rules : []),
    [rankRules]
  );

  const [draftRules, setDraftRules] = useState({});

  useEffect(() => {
    const nextDraft = {};
    effectiveRules.forEach((rule) => {
      const ruleCode = String(rule?.rule_code || "").toUpperCase();
      if (!ruleCode) return;
      nextDraft[ruleCode] = {
        rank_4_min_value: String(rule?.rank_4_min_value ?? ""),
        rank_3_min_value: String(rule?.rank_3_min_value ?? ""),
        rank_2_min_value: String(rule?.rank_2_min_value ?? ""),
        rank_1_min_value: String(rule?.rank_1_min_value ?? "")
      };
    });
    setDraftRules(nextDraft);
  }, [effectiveRules]);

  const updateDraftRule = (ruleCode, field, value) => {
    setDraftRules((prev) => ({
      ...prev,
      [ruleCode]: {
        ...(prev[ruleCode] || {}),
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    const payloadRules = {};

    effectiveRules.forEach((rule) => {
      const ruleCode = String(rule?.rule_code || "").toUpperCase();
      const draft = draftRules[ruleCode] || {};
      payloadRules[ruleCode] = {
        rank_4_min_value: Number(draft.rank_4_min_value),
        rank_3_min_value: Number(draft.rank_3_min_value),
        rank_2_min_value: Number(draft.rank_2_min_value),
        rank_1_min_value: Number(draft.rank_1_min_value)
      };
    });

    await onSaveRules?.({
      use_system_default: false,
      rules: payloadRules
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Rank Overview</h2>
          <p className="mt-1 text-sm text-slate-500">
            Group rank reviews are stored every 5 completed phases. Scores use a 100-point split:
            {" "}
            {SCORE_DISTRIBUTION_TEXT}.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading || saving}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">My Criteria Status</h3>
          <p className="mt-1 text-xs text-slate-500">
            Your current values, rank band, and proportional score basis under this group&apos;s active rule set.
          </p>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[860px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Criteria", "My Value", "Eligible Rank", "Rank 4", "Rank 3", "Rank 2", "Rank 1", "Source"].map((header) => (
                  <th key={header} className={tableHeaderClass}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {effectiveRules.map((rule) => {
                const ruleCode = String(rule?.rule_code || "").toUpperCase();
                const myValue =
                  ruleCode === "LOYALTY"
                    ? currentMember?.current_loyalty_phase_count
                    : ruleCode === "CONTRIBUTION"
                      ? currentMember?.current_contribution_points
                      : currentMember?.current_reliability_eligible_phase_count;
                const myEligibleRank =
                  ruleCode === "LOYALTY"
                    ? currentMember?.current_loyalty_eligible_rank
                    : ruleCode === "CONTRIBUTION"
                      ? currentMember?.current_contribution_eligible_rank
                      : currentMember?.current_reliability_eligible_rank;

                return (
                  <tr key={ruleCode}>
                    <td className={tableCellClass}>
                      <div className="font-semibold text-slate-900">{RULE_LABELS[ruleCode] || ruleCode}</div>
                      <div className="mt-1 text-xs text-slate-500">{RULE_UNITS[ruleCode]}</div>
                    </td>
                    <td className={tableCellClass}>{formatRuleValue(ruleCode, myValue)}</td>
                    <td className={tableCellClass}>
                      <span className="inline-flex rounded-full border border-[#7148e7]/20 bg-[#7148e7]/10 px-2.5 py-1 text-xs font-semibold text-[#5c35d6]">
                        {formatRank(myEligibleRank)}
                      </span>
                    </td>
                    <td className={tableCellClass}>{formatRuleValue(ruleCode, rule.rank_4_min_value)}</td>
                    <td className={tableCellClass}>{formatRuleValue(ruleCode, rule.rank_3_min_value)}</td>
                    <td className={tableCellClass}>{formatRuleValue(ruleCode, rule.rank_2_min_value)}</td>
                    <td className={tableCellClass}>{formatRuleValue(ruleCode, rule.rank_1_min_value)}</td>
                    <td className={tableCellClass}>
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {rule?.source === "GROUP" ? "Group" : "System"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!loading && effectiveRules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                    No rank rule configuration available.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Group Rank Criteria</h3>
          <p className="mt-1 text-xs text-slate-500">
            Captains can customize these thresholds for their group. If no custom rule is saved, system values stay active.
          </p>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[820px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Criteria", "Rank 4", "Rank 3", "Rank 2", "Rank 1", "Status"].map((header) => (
                  <th key={header} className={tableHeaderClass}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {effectiveRules.map((rule) => {
                const ruleCode = String(rule?.rule_code || "").toUpperCase();
                const draft = draftRules[ruleCode] || {};
                const readOnly = !isCaptain;

                return (
                  <tr key={`editable-${ruleCode}`}>
                    <td className={tableCellClass}>
                      <div className="font-semibold text-slate-900">{RULE_LABELS[ruleCode] || ruleCode}</div>
                      <div className="mt-1 text-xs text-slate-500">{RULE_UNITS[ruleCode]}</div>
                    </td>
                    {["rank_4_min_value", "rank_3_min_value", "rank_2_min_value", "rank_1_min_value"].map((field) => (
                      <td key={field} className={tableCellClass}>
                        {readOnly ? (
                          formatRuleValue(ruleCode, rule[field])
                        ) : (
                          <input
                            type="number"
                            min="0"
                            value={draft[field] ?? ""}
                            onChange={(event) => updateDraftRule(ruleCode, field, event.target.value)}
                            className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#7148e7] focus:ring-4 focus:ring-[#7148e7]/10"
                          />
                        )}
                      </td>
                    ))}
                    <td className={tableCellClass}>
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {rule?.source === "GROUP" ? "Custom" : "System default"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {isCaptain ? (
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {rankRules?.has_group_override
                ? "This group is using captain-defined custom thresholds."
                : "This group is currently using the system default thresholds."}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onSaveRules?.({ use_system_default: true })}
                disabled={saving}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Use System Values
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || effectiveRules.length === 0}
                className="rounded-lg bg-[#7148e7] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Criteria"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Rank Table</h3>
          <p className="mt-1 text-xs text-slate-500">
            Only members with at least 5 completed phases in this group are shown here.
          </p>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Name", "ID", "Official Rank", "Live Score", "Loyalty", "Contribution", "Reliability", "Last Review"].map((header) => (
                  <th key={header} className={tableHeaderClass}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {eligibleMembers.map((member) => (
                <tr key={`rank-row-${member.membership_id}`}>
                  <td className={tableCellClass}>
                    <div className="font-semibold text-slate-900">{member?.name || "-"}</div>
                  </td>
                  <td className={`${tableCellClass} font-mono text-xs text-slate-500`}>{member?.student_id || "-"}</td>
                  <td className={tableCellClass}>{member?.member_rank_label || "Rank 5"}</td>
                  <td className={tableCellClass}>{formatNumber(member?.current_total_score)}</td>
                  <td className={tableCellClass}>{formatRuleValue("LOYALTY", member?.current_loyalty_phase_count)}</td>
                  <td className={tableCellClass}>{formatRuleValue("CONTRIBUTION", member?.current_contribution_points)}</td>
                  <td className={tableCellClass}>{formatRuleValue("RELIABILITY", member?.current_reliability_eligible_phase_count)}</td>
                  <td className={tableCellClass}>{member?.member_rank_review_phase_name || "-"}</td>
                </tr>
              ))}
              {!loading && eligibleMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                    No active member has completed 5 phases in this group yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">My Review History</h3>
          <p className="mt-1 text-xs text-slate-500">
            Stored 5-phase review snapshots from the `group_rank` history.
          </p>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Phase", "Cycle", "Rank", "Score", "Loyalty", "Contribution", "Reliability", "Movement"].map((header) => (
                  <th key={header} className={tableHeaderClass}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myReviewHistory.map((row) => (
                <tr key={`history-${row.group_rank_id}`}>
                  <td className={tableCellClass}>
                    <div className="font-semibold text-slate-900">{row?.phase_name || row?.review_phase_id || "-"}</div>
                    <div className="mt-1 text-xs text-slate-500">{formatDateTime(row?.reviewed_at)}</div>
                  </td>
                  <td className={tableCellClass}>{row?.review_cycle_number || "-"}</td>
                  <td className={tableCellClass}>{formatRank(row?.overall_rank)}</td>
                  <td className={tableCellClass}>{formatNumber(row?.total_score)}</td>
                  <td className={tableCellClass}>{formatRuleValue("LOYALTY", row?.loyalty_phase_count)}</td>
                  <td className={tableCellClass}>{formatRuleValue("CONTRIBUTION", row?.contribution_points)}</td>
                  <td className={tableCellClass}>{formatRuleValue("RELIABILITY", row?.reliability_eligible_phase_count)}</td>
                  <td className={tableCellClass}>{row?.rank_movement || "-"}</td>
                </tr>
              ))}
              {!loading && myReviewHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                    No 5-phase rank review has been stored for your membership yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
