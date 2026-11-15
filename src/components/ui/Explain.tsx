"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { codex, type CodexEntry } from "@/data";
import { useSettingsStore } from "@/store/settings";
import { toPlainLanguage } from "@/lib/plainLanguage";
import { Popover } from "./Popover";
import { Badge } from "./Badge";
import { BookOpen, ExternalLink, Lightbulb, History, Sparkles } from "lucide-react";

export interface ExplainProps {
  id: string;
  term?: string;
  fallback?: string;
  children?: React.ReactNode;
  className?: string;
  showBadge?: boolean;
}

export const Explain: React.FC<ExplainProps> = ({
  id,
  term,
  fallback,
  children,
  className = "",
  showBadge = false,
}) => {
  const plainLanguage = useSettingsStore((state) => state.plainLanguage);

  // Match entry by ID or normalized name
  const entry: CodexEntry | undefined = useMemo(() => {
    const direct = codex.find((e) => e.id.toLowerCase() === id.toLowerCase());
    if (direct) return direct;

    const lowerId = id.toLowerCase().replace(/[\s_]+/g, "-");
    const fuzzy = codex.find((e) => e.id.toLowerCase() === lowerId);
    if (fuzzy) return fuzzy;

    return codex.find(
      (e) =>
        e.name.toLowerCase().includes(id.toLowerCase()) ||
        (e.plainLanguageName && e.plainLanguageName.toLowerCase().includes(id.toLowerCase()))
    );
  }, [id]);

  // Determine display text
  const displayText = useMemo(() => {
    if (children) return children;
    const base = term || (entry ? entry.name : id);
    if (plainLanguage) {
      if (entry?.plainLanguageName) return entry.plainLanguageName;
      return toPlainLanguage(base, true);
    }
    return base;
  }, [children, term, entry, id, plainLanguage]);

  if (!entry) {
    return (
      <span
        className={`underline decoration-dotted decoration-slate-500/60 cursor-help text-slate-300 hover:text-white ${className}`}
        title={fallback || id}
      >
        {displayText}
      </span>
    );
  }

  const trigger = (
    <span
      className={`inline-flex items-center gap-1 cursor-help group transition-colors ${className}`}
      tabIndex={0}
      role="button"
      aria-label={`Explain ${entry.name}`}
    >
      <span className="underline decoration-dotted decoration-telemetry-amber/50 group-hover:decoration-telemetry-amber text-slate-200 group-hover:text-telemetry-amber transition-colors">
        {displayText}
      </span>
      {plainLanguage && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full bg-telemetry-cyan/70 group-hover:bg-telemetry-cyan transition-colors"
          title="Plain English Active"
        />
      )}
      {showBadge && (
        <Badge variant="amber" size="sm" className="ml-1 text-[10px] py-0 px-1">
          EXPLAIN
        </Badge>
      )}
    </span>
  );

  return (
    <Popover trigger={trigger} className="w-84 sm:w-96 p-3.5 bg-space-panel/95 backdrop-blur-md border border-space-border shadow-panel text-left z-50">
      <div className="flex flex-col gap-2.5">
        {/* Header: Title + Category + Mode Badge */}
        <div className="flex items-start justify-between border-b border-space-border pb-2 gap-2">
          <div>
            <h4 className="font-heading uppercase text-xs tracking-wider text-telemetry-amber font-bold leading-tight">
              {entry.name}
            </h4>
            {entry.plainLanguageName && entry.plainLanguageName !== entry.name && (
              <span className="text-[11px] font-mono text-telemetry-cyan flex items-center gap-1 mt-0.5">
                <Sparkles className="w-2.5 h-2.5" />
                {entry.plainLanguageName}
              </span>
            )}
          </div>
          <Badge variant="info" size="sm" className="shrink-0 uppercase text-[10px]">
            {entry.category}
          </Badge>
        </div>

        {/* 1-Sentence Plain-English Summary */}
        <p className="text-xs font-body text-slate-200 leading-relaxed">
          {entry.summary}
        </p>

        {/* Why this matters in your design */}
        <div className="p-2 rounded bg-space-bg/80 border border-space-border/60 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-telemetry-amber mb-1 font-semibold">
            <Lightbulb className="w-3 h-3 text-telemetry-amber shrink-0" />
            <span>Mission Impact</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-300">
            {entry.gameplayImpact}
          </p>
        </div>

        {/* Real-World Flight History */}
        <div className="flex items-start gap-1.5 text-[11px] font-mono text-slate-400">
          <History className="w-3.5 h-3.5 text-telemetry-cyan shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong className="text-slate-300">Flight Record: </strong>
            {entry.historicalExample}
          </p>
        </div>

        {/* Formula if present */}
        {entry.formula && (
          <div className="px-2 py-1.5 rounded bg-black/60 border border-space-border/70 text-center font-mono text-[11px] text-telemetry-cyan">
            <code>{entry.formula}</code>
          </div>
        )}

        {/* Footer Deep-Links */}
        <div className="flex items-center justify-between pt-1.5 border-t border-space-border/60 text-[10px] font-mono">
          <Link
            href={`/codex#${entry.id}`}
            className="text-telemetry-amber hover:text-white flex items-center gap-1 transition-colors"
          >
            <BookOpen className="w-3 h-3" />
            <span>Open in Space Codex</span>
          </Link>

          {entry.externalUrl && (
            <a
              href={entry.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-telemetry-cyan flex items-center gap-1 transition-colors"
            >
              <span>NASA Archive</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>
    </Popover>
  );
};
