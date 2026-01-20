import React from 'react';
import type { ResumeTemplateProps } from './types';
import { isListBlock, isTextBlock, isObjectBlock } from '@/types/resume';

/**
 * Calm Template - 简洁优雅，适合专业人士
 * 特点：左侧边栏显示个人信息，右侧主内容区，使用柔和的蓝色调
 */
export const CalmTemplate: React.FC<ResumeTemplateProps> = ({ resumeData, className = '' }) => {
  // 查找个人信息块
  const personalInfoBlock = resumeData.blocks.find((block) => isObjectBlock(block));
  const otherBlocks = resumeData.blocks.filter((block) => !isObjectBlock(block));

  return (
    <div className={`bg-white ${className}`}>
      <div className="flex min-h-screen">
        {/* 左侧边栏 - 个人信息 */}
        <div className="w-1/3 bg-gradient-to-b from-blue-50 to-blue-100 p-8">
          {personalInfoBlock && isObjectBlock(personalInfoBlock) && (
            <div className="space-y-6">
              {/* 头像 */}
              {personalInfoBlock.data.photo && (
                <div className="flex justify-center mb-6">
                  <img
                    src={personalInfoBlock.data.photo}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                </div>
              )}

              {/* 姓名和职位 */}
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {personalInfoBlock.data.name}
                </h1>
                {personalInfoBlock.data.title && (
                  <p className="text-lg text-blue-700 font-medium">
                    {personalInfoBlock.data.title}
                  </p>
                )}
              </div>

              {/* 联系方式 */}
              <div className="border-t border-blue-200 pt-6 space-y-3">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                  联系方式
                </h2>
                {personalInfoBlock.data.phone && (
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-2">📱</span>
                    <span className="text-sm text-gray-700">{personalInfoBlock.data.phone}</span>
                  </div>
                )}
                {personalInfoBlock.data.email && (
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-2">✉️</span>
                    <span className="text-sm text-gray-700 break-all">
                      {personalInfoBlock.data.email}
                    </span>
                  </div>
                )}
                {personalInfoBlock.data.location && (
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-2">📍</span>
                    <span className="text-sm text-gray-700">{personalInfoBlock.data.location}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 右侧主内容区 */}
        <div className="w-2/3 p-10">
          <div className="space-y-8">
            {otherBlocks.map((block, index) => (
              <div key={index} className="resume-section">
                {/* 区块标题 */}
                {block.title && (
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-500">
                    {block.title}
                  </h2>
                )}

                {/* 文本类型 */}
                {isTextBlock(block) && (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {block.data}
                    </p>
                  </div>
                )}

                {/* 列表类型 */}
                {isListBlock(block) && (
                  <div className="space-y-6">
                    {block.data.map((item) => (
                      <div key={item.id} className="border-l-4 border-blue-300 pl-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {item.name}
                          </h3>
                          {item.time && (
                            <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                              {item.time}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-2">
                            {item.description}
                          </p>
                        )}
                        {item.highlight && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.highlight.split(',').map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
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

export default CalmTemplate;
