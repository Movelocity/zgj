import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            编辑用户信息
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            用户手机号：{user.phone}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
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
        </form>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
          >
            保存
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
