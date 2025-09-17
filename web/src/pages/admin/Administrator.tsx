import React, { useState } from 'react';
import { FiSettings, FiUsers, FiFolder } from 'react-icons/fi';
import { WorkflowManagement, UserManagement, FileManagement } from './components';

type TabType = 'workflows' | 'users' | 'files';

const Administrator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('workflows');

  const tabs = [
    { id: 'workflows' as TabType, name: '工作流管理', icon: FiSettings },
    { id: 'users' as TabType, name: '用户管理', icon: FiUsers },
    { id: 'files' as TabType, name: '文件管理', icon: FiFolder },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'workflows':
        return <WorkflowManagement />;
      case 'users':
        return <UserManagement />;
      case 'files':
        return <FileManagement />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          管理后台
        </h1>

        {/* 标签页导航 */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="mr-2 w-4 h-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 标签页内容 */}
        <div className="tab-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Administrator;
