import React, { useState, useEffect } from 'react';
import { Button, Input, Modal } from '@/components/ui';
import { showSuccess, showError } from '@/utils/toast';
import {
  getUserBillingPackages,
  assignBillingPackage,
  listBillingPackages,
} from '@/api/billing';
import { adminAPI } from '@/api/admin';
import type { UserBillingPackage, BillingPackage } from '@/types/billing';
import { PACKAGE_STATUS_NAME_MAP, PACKAGE_SOURCE_NAME_MAP } from '@/types/billing';
import type { User } from '@/types/user';

const UserBillingPackageList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userPackages, setUserPackages] = useState<UserBillingPackage[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [availablePackages, setAvailablePackages] = useState<BillingPackage[]>([]);
  const [assignForm, setAssignForm] = useState({
    package_id: 0,
    notes: '',
    auto_activate: true,
  });

  useEffect(() => {
    loadUsers();
    loadAvailablePackages();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getUsers({ page: 1, page_size: 100 });
      if (response.code === 0) {
        setUsers(response.data.list || []);
      }
    } catch (error) {
      console.error('加载用户列表失败:', error);
    }
  };

  const loadAvailablePackages = async () => {
    try {
      const response = await listBillingPackages({ active_only: true });
      if (response.code === 0) {
        setAvailablePackages(response.data || []);
      }
    } catch (error) {
      console.error('加载套餐列表失败:', error);
    }
  };

  const loadUserPackages = async (userId: string) => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await getUserBillingPackages(userId);
      if (response.code === 0) {
        setUserPackages(response.data || []);
      } else {
        showError(response.msg || '加载用户套餐失败');
      }
    } catch (error) {
      console.error('加载用户套餐失败:', error);
      showError('加载用户套餐失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    if (userId) {
      loadUserPackages(userId);
    } else {
      setUserPackages([]);
    }
  };

  const handleOpenAssignModal = () => {
    if (!selectedUserId) {
      showError('请先选择用户');
      return;
    }
    setAssignForm({
      package_id: availablePackages[0]?.id || 0,
      notes: '',
      auto_activate: true,
    });
    setModalOpen(true);
  };

  const handleAssignPackage = async () => {
    if (!selectedUserId || !assignForm.package_id) {
      showError('请选择套餐');
      return;
    }

    try {
      setLoading(true);
      const response = await assignBillingPackage({
        user_id: selectedUserId,
        package_id: assignForm.package_id,
        source: 'system',
        notes: assignForm.notes,
        auto_activate: assignForm.auto_activate,
      });

      if (response.code === 0) {
        showSuccess('套餐分配成功');
        setModalOpen(false);
        loadUserPackages(selectedUserId);
      } else {
        showError(response.msg || '分配套餐失败');
      }
    } catch (error) {
      console.error('分配套餐失败:', error);
      showError('分配套餐失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">用户套餐管理</h2>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">选择用户</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={selectedUserId}
            onChange={(e) => handleUserChange(e.target.value)}
          >
            <option value="">请选择用户</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.phone})
              </option>
            ))}
          </select>
        </div>
        <div className="pt-6">
          <Button onClick={handleOpenAssignModal} disabled={!selectedUserId}>
            分配套餐
          </Button>
        </div>
      </div>

      {selectedUserId && (
        <>
          {loading && <div>加载中...</div>}

          {!loading && userPackages.length === 0 && (
            <div className="text-center py-8 text-gray-500">该用户暂无套餐</div>
          )}

          {!loading && userPackages.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 border">套餐名称</th>
                    <th className="px-4 py-2 border">总积分</th>
                    <th className="px-4 py-2 border">已用</th>
                    <th className="px-4 py-2 border">剩余</th>
                    <th className="px-4 py-2 border">状态</th>
                    <th className="px-4 py-2 border">来源</th>
                    <th className="px-4 py-2 border">激活时间</th>
                    <th className="px-4 py-2 border">过期时间</th>
                  </tr>
                </thead>
                <tbody>
                  {userPackages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border">{pkg.package_name}</td>
                      <td className="px-4 py-2 border text-center">{pkg.total_credits}</td>
                      <td className="px-4 py-2 border text-center">{pkg.used_credits}</td>
                      <td className="px-4 py-2 border text-center">
                        <span className="font-semibold text-blue-600">
                          {pkg.remaining_credits}
                        </span>
                      </td>
                      <td className="px-4 py-2 border text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            pkg.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : pkg.status === 'depleted'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {PACKAGE_STATUS_NAME_MAP[pkg.status]}
                        </span>
                      </td>
                      <td className="px-4 py-2 border text-center">
                        {PACKAGE_SOURCE_NAME_MAP[pkg.source]}
                      </td>
                      <td className="px-4 py-2 border text-center text-sm">
                        {formatDate(pkg.activated_at)}
                      </td>
                      <td className="px-4 py-2 border text-center text-sm">
                        {formatDate(pkg.expires_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">为用户分配套餐</h3>

          <div>
            <label className="block text-sm font-medium mb-1">选择套餐</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={assignForm.package_id}
              onChange={(e) =>
                setAssignForm({ ...assignForm, package_id: parseInt(e.target.value) })
              }
            >
              {availablePackages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} - {pkg.credits_amount}积分
                  {pkg.validity_days > 0 && ` - ${pkg.validity_days}天`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">备注</label>
            <Input
              value={assignForm.notes}
              onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
              placeholder="分配原因或备注"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={assignForm.auto_activate}
                onChange={(e) =>
                  setAssignForm({ ...assignForm, auto_activate: e.target.checked })
                }
                className="mr-2"
              />
              立即激活
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAssignPackage} disabled={loading}>
              {loading ? '分配中...' : '确定'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserBillingPackageList;

