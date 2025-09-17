import React, { useState } from 'react';
import { Mail, Phone, MapPin, Sparkles, Check, X } from 'lucide-react';
import Button from "@/components/ui/Button"
import type { ResumeData } from '../types';


interface OptimizedResumeViewProps {
  resumeData: ResumeData;
  onResumeDataChange?: (data: ResumeData) => void;
  onStartEditing?: () => void;
  // onStopEditing?: () => void;
  isEditing?: boolean;
}

// 定义哪些内容是AI优化过的
const optimizedSections = {
  personalInfo: ['title'], // 职位标题被优化：更专业的表述
  summary: true, // 整个个人总结被优化：更具体和有吸引力
  workExperience: {
    '1': ['description'] // 第一个工作经历的描述被优化：添加了数据和成果
  },
  skills: true, // 技能部分被优化：重新排序突出核心技能
  projects: {
    '1': ['description'] // 第一个项目的描述被优化：更详细的技术实现和业务价值
  }
};

export default function ResumeEditor({ 
  resumeData, 
  onResumeDataChange = () => {}, 
}: OptimizedResumeViewProps) {
  const { personalInfo, summary, workExperience, education, skills, projects } = resumeData;
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  // 检查某个字段是否被优化过
  const isOptimized = (section: string, itemId?: string, field?: string): boolean => {
    const sectionData = optimizedSections[section as keyof typeof optimizedSections];
    
    if (typeof sectionData === 'boolean') {
      return sectionData;
    }
    
    if (Array.isArray(sectionData)) {
      return field ? sectionData.includes(field) : false;
    }
    
    if (typeof sectionData === 'object' && itemId && field) {
      const itemData = sectionData[itemId as keyof typeof sectionData];
      return Array.isArray(itemData) ? itemData.includes(field) : false;
    }
    
    return false;
  };

  // 开始编辑某个字段
  const startEditing = (fieldId: string, currentValue: string) => {
    // if (!isEditing) {
    //   onStartEditing();
    // }
    setEditingField(fieldId);
    setTempValue(currentValue);
  };

  // 保存编辑
  const saveEdit = (fieldId: string) => {
    // 根据fieldId更新对应的数据
    const newData = { ...resumeData };
    
    if (fieldId === 'name') {
      newData.personalInfo.name = tempValue;
    } else if (fieldId === 'title') {
      newData.personalInfo.title = tempValue;
    } else if (fieldId === 'email') {
      newData.personalInfo.email = tempValue;
    } else if (fieldId === 'phone') {
      newData.personalInfo.phone = tempValue;
    } else if (fieldId === 'location') {
      newData.personalInfo.location = tempValue;
    } else if (fieldId === 'summary') {
      newData.summary = tempValue;
    } else if (fieldId.startsWith('work-')) {
      const [, workId, field] = fieldId.split('-');
      const workIndex = newData.workExperience.findIndex(w => w.id === workId);
      if (workIndex !== -1) {
        (newData.workExperience[workIndex] as any)[field] = tempValue;
      }
    } else if (fieldId.startsWith('project-')) {
      const [, projectId, field] = fieldId.split('-');
      const projectIndex = newData.projects.findIndex(p => p.id === projectId);
      if (projectIndex !== -1) {
        (newData.projects[projectIndex] as any)[field] = tempValue;
      }
    } else if (fieldId === 'skills') {
      newData.skills = tempValue.split(',').map(s => s.trim()).filter(s => s);
    }
    
    onResumeDataChange(newData);
    setEditingField(null);
    setTempValue('');
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingField(null);
    setTempValue('');
  };

  // 停止整体编辑模式
  // const handleStopEditing = () => {
  //   cancelEdit();
  //   onStopEditing();
  // };

  // 高亮组件
  const HighlightedText = ({ children, isHighlighted = false }: { children: React.ReactNode; isHighlighted?: boolean }) => {
    if (!isHighlighted) return <>{children}</>;
    
    return (
      <span className="bg-yellow-100 border-l-2 border-yellow-400 pl-1 relative group">
        {children}
        <div className="absolute -top-8 left-0 bg-yellow-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
          <Sparkles className="w-3 h-3 inline mr-1" />
          AI 优化内容
        </div>
      </span>
    );
  };

  // 可编辑文本组件
  const EditableText = ({ 
    fieldId, 
    value, 
    isHighlighted = false, 
    multiline = false,
    placeholder = '点击编辑',
    className = ''
  }: { 
    fieldId: string; 
    value: string; 
    isHighlighted?: boolean; 
    multiline?: boolean;
    placeholder?: string;
    className?: string;
  }) => {
    const isCurrentlyEditing = editingField === fieldId;
    
    if (isCurrentlyEditing) {
      return (
        <div className="flex items-start space-x-2">
          {multiline ? (
            <textarea
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="flex-1 min-h-20"
              autoFocus
            />
          ) : (
            <input
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="flex-1"
              autoFocus
            />
          )}
          <div className="flex space-x-1">
            <Button size="sm" onClick={() => saveEdit(fieldId)}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={cancelEdit}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      );
    }

    const content = value || placeholder;
    const textElement = (
      <span 
        className={`cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors ${className} ${!value ? 'text-gray-400 italic' : ''}`}
        onClick={() => startEditing(fieldId, value)}
      >
        {content}
      </span>
    );

    return isHighlighted ? (
      <HighlightedText isHighlighted={true}>
        {textElement}
      </HighlightedText>
    ) : textElement;
  };

  return (
    <div className="h-full bg-white">
      <div className="h-full">{/** scroll area */}
        <div className="p-8 max-w-4xl mx-auto">

          {/* 个人信息头部 */}
          <div className="border-b-2 border-blue-600 pb-6 mb-6 p-4 -m-4 rounded-lg">
            <h1 className="text-3xl text-gray-800 mb-2">
              <EditableText 
                fieldId="name"
                value={personalInfo.name}
                placeholder="点击输入姓名"
              />
            </h1>
            <h2 className="text-xl text-blue-600 mb-4">
              <EditableText 
                fieldId="title"
                value={personalInfo.title}
                placeholder="点击输入职位"
                isHighlighted={isOptimized('personalInfo', undefined, 'title')}
              />
            </h2>
            <div className="flex flex-wrap gap-4 text-gray-600">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                <EditableText 
                  fieldId="email"
                  value={personalInfo.email}
                  placeholder="点击输入邮箱"
                />
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                <EditableText 
                  fieldId="phone"
                  value={personalInfo.phone}
                  placeholder="点击输入电话"
                />
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                <EditableText 
                  fieldId="location"
                  value={personalInfo.location}
                  placeholder="点击输入地址"
                />
              </div>
            </div>
          </div>

          {/* 个人总结 */}
          <div className="mb-6 p-4 -m-4 rounded-lg">
            <h3 className="text-lg text-gray-800 border-l-4 border-blue-600 pl-3 mb-3">个人总结</h3>
            <div className="text-gray-700 leading-relaxed">
              <EditableText 
                fieldId="summary"
                value={summary}
                placeholder="点击添加个人总结..."
                multiline={true}
                isHighlighted={isOptimized('summary')}
              />
            </div>
          </div>

          {/* 工作经历 */}
          <div className="mb-6 p-4 -m-4 rounded-lg">
            <h3 className="text-lg text-gray-800 border-l-4 border-blue-600 pl-3 mb-4">工作经历</h3>
            {workExperience.length > 0 ? (
              <div className="space-y-4">
                {workExperience.map((work, index) => (
                  <div key={work.id} className="border-l-2 border-gray-200 pl-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="text-gray-800 font-medium">
                          <EditableText 
                            fieldId={`work-${work.id}-position`}
                            value={work.position}
                            placeholder={`工作经历 ${index + 1}`}
                          />
                        </h4>
                        <p className="text-blue-600">
                          <EditableText 
                            fieldId={`work-${work.id}-company`}
                            value={work.company}
                            placeholder="公司名称"
                          />
                        </p>
                      </div>
                      <span className="text-gray-500 text-sm ml-4">
                        <EditableText 
                          fieldId={`work-${work.id}-duration`}
                          value={work.duration}
                          placeholder="时间"
                        />
                      </span>
                    </div>
                    <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                      <EditableText 
                        fieldId={`work-${work.id}-description`}
                        value={work.description}
                        placeholder="点击添加工作描述..."
                        multiline={true}
                        isHighlighted={isOptimized('workExperience', work.id, 'description')}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">请添加工作经历...</p>
            )}
          </div>

          {/* 项目经验 */}
          <div className="mb-6 p-4 -m-4 rounded-lg">
            <h3 className="text-lg text-gray-800 border-l-4 border-blue-600 pl-3 mb-4">项目经验</h3>
            {projects.length > 0 ? (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="border-l-2 border-gray-200 pl-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="text-gray-800 font-medium">
                          <EditableText 
                            fieldId={`project-${project.id}-name`}
                            value={project.name}
                            placeholder="项目名称"
                          />
                        </h4>
                        <p className="text-blue-600 text-sm">
                          <EditableText 
                            fieldId={`project-${project.id}-technologies`}
                            value={project.technologies}
                            placeholder="技术栈"
                          />
                        </p>
                      </div>
                      <span className="text-gray-500 text-sm ml-4">
                        <EditableText 
                          fieldId={`project-${project.id}-duration`}
                          value={project.duration}
                          placeholder="时间"
                        />
                      </span>
                    </div>
                    <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                      <EditableText 
                        fieldId={`project-${project.id}-description`}
                        value={project.description}
                        placeholder="点击添加项目描述..."
                        multiline={true}
                        isHighlighted={isOptimized('projects', project.id, 'description')}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">请添加项目经验...</p>
            )}
          </div>

          {/* 教育背景 */}
          <div 
            className="mb-6 cursor-pointer hover:bg-gray-50 p-4 -m-4 rounded-lg transition-colors"
            // onClick={() => onEditSection?.('education')}
          >
            <h3 className="text-lg text-gray-800 border-l-4 border-blue-600 pl-3 mb-4">教育背景</h3>
            {education.length > 0 ? (
              <div className="space-y-3">
                {education.map((edu) => (
                  <div key={edu.id} className="border-l-2 border-gray-200 pl-4">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h4 className="text-gray-800 font-medium">{edu.degree || '学历/专业'}</h4>
                        <p className="text-blue-600">{edu.school || '学校名称'}</p>
                      </div>
                      <span className="text-gray-500 text-sm">{edu.duration || '时间'}</span>
                    </div>
                    {edu.description && (
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                        {edu.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">请添加教育背景...</p>
            )}
          </div>

          {/* 专业技能 */}
          <div className="mb-6 p-4 -m-4 rounded-lg">
            <h3 className="text-lg text-gray-800 border-l-4 border-blue-600 pl-3 mb-3">专业技能</h3>
            {skills.length > 0 ? (
              <div className="text-gray-700">
                <EditableText 
                  fieldId="skills"
                  value={skills.join(', ')}
                  placeholder="点击添加技能，用逗号分隔..."
                  isHighlighted={isOptimized('skills')}
                />
              </div>
            ) : (
              <p className="text-gray-500 italic">
                <EditableText 
                  fieldId="skills"
                  value=""
                  placeholder="点击添加专业技能..."
                />
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}