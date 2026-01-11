import ReactMarkdown from 'react-markdown';
import './markdown.css';

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
          p: ({ children, ...props }) => (
            <p className="mb-2 last:mb-0 leading-relaxed break-words" {...props}>
              {children}
            </p>
          ),
          // 标题样式
          h1: ({ children, ...props }) => (
            <h1 className="text-lg font-semibold mb-2 break-words" {...props}>{children}</h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-base font-semibold mb-2 break-words" {...props}>{children}</h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-sm font-semibold mb-1 break-words" {...props}>{children}</h3>
          ),
          // 列表样式
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside mb-2 space-y-1 break-words" {...props}>{children}</ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1 break-words" {...props}>{children}</ol>
          ),
          li: ({ children, ...props }) => (
            <li className="break-words" {...props}>
              {children}
            </li>
          ),
          // 代码块样式
          code: (props) => {
            let { inline, children } = props as any;
            inline = true; // 识别有误，先写死true
            if (inline) {
              return (
                <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono break-all">
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
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 border-gray-300 pl-3 mb-2 text-gray-700 break-words" {...props}>
              {children}
            </blockquote>
          ),
          // 强调样式
          strong: ({ children, ...props }) => (
            <strong className="font-semibold break-words" {...props}>{children}</strong>
          ),
          em: ({ children, ...props }) => (
            <em className="italic break-words" {...props}>{children}</em>
          ),
          // 链接样式
          a: ({ href, children, ...props }) => (
            <a 
              href={href} 
              className="text-blue-600 hover:text-blue-800 underline break-all"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
          // 表格样式
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full border-collapse border border-gray-300 text-xs" {...props}>
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th className="border border-gray-300 px-2 py-1 bg-gray-100 font-semibold text-left break-words" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border border-gray-300 px-2 py-1 break-words" {...props}>
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
