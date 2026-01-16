/**
 * Analysis Markdown Renderer Component
 * Renders analysis results in Markdown format with fallbacks for other types
 */

import MarkdownRenderer from '@/components/ui/Markdown';

interface AnalysisMarkdownRendererProps {
  content: Record<string, any> | null;
  loading?: boolean;
}

export const AnalysisMarkdownRenderer: React.FC<AnalysisMarkdownRendererProps> = ({
  content,
  loading = false,
}) => {
  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // No content
  if (!content) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-gray-500">暂无分析结果</p>
      </div>
    );
  }

  // Detect content type and render accordingly
  const renderContent = () => {
    if (content.text) {
      // Render as Markdown
      return <MarkdownRenderer content={content.text || ''} />;
    }
    // Fallback: render as plain text
    return (
      <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 whitespace-pre-wrap text-sm">
        {String(content)}
      </pre>
    );
  };

  return (
    <div className="">
      {/* <h2 className="text-xl font-semibold text-gray-900 mb-4">分析结果</h2> */}
      <div className="prose prose-sm max-w-none">
        {renderContent()}
      </div>
    </div>
  );
};

export default AnalysisMarkdownRenderer;
