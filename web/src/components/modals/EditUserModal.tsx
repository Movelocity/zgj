import React, { useState, useEffect } from 'react';
import { Modal, Input } from '@/components/ui';
import { showSuccess, showError } from '@/utils/toast';
import { adminAPI } from '@/api/admin';
import type { User } from '@/types/user';

interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleSubmit = async () => {
    // e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      const response = await adminAPI.updateUser(user.id, {
        name: formData.name,
        email: formData.email,
      });

      if (response.code === 0) {
        showSuccess('用户信息更新成功');
        onSuccess();
        onClose();
      } else {
        showError(response.msg || '更新失败');
      }
    } catch (error) {
      console.error('更新用户信息失败:', error);
      showError('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen || !user) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="编辑用户信息"
      size="sm"
      showFooter={true}
      confirmText={loading ? '保存中...' : '保存'}
      cancelText="取消"
      onConfirm={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
    >
      <div className="p-6 space-y-4">
        <p className="text-sm text-gray-500">
          用户手机号：{user.phone}
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            用户姓名
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              handleInputChange('name', e.target.value)
            }
            placeholder="请输入用户姓名"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            邮箱地址
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              handleInputChange('email', e.target.value)
            }
            placeholder="请输入邮箱地址"
            disabled={loading}
          />
        </div>
      </div>
    </Modal>
  );
};

export default EditUserModal;
