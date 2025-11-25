import React, { useState } from 'react';
import { FiUser, FiPackage } from 'react-icons/fi';
import { ProfileInfo, PackagesList } from './components';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store';

type TabType = 'account' | 'packages';

const Profile: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('account');

  const { isAdmin } = useAuthStore();

  const tabs = [
    { id: 'account' as TabType, name: '账号设置', icon: FiUser, adminOnly: false },
    { id: 'packages' as TabType, name: '升级计划(Pro)', icon: FiPackage, adminOnly: false },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return <ProfileInfo loading={loading} setLoading={setLoading} />;
      case 'packages':
        return <PackagesList />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen ">
      {/* 宽屏布局：flex */}
      <div className="hidden lg:flex h-[calc(100vh-2rem)]">
        {/* 右侧内容区域 */}
        <div className="flex-1 overflow-y-auto mt-16" style={{ width: 'calc(100vw - 16rem)' }}>
          {/* 左侧菜单 */}
          <div className="fixed left-0 top-0 py-24 h-full w-48 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
            <nav className="space-y-1">
              {tabs.filter((tab) => !tab.adminOnly || isAdmin()).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
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
          <div className="p-6 ml-[210px] relative">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* 窄屏布局：fixed可折叠 */}
      <div className="lg:hidden pt-16">
        {/**顶部可滚动菜单 */}
        <div className="px-4 w-screen overflow-x-auto flex flex-nowrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button 
                key={tab.id} 
                variant={activeTab === tab.id ? 'outline' : 'ghost'}
                size="sm" 
                onClick={() => setActiveTab(tab.id)}
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

export default Profile;
