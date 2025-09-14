import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { ADMIN_ROLE } from '@/utils/constants';
import { ProfileInfo, ChangePassword, UserList } from './components';

type TabType = 'profile' | 'password' | 'users';

const Profile: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  
  // 检查是否是管理员
  const isAdmin = user?.role === ADMIN_ROLE;

  // 获取可用的标签页
  const getAvailableTabs = () => {
    const tabs = [
      { key: 'profile' as TabType, label: '个人信息' },
      { key: 'password' as TabType, label: '修改密码' },
    ];
    
    if (isAdmin) {
      tabs.push({ key: 'users' as TabType, label: '用户管理' });
    }
    
    return tabs;
  };

  const availableTabs = getAvailableTabs();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          个人中心
        </h1>
        
        {/* 标签页 */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {availableTabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <ProfileInfo loading={loading} setLoading={setLoading} />
            )}

            {activeTab === 'password' && (
              <ChangePassword loading={loading} setLoading={setLoading} />
            )}

            {activeTab === 'users' && isAdmin && (
              <UserList loading={loading} setLoading={setLoading} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
