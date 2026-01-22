import React from 'react';
import type { ResumeTemplateProps } from './types';
import { isListBlock, isTextBlock, isObjectBlock } from '@/types/resume';

/**
 * Classic Template - 传统经典，适合正式场合
 * 特点：单列布局，居中对齐，使用传统的黑白配色，强调专业性
 */
export const ClassicTemplate: React.FC<ResumeTemplateProps> = ({ resumeData, className = '' }) => {
  // 查找个人信息块
  const personalInfoBlock = resumeData.blocks.find((block) => isObjectBlock(block));
  const otherBlocks = resumeData.blocks.filter((block) => !isObjectBlock(block));

  return (
    <div className={`bg-white min-h-screen ${className}`}>
      <div className="max-w-4xl mx-auto p-12">
        {/* 个人信息 - 居中展示 */}
        {personalInfoBlock && isObjectBlock(personalInfoBlock) && (
          <div className="text-center mb-10 pb-8 border-b-2 border-gray-800">
            {/* 头像 */}
            {personalInfoBlock.data.photo && (
              <div className="flex justify-center mb-6">
                <img
                  src={personalInfoBlock.data.photo}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-800"
                />
              </div>
            )}

            {/* 姓名 */}
            <h1 className="text-4xl font-bold text-gray-900 mb-2 uppercase tracking-wide">
              {personalInfoBlock.data.name}
            </h1>

            {/* 职位 */}
            {personalInfoBlock.data.title && (
              <p className="text-xl text-gray-700 mb-6 font-medium">
                {personalInfoBlock.data.title}
              </p>
            )}

            {/* 联系方式 - 横向排列 */}
            <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
              {personalInfoBlock.data.phone && (
                <div className="flex items-center">
                  <span className="mr-2">📱</span>
                  <span>{personalInfoBlock.data.phone}</span>
                </div>
              )}
              {personalInfoBlock.data.email && (
                <div className="flex items-center">
                  <span className="mr-2">✉️</span>
                  <span>{personalInfoBlock.data.email}</span>
                </div>
              )}
              {personalInfoBlock.data.location && (
                <div className="flex items-center">
                  <span className="mr-2">📍</span>
                  <span>{personalInfoBlock.data.location}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 主内容区 */}
        <div className="space-y-8">
          {otherBlocks.map((block, index) => (
            <div key={index} className="resume-section">
              {/* 区块标题 */}
              {block.title && (
                <h2 className="text-2xl font-bold text-gray-900 mb-2 uppercase tracking-wide border-b border-gray-300 pb-1">
                  {block.title}
                </h2>
              )}

              {/* 文本类型 */}
              {isTextBlock(block) && (
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-justify">
                    {block.data}
                  </p>
                </div>
              )}

              {/* 列表类型 */}
              {isListBlock(block) && (
                <div className="space-y-5">
                  {block.data.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`${idx !== 0 ? 'pt-5 border-t border-gray-200' : ''}`}
                    >
                      <div className="flex justify-between items-baseline mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                        {item.time && (
                          <span className="text-sm text-gray-600 italic whitespace-nowrap ml-4">
                            {item.time}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-justify mb-2">
                          {item.description}
                        </p>
                      )}
                      {item.highlight && (
                        <div className="mt-2">
                          <span className="text-sm text-gray-600">
                            <span className="font-semibold">关键词：</span>
                            {item.highlight}
                          </span>
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

export default ClassicTemplate;
