import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";

const toneConfig = {
  success: {
    wrapper: "border-blue-100 bg-blue-50",
    iconWrap: "bg-blue-100 text-[#1754cf]",
    title: "text-blue-900",
    body: "text-blue-700",
    icon: CheckCircleRoundedIcon
  },
  error: {
    wrapper: "border-red-100 bg-red-50",
    iconWrap: "bg-red-100 text-red-600",
    title: "text-red-900",
    body: "text-red-700",
    icon: ErrorOutlineRoundedIcon
  }
};

export default function ChangeDayManagementStatusBanner({ message, tone }) {
  const config = toneConfig[tone] || toneConfig.success;
  const Icon = config.icon;
  const subtitle =
    tone === "error"
      ? "Review the current values and try again."
      : "The configuration has been synchronized across all student records.";

  return (
    <div className={`rounded-xl border p-4 ${config.wrapper}`}>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.iconWrap}`}
        >
          <Icon sx={{ fontSize: 20 }} />
        </div>

        <div>
          <p className={`text-sm font-bold ${config.title}`}>{message}</p>
          <p className={`text-sm ${config.body}`}>{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
