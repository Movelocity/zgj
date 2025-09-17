import React, { useState } from 'react';
import { FiUpload, FiFileText, FiStar, FiCheckCircle, FiArrowLeft, FiX, FiFolder, FiMessageSquare, FiEdit } from 'react-icons/fi';

interface OptimizationResult {
  totalChanges: number;
  sectionsImproved: string[];
  improvementPercentage: number;
}

interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
}

interface WorkExperience {
  id: string;
  company: string;
  position: string;
  duration: string;
  description: string;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  duration: string;
  description: string;
}

interface Project {
  id: string;
  name: string;
  duration: string;
  description: string;
  technologies: string;
}

interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  projects: Project[];
}

const SimpleResume: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [historicalResumes] = useState<File[]>([
    new File([''], '产品经理简历_张三.pdf', { type: 'application/pdf' }),
    new File([''], '前端开发工程师简历_李四.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
    new File([''], '数据分析师简历_王五.pdf', { type: 'application/pdf' })
  ]);
  
  // 简历数据状态 - AI优化后的内容
  const [resumeData] = useState<ResumeData>({
    personalInfo: {
      name: '张三',
      title: '资深前端开发工程师 | React/Vue 专家', // AI优化：更突出专业性
      email: 'zhangsan@email.com',
      phone: '138-0000-0000',
      location: '北京市'
    },
    summary: '3年前端开发经验，精通React、Vue全家桶技术栈，具备大型项目架构设计能力。曾独立负责多个核心业务系统的前端开发，在性能优化和用户体验提升方面有丰富实践。具备良好的团队协作能力和技术学习能力，能够快速适应新技术并应用于实际项目中。', // AI优化：更具体和有吸引力
    workExperience: [
      {
        id: '1',
        company: '科技有限公司',
        position: '前端开发工程师',
        duration: '2021.06 - 至今',
        description: '• 主导开发公司核心产品前端架构，服务用户数达10万+，页面加载速度提升40%\n• 运用React+TypeScript技术栈重构老旧系统，代码可维护性显著提升\n• 与产品、设计、后端团队紧密协作，确保项目按期高质量交付\n• 建立前端代码规范和CI/CD流程，团队开发效率提升30%\n• 指导初级开发人员，参与技术分享，推动团队技术成长' // AI优化：更有说服力的数据和成果
      }
    ],
    education: [
      {
        id: '1',
        school: '某某大学',
        degree: '计算机科学与技术 本科',
        duration: '2017.09 - 2021.06',
        description: '主修课程：数据结构、算法、软件工程、数据库原理等\nGPA: 3.7/4.0\n获得：优秀学生奖学金、ACM程序设计竞赛二等奖'
      }
    ],
    skills: ['React', 'Vue.js', 'TypeScript', 'JavaScript', 'Webpack', 'Vite', 'Node.js', 'HTML5/CSS3', 'Git', 'Docker'], // AI优化：重新排序，突出核心技能
    projects: [
      {
        id: '1',
        name: '企业管理系统',
        duration: '2023.03 - 2023.08',
        description: '基于React+TypeScript构建的大型企业级管理平台，支持多租户架构，日活用户5000+。\n核心贡献：\n• 设计并实现前端微服务架构，支持模块化开发和独立部署\n• 开发了通用组件库，被公司其他项目复用，开发效率提升50%\n• 集成Echarts实现数据可视化，为业务决策提供直观支持\n• 实现权限控制系统，确保数据安全和用户体验的平衡', // AI优化：更详细的技术实现和业务价值
        technologies: 'React, TypeScript, Ant Design, Echarts, Webpack, Redux'
      }
    ]
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleDeleteFile = () => {
    setUploadedFile(null);
  };

  const handleSelectHistoricalResume = (file: File) => {
    setUploadedFile(file);
    setShowHistoryModal(false);
  };

  const startOptimization = async () => {
    if (!uploadedFile) return;

    setIsOptimizing(true);
    setProgress(0);

    // 模拟AI优化过程，增加描述性文字
    const steps = [
      { text: '读取简历中...', progress: 15 },
      { text: '分析您的个人优势...', progress: 35 },
      { text: '生成针对性优化建议...', progress: 65 },
      { text: '专家为您优化简历中...', progress: 85 },
      { text: '完成优化处理...', progress: 100 }
    ];

    for (const step of steps) {
      setProgressText(step.text);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(step.progress);
    }

    // 模拟优化结果
    const mockResults: OptimizationResult = {
      totalChanges: Math.floor(Math.random() * 15) + 8,
      sectionsImproved: ['工作经历', '技能描述', '项目经验', '个人总结'],
      improvementPercentage: Math.floor(Math.random() * 30) + 40
    };

    setOptimizationResults(mockResults);
    setIsOptimizing(false);
    setShowResults(true);
  };

  const resetProcess = () => {
    setUploadedFile(null);
    setIsOptimizing(false);
    setProgress(0);
    setProgressText('');
    setShowResults(false);
    setShowEditor(false);
    setOptimizationResults(null);
  };

  const handleViewResults = () => {
    setShowResults(false);
    setShowEditor(true);
  };

  const handleBackToUpload = () => {
    setShowEditor(false);
    setShowResults(false);
  };

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleStopEditing = () => {
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 编辑页面 */}
      {showEditor ? (
        <div className="h-screen flex flex-col">
          {/* 头部导航 */}
          <div className="bg-white border-b p-4 shadow-sm">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center">
                <button 
                  onClick={handleBackToUpload}
                  className="mr-4 p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <FiArrowLeft className="w-4 h-4 mr-2" />
                  返回
                </button>
                <div className="flex items-center">
                  <FiStar className="w-6 h-6 text-blue-600 mr-2" />
                  <h1 className="text-xl">简历编辑</h1>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center mr-4 bg-blue-50 px-3 py-1 rounded-lg">
                  <FiMessageSquare className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-700">AI 优化简历</span>
                </div>
                {isEditing && (
                  <div className="flex items-center mr-4 bg-green-50 px-3 py-1 rounded-lg">
                    <FiEdit className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-sm text-green-700">编辑中</span>
                  </div>
                )}
                <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  导出PDF
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  保存简历
                </button>
              </div>
            </div>
          </div>

          {/* 编辑区域 */}
          <div className="flex-1 flex">
            {/* 左侧优化后简历 (7/10) */}
            <div className="w-[70%] border-r bg-white">
              <div className="h-full overflow-y-auto">
                <div className="p-8 max-w-4xl mx-auto">
                  {/* 编辑提示 */}
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FiStar className="w-5 h-5 text-blue-600 mr-2" />
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
                        <button 
                          onClick={handleStartEditing}
                          className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center"
                        >
                          <FiEdit className="w-4 h-4 mr-2" />
                          编辑简历
                        </button>
                      ) : (
                        <button 
                          onClick={handleStopEditing}
                          className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center"
                        >
                          <FiCheckCircle className="w-4 h-4 mr-2" />
                          完成编辑
                        </button>
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
            </div>

            {/* 右侧AI对话界面 (3/10) */}
            <div className="w-[30%] p-4 bg-gray-50">
              <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
                <div className="p-4 border-b">
                  <div className="flex items-center text-lg font-medium">
                    <FiMessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                    简历专家
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    与AI专家对话，实时优化您的简历
                  </p>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    <div className="bg-gray-100 rounded-lg p-3 max-w-[85%]">
                      <div className="flex items-start space-x-2">
                        <FiMessageSquare className="w-4 h-4 mt-0.5 text-blue-600" />
                        <p className="text-sm leading-relaxed">
                          您好！我是您的简历专家助手。我已经为您优化了简历内容，左侧黄色标记的部分是我建议的改进。您可以随时与我对话，我会根据您的需求进一步优化简历。
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 ml-6">
                      <button className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center">
                        <FiStar className="w-3 h-3 mr-1" />
                        帮我优化个人总结
                      </button>
                      <button className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center">
                        <FiStar className="w-3 h-3 mr-1" />
                        改进工作经历描述
                      </button>
                      <button className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center">
                        <FiStar className="w-3 h-3 mr-1" />
                        调整技能关键词
                      </button>
                      <button className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center">
                        <FiStar className="w-3 h-3 mr-1" />
                        优化项目经验
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="输入您的问题或需求..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      <FiMessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors">
                      整体检查
                    </button>
                    <button className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors">
                      突出优势
                    </button>
                    <button className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors">
                      岗位匹配
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="max-w-2xl mx-auto pt-20">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <FiStar className="w-8 h-8 text-blue-600 mr-2" />
                <h1 className="text-3xl">AI简历优化器</h1>
              </div>
              <p className="text-gray-600">
                上传您的简历，让AI为您智能优化内容和格式
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg">
              <div className="p-6">
                <div className="flex items-center mb-2">
                  <FiFileText className="w-5 h-5 mr-2" />
                  <h2 className="text-lg font-medium">简历优化</h2>
                </div>
                <p className="text-gray-600 text-sm">
                  支持PDF、Word等格式，文件大小不超过10MB
                </p>
              </div>
              <div className="p-6 space-y-6">
                {!isOptimizing && !showResults && (
                  <>
                    {/* 文件上传区域 */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center relative">
                      {/* 选择已有简历按钮 */}
                      <button
                        onClick={() => setShowHistoryModal(true)}
                        className="absolute top-3 right-3 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center text-sm"
                      >
                        <FiFolder className="w-4 h-4 mr-2" />
                        选择已有简历
                      </button>

                      <input
                        type="file"
                        id="resume-upload"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                      />
                      
                      {uploadedFile ? (
                        // 已上传文件显示
                        <div className="flex items-center justify-center space-x-3">
                          <FiFileText className="w-8 h-8 text-blue-600" />
                          <span className="text-lg">{uploadedFile.name}</span>
                          <button
                            onClick={handleDeleteFile}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        // 上传提示
                        <label
                          htmlFor="resume-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <FiUpload className="w-12 h-12 text-gray-400 mb-4" />
                          <span className="text-lg mb-2">点击上传简历</span>
                          <span className="text-sm text-gray-500">
                            或拖拽文件到此处
                          </span>
                        </label>
                      )}
                    </div>

                    {/* 开始优化按钮 */}
                    <button
                      onClick={startOptimization}
                      disabled={!uploadedFile}
                      className="w-full h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      <FiStar className="w-4 h-4 mr-2" />
                      开始AI优化
                    </button>
                  </>
                )}

                {/* 优化进度 */}
                {isOptimizing && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="mb-2">正在优化您的简历...</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        AI正在分析和优化您的简历内容
                      </p>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <div className="text-sm text-blue-600 font-medium">
                        {progressText}
                      </div>
                      <div className="text-sm text-gray-600">
                        {progress}% 完成
                      </div>
                    </div>
                  </div>
                )}

                {/* 完成状态 */}
                {!isOptimizing && showResults && (
                  <div className="text-center space-y-4">
                    <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                    <h3>优化完成！</h3>
                    <p className="text-gray-600">
                      您的简历已成功优化
                    </p>
                    <button 
                      onClick={resetProcess} 
                      className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      优化新简历
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 优化结果弹窗 */}
            {showResults && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center mb-2">
                      <FiStar className="w-5 h-5 mr-2 text-blue-600" />
                      <h3 className="text-lg font-medium">优化完成</h3>
                    </div>
                    <p className="text-gray-600">AI已成功优化您的简历</p>
                  </div>
                  
                  {optimizationResults && (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-2xl text-green-600">
                              {optimizationResults.totalChanges}
                            </div>
                            <div className="text-sm text-gray-600">
                              处优化点
                            </div>
                          </div>
                          <div>
                            <div className="text-2xl text-blue-600">
                              {optimizationResults.improvementPercentage}%
                            </div>
                            <div className="text-sm text-gray-600">
                              整体提升
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="mb-2">优化的部分：</h4>
                        <div className="space-y-2">
                          {optimizationResults.sectionsImproved.map((section, index) => (
                            <div key={index} className="flex items-center text-sm">
                              <FiCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                              {section}
                            </div>
                          ))}
                        </div>
                      </div>

                      <button 
                        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" 
                        onClick={handleViewResults}
                      >
                        查看优化结果
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 历史简历选择弹窗 */}
            {showHistoryModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center mb-2">
                      <FiFolder className="w-5 h-5 mr-2 text-blue-600" />
                      <h3 className="text-lg font-medium">选择已有简历</h3>
                    </div>
                    <p className="text-gray-600">从历史上传的简历中选择一份进行优化</p>
                  </div>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {historicalResumes.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleSelectHistoricalResume(file)}
                      >
                        <div className="flex items-center space-x-3">
                          <FiFileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="text-sm font-medium">{file.name}</div>
                            <div className="text-xs text-gray-600">
                              {file.type.includes('pdf') ? 'PDF文件' : 'Word文档'}
                            </div>
                          </div>
                        </div>
                        <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                          选择
                        </button>
                      </div>
                    ))}
                    
                    {historicalResumes.length === 0 && (
                      <div className="text-center py-8 text-gray-600">
                        <FiFileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>暂无历史简历</p>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => setShowHistoryModal(false)}
                    className="w-full mt-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleResume;