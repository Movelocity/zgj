import React, { useState, useEffect } from 'react';
import { userAPI } from '@/api/user';
import { invitationAPI } from '@/api/invitation';
import { useAuthStore } from '@/store/authStore';
import { Button, Input } from '@/components/ui';
import { RiEditLine } from 'react-icons/ri';
import { showSuccess, showError } from '@/utils/toast';
import UserChangePasswordModal from '@/components/modals/UserChangePasswordModal';
import type { UserInvitationUseResponse, InvitationCode } from '@/types/invitation';

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

  // 用户的普通邀请码（用于分享）
  const [myNormalInvitation, setMyNormalInvitation] = useState<InvitationCode | null>(null);

  // 修改密码 modal 状态
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

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

  // 加载用户的普通邀请码（用于分享）
  const loadMyNormalInvitation = async () => {
    try {
      const response = await invitationAPI.getNormalCode();
      if (response.code === 0) {
        setMyNormalInvitation(response.data);
      }
    } catch (error) {
      console.error('加载邀请码失败:', error);
    }
  };

  // 复制邀请码（生成完整注册链接）
  const handleCopyCode = async (code: string) => {
    try {
      const registerUrl = `${window.location.origin}/register?invite=${code}`;
      await navigator.clipboard.writeText(registerUrl);
      showSuccess('注册链接已复制到剪贴板');
    } catch (error) {
      showError('复制失败，请手动复制');
      console.error('复制失败:', error);
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
      const response = await userAPI.updateProfile({ name: trimmedName });
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
      const errorMessage = error instanceof Error ? error.message : '邀请码使用失败，请重试';
      showError(errorMessage);
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
    loadMyNormalInvitation();
  }, []);

  return (
    <div className="rounded-lg bg-white shadow-sm p-6">
      
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <label className="block text-sm font-medium text-gray-700 w-20">
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
              <div className="text-sm">
                {profileForm.name || '未设置'}
              </div>
              <Button
                variant="link"
                onClick={handleStartEditName}
                disabled={loading}
              >
                <RiEditLine className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        
        <div className="flex items-center gap-2">
          <label className="block text-sm font-medium text-gray-700 w-20">
            手机号
          </label>
          <div className="text-sm">
            {user?.phone || ''}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="block text-sm font-medium text-gray-700 w-20">
            邮箱
          </label>
          <div className="text-sm">
            {profileForm.email || '未设置'}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="block text-sm font-medium text-gray-700 w-20">
            注册时间
          </label>
          <div className="text-sm">
            {user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''}
          </div>
        </div>

        {/* 邀请码部分 */}
        {invitationUseInfo && !invitationUseInfo.has_used && (
          <div className="flex items-center gap-2">
            <label className="block text-sm font-medium text-gray-700 w-20">
              邀请码
            </label>
            <div className="flex gap-3">
              <Input
                type="text"
                value={invitationCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvitationCode(e.target.value)}
                placeholder="填写以获得额外权益"
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
                variant={invitationCode.trim() ? "primary" : "outline"}
                className="min-w-16"
              >
                {submittingInvitation ? '提交中...' : '提交'}
              </Button>
            </div>
          </div>
        )}

        {/* 已使用邀请码的提示 */}
        {invitationUseInfo && invitationUseInfo.has_used && (
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-green-800">已使用邀请码</span>
          </div>
        )}


        {/* 我的邀请码部分 - 显示普通邀请码 */}
        {myNormalInvitation && (
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium text-gray-700 w-20">我的邀请码</h3>
            {/* <div className="text-xs text-gray-500">
              已邀请 {myNormalInvitation.used_count} 人
            </div> */}

            <div>
              <code className="text-base font-mono font-semibold text-gray-900 bg-gray-50 px-3 py-1.5 rounded">
                {myNormalInvitation.code}
              </code>
              <Button
                variant="link"
                onClick={() => handleCopyCode(myNormalInvitation.code)}
                className=""
                title="复制邀请码"
                // icon={<CopyIcon className="w-4 h-4 mr-1" />}
              >
                复制邀请链接
              </Button>
            </div>
          </div>
        )}
      </div>


      

      

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setIsPasswordModalOpen(true)}>
          修改密码
        </Button>
        <Button variant="outline" onClick={handleLogout}>
          退出登录
        </Button>
      </div>

      <UserChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};

export default ProfileInfo;
