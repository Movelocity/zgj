import { useState } from 'react';
import { FiCheckCircle,  FiEdit } from 'react-icons/fi';
import { Sparkles } from 'lucide-react';
import Button from "@/components/ui/Button"
import type { ResumeData } from '../types';

export default function ResumeEditor({ resumeData }: { resumeData: ResumeData }) {
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 max-w-4xl mx-auto">
        {/* 编辑提示 */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p className="font-medium text-blue-800">AI 已优化您的简历</p>
              <p className="text-sm text-blue-600">
                {isEditing 
                  ? '点击文字直接编辑，黄色高亮为 AI 优化内容'
                  : '黄色高亮部分为 AI 优化内容，点击"编辑简历"开始编辑'
                }
              </p>
            </div>
          </div>
            {!isEditing ? (
              <Button 
                onClick={() => setIsEditing(true)}
                variant="outline"
              >
                <FiEdit className="w-4 h-4 mr-2" />
                编辑简历
              </Button>
            ) : (
              <Button 
                onClick={() => setIsEditing(false)}
                variant="outline"
              >
                <FiCheckCircle className="w-4 h-4 mr-2" />
                完成编辑
              </Button>
            )}
          </div>
        </div>

        {/* 简历预览内容 */}
        <div className="space-y-6">
          {/* 个人信息头部 */}
          <div className="border-b-2 border-blue-600 pb-6">
            <h1 className="text-3xl text-gray-800 mb-2">{resumeData.personalInfo.name}</h1>
            <h2 className="text-xl text-blue-600 mb-4 bg-yellow-100 border-l-2 border-yellow-400 pl-1">
              {resumeData.personalInfo.title}
            </h2>
            <div className="flex flex-wrap gap-4 text-gray-600">
              <div className="flex items-center">
                <span className="mr-2">✉️</span>
                {resumeData.personalInfo.email}
              </div>
              <div className="flex items-center">
                <span className="mr-2">📱</span>
                {resumeData.personalInfo.phone}
              </div>
              <div className="flex items-center">
                <span className="mr-2">📍</span>
                {resumeData.personalInfo.location}
              </div>
            </div>
          </div>

          {/* 个人总结 */}
          <div>
            <h3 className="text-lg text-gray-800 border-l-4 border-blue-600 pl-3 mb-3">个人总结</h3>
            <div className="text-gray-700 leading-relaxed bg-yellow-100 border-l-2 border-yellow-400 pl-1">
              {resumeData.summary}
            </div>
          </div>

          {/* 工作经历 */}
          <div>
            <h3 className="text-lg text-gray-800 border-l-4 border-blue-600 pl-3 mb-4">工作经历</h3>
            <div className="space-y-4">
              {resumeData.workExperience.map((work) => (
                <div key={work.id} className="border-l-2 border-gray-200 pl-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="text-gray-800 font-medium">{work.position}</h4>
                      <p className="text-blue-600">{work.company}</p>
                    </div>
                    <span className="text-gray-500 text-sm ml-4">{work.duration}</span>
                  </div>
                  <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line bg-yellow-100 border-l-2 border-yellow-400 pl-1">
                    {work.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 项目经验 */}
          <div>
            <h3 className="text-lg text-gray-800 border-l-4 border-blue-600 pl-3 mb-4">项目经验</h3>
            <div className="space-y-4">
              {resumeData.projects.map((project) => (
                <div key={project.id} className="border-l-2 border-gray-200 pl-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="text-gray-800 font-medium">{project.name}</h4>
                      <p className="text-blue-600 text-sm">{project.technologies}</p>
                    </div>
                    <span className="text-gray-500 text-sm ml-4">{project.duration}</span>
                  </div>
                  <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line bg-yellow-100 border-l-2 border-yellow-400 pl-1">
                    {project.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 教育背景 */}
          <div>
            <h3 className="text-lg text-gray-800 border-l-4 border-blue-600 pl-3 mb-4">教育背景</h3>
            <div className="space-y-3">
              {resumeData.education.map((edu) => (
                <div key={edu.id} className="border-l-2 border-gray-200 pl-4">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h4 className="text-gray-800 font-medium">{edu.degree}</h4>
                      <p className="text-blue-600">{edu.school}</p>
                    </div>
                    <span className="text-gray-500 text-sm">{edu.duration}</span>
                  </div>
                  {edu.description && (
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                      {edu.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 专业技能 */}
          <div>
            <h3 className="text-lg text-gray-800 border-l-4 border-blue-600 pl-3 mb-3">专业技能</h3>
            <div className="text-gray-700 bg-yellow-100 border-l-2 border-yellow-400 pl-1">
              {resumeData.skills.join(', ')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}