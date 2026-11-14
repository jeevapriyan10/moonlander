"use client";

import React from "react";
import { glossary } from "@/data";
import { Popover } from "./Popover";
import { Badge } from "./Badge";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export interface TermProps {
  id: string;
  children?: React.ReactNode;
  className?: string;
}

export const Term: React.FC<TermProps> = ({ id, children, className }) => {
  const termData = glossary.find((t) => t.id === id);

  if (!termData) {
    return <span className={className}>{children ?? id}</span>;
  }

  const trigger = (
    <span
      className={`underline decoration-dotted decoration-telemetry-cyan/60 hover:decoration-telemetry-cyan cursor-help text-gray-200 hover:text-telemetry-cyan transition-colors ${className ?? ""}`}
      title={termData.shortDefinition}
    >
      {children ?? termData.term}
    </span>
  );

  return (
    <Popover trigger={trigger} className="w-80">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-space-border pb-1.5">
          <h4 className="font-heading uppercase text-xs tracking-wider text-telemetry-cyan font-bold">
            {termData.term}
          </h4>
          <Badge variant="info" size="sm">
            {termData.category}
          </Badge>
        </div>

        <p className="text-xs font-mono text-gray-300 leading-relaxed">
          {termData.shortDefinition}
        </p>

        {termData.formula && (
          <div className="p-1.5 rounded bg-black/40 border border-space-border/60 text-center font-mono text-[11px] text-telemetry-amber">
            <code>{termData.formula}</code>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Link
            href={`/learn#${termData.id}`}
            className="text-[10px] font-mono text-telemetry-cyan hover:underline flex items-center gap-1"
          >
            <BookOpen className="w-3 h-3" />
            Full Glossary Entry
          </Link>
        </div>
      </div>
    </Popover>
  );
};
