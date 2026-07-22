import {
  WorkspaceFilterBar
} from "../../../shared/components/WorkspaceInlineFilters";

const VACANCY_LABELS = {
  HAS_VACANCY: "Has Vacancy",
  FULL: "Full"
};

const ACCEPTING_LABELS = {
  YES: "Accepting applications",
  NO: "Not accepting applications"
};

const ELIGIBILITY_LABELS = {
  ELIGIBLE: "Eligible",
  NOT_ELIGIBLE: "Not eligible",
  NOT_EVALUATED: "Not evaluated"
};

const RANK_LABELS = {
  RANKED: "Ranked only",
  UNRANKED: "Unranked only"
};

export default function AllGroupsFilters({
  acceptingFilter,
  captainFilter,
  canReset = false,
  eligibilityFilter,
  eligibilityOptions = [],
  groupQuery,
  onCaptainChange,
  onAcceptingChange,
  onEligibilityChange,
  onGroupQueryChange,
  onPointsMinChange,
  onRankChange,
  onReset,
  onStatusChange,
  onTierChange,
  onVacancyChange,
  pointsMinFilter,
  rankFilter,
  rankOptions = [],
  statusFilter,
  statusOptions,
  tierFilter,
  tierOptions,
  vacancyFilter,
  withDivider = true
}) {
  const fields = [
    {
      key: "groupQuery",
      type: "search",
      label: "Group",
      value: groupQuery,
      placeholder: "Name, code, or id",
      onChangeValue: (value, event) => onGroupQueryChange?.(event)
    },
    {
      key: "tier",
      type: "select",
      label: "Tier",
      value: tierFilter,
      onChangeValue: (value, event) => onTierChange?.(event),
      wrapperClassName: "w-full sm:w-[150px]",
      options: [
        { value: "ALL", label: "All tiers" },
        ...tierOptions.map((tier) => ({
          value: tier,
          label: `Tier ${tier}`
        }))
      ]
    },
    {
      key: "status",
      type: "select",
      label: "Status",
      value: statusFilter,
      onChangeValue: (value, event) => onStatusChange?.(event),
      wrapperClassName: "w-full sm:w-[170px]",
      options: [
        { value: "ALL", label: "All statuses" },
        ...statusOptions.map((status) => ({
          value: status,
          label: status
        }))
      ]
    },
    {
      key: "eligibility",
      type: "select",
      label: "Eligibility",
      value: eligibilityFilter,
      onChangeValue: (value, event) => onEligibilityChange?.(event),
      wrapperClassName: "w-full sm:w-[180px]",
      options: [
        { value: "ALL", label: "All eligibility" },
        ...eligibilityOptions.map((status) => ({
          value: status,
          label: ELIGIBILITY_LABELS[status] || status
        }))
      ]
    },
    {
      key: "captain",
      type: "input",
      label: "Captain",
      value: captainFilter,
      placeholder: "Captain name",
      wrapperClassName: "w-full sm:w-[180px]",
      onChangeValue: (value, event) => onCaptainChange?.(event)
    },
    {
      key: "rank",
      type: "select",
      label: "Rank",
      value: rankFilter,
      onChangeValue: (value, event) => onRankChange?.(event),
      wrapperClassName: "w-full sm:w-[170px]",
      options: [
        { value: "ALL", label: "All rank states" },
        ...rankOptions.map((status) => ({
          value: status,
          label: RANK_LABELS[status] || status
        }))
      ]
    },
    {
      key: "vacancy",
      type: "select",
      label: "Vacancy",
      value: vacancyFilter,
      onChangeValue: (value, event) => onVacancyChange?.(event),
      wrapperClassName: "w-full sm:w-[170px]",
      options: [
        { value: "ALL", label: "All vacancy states" },
        { value: "HAS_VACANCY", label: VACANCY_LABELS.HAS_VACANCY },
        { value: "FULL", label: VACANCY_LABELS.FULL }
      ]
    },
    {
      key: "accepting",
      type: "select",
      label: "Accepting",
      value: acceptingFilter,
      onChangeValue: (value, event) => onAcceptingChange?.(event),
      wrapperClassName: "w-full sm:w-[190px]",
      options: [
        { value: "ALL", label: "All application states" },
        { value: "YES", label: ACCEPTING_LABELS.YES },
        { value: "NO", label: ACCEPTING_LABELS.NO }
      ]
    },
    {
      key: "pointsMin",
      type: "input",
      label: "Minimum Points",
      value: pointsMinFilter,
      inputType: "number",
      min: "0",
      step: "1",
      placeholder: "0",
      wrapperClassName: "w-full sm:w-[160px]",
      onChangeValue: (value, event) => onPointsMinChange?.(event)
    }
  ];

  return (
    <div className={withDivider ? "border-b border-slate-200 p-3" : ""}>
      <WorkspaceFilterBar
        className={withDivider ? "border-0 p-0 shadow-none" : ""}
        fields={fields}
        onReset={onReset}
        hasActiveFilters={canReset}
      />
    </div>
  );
}
