import React, { useState, useEffect } from 'react';
import { userAPI } from '@/api/user';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { showSuccess, showError } from '@/utils/toast';
import type { UserProfileResponse } from '@/types/user';

interface ProfileInfoProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ loading, setLoading }) => {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  
  // 个人信息表单
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  // 加载用户资料
  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getProfile();
      if (response.code === 0) {
        setProfile(response.data);
        setProfileForm({
          name: response.data.user.name || '',
          email: response.data.user.email || '',
        });
      }
    } catch (error) {
      console.error('加载用户资料失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 更新个人信息
  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const response = await userAPI.updateProfile(profileForm);
      if (response.code === 0) {
        showSuccess('个人信息更新成功');
        await loadProfile();
      } else {
        showError(response.msg || '更新失败');
      }
    } catch (error) {
      showError('更新失败，请重试');
      console.error('更新个人信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">个人信息</h2>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            用户名
          </label>
          <Input
            type="text"
            value={profileForm.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, name: e.target.value })}
            placeholder="请输入用户名"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            手机号
          </label>
          <Input
            type="text"
            value={user?.phone || ''}
            disabled
            className="bg-gray-50"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            邮箱
          </label>
          <Input
            type="email"
            value={profileForm.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, email: e.target.value })}
            placeholder="请输入邮箱"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            注册时间
          </label>
          <Input
            type="text"
            value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''}
            disabled
            className="bg-gray-50"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={handleLogout}>
          退出登录
        </Button>

        <Button
          onClick={handleUpdateProfile}
          disabled={loading}
          className="px-6 py-2"
        >
          {loading ? '保存中...' : '保存修改'}
        </Button>
      </div>
    </div>
  );
};

export default ProfileInfo;
