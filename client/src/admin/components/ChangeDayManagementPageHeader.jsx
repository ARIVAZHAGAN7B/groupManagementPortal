import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

export default function ChangeDayManagementPageHeader({ loading, onRefresh }) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Change Day Management
        </h1>
        <p className="text-sm text-slate-500">
          Update change day and phase configuration settings for the active phase.
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
      >
        <RefreshRoundedIcon sx={{ fontSize: 18 }} />
        {loading ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  );
}
