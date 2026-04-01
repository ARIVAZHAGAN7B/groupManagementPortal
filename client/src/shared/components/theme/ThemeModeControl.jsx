import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import DesktopWindowsRoundedIcon from "@mui/icons-material/DesktopWindowsRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import { useMemo } from "react";
import { useTheme } from "../../theme/ThemeContext";

const THEME_OPTIONS = [
  {
    value: "light",
    label: "Light",
    icon: LightModeRoundedIcon,
  },
  {
    value: "dark",
    label: "Dark",
    icon: DarkModeRoundedIcon,
  },
  {
    value: "system",
    label: "System",
    icon: DesktopWindowsRoundedIcon,
  },
];

const ThemeModeControl = ({ className = "" }) => {
  const { setThemeMode, themeMode } = useTheme();

  const activeIndex = useMemo(() => {
    const index = THEME_OPTIONS.findIndex((option) => option.value === themeMode);
    return index >= 0 ? index : 0;
  }, [themeMode]);

  const activeOption = THEME_OPTIONS[activeIndex];
  const nextOption = THEME_OPTIONS[(activeIndex + 1) % THEME_OPTIONS.length];

  const ActiveIcon = activeOption.icon;

  return (
    <button
      type="button"
      onClick={() => setThemeMode(nextOption.value)}
      aria-label={`Theme mode: ${activeOption.label}. Click to switch to ${nextOption.label}.`}
      title={`Switch theme to ${nextOption.label}`}
      className={`grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm backdrop-blur-sm transition hover:bg-slate-50 ${className}`.trim()}
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-700">
        <ActiveIcon sx={{ fontSize: 16 }} />
      </span>
    </button>
  );
};

export default ThemeModeControl;
