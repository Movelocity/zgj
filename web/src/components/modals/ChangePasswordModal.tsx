import React, { useState } from 'react';
import { Modal, Input } from '@/components/ui';
import { showSuccess, showError } from '@/utils/toast';
import { adminAPI } from '@/api/admin';
import type { User } from '@/types/user';
import { FaInfoCircle } from 'react-icons/fa';

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

  const handleSubmit = async () => {
    // e.preventDefault();
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
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="修改用户密码"
      size="sm"
      showFooter={true}
      confirmText={loading ? '修改中...' : '确认修改'}
      cancelText="取消"
      onConfirm={handleSubmit}
      onCancel={handleClose}
      confirmLoading={loading}
    >
      <div className="p-6">
        <p className="text-sm text-gray-500 mb-4">
          用户：{user.name || user.phone}
        </p>

        
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaInfoCircle className="h-5 w-5 text-blue-400" />
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
      
      </div>
    </Modal>
  );
};

export default ChangePasswordModal;
