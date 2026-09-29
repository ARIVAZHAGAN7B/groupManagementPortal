import React, { useState } from "react";
import { Link } from "react-router-dom";

/* Inline token parser: **bold**, `code/badge`, [link](url), _italic_ */
function parseInline(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|`[^`]+`|\[.*?\]\(.*?\)|_.*?_)/g);
  return parts.map((t, i) => {
    // Bold
    if (t.startsWith("**") && t.endsWith("**")) {
      return <strong key={i} className="font-semibold text-slate-900">{t.slice(2, -2)}</strong>;
    }
    // Italic
    if (t.startsWith("_") && t.endsWith("_")) {
      return <em key={i} className="italic text-slate-700">{t.slice(1, -1)}</em>;
    }
    // Inline code / badge
    if (t.startsWith("`") && t.endsWith("`")) {
      const val = t.slice(1, -1);
      const roleSet = new Set(["CAPTAIN", "VICE_CAPTAIN", "STRATEGIST", "MANAGER", "LEADER"]);
      const okSet   = new Set(["ACTIVE", "APPROVED", "COMPLETED", "ELIGIBLE", "PASS"]);
      const warnSet = new Set(["PENDING", "FROZEN", "REVIEW", "WAITING"]);
      const errSet  = new Set(["REJECTED", "INELIGIBLE", "FAIL", "ERROR", "BLOCKED"]);
      let cls = "bg-slate-100 text-slate-700 border-slate-200";
      if (roleSet.has(val)) cls = "bg-purple-50 text-purple-700 border-purple-200";
      else if (okSet.has(val)) cls = "bg-emerald-50 text-emerald-700 border-emerald-200";
      else if (warnSet.has(val)) cls = "bg-amber-50 text-amber-700 border-amber-200";
      else if (errSet.has(val)) cls = "bg-red-50 text-red-700 border-red-200";
      return (
        <code key={i} className={`inline-block px-1.5 py-0.5 rounded-md text-[11px] font-mono font-semibold border ${cls}`}>
          {val}
        </code>
      );
    }
    // Link
    const m = t.match(/^\[(.*?)\]\((.*?)\)$/);
    if (m) {
      const [, title, url] = m;
      const isExternal = url.startsWith("http");
      if (isExternal) return <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2">{title} <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" /></svg></a>;
      return <Link key={i} to={url} className="inline-flex items-center gap-0.5 text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2">{title}</Link>;
    }
    return t;
  });
}

export default function RichMarkdownRenderer({ content }) {
  const [copiedIdx, setCopiedIdx] = useState(null);
  if (!content) return null;

  const copyCode = (code, idx) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const lines = content.split("\n");
  const els = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    /* ── Fenced code block ─────────────────────────────────────────────── */
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim() || "code";
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) { codeLines.push(lines[i]); i++; }
      i++;
      const code = codeLines.join("\n");
      const idx = i;
      els.push(
        <div key={`code-${idx}`} className="my-4 rounded-xl overflow-hidden border border-slate-800 bg-[#0d1117] shadow-lg">
          <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 tracking-wide">{lang}</span>
            <button
              onClick={() => copyCode(code, idx)}
              className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors"
            >
              {copiedIdx === idx
                ? <><svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg><span className="text-emerald-400">Copied</span></>
                : <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg><span>Copy</span></>
              }
            </button>
          </div>
          <pre className="px-4 py-3.5 text-[12px] font-mono text-slate-200 overflow-x-auto leading-[1.7]">
            <code>{code}</code>
          </pre>
        </div>
      );
      continue;
    }

    /* ── Markdown table ────────────────────────────────────────────────── */
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableRows = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableRows.push(lines[i].trim()); i++;
      }
      if (tableRows.length >= 2) {
        const headers = tableRows[0].split("|").slice(1, -1).map(c => c.trim());
        const rows = tableRows.slice(2).map(r => r.split("|").slice(1, -1).map(c => c.trim()));
        els.push(
          <div key={`tbl-${i}`} className="my-4 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm text-left text-slate-700">
              <thead>
                <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
                  {headers.map((h, ci) => (
                    <th key={ci} className="px-4 py-2.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                      {parseInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} className={`border-b border-slate-100 transition-colors ${ri % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-indigo-50/40`}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-2.5 text-xs text-slate-700 whitespace-nowrap">
                        {parseInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    /* ── Horizontal rule ───────────────────────────────────────────────── */
    if (/^---+$/.test(trimmed)) {
      els.push(<hr key={`hr-${i}`} className="my-4 border-slate-200" />);
      i++; continue;
    }

    /* ── H1 ────────────────────────────────────────────────────────────── */
    if (line.startsWith("# ")) {
      els.push(
        <h2 key={`h1-${i}`} className="text-lg font-extrabold text-slate-900 mt-5 mb-2 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-gradient-to-b from-violet-500 to-indigo-600 inline-block" />
          {parseInline(line.slice(2))}
        </h2>
      );
      i++; continue;
    }

    /* ── H2 ────────────────────────────────────────────────────────────── */
    if (line.startsWith("## ")) {
      els.push(
        <h3 key={`h2-${i}`} className="text-base font-bold text-slate-900 mt-4 mb-1.5 flex items-center gap-2">
          <span className="w-0.5 h-4 rounded-full bg-indigo-500 inline-block" />
          {parseInline(line.slice(3))}
        </h3>
      );
      i++; continue;
    }

    /* ── H3 ────────────────────────────────────────────────────────────── */
    if (line.startsWith("### ")) {
      els.push(
        <h4 key={`h3-${i}`} className="text-sm font-bold text-slate-800 mt-3 mb-1">
          {parseInline(line.slice(4))}
        </h4>
      );
      i++; continue;
    }

    /* ── Bullet list ───────────────────────────────────────────────────── */
    const isBullet = /^[\-\*•]\s+/.test(trimmed);
    if (isBullet) {
      const txt = trimmed.replace(/^[\-\*•]\s+/, "");
      const isIndented = line.startsWith("  ") || line.startsWith("\t");
      els.push(
        <div key={`li-${i}`} className={`flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed ${isIndented ? "ml-4 my-0.5" : "my-1"}`}>
          <span className={`shrink-0 mt-[3px] rounded-full ${isIndented ? "w-1 h-1 bg-slate-400" : "w-1.5 h-1.5 bg-indigo-500"}`} />
          <span className="flex-1">{parseInline(txt)}</span>
        </div>
      );
      i++; continue;
    }

    /* ── Numbered list ─────────────────────────────────────────────────── */
    const numM = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numM) {
      els.push(
        <div key={`nl-${i}`} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed my-1">
          <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold mt-0.5 border border-indigo-200">
            {numM[1]}
          </span>
          <span className="flex-1">{parseInline(numM[2])}</span>
        </div>
      );
      i++; continue;
    }

    /* ── Blockquote ────────────────────────────────────────────────────── */
    if (trimmed.startsWith("> ")) {
      els.push(
        <div key={`bq-${i}`} className="my-3 pl-4 border-l-4 border-indigo-300 bg-indigo-50/60 py-2 pr-3 rounded-r-lg">
          <p className="text-sm text-slate-700 italic">{parseInline(trimmed.slice(2))}</p>
        </div>
      );
      i++; continue;
    }

    /* ── Empty line ────────────────────────────────────────────────────── */
    if (!trimmed) {
      els.push(<div key={`br-${i}`} className="h-2" />);
      i++; continue;
    }

    /* ── Paragraph ─────────────────────────────────────────────────────── */
    els.push(
      <p key={`p-${i}`} className="text-sm text-slate-700 leading-relaxed my-1">
        {parseInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{els}</div>;
}
