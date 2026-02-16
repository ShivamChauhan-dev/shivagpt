"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="mb-2 break-words last:mb-0">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-bold">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => (
          <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>
        ),
        li: ({ children }) => <li className="break-words">{children}</li>,
        h1: ({ children }) => (
          <h1 className="mb-2 text-xl font-bold">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-2 text-lg font-bold">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-1 text-base font-bold">{children}</h3>
        ),
        code: ({ className, children, ...rest }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <div className="group relative my-2">
                <pre className="overflow-x-auto rounded-lg bg-black/40 p-3 text-xs">
                  <code className={className} {...rest}>
                    {children}
                  </code>
                </pre>
                <button
                  type="button"
                  className="absolute right-2 top-2 rounded bg-white/10 px-2 py-0.5 text-[10px] text-white/70 opacity-0 transition hover:bg-white/20 group-hover:opacity-100"
                  onClick={() => {
                    const text =
                      typeof children === "string"
                        ? children
                        : String(children);
                    navigator.clipboard.writeText(text);
                  }}
                >
                  Copy
                </button>
              </div>
            );
          }
          return (
            <code
              className="rounded bg-black/30 px-1.5 py-0.5 text-xs"
              {...rest}
            >
              {children}
            </code>
          );
        },
        blockquote: ({ children }) => (
          <blockquote className="my-2 border-l-2 border-white/30 pl-3 italic opacity-80">
            {children}
          </blockquote>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="break-all text-blue-300 underline hover:text-blue-200"
          >
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="my-2 overflow-x-auto">
            <table className="w-full border-collapse text-xs">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-white/20 bg-white/10 px-2 py-1 text-left font-semibold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-white/10 px-2 py-1">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
