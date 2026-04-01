import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import {
  filterInputClass,
  getPhaseOptionLabel,
  TIER_OPTIONS
} from "./leaderboard.constants";
import { LeaderboardPanel } from "./LeaderboardShared";

const LeaderboardFilters = ({
  hasActiveFilters,
  onClearFilters,
  onPhaseChange,
  onTierChange,
  phaseLoadError,
  phases,
  selectedPhaseId,
  selectedTier
}) => (
  <LeaderboardPanel className="p-4 md:p-5">
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_220px_auto] lg:items-end">
      <label className="block">
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Phase
        </span>
        <select value={selectedPhaseId} onChange={onPhaseChange} className={filterInputClass}>
          <option value="">All Time</option>
          {phases.map((phase) => (
            <option key={phase.phase_id} value={phase.phase_id}>
              {getPhaseOptionLabel(phase)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Tier
        </span>
        <select value={selectedTier} onChange={onTierChange} className={filterInputClass}>
          <option value="">All Tiers</option>
          {TIER_OPTIONS.map((tier) => (
            <option key={tier} value={tier}>
              Tier {tier}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={onClearFilters}
        disabled={!hasActiveFilters}
        className="inline-flex h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RestartAltRoundedIcon sx={{ fontSize: 18 }} />
        Clear Filters
      </button>

      {phaseLoadError ? (
        <div className="lg:col-span-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {phaseLoadError}
        </div>
      ) : null}
    </div>
  </LeaderboardPanel>
);

export default LeaderboardFilters;
