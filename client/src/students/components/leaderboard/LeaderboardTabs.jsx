import { TABS } from "./leaderboard.constants";

const LeaderboardTabs = ({ activeTab, counts, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {TABS.map((tab) => {
      const isActive = activeTab === tab.key;

      return (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
            isActive
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <span>{tab.label}</span>
          <span
            className={`inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
              isActive ? "bg-white text-blue-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {counts[tab.key] || 0}
          </span>
        </button>
      );
    })}
  </div>
);

export default LeaderboardTabs;
