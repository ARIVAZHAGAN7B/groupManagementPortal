import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import {
  getGroupStatusBadgeClass,
  getTierBadgeClass
} from "./leaderboard.constants";

const getDisplayValue = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : "-";
};

const LeaderboardPanel = ({ children, className = "" }) => (
  <section
    className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`.trim()}
  >
    {children}
  </section>
);

const LeaderboardEmptyState = ({ message, title = "Nothing to show yet" }) => (
  <LeaderboardPanel>
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-[#1754cf]/10 text-[#1754cf]">
        <EmojiEventsRoundedIcon sx={{ fontSize: 28 }} />
      </span>
      <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-500">{message}</p>
    </div>
  </LeaderboardPanel>
);

const LeaderboardRankBadge = ({ value }) => (
  <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-[#1754cf]/10 px-3 py-1 text-sm font-bold text-[#1754cf]">
    {getDisplayValue(value)}
  </span>
);

const LeaderboardTierBadge = ({ tier }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] ${getTierBadgeClass(
      tier
    )}`}
  >
    {tier || "-"}
  </span>
);

const LeaderboardStatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] ${getGroupStatusBadgeClass(
      status
    )}`}
  >
    {status || "-"}
  </span>
);

export {
  LeaderboardEmptyState,
  LeaderboardPanel,
  LeaderboardRankBadge,
  LeaderboardStatusBadge,
  LeaderboardTierBadge
};
