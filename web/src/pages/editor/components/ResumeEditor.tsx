import React, { useState, useRef } from 'react';
import { Mail, Phone, MapPin, Sparkles, Check, X, Plus, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import Button from "@/components/ui/Button"
import type { ResumeData, OptimizedSections, WorkExperience, Education, Project } from '@/types/resume';

interface OptimizedResumeViewProps {
  optimizedSections: OptimizedSections;
  resumeData: ResumeData;
  onResumeDataChange?: (data: ResumeData) => void;
  onStartEditing?: () => void;
  isEditing?: boolean;
}

export default function ResumeEditor({ 
  optimizedSections,
  resumeData, 
  onResumeDataChange = () => {}, 
}: OptimizedResumeViewProps) {
  const { personalInfo, summary, workExperience, education, skills, projects } = resumeData;
  const [editingField, setEditingField] = useState<string | null>(null);
  const editingValueRef = useRef<string>('');

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
    setEditingField(fieldId);
    editingValueRef.current = currentValue;
  };

  // 保存编辑
  const saveEdit = (fieldId: string, inputElement: HTMLInputElement | HTMLTextAreaElement) => {
    // 从输入框直接获取最新值
    const currentValue = inputElement.value;
    
    // 根据fieldId更新对应的数据
    const newData = { ...resumeData };
    
    if (fieldId === 'name') {
      newData.personalInfo.name = currentValue;
    } else if (fieldId === 'title') {
      newData.personalInfo.title = currentValue;
    } else if (fieldId === 'email') {
      newData.personalInfo.email = currentValue;
    } else if (fieldId === 'phone') {
      newData.personalInfo.phone = currentValue;
    } else if (fieldId === 'location') {
      newData.personalInfo.location = currentValue;
    } else if (fieldId === 'summary') {
      newData.summary = currentValue;
    } else if (fieldId.startsWith('work-')) {
      const [, workId, field] = fieldId.split('-');
      const workIndex = newData.workExperience.findIndex(w => w.id === workId);
      if (workIndex !== -1) {
        (newData.workExperience[workIndex] as any)[field] = currentValue;
      }
    } else if (fieldId.startsWith('project-')) {
      const [, projectId, field] = fieldId.split('-');
      const projectIndex = newData.projects.findIndex(p => p.id === projectId);
      if (projectIndex !== -1) {
        (newData.projects[projectIndex] as any)[field] = currentValue;
      }
    } else if (fieldId.startsWith('education-')) {
      const [, educationId, field] = fieldId.split('-');
      const educationIndex = newData.education.findIndex(e => e.id === educationId);
      if (educationIndex !== -1) {
        (newData.education[educationIndex] as any)[field] = currentValue;
      }
    } else if (fieldId === 'skills') {
      newData.skills = currentValue.split(',').map(s => s.trim()).filter(s => s);
    }
    
    onResumeDataChange(newData);
    setEditingField(null);
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingField(null);
  };

  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  // 添加工作经历
  const addWorkExperience = () => {
    const newWork: WorkExperience = {
      id: generateId(),
      company: '',
      position: '',
      duration: '',
      description: ''
    };
    const newData = { ...resumeData };
    newData.workExperience.push(newWork);
    onResumeDataChange(newData);
  };

  // 添加教育经历
  const addEducation = () => {
    const newEducation: Education = {
      id: generateId(),
      school: '',
      degree: '',
      duration: '',
      description: ''
    };
    const newData = { ...resumeData };
    newData.education.push(newEducation);
    onResumeDataChange(newData);
  };

  // 添加项目经历
  const addProject = () => {
    const newProject: Project = {
      id: generateId(),
      name: '',
      duration: '',
      description: '',
      technologies: ''
    };
    const newData = { ...resumeData };
    newData.projects.push(newProject);
    onResumeDataChange(newData);
  };

  // 删除列表项
  const deleteItem = (type: 'workExperience' | 'education' | 'projects', id: string) => {
    const newData = { ...resumeData };
    if (type === 'workExperience') {
      newData.workExperience = newData.workExperience.filter(item => item.id !== id);
    } else if (type === 'education') {
      newData.education = newData.education.filter(item => item.id !== id);
    } else if (type === 'projects') {
      newData.projects = newData.projects.filter(item => item.id !== id);
    }
    onResumeDataChange(newData);
  };

  // 上移列表项
  const moveItemUp = (type: 'workExperience' | 'education' | 'projects', id: string) => {
    const newData = { ...resumeData };
    if (type === 'workExperience') {
      const items = newData.workExperience;
      const index = items.findIndex(item => item.id === id);
      if (index > 0) {
        [items[index], items[index - 1]] = [items[index - 1], items[index]];
      }
    } else if (type === 'education') {
      const items = newData.education;
      const index = items.findIndex(item => item.id === id);
      if (index > 0) {
        [items[index], items[index - 1]] = [items[index - 1], items[index]];
      }
    } else if (type === 'projects') {
      const items = newData.projects;
      const index = items.findIndex(item => item.id === id);
      if (index > 0) {
        [items[index], items[index - 1]] = [items[index - 1], items[index]];
      }
    }
    onResumeDataChange(newData);
  };

  // 下移列表项
  const moveItemDown = (type: 'workExperience' | 'education' | 'projects', id: string) => {
    const newData = { ...resumeData };
    if (type === 'workExperience') {
      const items = newData.workExperience;
      const index = items.findIndex(item => item.id === id);
      if (index < items.length - 1) {
        [items[index], items[index + 1]] = [items[index + 1], items[index]];
      }
    } else if (type === 'education') {
      const items = newData.education;
      const index = items.findIndex(item => item.id === id);
      if (index < items.length - 1) {
        [items[index], items[index + 1]] = [items[index + 1], items[index]];
      }
    } else if (type === 'projects') {
      const items = newData.projects;
      const index = items.findIndex(item => item.id === id);
      if (index < items.length - 1) {
        [items[index], items[index + 1]] = [items[index + 1], items[index]];
      }
    }
    onResumeDataChange(newData);
  };

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

  // 列表项操作按钮组件
  const ListItemActions = ({ 
    type, 
    id, 
    index, 
    total 
  }: { 
    type: 'workExperience' | 'education' | 'projects'; 
    id: string; 
    index: number; 
    total: number; 
  }) => (
    <div className="absolute -left-10 top-0 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        size="zero"
        variant="outline"
        onClick={() => moveItemUp(type, id)}
        disabled={index === 0}
        className="w-8 h-8 p-0 bg-white shadow-sm hover:bg-gray-50"
        title="上移"
      >
        <ChevronUp size={14} />
      </Button>
      <Button
        size="zero"
        variant="outline"
        onClick={() => moveItemDown(type, id)}
        disabled={index === total - 1}
        className="w-8 h-8 p-0 bg-white shadow-sm hover:bg-gray-50"
        title="下移"
      >
        <ChevronDown size={14} />
      </Button>
      <Button
        size="zero"
        variant="outline"
        onClick={() => deleteItem(type, id)}
        className="w-8 h-8 p-0 bg-white shadow-sm hover:bg-red-50 hover:text-red-600"
        title="删除"
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );

  // 列表标题组件
  const ListSectionTitle = ({ 
    title, 
    onAdd 
  }: { 
    title: string; 
    onAdd: () => void; 
  }) => (
    <div className="relative group">
      <h3 className="text-lg text-gray-800 border-l-4 border-blue-600 pl-3 mb-4">{title}</h3>
      <Button
        size="zero"
        variant="outline"
        onClick={onAdd}
        className="absolute -left-10 top-0 w-8 h-8 p-0 bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50 hover:text-blue-600"
        title={`添加${title}`}
      >
        <Plus size={14} />
      </Button>
    </div>
  );

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
    const inputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    if (isCurrentlyEditing) {
      return (
        <div className="flex items-start space-x-2 min-h-[2.5rem]">
          {multiline ? (
            <textarea
              ref={textareaRef}
              defaultValue={editingValueRef.current}
              className="flex-1 min-h-20 p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <input
              ref={inputRef}
              defaultValue={editingValueRef.current}
              className="flex-1 h-8 px-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          )}
          <div className="flex space-x-1 flex-shrink-0">
            <Button size="sm" onClick={() => {
              const element = multiline ? textareaRef.current : inputRef.current;
              if (element) saveEdit(fieldId, element);
            }}>
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
    const baseClasses = multiline ? 'min-h-[2rem] block' : 'min-h-[1.5rem] inline-block';
    const textElement = (
      <span 
        className={`cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors ${baseClasses} ${className} ${!value ? 'text-gray-400 italic' : ''}`}
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
      <div className="p-8 max-w-4xl mx-auto">

        {/* 个人信息头部 */}
        <div className="border-b-2 border-blue-600 pb-6 mb-6 p-4 -m-4">
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
        <div className="mb-3 p-4 -m-4 rounded-lg">
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
        <div className="mb-3 p-4 -m-4 rounded-lg relative">
          <ListSectionTitle title="工作经历" onAdd={addWorkExperience} />
          {workExperience.length > 0 ? (
            <div className="space-y-4">
              {workExperience.map((work, index) => (
                <div key={work.id} className="relative group border-l-2 border-gray-200 pl-4">
                  <ListItemActions 
                    type="workExperience" 
                    id={work.id} 
                    index={index} 
                    total={workExperience.length} 
                  />
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-gray-800 font-medium">
                        <EditableText 
                          fieldId={`work-${work.id}-position`}
                          value={work.position}
                          placeholder={`职位名称`}
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
                        placeholder="工作时间"
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
            <p className="text-gray-500 italic">暂无工作经历，点击上方加号添加...</p>
          )}
        </div>

        {/* 项目经验 */}
        <div className="mb-3 p-4 -m-4 rounded-lg relative">
          <ListSectionTitle title="项目经验" onAdd={addProject} />
          {projects.length > 0 ? (
            <div className="space-y-4">
              {projects.map((project, index) => (
                <div key={project.id} className="relative group border-l-2 border-gray-200 pl-4">
                  <ListItemActions 
                    type="projects" 
                    id={project.id} 
                    index={index} 
                    total={projects.length} 
                  />
                  <div className="flex justify-between items-start">
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
                        placeholder="项目时间"
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
            <p className="text-gray-500 italic">暂无项目经验，点击上方加号添加...</p>
          )}
        </div>

        {/* 教育背景 */}
        <div className="mb-3 p-4 -m-4 rounded-lg relative">
          <ListSectionTitle title="教育背景" onAdd={addEducation} />
          {education.length > 0 ? (
            <div className="space-y-4">
              {education.map((edu, index) => (
                <div key={edu.id} className="relative group border-l-2 border-gray-200 pl-4">
                  <ListItemActions 
                    type="education" 
                    id={edu.id} 
                    index={index} 
                    total={education.length} 
                  />
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-gray-800 font-medium">
                        <EditableText 
                          fieldId={`education-${edu.id}-degree`}
                          value={edu.degree}
                          placeholder="学历/专业"
                        />
                      </h4>
                      <p className="text-blue-600">
                        <EditableText 
                          fieldId={`education-${edu.id}-school`}
                          value={edu.school}
                          placeholder="学校名称"
                        />
                      </p>
                    </div>
                    <span className="text-gray-500 text-sm ml-4">
                      <EditableText 
                        fieldId={`education-${edu.id}-duration`}
                        value={edu.duration}
                        placeholder="就读时间"
                      />
                    </span>
                  </div>
                  <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                    <EditableText 
                      fieldId={`education-${edu.id}-description`}
                      value={edu.description}
                      placeholder="点击添加教育描述..."
                      multiline={true}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">暂无教育背景，点击上方加号添加...</p>
          )}
        </div>

        {/* 专业技能 */}
        <div className="mb-3 p-4 -m-4 rounded-lg">
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
  );
}