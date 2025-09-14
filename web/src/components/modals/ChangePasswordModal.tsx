import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { showSuccess, showError } from '@/utils/toast';
import { adminAPI } from '@/api/admin';
import type { User } from '@/types/user';

interface ChangePasswordModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.newPassword) {
      newErrors.newPassword = '请输入新密码';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = '密码长度至少6位';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认新密码';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validateForm()) return;

    try {
      setLoading(true);
      const response = await adminAPI.adminChangePassword(user.id, formData.newPassword);

      if (response.code === 0) {
        showSuccess('用户密码修改成功');
        onSuccess();
        onClose();
        // 重置表单
        setFormData({ newPassword: '', confirmPassword: '' });
        setErrors({});
      } else {
        showError(response.msg || '密码修改失败');
      }
    } catch (error) {
      console.error('修改用户密码失败:', error);
      showError('密码修改失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
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

  const handleClose = () => {
    setFormData({ newPassword: '', confirmPassword: '' });
    setErrors({});
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            修改用户密码
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            用户：{user.name || user.phone}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  管理员修改用户密码无需验证原密码，新密码将立即生效。
                </p>
              </div>
            </div>
          </div>

          <div>
            <Input
              type="password"
              value={formData.newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('newPassword', e.target.value)
              }
              placeholder="请输入新密码（至少6位）"
              disabled={loading}
              error={errors.newPassword}
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
            )}
          </div>

          <div>
            <Input
              type="password"
              value={formData.confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('confirmPassword', e.target.value)
              }
              placeholder="再次确认新密码"
              disabled={loading}
              error={errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
          >
            确认修改
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
