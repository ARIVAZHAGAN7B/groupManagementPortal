import React, { useState, useEffect, useRef, useCallback } from "react";
import { sendSupportChatMessage, fetchSupportSuggestions } from "../../service/support.api";
import { useAuth } from "../../utils/AuthContext";
import RichMarkdownRenderer from "../components/support/RichMarkdownRenderer";

const STORAGE_KEY = "gmp_support_page_messages_v4";

/* ─────────────────────────────────────────────────────────────────────────────
   AI ROBOT ICON  — classic robot head in grey
   ───────────────────────────────────────────────────────────────────────────── */
const RobotIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Antenna */}
    <line x1="24" y1="2" x2="24" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="24" cy="2" r="2.5" fill="currentColor" />
    {/* Head */}
    <rect x="6" y="10" width="36" height="26" rx="5" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="2" />
    {/* Left eye */}
    <rect x="13" y="18" width="8" height="8" rx="2" fill="currentColor" />
    <rect x="15" y="20" width="3" height="3" rx="1" fill="white" opacity="0.7" />
    {/* Right eye */}
    <rect x="27" y="18" width="8" height="8" rx="2" fill="currentColor" />
    <rect x="29" y="20" width="3" height="3" rx="1" fill="white" opacity="0.7" />
    {/* Mouth — grid of dots */}
    <rect x="16" y="30" width="3" height="3" rx="1" fill="currentColor" opacity="0.7" />
    <rect x="22.5" y="30" width="3" height="3" rx="1" fill="currentColor" opacity="0.7" />
    <rect x="29" y="30" width="3" height="3" rx="1" fill="currentColor" opacity="0.7" />
    {/* Ear bolts */}
    <circle cx="6" cy="21" r="2.5" fill="currentColor" opacity="0.5" />
    <circle cx="42" cy="21" r="2.5" fill="currentColor" opacity="0.5" />
    {/* Neck */}
    <rect x="19" y="36" width="10" height="4" rx="2" fill="currentColor" opacity="0.4" />
    {/* Shoulders */}
    <rect x="8" y="40" width="32" height="5" rx="2.5" fill="currentColor" opacity="0.2" />
  </svg>
);

/* ─── Send Icon ────────────────────────────────────────────────────────────── */
const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px] translate-x-px">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

/* ─── Prompt Cards ─────────────────────────────────────────────────────────── */
const PROMPT_CARDS = [
  {
    icon: "📊",
    label: "Points & Eligibility",
    hint: "Breakdown, rankings, history",
    prompt: "Show me a detailed breakdown of my academic points, eligibility status, and how I compare to top performers.",
  },
  {
    icon: "🏆",
    label: "Squad Roster",
    hint: "Roles, tiers, leadership",
    prompt: "List all squad members in my group with their roles, tier levels, and current leadership positions.",
  },
  {
    icon: "📅",
    label: "Phase Schedule",
    hint: "Dates, milestones, deadlines",
    prompt: "Give me a full schedule table for the current active phase — start date, end date, total duration, and key milestones.",
  },
  {
    icon: "📋",
    label: "OD Requests",
    hint: "Status, rules, approvals",
    prompt: "What is the current status of my on-duty requests, and what are the portal rules for OD approval?",
  },
];

/* ─── Mode Badge ───────────────────────────────────────────────────────────── */
function ModeBadge({ mode }) {
  if (!mode || mode === "SYSTEM") return null;
  const isAI = mode === "GEMINI_AI";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full border ${
      isAI
        ? "bg-slate-100 text-slate-600 border-slate-300"
        : "bg-emerald-50 text-emerald-700 border-emerald-200"
    }`}>
      {isAI ? (
        <><RobotIcon size={10} className="text-slate-500" /> AI</>
      ) : (
        <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Live DB</>
      )}
    </span>
  );
}

/* ─── Copy Button ──────────────────────────────────────────────────────────── */
function CopyBtn({ text }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); }}
      title={ok ? "Copied!" : "Copy"}
      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-all"
    >
      {ok
        ? <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
        : <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
      }
      {ok ? "Copied" : "Copy"}
    </button>
  );
}

/* ─── Typing Dots ──────────────────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-start gap-3 px-4 sm:px-8 py-3 max-w-4xl mx-auto w-full">
      <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center shadow ring-2 ring-white">
        <RobotIcon size={18} className="text-white" />
      </div>
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "160ms" }} />
        <span className="w-2 h-2 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: "320ms" }} />
        <span className="ml-2 text-xs text-slate-400 font-medium">Thinking…</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────────────────────── */
export default function SupportPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState(() => {
    try { const s = sessionStorage.getItem(STORAGE_KEY); if (s) return JSON.parse(s); } catch {}
    return [];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);

  const bottomRef = useRef(null);
  const taRef = useRef(null);

  const grow = useCallback(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, []);
  useEffect(grow, [input, grow]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {} }, [messages]);

  useEffect(() => {
    if (!user) return;
    fetchSupportSuggestions().then(d => { if (d?.suggestions) setSuggestions(d.suggestions.slice(0, 5)); }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (user && messages.length === 0) {
      setMessages([{
        id: "welcome",
        sender: "assistant",
        text: `Hello **${user.name || "there"}**! 👋 I'm your **GM Portal Assistant**.\n\nI have real-time access to your:\n- 📊 Academic points and eligibility history\n- 👥 Squad leadership and team roster\n- 📅 Phase schedules (max 15-day windows)\n- 📋 OD requests and approval status\n\nPick a topic below or type your own question!`,
        mode: "SYSTEM",
        ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    }
  }, [user, messages.length]);

  if (!user) return null;

  const canSend = input.trim().length > 0 && !loading;

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    const userMsg = { id: "u-" + Date.now(), sender: "user", text: q, ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const history = next.slice(-8).map(m => ({ sender: m.sender, text: m.text }));
      const res = await sendSupportChatMessage(q, history);
      setMessages(p => [...p, {
        id: "b-" + Date.now(), sender: "assistant",
        text: res?.reply ?? "I couldn't process that right now.",
        mode: res?.mode ?? "DATABASE_DIRECT",
        ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
      if (res?.suggestions?.length) setSuggestions(res.suggestions.slice(0, 5));
    } catch {
      setMessages(p => [...p, {
        id: "e-" + Date.now(), sender: "assistant",
        text: "⚠️ Sorry, I ran into an issue. Please try again in a moment.",
        mode: "ERROR",
        ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    } finally { setLoading(false); }
  };

  const onKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  const newChat = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setMessages([{
      id: "welcome-new", sender: "assistant",
      text: "New conversation started! 🚀 What would you like to know?",
      mode: "SYSTEM",
      ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }]);
  };

  const isWelcome = messages.length <= 1 && messages[0]?.id?.startsWith("welcome");
  const userInitial = (user.name || user.email || "U").charAt(0).toUpperCase();

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>

      {/* ══ TOPBAR ══════════════════════════════════════════════════════════ */}
      <div className="shrink-0 flex items-center justify-between px-5 sm:px-8 py-3 bg-white border-b border-slate-200 z-20">
        <div className="flex items-center gap-3">
          {/* Grey robot avatar */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-700 shadow-md">
            <RobotIcon size={22} className="text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-snug">GM Portal Assistant</p>
            <div className="flex items-center gap-2 mt-0.5">
              {/* AI badge — grey */}
              <span className="inline-flex items-center gap-1.5 bg-slate-800 text-white text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full">
                <RobotIcon size={10} className="text-slate-300" />
                AI Support
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live data
              </span>
            </div>
          </div>
        </div>

        {/* New Chat */}
        <button
          onClick={newChat}
          className="group flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 px-3.5 py-2 rounded-xl transition-all duration-150 shadow-sm"
        >
          <svg className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New chat
        </button>
      </div>

      {/* ══ CANVAS ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto bg-slate-50">

        {/* ── WELCOME STATE ──────────────────────────────────────────────── */}
        {isWelcome && (
          <div className="flex flex-col items-center pt-12 pb-4 px-4 text-center">

            {/* Hero Robot */}
            <div className="relative mb-6">
              {/* Subtle shadow ring */}
              <div className="absolute inset-0 w-24 h-24 rounded-2xl bg-slate-400/20 blur-xl scale-110" />
              <div className="relative w-24 h-24 rounded-2xl bg-slate-700 flex items-center justify-center shadow-xl">
                <RobotIcon size={52} className="text-white" />
              </div>
              {/* Online badge */}
              <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 shadow-md border-2 border-white">
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">
              GM AI Support
            </h2>
            <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed">
              Instant answers about your academic points, squad, phases, and OD requests — grounded in real-time portal data.
            </p>

            {/* Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mb-4">
              {PROMPT_CARDS.map(card => (
                <button
                  key={card.label}
                  onClick={() => send(card.prompt)}
                  disabled={loading}
                  className="group flex items-start gap-3 text-left p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all duration-150 disabled:opacity-50"
                >
                  <span className="text-xl shrink-0 mt-0.5">{card.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-slate-900">{card.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{card.hint}</p>
                  </div>
                  <svg className="w-4 h-4 shrink-0 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── MESSAGE THREAD ─────────────────────────────────────────────── */}
        {!isWelcome && (
          <div className="py-4 space-y-2">
            {messages.map(m => {
              const isUser = m.sender === "user";
              return (
                <div
                  key={m.id}
                  className={`group flex gap-3 px-4 sm:px-8 py-2 max-w-4xl mx-auto w-full ${isUser ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  {isUser ? (
                    <div className="shrink-0 w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white shadow">
                      {userInitial}
                    </div>
                  ) : (
                    <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center shadow ring-2 ring-white mt-0.5">
                      <RobotIcon size={18} className="text-white" />
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={`flex flex-col gap-1.5 ${isUser ? "items-end max-w-[72%]" : "flex-1 min-w-0"}`}>
                    {isUser ? (
                      <div className="bg-slate-800 text-white px-4 py-3 rounded-2xl rounded-tr-sm shadow-md text-sm leading-relaxed whitespace-pre-wrap">
                        {m.text}
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                        <RichMarkdownRenderer content={m.text} />
                      </div>
                    )}

                    {/* Meta */}
                    <div className={`flex items-center gap-2 px-1 ${isUser ? "flex-row-reverse" : ""}`}>
                      <span className="text-[10px] text-slate-400">{m.ts}</span>
                      {!isUser && <ModeBadge mode={m.mode} />}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <CopyBtn text={m.text} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && <TypingDots />}
            <div ref={bottomRef} className="h-4" />
          </div>
        )}

        {isWelcome && <div ref={bottomRef} />}
      </div>

      {/* ══ INPUT DOCK ══════════════════════════════════════════════════════ */}
      <div className="shrink-0 bg-white border-t border-slate-200 px-4 sm:px-8 pt-3 pb-5">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-2">

          {/* Suggestion Pills */}
          {suggestions.length > 0 && !loading && (
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  className="shrink-0 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-full transition-all whitespace-nowrap shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input Capsule */}
          <div className={`flex items-end gap-3 rounded-2xl border-2 px-4 py-3 transition-all duration-200 shadow-sm ${
            focused
              ? "border-slate-500 shadow-slate-200 shadow-md bg-white"
              : "border-slate-200 hover:border-slate-300 bg-slate-50"
          }`}>
            <textarea
              ref={taRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Ask about points, squads, phases, OD requests…"
              disabled={loading}
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none resize-none leading-relaxed max-h-36 min-h-[22px] disabled:cursor-not-allowed"
            />
            <button
              onClick={() => send()}
              disabled={!canSend}
              className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 shadow-sm ${
                canSend
                  ? "bg-slate-800 text-white hover:bg-slate-900 active:scale-95 shadow-slate-300 hover:shadow-md"
                  : "bg-slate-100 text-slate-300 cursor-not-allowed"
              }`}
            >
              {loading
                ? <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                : <SendIcon />
              }
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] text-slate-400 leading-snug">
            GM Portal Assistant · Real-time data grounded · Verify critical details in the portal.
          </p>
        </div>
      </div>
    </div>
  );
}
