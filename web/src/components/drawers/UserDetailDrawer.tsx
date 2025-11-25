import React, { useState, useEffect } from 'react';
import { Drawer, Input, Button, Modal } from '@/components/ui';
import { showSuccess, showError } from '@/utils/toast';
import { adminAPI } from '@/api/admin';
import type { User } from '@/types/user';
import { FaExclamationTriangle, FaInfoCircle, FaTrash } from 'react-icons/fa';
import {
  getUserBillingPackages,
  assignBillingPackage,
  listBillingPackages,
} from '@/api/billing';
import type { UserBillingPackage, BillingPackage } from '@/types/billing';
import { PACKAGE_STATUS_NAME_MAP, PACKAGE_SOURCE_NAME_MAP } from '@/types/billing';

interface UserDetailDrawerProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'status' | 'packages'>('info');
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [selectedRole, setSelectedRole] = useState<number>(666);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  // Billing package states
  const [userPackages, setUserPackages] = useState<UserBillingPackage[]>([]);
  const [availablePackages, setAvailablePackages] = useState<BillingPackage[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    package_id: 0,
    notes: '',
    auto_activate: true,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
      setSelectedRole(user.role);
      setNewPassword('');
      setPasswordError('');
      setShowPasswordReset(false);
      setActiveTab('info');
      setUserPackages([]);
      loadAvailablePackages();
    }
  }, [user]);

  useEffect(() => {
    if (user && activeTab === 'packages') {
      loadUserPackages();
    }
  }, [user, activeTab]);

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

  const getStatusDisplay = (active: boolean) => {
    return active ? (
      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
        正常
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
        已禁用
      </span>
    );
  };

  // Update user info
  const handleUpdateInfo = async () => {
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
      } else {
        showError(response.msg || '更新失败');
      }
    } catch (error) {
      console.error('Update user info failed:', error);
      showError('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // Update user role (immediate effect)
  const handleRoleChange = async (newRole: number) => {
    if (!user || newRole === user.role) return;

    try {
      setLoading(true);
      const response = await adminAPI.updateUserRole(user.id, newRole);

      if (response.code === 0) {
        showSuccess('用户角色更新成功');
        setSelectedRole(newRole);
        onSuccess();
      } else {
        showError(response.msg || '角色更新失败');
        // Revert on failure
        setSelectedRole(user.role);
      }
    } catch (error) {
      console.error('Update user role failed:', error);
      showError('角色更新失败，请重试');
      // Revert on failure
      setSelectedRole(user.role);
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!user) return;

    if (!newPassword) {
      setPasswordError('请输入新密码');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('密码长度至少6位');
      return;
    }

    try {
      setLoading(true);
      const response = await adminAPI.adminChangePassword(user.id, newPassword);

      if (response.code === 0) {
        showSuccess('密码重置成功');
        setNewPassword('');
        setPasswordError('');
        setShowPasswordReset(false);
        onSuccess();
      } else {
        showError(response.msg || '密码重置失败');
      }
    } catch (error) {
      console.error('Reset password failed:', error);
      showError('密码重置失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // Toggle user status
  const handleToggleStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = user.active 
        ? await adminAPI.deactivateUser(user.id)
        : await adminAPI.activateUser(user.id);
      
      if (response.code === 0) {
        showSuccess(`用户${user.active ? '禁用' : '激活'}成功`);
        onSuccess();
      } else {
        showError(response.msg || `用户${user.active ? '禁用' : '激活'}失败`);
      }
    } catch (error) {
      console.error('Toggle user status failed:', error);
      showError(`用户${user.active ? '禁用' : '激活'}失败，请重试`);
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!user) return;

    if (!confirm(`确认删除用户 "${user.name || user.phone}" 吗？此操作不可恢复！`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await adminAPI.deleteUser(user.id);
      
      if (response.code === 0) {
        showSuccess('用户删除成功');
        onSuccess();
        onClose();
      } else {
        showError(response.msg || '用户删除失败');
      }
    } catch (error) {
      console.error('Delete user failed:', error);
      showError('用户删除失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // Billing package functions
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

  const loadUserPackages = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await getUserBillingPackages(user.id);
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

  const handleOpenAssignModal = () => {
    if (!user) return;
    
    setAssignForm({
      package_id: availablePackages[0]?.id || 0,
      notes: '',
      auto_activate: true,
    });
    setModalOpen(true);
  };

  const handleAssignPackage = async () => {
    if (!user || !assignForm.package_id) {
      showError('请选择套餐');
      return;
    }

    try {
      setLoading(true);
      const response = await assignBillingPackage({
        user_id: user.id,
        package_id: assignForm.package_id,
        source: 'system',
        notes: assignForm.notes,
        auto_activate: assignForm.auto_activate,
      });

      if (response.code === 0) {
        showSuccess('套餐分配成功');
        setModalOpen(false);
        loadUserPackages();
        onSuccess();
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

  if (!user) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="用户详情"
      width="500px"
    >

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {[
            { key: 'info', label: '基本信息' },
            { key: 'packages', label: '套餐管理' },
            { key: 'status', label: '状态与操作' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Basic Info Tab - Merged with Role and Password */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* 用户头像和基本状态 */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-xl font-medium text-gray-700">
                  {user.name?.charAt(0) || user.phone.slice(-2)}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {user.name || '未设置'}
                </h3>
                <p className="text-sm text-gray-500">{user.phone}</p>
                {user.email && (
                  <p className="text-sm text-gray-500">{user.email}</p>
                )}
                <div className="mt-1 flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === 888 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {getRoleName(user.role)}
                  </span>
                  {getStatusDisplay(user.active)}
                </div>
              </div>
            </div>

            {/* 基本信息 */}
            <div className="space-y-4">
              {/* <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">基本信息</h4> */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户姓名
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setFormData(prev => ({ ...prev, name: e.target.value }))
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
                    setFormData(prev => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="请输入邮箱地址"
                  disabled={loading}
                />
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleUpdateInfo}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? '保存中...' : '保存基本信息'}
                </Button>
              </div>
            </div>

            {/* 用户角色 */}
            <div className="space-y-4 pt-4 border-t">
              {/* <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">用户角色</h4> */}
              <p className="text-sm text-gray-500">
                当前角色：
                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                  user.role === 888 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {getRoleName(user.role)}
                </span>
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">
                      角色修改将立即生效，请谨慎操作
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="role"
                    value={666}
                    checked={selectedRole === 666}
                    onChange={(e) => handleRoleChange(parseInt(e.target.value))}
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
                
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="role"
                    value={888}
                    checked={selectedRole === 888}
                    onChange={(e) => handleRoleChange(parseInt(e.target.value))}
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

            {/* 密码重置 */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">密码管理</h4>
                {!showPasswordReset && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasswordReset(true)}
                    disabled={loading}
                  >
                    重置密码
                  </Button>
                )}
              </div>

              {showPasswordReset && (
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FaInfoCircle className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-800">
                          管理员修改用户密码无需验证原密码，新密码将立即生效
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      新密码
                    </label>
                    <Input
                      type="new-password"
                      value={newPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setNewPassword(e.target.value);
                        setPasswordError('');
                      }}
                      placeholder="请输入新密码（至少6位）"
                      disabled={loading}
                      error={passwordError}
                    />
                    {passwordError && (
                      <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleResetPassword}
                      disabled={loading || !newPassword}
                      className="flex-1"
                    >
                      {loading ? '重置中...' : '确认重置'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPasswordReset(false);
                        setNewPassword('');
                        setPasswordError('');
                      }}
                      disabled={loading}
                      className="flex-1"
                    >
                      取消
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Packages Tab */}
        {activeTab === 'packages' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-semibold text-gray-900">用户套餐列表</h4>
              <Button
                onClick={handleOpenAssignModal}
                disabled={loading || availablePackages.length === 0}
                size="sm"
              >
                分配套餐
              </Button>
            </div>

            {loading && <div className="text-center py-8 text-gray-500">加载中...</div>}

            {!loading && userPackages.length === 0 && (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border">
                该用户暂无套餐
              </div>
            )}

            {!loading && userPackages.length > 0 && (
              <div className="space-y-3">
                {userPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h5 className="font-semibold text-gray-900">{pkg.package_name}</h5>
                        <p className="text-xs text-gray-500 mt-1">
                          {PACKAGE_SOURCE_NAME_MAP[pkg.source]}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          pkg.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : pkg.status === 'depleted'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {PACKAGE_STATUS_NAME_MAP[pkg.status]}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">总积分</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {pkg.total_credits}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">已用</p>
                        <p className="text-lg font-semibold text-orange-600">
                          {pkg.used_credits}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">剩余</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {pkg.remaining_credits}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 space-y-1 border-t pt-3">
                      <div className="flex justify-between">
                        <span>激活时间：</span>
                        <span>{formatDate(pkg.activated_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>过期时间：</span>
                        <span>{formatDate(pkg.expires_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Status & Actions Tab */}
        {activeTab === 'status' && (
          <div className="space-y-6">
            {/* Account Status */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">账户状态</h4>
              <div className="flex items-center justify-between p-4 bg-gray-50 border rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    当前状态：{getStatusDisplay(user.active)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {user.active 
                      ? '用户可以正常访问系统' 
                      : '用户已被禁用，无法登录'}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <Button
                  onClick={handleToggleStatus}
                  disabled={loading}
                  variant={user.active ? 'outline' : 'default'}
                  className="w-full"
                >
                  {loading ? '处理中...' : (user.active ? '禁用用户' : '激活用户')}
                </Button>
              </div>
            </div>

            {/* User Metadata */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">用户信息</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">用户ID：</span>
                  <span className="text-gray-900 font-mono text-xs">{user.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">注册时间：</span>
                  <span className="text-gray-900">{new Date(user.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">最后登录：</span>
                  <span className="text-gray-900">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString('zh-CN') : '从未登录'}
                  </span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border-t pt-6">
              <h4 className="text-sm font-semibold text-red-600 mb-3">危险操作</h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <FaTrash className="h-5 w-5 text-red-400 mt-0.5" />
                  <div className="ml-3 flex-1">
                    <h5 className="text-sm font-medium text-red-800">删除用户</h5>
                    <p className="text-sm text-red-700 mt-1">
                      永久删除此用户及其所有关联数据。此操作不可恢复。
                    </p>
                    <div className="mt-3">
                      <Button
                        onClick={handleDeleteUser}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {loading ? '删除中...' : '删除用户'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assign Package Modal */}
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
    </Drawer>
  );
};

export default UserDetailDrawer;
