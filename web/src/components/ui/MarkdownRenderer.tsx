import ReactMarkdown from 'react-markdown';
import type { ReactNode } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Markdown渲染器组件
 * 用于渲染AI回复消息中的markdown内容，并确保内容不超出容器宽度
 */
export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content overflow-hidden ${className}`}>
      <ReactMarkdown
        components={{
          // 段落样式
          p: ({ children }: { children: ReactNode }) => (
            <p className="mb-2 last:mb-0 leading-relaxed break-words">{children}</p>
          ),
          // 标题样式
          h1: ({ children }: { children: ReactNode }) => (
            <h1 className="text-lg font-semibold mb-2 break-words">{children}</h1>
          ),
          h2: ({ children }: { children: ReactNode }) => (
            <h2 className="text-base font-semibold mb-2 break-words">{children}</h2>
          ),
          h3: ({ children }: { children: ReactNode }) => (
            <h3 className="text-sm font-semibold mb-1 break-words">{children}</h3>
          ),
          // 列表样式
          ul: ({ children }: { children: ReactNode }) => (
            <ul className="list-disc list-inside mb-2 space-y-1 break-words">{children}</ul>
          ),
          ol: ({ children }: { children: ReactNode }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1 break-words">{children}</ol>
          ),
          li: ({ children }: { children: ReactNode }) => (
            <li className="break-words">{children}</li>
          ),
          // 代码块样式
          code: ({ inline, children }: { inline?: boolean; children: ReactNode }) => {
            if (inline) {
              return (
                <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono break-all">
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto mb-2">
                <code className="break-all">{children}</code>
              </pre>
            );
          },
          // 引用样式
          blockquote: ({ children }: { children: ReactNode }) => (
            <blockquote className="border-l-4 border-gray-300 pl-3 mb-2 text-gray-700 break-words">
              {children}
            </blockquote>
          ),
          // 强调样式
          strong: ({ children }: { children: ReactNode }) => (
            <strong className="font-semibold break-words">{children}</strong>
          ),
          em: ({ children }: { children: ReactNode }) => (
            <em className="italic break-words">{children}</em>
          ),
          // 链接样式
          a: ({ href, children }: { href?: string; children: ReactNode }) => (
            <a 
              href={href} 
              className="text-blue-600 hover:text-blue-800 underline break-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          // 表格样式
          table: ({ children }: { children: ReactNode }) => (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full border-collapse border border-gray-300 text-xs">
                {children}
              </table>
            </div>
          ),
          th: ({ children }: { children: ReactNode }) => (
            <th className="border border-gray-300 px-2 py-1 bg-gray-100 font-semibold text-left break-words">
              {children}
            </th>
          ),
          td: ({ children }: { children: ReactNode }) => (
            <td className="border border-gray-300 px-2 py-1 break-words">
              {children}
            </td>
          ),
          // 水平分割线
          hr: () => <hr className="border-gray-300 my-2" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
