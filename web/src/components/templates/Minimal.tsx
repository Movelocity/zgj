import React from 'react';
import type { ResumeTemplateProps } from './types';
import { isListBlock, isTextBlock, isObjectBlock } from '@/types/resume';

/**
 * Minimal Template - 极简主义，适合设计师和创意人士
 * 特点：留白充足，极简线条，使用绿色点缀，强调内容本身
 */
export const MinimalTemplate: React.FC<ResumeTemplateProps> = ({ resumeData, className = '' }) => {
  // 查找个人信息块
  const personalInfoBlock = resumeData.blocks.find((block) => isObjectBlock(block));
  const otherBlocks = resumeData.blocks.filter((block) => !isObjectBlock(block));

  return (
    <div className={`bg-white min-h-screen ${className}`}>
      <div className="max-w-3xl mx-auto p-16">
        {/* 个人信息 - 极简展示 */}
        {personalInfoBlock && isObjectBlock(personalInfoBlock) && (
          <div className="mb-16">
            <div className="flex items-start space-x-8">
              {/* 头像 */}
              {personalInfoBlock.data.photo && (
                <div className="flex-shrink-0">
                  <img
                    src={personalInfoBlock.data.photo}
                    alt="Profile"
                    className="w-24 h-24 rounded-sm object-cover border border-gray-200"
                  />
                </div>
              )}

              <div className="flex-1">
                {/* 姓名 */}
                <h1 className="text-5xl font-light text-gray-900 mb-2 tracking-tight">
                  {personalInfoBlock.data.name}
                </h1>

                {/* 职位 */}
                {personalInfoBlock.data.title && (
                  <p className="text-lg text-gray-600 mb-6 font-light">
                    {personalInfoBlock.data.title}
                  </p>
                )}

                {/* 联系方式 - 极简列表 */}
                <div className="space-y-1 text-sm text-gray-600 font-light">
                  {personalInfoBlock.data.phone && <div>{personalInfoBlock.data.phone}</div>}
                  {personalInfoBlock.data.email && <div>{personalInfoBlock.data.email}</div>}
                  {personalInfoBlock.data.location && <div>{personalInfoBlock.data.location}</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 主内容区 */}
        <div className="space-y-12">
          {otherBlocks.map((block, index) => (
            <div key={index} className="resume-section">
              {/* 区块标题 */}
              {block.title && (
                <div className="mb-6 flex items-center">
                  <div className="w-1 h-6 bg-green-500 mr-4"></div>
                  <h2 className="text-xl font-light text-gray-900 tracking-wide">
                    {block.title}
                  </h2>
                </div>
              )}

              {/* 文本类型 */}
              {isTextBlock(block) && (
                <div className="pl-5">
                  <p className="text-gray-700 leading-loose whitespace-pre-wrap font-light">
                    {block.data}
                  </p>
                </div>
              )}

              {/* 列表类型 */}
              {isListBlock(block) && (
                <div className="space-y-8 pl-5">
                  {block.data.map((item) => (
                    <div key={item.id}>
                      <div className="flex justify-between items-baseline mb-2">
                        <h3 className="text-base font-medium text-gray-900">{item.name}</h3>
                        {item.time && (
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-4 font-light">
                            {item.time}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 leading-loose whitespace-pre-wrap font-light mb-2">
                          {item.description}
                        </p>
                      )}
                      {item.highlight && (
                        <div className="flex flex-wrap gap-3 mt-3">
                          {item.highlight.split(',').map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-xs text-gray-500 font-light border-b border-green-300"
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

export default MinimalTemplate;
