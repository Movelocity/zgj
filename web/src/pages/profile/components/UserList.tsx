import React, { useState, useEffect } from 'react';
import { adminAPI } from '@/api/admin';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { showSuccess, showError } from '@/utils/toast';
import type { User } from '@/types/user';
import { EditUserModal, ChangeRoleModal, ChangePasswordModal } from '@/components/modals';
// import type { PaginationResponse } from '@/types/global';

interface UserListProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const UserList: React.FC<UserListProps> = ({ loading, setLoading }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  // 模态框状态
  const [editUserModal, setEditUserModal] = useState({ isOpen: false, user: null as User | null });
  const [changeRoleModal, setChangeRoleModal] = useState({ isOpen: false, user: null as User | null });
  const [changePasswordModal, setChangePasswordModal] = useState({ isOpen: false, user: null as User | null });

  // 加载用户列表
  const loadUsers = async (page = 1, keyword = searchKeyword) => {
    try {
      setLoading(true);
      const params = {
        page,
        pageSize: pagination.pageSize,
        ...(keyword && { keyword }),
      };
      
      const response = await adminAPI.getUsers(params);
      if (response.code === 0) {
        setUsers(response.data.list || []);
        setPagination(prev => ({
          ...prev,
          current: response.data.page || 1,
          total: response.data.total || 0,
        }));
      } else {
        showError(response.msg || '加载用户列表失败');
      }
    } catch (error) {
      console.error('加载用户列表失败:', error);
      showError('加载用户列表失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 搜索用户
  const handleSearch = () => {
    setSearchKeyword(searchInput);
    loadUsers(1, searchInput);
  };

  // 重置搜索
  const handleResetSearch = () => {
    setSearchInput('');
    setSearchKeyword('');
    loadUsers(1, '');
  };

  // 激活/禁用用户
  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      setLoading(true);
      const response = isActive 
        ? await adminAPI.deactivateUser(userId)
        : await adminAPI.activateUser(userId);
      
      if (response.code === 0) {
        showSuccess(`用户${isActive ? '禁用' : '激活'}成功`);
        await loadUsers(pagination.current);
      } else {
        showError(response.msg || `用户${isActive ? '禁用' : '激活'}失败`);
      }
    } catch (error) {
      console.error('操作用户状态失败:', error);
      showError(`用户${isActive ? '禁用' : '激活'}失败，请重试`);
    } finally {
      setLoading(false);
    }
  };

  // 删除用户
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`确认删除用户 "${userName}" 吗？此操作不可恢复！`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await adminAPI.deleteUser(userId);
      
      if (response.code === 0) {
        showSuccess('用户删除成功');
        await loadUsers(pagination.current);
      } else {
        showError(response.msg || '用户删除失败');
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      showError('删除用户失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 翻页
  const handlePageChange = (page: number) => {
    loadUsers(page);
  };

  // 编辑用户信息
  const handleEditUser = (user: User) => {
    setEditUserModal({ isOpen: true, user });
  };

  // 修改用户角色
  const handleChangeRole = (user: User) => {
    setChangeRoleModal({ isOpen: true, user });
  };

  // 修改用户密码
  const handleChangePassword = (user: User) => {
    setChangePasswordModal({ isOpen: true, user });
  };

  // 模态框关闭处理
  const handleModalClose = (modalType: 'edit' | 'role' | 'password') => {
    switch (modalType) {
      case 'edit':
        setEditUserModal({ isOpen: false, user: null });
        break;
      case 'role':
        setChangeRoleModal({ isOpen: false, user: null });
        break;
      case 'password':
        setChangePasswordModal({ isOpen: false, user: null });
        break;
    }
  };

  // 模态框成功处理（重新加载用户列表）
  const handleModalSuccess = () => {
    loadUsers(pagination.current);
  };

  // 获取用户角色显示名称
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

  // 获取用户状态显示
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

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-lg font-medium text-gray-900">用户管理</span>
        <div className="flex gap-2">
          <div>
            <Input
              type="text"
              placeholder="搜索用户名或手机号"
              value={searchInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-64"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            搜索
          </Button>
          {searchKeyword && (
            <Button variant="outline" onClick={handleResetSearch}>
              重置
            </Button>
          )}
        </div>
      </div>

      {/* 用户统计 */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-sm text-gray-600">
          共找到 <span className="font-medium text-gray-900">{pagination.total}</span> 个用户
          {searchKeyword && (
            <span>，搜索关键词：<span className="font-medium text-blue-600">"{searchKeyword}"</span></span>
          )}
        </div>
      </div>

      {/* 用户列表 */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  注册时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最后登录
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.name?.charAt(0) || user.phone.slice(-2)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || '未设置'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.phone}
                        </div>
                        {user.email && (
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 888 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {getRoleName(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusDisplay(user.active)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : '未登录'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeRole(user)}
                        disabled={loading}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        角色
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangePassword(user)}
                        disabled={loading}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        密码
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleUserStatus(user.id, user.active)}
                        disabled={loading}
                        className={user.active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                      >
                        {user.active ? '禁用' : '激活'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.name || user.phone)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700"
                      >
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            {searchKeyword ? '没有找到匹配的用户' : '暂无用户数据'}
          </div>
        )}
      </div>

      {/* 分页 */}
      {pagination.total > pagination.pageSize && (
        <div className="flex justify-center items-center gap-4">
          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.current - 1)}
            disabled={pagination.current <= 1 || loading}
          >
            上一页
          </Button>
          
          <span className="text-sm text-gray-600">
            第 {pagination.current} 页，共 {Math.ceil(pagination.total / pagination.pageSize)} 页
          </span>
          
          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.current + 1)}
            disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize) || loading}
          >
            下一页
          </Button>
        </div>
      )}

      {/* 编辑用户信息模态框 */}
      <EditUserModal
        user={editUserModal.user}
        isOpen={editUserModal.isOpen}
        onClose={() => handleModalClose('edit')}
        onSuccess={handleModalSuccess}
      />

      {/* 修改用户角色模态框 */}
      <ChangeRoleModal
        user={changeRoleModal.user}
        isOpen={changeRoleModal.isOpen}
        onClose={() => handleModalClose('role')}
        onSuccess={handleModalSuccess}
      />

      {/* 修改用户密码模态框 */}
      <ChangePasswordModal
        user={changePasswordModal.user}
        isOpen={changePasswordModal.isOpen}
        onClose={() => handleModalClose('password')}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default UserList;
