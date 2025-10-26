import React, { useState, useEffect } from 'react';
import { userAPI } from '@/api/user';
import { invitationAPI } from '@/api/invitation';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { showSuccess, showError } from '@/utils/toast';
import type { UserInvitationUseResponse } from '@/types/invitation';
// import type { UserProfileResponse } from '@/types/user';

interface ProfileInfoProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ loading, setLoading }) => {
  const { user, logout } = useAuthStore();
  // const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  
  // 个人信息表单
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  // 用户名编辑状态
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(user?.name || '');

  // 邀请码相关状态
  const [invitationUseInfo, setInvitationUseInfo] = useState<UserInvitationUseResponse | null>(null);
  const [invitationCode, setInvitationCode] = useState('');
  const [submittingInvitation, setSubmittingInvitation] = useState(false);

  // 加载用户资料
  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getProfile();
      if (response.code === 0) {
        // setProfile(response.data);
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

  // 加载邀请码使用记录
  const loadInvitationUse = async () => {
    try {
      const response = await invitationAPI.getMyInvitationUse();
      if (response.code === 0) {
        setInvitationUseInfo(response.data);
      }
    } catch (error) {
      console.error('加载邀请码使用记录失败:', error);
    }
  };

  // 开始编辑用户名
  const handleStartEditName = () => {
    setTempName(profileForm.name);
    setIsEditingName(true);
  };

  // 取消编辑用户名
  const handleCancelEditName = () => {
    setTempName(profileForm.name);
    setIsEditingName(false);
  };

  // 保存用户名（blur时调用）
  const handleSaveName = async () => {
    const trimmedName = tempName.trim();

    // 验证空值
    if (!trimmedName) {
      showError('用户名不能为空');
      setTempName(profileForm.name); // 恢复原值
      setIsEditingName(false);
      return;
    }

    // 验证长度
    if (trimmedName.length < 2) {
      showError('用户名至少需要2个字符');
      setTempName(profileForm.name); // 恢复原值
      setIsEditingName(false);
      return;
    }

    if (trimmedName.length > 50) {
      showError('用户名不能超过50个字符');
      setTempName(profileForm.name); // 恢复原值
      setIsEditingName(false);
      return;
    }

    // 如果没有变化，直接退出编辑模式
    if (trimmedName === profileForm.name) {
      setIsEditingName(false);
      return;
    }

    // 提交更新
    try {
      setLoading(true);
      const response = await userAPI.updateProfile({ real_name: trimmedName });
      if (response.code === 0) {
        showSuccess('用户名更新成功');
        setProfileForm({ ...profileForm, name: trimmedName });
        setIsEditingName(false);
      } else {
        showError(response.msg || '更新失败');
        setTempName(profileForm.name); // 恢复原值
        setIsEditingName(false);
      }
    } catch (error) {
      showError('更新失败，请重试');
      console.error('更新用户名失败:', error);
      setTempName(profileForm.name); // 恢复原值
      setIsEditingName(false);
    } finally {
      setLoading(false);
    }
  };

  // 提交邀请码
  const handleSubmitInvitation = async () => {
    if (!invitationCode.trim()) {
      showError('请输入邀请码');
      return;
    }

    try {
      setSubmittingInvitation(true);
      const response = await invitationAPI.useInvitation(invitationCode.trim());
      if (response.code === 0) {
        showSuccess('邀请码使用成功');
        setInvitationCode('');
        await loadInvitationUse(); // 重新加载邀请码使用记录
      } else {
        showError(response.msg || '邀请码使用失败');
      }
    } catch (error) {
      showError('邀请码使用失败，请重试');
      console.error('使用邀请码失败:', error);
    } finally {
      setSubmittingInvitation(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    loadProfile();
    loadInvitationUse();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">个人信息</h2>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            用户名
          </label>
          {isEditingName ? (
            <Input
              type="text"
              value={tempName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter') {
                  handleSaveName();
                } else if (e.key === 'Escape') {
                  handleCancelEditName();
                }
              }}
              placeholder="请输入用户名"
              autoFocus
              disabled={loading}
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-900 flex-1">
                {profileForm.name || '未设置'}
              </div>
              <button
                onClick={handleStartEditName}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                disabled={loading}
              >
                编辑
              </button>
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            手机号
          </label>
          <div className="bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-500">
            {user?.phone || ''}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            邮箱
          </label>
          <div className="bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-500">
            {profileForm.email || '未设置'}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            注册时间
          </label>
          <div className="bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-500">
            {user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''}
          </div>
        </div>
      </div>

      {/* 邀请码部分 */}
      {invitationUseInfo && !invitationUseInfo.has_used && (
        <div className="">
          <h3 className="text-lg font-medium text-gray-900 mb-4">邀请码</h3>
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              填写邀请码
            </label>
            <div className="flex gap-3">
              <Input
                type="text"
                value={invitationCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvitationCode(e.target.value)}
                placeholder="请输入邀请码"
                disabled={submittingInvitation}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' && !submittingInvitation) {
                    handleSubmitInvitation();
                  }
                }}
              />
              <Button
                onClick={handleSubmitInvitation}
                disabled={submittingInvitation || !invitationCode.trim()}
                className="whitespace-nowrap"
              >
                {submittingInvitation ? '提交中...' : '提交'}
              </Button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              如果您有邀请码，请在此处填写以获得额外权益
            </p>
          </div>
        </div>
      )}

      {/* 已使用邀请码的提示 */}
      {invitationUseInfo && invitationUseInfo.has_used && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">邀请码</h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-green-800">已使用邀请码</span>
            </div>
            <p className="text-sm text-green-700">
              邀请码：{invitationUseInfo.invitation_code}
            </p>
            {invitationUseInfo.used_at && (
              <p className="text-sm text-green-600 mt-1">
                使用时间：{new Date(invitationUseInfo.used_at).toLocaleString('zh-CN')}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={handleLogout}>
          退出登录
        </Button>
      </div>
    </div>
  );
};

export default ProfileInfo;
