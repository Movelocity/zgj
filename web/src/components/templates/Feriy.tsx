import React from 'react';
import type { ResumeTemplateProps } from './types';
import { isListBlock, isTextBlock, isObjectBlock } from '@/types/resume';

/**
 * Feriy Template - 现代活力，适合创意行业
 * 特点：顶部横幅式个人信息，使用紫色渐变，卡片式内容布局
 */
export const FeriyTemplate: React.FC<ResumeTemplateProps> = ({ resumeData, className = '' }) => {
  // 查找个人信息块
  const personalInfoBlock = resumeData.blocks.find((block) => isObjectBlock(block));
  const otherBlocks = resumeData.blocks.filter((block) => !isObjectBlock(block));

  return (
    <div className={`bg-gray-50 min-h-screen ${className}`}>
      {/* 顶部横幅 - 个人信息 */}
      {personalInfoBlock && isObjectBlock(personalInfoBlock) && (
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white px-10 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center space-x-8">
              {/* 头像 */}
              {personalInfoBlock.data.photo && (
                <div className="flex-shrink-0">
                  <img
                    src={personalInfoBlock.data.photo}
                    alt="Profile"
                    className="w-32 h-40 object-cover border-4 border-white shadow-2xl"
                  />
                </div>
              )}

              {/* 个人信息 */}
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-3 drop-shadow-lg">
                  {personalInfoBlock.data.name}
                </h1>
                {personalInfoBlock.data.title && (
                  <p className="text-2xl font-light mb-3 opacity-90">
                    {personalInfoBlock.data.title}
                  </p>
                )}

                {/* 联系方式 - 横向排列 */}
                <div className="flex flex-wrap gap-6 text-sm">
                  {personalInfoBlock.data.phone && (
                    <div className="flex items-center space-x-2">
                      <span>📱</span>
                      <span>{personalInfoBlock.data.phone}</span>
                    </div>
                  )}
                  {personalInfoBlock.data.email && (
                    <div className="flex items-center space-x-2">
                      <span>✉️</span>
                      <span>{personalInfoBlock.data.email}</span>
                    </div>
                  )}
                  {personalInfoBlock.data.location && (
                    <div className="flex items-center space-x-2">
                      <span>📍</span>
                      <span>{personalInfoBlock.data.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <div className="max-w-6xl mx-auto px-12 py-4">
        <div className="space-y-3">
          {otherBlocks.map((block, index) => (
            <div
              key={index}
              className="p-2"
            >
              {/* 区块标题 */}
              {block.title && (
                <div className="flex items-center mb-3">
                  <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-500 mr-3"></div>
                  <h2 className="text-2xl font-bold text-gray-800">{block.title}</h2>
                </div>
              )}

              {/* 文本类型 */}
              {isTextBlock(block) && (
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                    {block.data}
                  </p>
                </div>
              )}

              {/* 列表类型 */}
              {isListBlock(block) && (
                <div className="space-y-3">
                  {block.data.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`${idx !== 0 ? 'border-t border-gray-100' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-semibold text-gray-800 flex-1 mb-0.5">
                          {item.name}
                        </h3>
                        {item.time && (
                          <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full whitespace-nowrap ml-4">
                            {item.time}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap mb-1">
                          {item.description}
                        </p>
                      )}
                      {item.highlight && (
                        <div className="flex flex-wrap gap-2">
                          {item.highlight.split(',').map((tag, tagIdx) => (
                            <span
                              key={tagIdx}
                              className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full"
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
  );
};

export default FeriyTemplate;
