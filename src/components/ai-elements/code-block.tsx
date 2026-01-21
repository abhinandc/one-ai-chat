"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckIcon, CopyIcon } from "lucide-react";
import { memo, useState, type ComponentProps } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export type CodeBlockProps = ComponentProps<"div"> & {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  filename?: string;
};

export const CodeBlock = memo(function CodeBlock({
  code,
  language = "text",
  showLineNumbers = false,
  filename,
  className,
  ...props
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border border-border bg-muted/30",
        className
      )}
      {...props}
    >
      {/* Header with filename and copy button */}
      <div className="flex items-center justify-between border-b border-border/50 bg-muted/50 px-3 py-1.5">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          {filename || language || "code"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[11px] opacity-0 transition-opacity group-hover:opacity-100"
          onClick={copyToClipboard}
        >
          {copied ? (
            <>
              <CheckIcon className="h-3 w-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <CopyIcon className="h-3 w-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      {/* Code content */}
      <SyntaxHighlighter
        style={oneDark}
        language={language}
        showLineNumbers={showLineNumbers}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: "0.75rem",
          fontSize: "12px",
          lineHeight: "1.5",
          background: "transparent",
        }}
        codeTagProps={{
          style: {
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
});

// Terminal-style output component
export type TerminalBlockProps = ComponentProps<"div"> & {
  lines: string[];
  title?: string;
  showPrompt?: boolean;
};

export const TerminalBlock = memo(function TerminalBlock({
  lines,
  title = "Terminal",
  showPrompt = true,
  className,
  ...props
}: TerminalBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "group overflow-hidden rounded-lg border border-border bg-zinc-900 text-zinc-100",
        className
      )}
      {...props}
    >
      {/* Terminal header */}
      <div className="flex items-center justify-between border-b border-zinc-700 bg-zinc-800 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="h-3 w-3 rounded-full bg-yellow-500" />
            <span className="h-3 w-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs font-medium text-zinc-400">{title}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[11px] text-zinc-400 hover:text-zinc-200 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={copyToClipboard}
        >
          {copied ? (
            <>
              <CheckIcon className="h-3 w-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <CopyIcon className="h-3 w-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      {/* Terminal content */}
      <div className="p-3 font-mono text-sm">
        {lines.map((line, index) => (
          <div key={index} className="flex">
            {showPrompt && (
              <span className="mr-2 text-green-400 select-none">$</span>
            )}
            <span className="text-zinc-100">{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

// Artifact display component for structured data
export type ArtifactProps = ComponentProps<"div"> & {
  title: string;
  type: "code" | "json" | "markdown" | "table" | "image" | "file";
  content: string | object | string[][];
  language?: string;
};

export const Artifact = memo(function Artifact({
  title,
  type,
  content,
  language,
  className,
  ...props
}: ArtifactProps) {
  const [copied, setCopied] = useState(false);

  const getContentString = () => {
    if (typeof content === "string") return content;
    return JSON.stringify(content, null, 2);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(getContentString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = () => {
    switch (type) {
      case "code":
        return (
          <SyntaxHighlighter
            style={oneDark}
            language={language || "javascript"}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: "1rem",
              fontSize: "12px",
              lineHeight: "1.5",
              background: "transparent",
            }}
          >
            {content as string}
          </SyntaxHighlighter>
        );
      case "json":
        return (
          <SyntaxHighlighter
            style={oneDark}
            language="json"
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: "1rem",
              fontSize: "12px",
              lineHeight: "1.5",
              background: "transparent",
            }}
          >
            {typeof content === "string"
              ? content
              : JSON.stringify(content, null, 2)}
          </SyntaxHighlighter>
        );
      case "table":
        const tableData = content as string[][];
        if (!Array.isArray(tableData) || tableData.length === 0) {
          return <div className="p-4 text-muted-foreground">No data</div>;
        }
        const headers = tableData[0];
        const rows = tableData.slice(1);
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/50">
                  {headers.map((header, i) => (
                    <th
                      key={i}
                      className="px-4 py-2 text-left font-medium text-muted-foreground"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-border/30">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "markdown":
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none p-4">
            {content as string}
          </div>
        );
      case "image":
        return (
          <div className="p-4">
            <img
              src={content as string}
              alt={title}
              className="max-w-full h-auto rounded-md"
            />
          </div>
        );
      default:
        return (
          <div className="p-4 font-mono text-sm whitespace-pre-wrap">
            {getContentString()}
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "group overflow-hidden rounded-xl border border-border bg-card",
        className
      )}
      {...props}
    >
      {/* Artifact header */}
      <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs text-muted-foreground uppercase">
            {type}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
          onClick={copyToClipboard}
        >
          {copied ? (
            <>
              <CheckIcon className="h-3.5 w-3.5 mr-1" />
              Copied
            </>
          ) : (
            <>
              <CopyIcon className="h-3.5 w-3.5 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      {/* Artifact content */}
      <div className="max-h-96 overflow-auto">{renderContent()}</div>
    </div>
  );
});
