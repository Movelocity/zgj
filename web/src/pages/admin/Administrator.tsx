import React, { useState } from 'react';
import { FiSettings, FiUsers, FiFolder, FiGift, FiDatabase, FiMenu, FiX } from 'react-icons/fi';
import { WorkflowManagement, UserManagement, FileManagement, InvitationManagement, SiteVariableManagement } from './components';

type TabType = 'workflows' | 'users' | 'files' | 'invitations' | 'variables';

const Administrator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const tabs = [
    { id: 'users' as TabType, name: '用户管理', icon: FiUsers },
    { id: 'invitations' as TabType, name: '邀请码管理', icon: FiGift },
    { id: 'workflows' as TabType, name: '工作流管理', icon: FiSettings },
    { id: 'files' as TabType, name: '文件管理', icon: FiFolder },
    { id: 'variables' as TabType, name: '网站变量', icon: FiDatabase },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'workflows':
        return <WorkflowManagement />;
      case 'users':
        return <UserManagement />;
      case 'files':
        return <FileManagement />;
      case 'invitations':
        return <InvitationManagement />;
      case 'variables':
        return <SiteVariableManagement />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-12">
      {/* 宽屏布局：flex */}
      <div className="hidden lg:flex h-[calc(100vh-5rem)]">
        {/* 左侧菜单 */}
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              管理后台
            </h1>
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center py-3 px-4 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 w-5 h-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className="flex-1 overflow-y-auto" style={{ width: 'calc(100vw - 16rem)' }}>
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* 窄屏布局：fixed可折叠 */}
      <div className="lg:hidden">
        {/* 顶部标题栏和菜单按钮 */}
        <div className="fixed top-12 left-0 right-0 z-40  px-4 py-4 flex items-center">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="px-2 py-1 cursor-pointer bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md font-medium flex items-center gap-2"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <>
                <FiX className="w-5 h-5" />
                <span>关闭</span>
              </>
            ) : (
              <>
                <FiMenu className="w-5 h-5" />
                <span>菜单</span>
              </>
            )}
          </button>
        </div>

        {/* 遮罩层 */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        {/* 左侧菜单（固定定位） */}
        <div
          className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-300 ease-in-out lg:hidden ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 overflow-y-auto h-full">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center py-3 px-4 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 w-5 h-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className="fixed top-16 left-0 right-0 bottom-0 overflow-y-auto" style={{ width: '100vw' }}>
          <div className="px-4 py-6 pb-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Administrator;
