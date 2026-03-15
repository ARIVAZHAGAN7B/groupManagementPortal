export default function MyGroupTabs({ activeTab, onChange, tabs }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
              active
                ? "border-[#1754cf]/20 bg-[#1754cf]/10 text-[#1754cf]"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" ? (
              <span
                className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs ${
                  active ? "bg-white/90 text-[#1754cf]" : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
