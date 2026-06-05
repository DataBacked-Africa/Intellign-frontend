"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownMessageProps {
  content: string;
  className?: string;
  inverted?: boolean;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({
  content,
  className,
  inverted = false,
}) => {
  const text   = inverted ? "text-white/90" : "text-gray-800";
  const border = inverted ? "border-white/20" : "border-gray-200";
  const thead  = inverted ? "bg-white/10"    : "bg-gray-50";
  const code   = inverted ? "bg-white/10 text-white" : "bg-black/5 text-gray-800";

  return (
    <div className={cn("text-sm leading-relaxed", text, className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className={cn("overflow-x-auto my-2 rounded-lg border text-xs", border)}>
              <table className="w-full border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className={cn("border-b", border, thead)}>{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">{children}</th>
          ),
          td: ({ children }) => (
            <td className={cn("px-3 py-2 border-t", border)}>{children}</td>
          ),
          tr: ({ children }) => <tr>{children}</tr>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children, className: cls }) => {
            const isBlock = cls?.includes("language-");
            if (isBlock) {
              return (
                <pre className={cn("rounded-lg p-3 my-2 text-xs overflow-x-auto", code)}>
                  <code>{children}</code>
                </pre>
              );
            }
            return (
              <code className={cn("px-1 py-0.5 rounded text-[11px] font-mono", code)}>
                {children}
              </code>
            );
          },
          ul: ({ children }) => <ul className="my-1 space-y-0.5 pl-1">{children}</ul>,
          ol: ({ children }) => <ol className="my-1 space-y-0.5 pl-4 list-decimal">{children}</ol>,
          li: ({ children }) => (
            <li className="flex items-start gap-1.5 text-sm">
              <span className="mt-[7px] w-1 h-1 rounded-full bg-current flex-shrink-0 opacity-40" />
              <span>{children}</span>
            </li>
          ),
          p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
          blockquote: ({ children }) => (
            <blockquote className={cn("border-l-2 pl-3 my-1 opacity-70", border)}>
              {children}
            </blockquote>
          ),
          h1: ({ children }) => <h3 className="font-bold text-base mt-2 mb-1">{children}</h3>,
          h2: ({ children }) => <h4 className="font-bold text-sm mt-2 mb-1">{children}</h4>,
          h3: ({ children }) => <h5 className="font-semibold text-sm mt-1 mb-0.5">{children}</h5>,
          hr: () => <hr className={cn("my-2 border-t", border)} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
