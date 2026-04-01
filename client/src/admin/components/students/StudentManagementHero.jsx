import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { formatDate } from "./studentManagement.constants";
import AdminWorkspaceHero, {
  AdminWorkspaceHeroActionButton
} from "../ui/AdminWorkspaceHero";

export default function StudentManagementHero({
  loading,
  onRefresh,
  phase,
  stats
}) {
  const phaseSummary = phase?.phase_id
    ? `Active phase: ${formatDate(phase.start_date)} to ${formatDate(phase.end_date)}`
    : "No active phase";

  return (
    <AdminWorkspaceHero
      eyebrow="Student Workspace"
      title="Student Management"
      description={phaseSummary}
      descriptionClassName="mt-1 text-[11px] font-medium text-slate-500"
      actions={
        <AdminWorkspaceHeroActionButton
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        >
          <RefreshRoundedIcon sx={{ fontSize: 18 }} />
          {loading ? "Refreshing..." : "Refresh"}
        </AdminWorkspaceHeroActionButton>
      }
    />
  );
}
