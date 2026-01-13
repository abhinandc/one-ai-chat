import { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Custom code block with syntax highlighting
const CodeBlock = memo(function CodeBlock({
  language,
  children,
}: {
  language: string;
  children: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Map common language aliases
  const normalizeLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      jsx: 'jsx',
      tsx: 'tsx',
      py: 'python',
      rb: 'ruby',
      rs: 'rust',
      go: 'go',
      sh: 'bash',
      bash: 'bash',
      shell: 'bash',
      zsh: 'bash',
      yml: 'yaml',
      md: 'markdown',
      json: 'json',
      html: 'html',
      css: 'css',
      scss: 'scss',
      sql: 'sql',
      graphql: 'graphql',
      gql: 'graphql',
      dockerfile: 'docker',
      docker: 'docker',
    };
    return languageMap[lang.toLowerCase()] || lang.toLowerCase();
  };

  const displayLanguage = language || 'plaintext';
  const highlightLanguage = normalizeLanguage(displayLanguage);

  return (
    <div className="relative group my-4 rounded-xl overflow-hidden border border-border-primary/30">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-graphite/80 border-b border-border-primary/20">
        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
          {displayLanguage}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1 text-accent-green" />
              <span className="text-xs text-accent-green">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </Button>
      </div>

      {/* Code */}
      <SyntaxHighlighter
        language={highlightLanguage}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: 'var(--surface-graphite)',
          fontSize: '0.875rem',
          lineHeight: '1.5',
        }}
        showLineNumbers={children.split('\n').length > 5}
        lineNumberStyle={{
          minWidth: '2.5em',
          paddingRight: '1em',
          color: 'var(--text-quaternary)',
          userSelect: 'none',
        }}
      >
        {children.trim()}
      </SyntaxHighlighter>
    </div>
  );
});

// Inline code component
const InlineCode = memo(function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 mx-0.5 bg-surface-graphite/80 border border-border-primary/30 rounded-md text-sm font-mono text-accent-blue">
      {children}
    </code>
  );
});

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  return (
    <div className={cn('prose prose-sm max-w-none dark:prose-invert', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        // Code blocks and inline code
        code({ node, inline, className: codeClassName, children, ...props }) {
          const match = /language-(\w+)/.exec(codeClassName || '');
          const language = match ? match[1] : '';
          const codeString = String(children).replace(/\n$/, '');

          if (!inline && (language || codeString.includes('\n'))) {
            return <CodeBlock language={language}>{codeString}</CodeBlock>;
          }

          return <InlineCode>{children}</InlineCode>;
        },

        // Headings
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold text-text-primary mt-6 mb-4 first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-semibold text-text-primary mt-5 mb-3">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold text-text-primary mt-4 mb-2">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-base font-medium text-text-primary mt-3 mb-2">
            {children}
          </h4>
        ),

        // Paragraphs
        p: ({ children }) => (
          <p className="text-text-primary leading-relaxed mb-3 last:mb-0">
            {children}
          </p>
        ),

        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-1 mb-3 text-text-primary ml-2">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1 mb-3 text-text-primary ml-2">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-text-primary">
            {children}
          </li>
        ),

        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-blue hover:text-accent-blue/80 underline underline-offset-2 inline-flex items-center gap-1"
          >
            {children}
            <ExternalLink className="h-3 w-3" />
          </a>
        ),

        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-accent-blue/50 pl-4 py-1 my-3 bg-accent-blue/5 rounded-r-lg italic text-text-secondary">
            {children}
          </blockquote>
        ),

        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto my-4 rounded-lg border border-border-primary/30">
            <table className="min-w-full divide-y divide-border-primary/20">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-surface-graphite/50">
            {children}
          </thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-border-primary/10">
            {children}
          </tbody>
        ),
        tr: ({ children }) => (
          <tr className="hover:bg-surface-graphite/20 transition-colors">
            {children}
          </tr>
        ),
        th: ({ children }) => (
          <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2 text-sm text-text-primary">
            {children}
          </td>
        ),

        // Horizontal rule
        hr: () => (
          <hr className="my-6 border-border-primary/30" />
        ),

        // Strong and emphasis
        strong: ({ children }) => (
          <strong className="font-semibold text-text-primary">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic text-text-primary">
            {children}
          </em>
        ),

        // Images
        img: ({ src, alt }) => (
          <img
            src={src}
            alt={alt || ''}
            className="max-w-full h-auto rounded-lg my-4 border border-border-primary/30"
            loading="lazy"
          />
        ),
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
