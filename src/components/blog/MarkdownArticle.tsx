import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { slugifyHeading } from "@/lib/blog";
import type { ReactNode } from "react";

function textOf(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(textOf).join("");
  if (children && typeof children === "object" && "props" in (children as never)) {
    return textOf((children as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

/**
 * The article body. No typography plugin in this project, so every element is
 * styled here against the site tokens: serif display headings, a comfortable
 * measure, hairline rules and mono for tables.
 */
export function MarkdownArticle({ body }: { body: string }) {
  return (
    <div className="text-[1.0625rem] leading-[1.75] text-foreground/85">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2
              id={slugifyHeading(textOf(children))}
              className="mt-12 scroll-mt-24 border-t border-border pt-6 font-display text-2xl font-bold tracking-[-.02em] text-foreground sm:text-3xl"
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-8 font-display text-xl font-bold text-foreground">{children}</h3>
          ),
          p: ({ children }) => <p className="mt-4">{children}</p>,
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
              {...(href?.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          ul: ({ children }) => <ul className="mt-4 space-y-2 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="mt-4 list-decimal space-y-2 pl-5">{children}</ol>,
          li: ({ children }) => (
            <li className="relative marker:text-primary/60 [ul>&]:list-none [ul>&]:before:absolute [ul>&]:before:-left-4 [ul>&]:before:text-primary/70 [ul>&]:before:content-['·']">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mt-6 border-l-2 border-primary/60 pl-4 font-display text-lg italic text-foreground/80">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-10 border-border" />,
          code: ({ children }) => (
            <code className="data-mono rounded bg-muted px-1.5 py-0.5 text-[0.85em] text-foreground">
              {children}
            </code>
          ),
          table: ({ children }) => (
            <div className="mt-6 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-foreground/30 text-left">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="science-label whitespace-nowrap py-2 pr-4 align-bottom text-foreground/70">
              {children}
            </th>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-border last:border-0">{children}</tr>
          ),
          td: ({ children }) => (
            <td className="data-mono py-3 pr-4 align-top text-[0.8125rem] text-foreground/80">
              {children}
            </td>
          ),
          img: ({ src, alt }) => (
            <figure className="mt-8">
              <img src={typeof src === "string" ? src : ""} alt={alt ?? ""} className="w-full" />
              {alt && (
                <figcaption className="data-mono mt-2 text-xs text-muted-foreground">
                  {alt}
                </figcaption>
              )}
            </figure>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
