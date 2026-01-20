import React from 'react';
import type { ResumeTemplateProps } from './types';
import { isListBlock, isTextBlock, isObjectBlock } from '@/types/resume';

/**
 * Modern Template - 现代简约，适合技术和商务领域
 * 特点：左右分栏布局，使用灰色调和橙色强调，清晰的层次结构
 */
export const ModernTemplate: React.FC<ResumeTemplateProps> = ({ resumeData, className = '' }) => {
  // 查找个人信息块
  const personalInfoBlock = resumeData.blocks.find((block) => isObjectBlock(block));
  const otherBlocks = resumeData.blocks.filter((block) => !isObjectBlock(block));

  return (
    <div className={`bg-white ${className}`}>
      <div className="flex min-h-screen">
        {/* 左侧边栏 */}
        <div className="w-80 bg-gray-900 text-white p-8">
          {personalInfoBlock && isObjectBlock(personalInfoBlock) && (
            <div className="space-y-6">
              {/* 头像 */}
              {personalInfoBlock.data.photo && (
                <div className="flex justify-center mb-6">
                  <img
                    src={personalInfoBlock.data.photo}
                    alt="Profile"
                    className="w-36 h-36 rounded-lg object-cover border-2 border-orange-500 shadow-lg"
                  />
                </div>
              )}

              {/* 姓名和职位 */}
              <div className="border-b border-gray-700 pb-6">
                <h1 className="text-3xl font-bold mb-2">{personalInfoBlock.data.name}</h1>
                {personalInfoBlock.data.title && (
                  <p className="text-orange-400 text-lg font-medium">
                    {personalInfoBlock.data.title}
                  </p>
                )}
              </div>

              {/* 联系方式 */}
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-orange-400 uppercase tracking-wider">
                  Contact
                </h2>
                {personalInfoBlock.data.phone && (
                  <div className="flex items-start space-x-3">
                    <span className="text-orange-400 text-lg">📱</span>
                    <span className="text-sm text-gray-300">{personalInfoBlock.data.phone}</span>
                  </div>
                )}
                {personalInfoBlock.data.email && (
                  <div className="flex items-start space-x-3">
                    <span className="text-orange-400 text-lg">✉️</span>
                    <span className="text-sm text-gray-300 break-all">
                      {personalInfoBlock.data.email}
                    </span>
                  </div>
                )}
                {personalInfoBlock.data.location && (
                  <div className="flex items-start space-x-3">
                    <span className="text-orange-400 text-lg">📍</span>
                    <span className="text-sm text-gray-300">{personalInfoBlock.data.location}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 右侧主内容区 */}
        <div className="flex-1 p-12 bg-gray-50">
          <div className="max-w-4xl space-y-10">
            {otherBlocks.map((block, index) => (
              <div key={index} className="resume-section">
                {/* 区块标题 */}
                {block.title && (
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-4 border-orange-500 pb-2">
                      {block.title}
                    </h2>
                  </div>
                )}

                {/* 文本类型 */}
                {isTextBlock(block) && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {block.data}
                    </p>
                  </div>
                )}

                {/* 列表类型 */}
                {isListBlock(block) && (
                  <div className="space-y-6">
                    {block.data.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                          {item.time && (
                            <span className="text-sm font-semibold text-orange-600 whitespace-nowrap ml-4">
                              {item.time}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">
                            {item.description}
                          </p>
                        )}
                        {item.highlight && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {item.highlight.split(',').map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-md"
                              >
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernTemplate;
