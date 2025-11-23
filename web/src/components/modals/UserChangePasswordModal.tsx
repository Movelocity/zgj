import React, { useState } from 'react';
import { Modal, Input } from '@/components/ui';
import { showSuccess, showError } from '@/utils/toast';
import { userAPI } from '@/api/user';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface UserChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserChangePasswordModal: React.FC<UserChangePasswordModalProps> = ({
  isOpen,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
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

  // 表单错误
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // 验证表单
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!passwordForm.current_password) {
      newErrors.current_password = '请输入当前密码';
    }
    
    if (!passwordForm.new_password) {
      newErrors.new_password = '请输入新密码';
    } else if (passwordForm.new_password.length < 6) {
      newErrors.new_password = '密码长度至少6位';
    }
    
    if (!passwordForm.confirm_password) {
      newErrors.confirm_password = '请确认新密码';
    } else if (passwordForm.new_password !== passwordForm.confirm_password) {
      newErrors.confirm_password = '两次输入的密码不一致';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 修改密码
  const handleChangePassword = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const response = await userAPI.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      
      if (response.code === 0) {
        showSuccess('密码修改成功');
        handleClose();
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

  // 处理输入变化
  const handleInputChange = (field: string, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除相关错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // 关闭 modal
  const handleClose = () => {
    setPasswordForm({
      current_password: '',
      new_password: '',
      confirm_password: '',
    });
    setPasswordVisibility({
      current_password: false,
      new_password: false,
      confirm_password: false,
    });
    setErrors({});
    onClose();
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
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="修改密码"
      size="sm"
      showFooter={true}
      confirmText={loading ? '修改中...' : '确认修改'}
      cancelText="取消"
      onConfirm={handleChangePassword}
      onCancel={handleClose}
      confirmLoading={loading}
    >
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            当前密码
          </label>
          <Input
            type={passwordVisibility.current_password ? "text" : "password"}
            value={passwordForm.current_password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              handleInputChange('current_password', e.target.value)
            }
            placeholder="请输入当前密码"
            disabled={loading}
            autoComplete="off"
            rightIcon={
              <EyeIcon
                visible={passwordVisibility.current_password}
                onClick={() => togglePasswordVisibility('current_password')}
              />
            }
            error={errors.current_password}
          />
          {errors.current_password && (
            <p className="mt-1 text-sm text-red-600">{errors.current_password}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            新密码
          </label>
          <Input
            type={passwordVisibility.new_password ? "text" : "password"}
            value={passwordForm.new_password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              handleInputChange('new_password', e.target.value)
            }
            placeholder="请输入新密码（至少6位）"
            disabled={loading}
            autoComplete="new-password"
            rightIcon={
              <EyeIcon
                visible={passwordVisibility.new_password}
                onClick={() => togglePasswordVisibility('new_password')}
              />
            }
            error={errors.new_password}
          />
          {errors.new_password && (
            <p className="mt-1 text-sm text-red-600">{errors.new_password}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            确认新密码
          </label>
          <Input
            type={passwordVisibility.confirm_password ? "text" : "password"}
            value={passwordForm.confirm_password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              handleInputChange('confirm_password', e.target.value)
            }
            placeholder="请再次输入新密码"
            disabled={loading}
            autoComplete="new-password"
            rightIcon={
              <EyeIcon
                visible={passwordVisibility.confirm_password}
                onClick={() => togglePasswordVisibility('confirm_password')}
              />
            }
            error={errors.confirm_password}
          />
          {errors.confirm_password && (
            <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default UserChangePasswordModal;

