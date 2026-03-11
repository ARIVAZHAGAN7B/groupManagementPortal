import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

export default function PhaseConfigurationPageHeader({ loading, onRefresh }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Phase Configuration
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Create academic or operational phases and configure eligibility targets.
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
      >
        <RefreshRoundedIcon sx={{ fontSize: 20 }} />
        {loading ? "Refreshing..." : "Refresh"}
      </button>
    </header>
  );
}
