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
    <div className="min-h-screen bg-gray-100 pt-12 relative">
      {/* 模板渲染区 */}
      <div className="py-8 max-w-4xl mx-auto">
        <ResumeWithTemplate
          resumeData={specialData}
          templateId={selectedTemplate}
          className="shadow-2xl"
        />
      </div>

      {/* 模板选择器 */}
      <div className="bg-white shadow-md fixed top-0 left-0 w-36 pt-12 h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`px-4 py-2 rounded-lg border transition-all text-left ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow'
                }`}
              >
                <div className="font-semibold text-gray-900 mb-1">{template.name}</div>
                {/* <div className="text-xs text-gray-600">{template.description}</div> */}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateDemo;
