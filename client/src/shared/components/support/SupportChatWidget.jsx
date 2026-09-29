import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../utils/AuthContext";

/* ── Grey AI Robot Icon ──────────────────────────────────────────────────── */
const RobotIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <line x1="24" y1="2" x2="24" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="24" cy="2" r="2.5" fill="currentColor" />
    <rect x="6" y="10" width="36" height="26" rx="5" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="2" />
    <rect x="13" y="18" width="8" height="8" rx="2" fill="currentColor" />
    <rect x="15" y="20" width="3" height="3" rx="1" fill="white" opacity="0.7" />
    <rect x="27" y="18" width="8" height="8" rx="2" fill="currentColor" />
    <rect x="29" y="20" width="3" height="3" rx="1" fill="white" opacity="0.7" />
    <rect x="16" y="30" width="3" height="3" rx="1" fill="currentColor" opacity="0.7" />
    <rect x="22.5" y="30" width="3" height="3" rx="1" fill="currentColor" opacity="0.7" />
    <rect x="29" y="30" width="3" height="3" rx="1" fill="currentColor" opacity="0.7" />
    <circle cx="6" cy="21" r="2.5" fill="currentColor" opacity="0.5" />
    <circle cx="42" cy="21" r="2.5" fill="currentColor" opacity="0.5" />
    <rect x="19" y="36" width="10" height="4" rx="2" fill="currentColor" opacity="0.4" />
    <rect x="8" y="40" width="32" height="5" rx="2.5" fill="currentColor" opacity="0.2" />
  </svg>
);

export default function SupportChatWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || location.pathname === "/support") return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center group">
      {/* Tooltip */}
      <div className="hidden sm:flex mr-3 items-center gap-2 bg-white text-slate-700 text-xs font-semibold py-2 px-3.5 rounded-full shadow-lg border border-slate-200 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 pointer-events-none whitespace-nowrap">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        GM AI Support
      </div>

      {/* FAB — grey robot square button */}
      <button
        onClick={() => navigate("/support")}
        className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-800 text-white shadow-xl shadow-slate-400/40 hover:bg-slate-700 hover:shadow-slate-400/60 hover:scale-110 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-slate-300"
        aria-label="Open GM AI Support"
      >
        <RobotIcon size={28} className="text-white" />
        {/* Live ping */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-70" />
          <span className="relative h-4 w-4 rounded-full bg-emerald-400 border-2 border-white shadow" />
        </span>
      </button>
    </div>
  );
}
