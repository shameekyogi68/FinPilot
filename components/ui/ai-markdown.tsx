"use client"

import Markdown from "markdown-to-jsx"

// Lightweight, safe (no dangerouslySetInnerHTML) renderer for AI-authored text,
// which regularly comes back with basic markdown (**bold**, ### headers, - lists).
export function AiMarkdown({
  content,
  className,
  block = true,
}: {
  content: string
  className?: string
  block?: boolean
}) {
  return (
    <Markdown
      className={className}
      options={{
        forceBlock: block,
        overrides: {
          h1: { component: "p", props: { className: "font-semibold text-[14px] mt-2.5 mb-1 first:mt-0" } },
          h2: { component: "p", props: { className: "font-semibold text-[14px] mt-2.5 mb-1 first:mt-0" } },
          h3: { component: "p", props: { className: "font-semibold text-[13px] mt-2.5 mb-1 first:mt-0" } },
          p: { props: { className: "mb-2 last:mb-0" } },
          ul: { props: { className: "list-disc pl-4 space-y-1 mb-2" } },
          ol: { props: { className: "list-decimal pl-4 space-y-1 mb-2" } },
          strong: { props: { className: "font-semibold text-[#14131F]" } },
        },
      }}
    >
      {content}
    </Markdown>
  )
}
