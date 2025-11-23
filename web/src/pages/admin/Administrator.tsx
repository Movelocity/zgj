import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiSettings, FiUsers, FiFolder, FiGift, FiDatabase, FiActivity, FiPackage } from 'react-icons/fi';
import { 
  WorkflowManagement, 
  UserManagement, 
  FileManagement, 
  InvitationManagement, 
  SiteVariableManagement, 
  EventLogManagement,
  BillingPackageManagement,
  UserBillingPackageList
} from './components';
import { Button } from '@/components/ui/Button';

type TabType = 'workflows' | 'users' | 'files' | 'invitations' | 'variables' | 'eventlogs' | 'billing' | 'user-billing-packages';

const Administrator: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 从 URL hash 中获取初始 tab，如果没有则默认为 'users'
  const getInitialTab = (): TabType => {
    const hash = location.hash.replace('#', '');
    const validTabs: TabType[] = ['workflows', 'users', 'files', 'invitations', 'variables', 'eventlogs', 'billing'];
    return validTabs.includes(hash as TabType) ? (hash as TabType) : 'users';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());

  const tabs = [
    { id: 'users' as TabType, name: '用户管理', icon: FiUsers },
    { id: 'invitations' as TabType, name: '邀请码管理', icon: FiGift },
    { id: 'workflows' as TabType, name: '工作流管理', icon: FiSettings },
    { id: 'files' as TabType, name: '文件管理', icon: FiFolder },
    { id: 'variables' as TabType, name: '网站变量', icon: FiDatabase },
    { id: 'eventlogs' as TabType, name: '事件日志', icon: FiActivity },
    { id: 'billing' as TabType, name: '套餐管理', icon: FiPackage },
    { id: 'user-billing-packages' as TabType, name: '用户套餐管理', icon: FiPackage },
  ];

  // 监听 URL hash 变化
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    const validTabs: TabType[] = ['workflows', 'users', 'files', 'invitations', 'variables', 'eventlogs', 'billing'];
    if (hash && validTabs.includes(hash as TabType)) {
      setActiveTab(hash as TabType);
    }
  }, [location.hash]);

  // 切换 tab 时更新 URL hash
  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    navigate(`#${tabId}`, { replace: true });
  };

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
      case 'eventlogs':
        return <EventLogManagement />;
      case 'billing':
        return <BillingPackageManagement />;
      case 'user-billing-packages':
        return <UserBillingPackageList />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 宽屏布局：flex */}
      <div className="hidden lg:flex h-screen">
        {/* 右侧内容区域 */}
        <div className="flex-1 overflow-y-auto" style={{ width: 'calc(100vw - 16rem)' }}>
          {/* 左侧菜单 */}
          <div className="fixed top-0 left-0 py-24 h-full w-48 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center py-3 px-4 font-medium text-sm transition-colors cursor-pointer ${
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
          <div className="mt-16 p-6 pl-[220px]">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* 窄屏布局：fixed可折叠 */}
      <div className="lg:hidden mt-16">
        {/**顶部可滚动菜单 */}
        <div className="py-2 px-4 w-screen overflow-x-auto flex flex-nowrap gap-2 bg-gray-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button 
                key={tab.id} 
                // variant="ghost" 
                variant={activeTab === tab.id ? 'primary' : 'ghost'}
                size="sm" 
                onClick={() => handleTabChange(tab.id)}
              >
                <Icon className="h-5 w-5" />
                {tab.name}
              </Button>
            );
          })}
        </div>

        <div className="px-4 py-6 pb-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Administrator;
