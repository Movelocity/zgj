import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { showSuccess, showError } from '@/utils/toast';
import { adminAPI } from '@/api/admin';
import type { User } from '@/types/user';
import { FaExclamationTriangle } from 'react-icons/fa';

interface ChangeRoleModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<number>(666);

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
    }
  }, [user]);

  const getRoleName = (role: number) => {
    switch (role) {
      case 888:
        return '管理员';
      case 666:
        return '普通用户';
      default:
        return '未知';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (selectedRole === user.role) {
      showError('请选择不同的角色');
      return;
    }

    try {
      setLoading(true);
      const response = await adminAPI.updateUserRole(user.id, selectedRole);

      if (response.code === 0) {
        showSuccess('用户角色更新成功');
        onSuccess();
        onClose();
      } else {
        showError(response.msg || '角色更新失败');
      }
    } catch (error) {
      console.error('更新用户角色失败:', error);
      showError('角色更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            修改用户角色
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            用户：{user.name || user.phone}
          </p>
          <p className="text-sm text-gray-500">
            当前角色：
            <span className={`ml-1 px-2 py-1 text-xs font-medium rounded-full ${
              user.role === 888 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {getRoleName(user.role)}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              选择新角色
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value={666}
                  checked={selectedRole === 666}
                  onChange={(e) => setSelectedRole(parseInt(e.target.value))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  disabled={loading}
                />
                <span className="ml-3 flex items-center">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    普通用户
                  </span>
                  <span className="ml-2 text-sm text-gray-600">
                    - 基本功能权限
                  </span>
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value={888}
                  checked={selectedRole === 888}
                  onChange={(e) => setSelectedRole(parseInt(e.target.value))}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                  disabled={loading}
                />
                <span className="ml-3 flex items-center">
                  <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                    管理员
                  </span>
                  <span className="ml-2 text-sm text-gray-600">
                    - 完整管理权限
                  </span>
                </span>
              </label>
            </div>
          </div>

          {selectedRole !== user.role && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    <strong>注意：</strong>修改用户角色将立即生效，请谨慎操作。
                  </p>
                </div>
              </div>
            </div>
          )}
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
            disabled={selectedRole === user.role}
          >
            确认修改
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChangeRoleModal;
