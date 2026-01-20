import React, { useState } from 'react';
import { ResumeWithTemplate, templates } from '@/components/templates';
import { specialData } from '@/types/resume';

/**
 * TemplateDemo - 模板展示页面
 * 用于预览和对比所有可用的简历模板
 */
export const TemplateDemo: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0].id);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 模板选择器 */}
      <div className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">简历模板预览</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow'
                }`}
              >
                <div className="font-semibold text-gray-900 mb-1">{template.name}</div>
                <div className="text-xs text-gray-600">{template.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 模板渲染区 */}
      <div className="py-8 max-w-4xl mx-auto">
        <ResumeWithTemplate
          resumeData={specialData}
          templateId={selectedTemplate}
          className="shadow-2xl"
        />
      </div>
    </div>
  );
};

export default TemplateDemo;
