import React, { useState } from 'react';
import { userAPI } from '@/api/user';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { showSuccess, showError } from '@/utils/toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface ChangePasswordProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ loading, setLoading }) => {
  // 修改密码表单
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // 密码可见性状态
  const [passwordVisibility, setPasswordVisibility] = useState({
    current_password: false,
    new_password: false,
    confirm_password: false,
  });

  // 修改密码
  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showError('新密码和确认密码不一致');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      showError('密码长度不能少于6位');
      return;
    }

    try {
      setLoading(true);
      const response = await userAPI.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      
      if (response.code === 0) {
        showSuccess('密码修改成功');
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
      } else {
        showError(response.msg || '密码修改失败');
      }
    } catch (error) {
      showError('密码修改失败，请重试');
      console.error('修改密码失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 切换密码可见性
  const togglePasswordVisibility = (field: keyof typeof passwordVisibility) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // 眼睛图标组件
  const EyeIcon = ({ visible, onClick }: { visible: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="text-gray-400 hover:text-gray-600 focus:outline-none"
    >
      {visible ? (
        <FaEye className="w-5 h-5" />
      ) : (
        <FaEyeSlash className="w-5 h-5" />
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">修改密码</h2>
      
      <div className="max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            当前密码
          </label>
          <Input
            type={passwordVisibility.current_password ? "text" : "password"}
            value={passwordForm.current_password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
            placeholder="请输入当前密码"
            rightIcon={
              <EyeIcon
                visible={passwordVisibility.current_password}
                onClick={() => togglePasswordVisibility('current_password')}
              />
            }
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            新密码
          </label>
          <Input
            type={passwordVisibility.new_password ? "text" : "password"}
            value={passwordForm.new_password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
            placeholder="请输入新密码（至少6位）"
            rightIcon={
              <EyeIcon
                visible={passwordVisibility.new_password}
                onClick={() => togglePasswordVisibility('new_password')}
              />
            }
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            确认新密码
          </label>
          <Input
            type={passwordVisibility.confirm_password ? "text" : "password"}
            value={passwordForm.confirm_password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
            placeholder="请再次输入新密码"
            rightIcon={
              <EyeIcon
                visible={passwordVisibility.confirm_password}
                onClick={() => togglePasswordVisibility('confirm_password')}
              />
            }
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleChangePassword}
          disabled={loading || !passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password}
          className="px-6 py-2"
        >
          {loading ? '修改中...' : '修改密码'}
        </Button>
      </div>
    </div>
  );
};

export default ChangePassword;
