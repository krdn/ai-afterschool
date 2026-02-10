"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-gray-900 mt-6 mb-3 pb-2 border-b border-gray-200">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-bold text-gray-800 mt-5 mb-2">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-gray-700 mt-3 mb-1">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="my-2 leading-7">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-600">{children}</em>
  ),
  ul: ({ children }) => (
    <ul className="my-2 ml-4 space-y-1 list-disc">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 ml-4 space-y-1 list-decimal">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-7">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 pl-4 border-l-4 border-purple-300 bg-purple-50/50 py-2 pr-3 rounded-r-md text-gray-700 italic">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-")
    if (isBlock) {
      return (
        <code className="block bg-gray-900 text-gray-100 rounded-md p-4 my-3 text-xs leading-6 overflow-x-auto font-mono">
          {children}
        </code>
      )
    }
    return (
      <code className="px-1.5 py-0.5 bg-gray-100 text-pink-600 rounded text-xs font-mono">
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="my-3">{children}</pre>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-md border border-gray-200">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-gray-50 border-b border-gray-200">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-gray-100">{children}</tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-gray-50/50">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-sm text-gray-700">{children}</td>
  ),
  hr: () => (
    <hr className="my-4 border-gray-200" />
  ),
  a: ({ href, children }) => (
    <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
}

type Props = {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = "" }: Props) {
  return (
    <div className={`markdown-rendered text-sm text-gray-700 leading-7 ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
