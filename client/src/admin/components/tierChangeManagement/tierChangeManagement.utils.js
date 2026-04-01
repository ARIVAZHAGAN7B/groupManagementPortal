const TIERS = ["D", "C", "B", "A"];

export const MANUAL_ACTIONS = ["PROMOTE", "DEMOTE"];

export const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
};

export const formatPhaseLabel = (phase) => {
  if (!phase?.phase_id) return "No previous phase";
  return `${phase.phase_name || phase.phase_id} | ${formatDate(phase.start_date)} - ${formatDate(
    phase.end_date
  )}`;
};

export const toEligibleLabel = (value) => {
  if (value === true || value === 1) return "Yes";
  if (value === false || value === 0) return "No";
  return "Not Evaluated";
};

export const normalizeChangeAction = (value) => {
  const action = String(value || "")
    .trim()
    .toUpperCase();
  return MANUAL_ACTIONS.includes(action) ? action : "";
};

export const normalizeStatus = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const getNextTier = (tier) => {
  const normalizedTier = String(tier || "")
    .trim()
    .toUpperCase();
  const idx = TIERS.indexOf(normalizedTier);
  if (idx < 0) return normalizedTier || "-";
  return TIERS[Math.min(idx + 1, TIERS.length - 1)];
};

const getPrevTier = (tier) => {
  const normalizedTier = String(tier || "")
    .trim()
    .toUpperCase();
  const idx = TIERS.indexOf(normalizedTier);
  if (idx < 0) return normalizedTier || "-";
  return TIERS[Math.max(idx - 1, 0)];
};

export const getAllowedActions = (row) => {
  const status = normalizeStatus(row?.group_status);
  return status === "ACTIVE" ? MANUAL_ACTIONS : ["DEMOTE"];
};

export const getInitialAction = (row) => {
  const allowedActions = getAllowedActions(row);
  const savedAction = normalizeChangeAction(row?.team_change_tier?.change_action);
  if (allowedActions.includes(savedAction)) return savedAction;
  const previewAction = normalizeChangeAction(row?.change_action);
  if (allowedActions.includes(previewAction)) return previewAction;
  return allowedActions[0] || "DEMOTE";
};

export const getResolvedAction = (row, selectedActions = {}) => {
  const allowedActions = getAllowedActions(row);
  const selectedAction = normalizeChangeAction(selectedActions[String(row?.group_id)]);
  if (allowedActions.includes(selectedAction)) return selectedAction;
  return getInitialAction(row);
};

export const getTargetTier = (currentTier, action) => {
  const normalizedAction = normalizeChangeAction(action);
  if (normalizedAction === "PROMOTE") return getNextTier(currentTier);
  if (normalizedAction === "DEMOTE") return getPrevTier(currentTier);
  return String(currentTier || "-").toUpperCase();
};

export const getDisplayedTargetTier = (row, selectedActions = {}) =>
  row?.team_change_tier?.recommended_tier ||
  row?.recommended_tier ||
  getTargetTier(row?.current_tier, getResolvedAction(row, selectedActions));

export const getActionButtonClass = (action, isSelected) => {
  if (isSelected && action === "PROMOTE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (isSelected && action === "DEMOTE") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  return "border-slate-200 bg-white text-slate-600 hover:bg-slate-50";
};
