import React, { useState, useEffect } from 'react';
import { adminAPI } from '@/api/admin';
import {Button, Input} from '@/components/ui';
import { showError } from '@/utils/toast';
import type { User } from '@/types/user';
import { UserDetailDrawer } from '@/components/drawers';

interface DailyGrowthData {
  stats: Array<{ date: string; count: number }>;
  total_users: number;
}

const UserManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  // Drawer state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // User growth chart state
  const [growthData, setGrowthData] = useState<DailyGrowthData | null>(null);
  const [growthDays, setGrowthDays] = useState<number>(30);
  const [loadingGrowth, setLoadingGrowth] = useState(false);

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

  // Open user detail drawer
  const handleOpenUserDrawer = (user: User) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  };

  // Close drawer
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedUser(null);
  };

  // Handle drawer success (reload user list)
  const handleDrawerSuccess = () => {
    loadUsers(pagination.current);
  };

  // 翻页
  const handlePageChange = (page: number) => {
    loadUsers(page);
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

  // 加载用户增长数据
  const loadUserGrowth = async (days: number) => {
    try {
      setLoadingGrowth(true);
      const response = await adminAPI.getDailyUserGrowth({ days });
      if (response.code === 0) {
        setGrowthData(response.data);
      } else {
        showError(response.msg || '加载用户增长数据失败');
      }
    } catch (error) {
      console.error('加载用户增长数据失败:', error);
      showError('加载用户增长数据失败，请重试');
    } finally {
      setLoadingGrowth(false);
    }
  };

  // 处理天数切换
  const handleDaysChange = (days: number) => {
    setGrowthDays(days);
    loadUserGrowth(days);
  };

  useEffect(() => {
    loadUsers();
    loadUserGrowth(30); // 默认加载最近30天数据
  }, []);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        {/* 头部操作栏 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-baseline gap-4">
            <h2 className="text-2xl font-bold text-gray-900">用户管理</h2>
            <div className="text-sm text-gray-600">
              共找到 <span className="font-medium text-gray-900">{pagination.total}</span> 个用户
            </div>
          </div>
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
            <Button onClick={handleSearch} disabled={loading} variant="primary">
              搜索
            </Button>
            {searchKeyword && (
              <Button variant="outline" onClick={handleResetSearch}>
                重置
              </Button>
            )}
          </div>
        </div>

        {/* 用户列表 */}
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">加载中...</p>
          </div>
        ) : (
          <div className="overflow-hidden">
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
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => handleOpenUserDrawer(user)}
                          disabled={loading}
                        >
                          管理
                        </Button>
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
        )}

        {/* 分页 */}
        {pagination.total > pagination.pageSize && (
          <div className="flex justify-center items-center gap-4 mt-6">
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

        {/* 用户增长趋势图 */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">用户增长趋势</h3>
            <div className="flex gap-2">
              {[7, 14, 30, 60, 90].map((days) => (
                <Button
                  key={days}
                  variant={growthDays === days ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleDaysChange(days)}
                  disabled={loadingGrowth}
                >
                  {days}天
                </Button>
              ))}
            </div>
          </div>

          {loadingGrowth ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : growthData && growthData.stats?.length > 0 ? (
            <div className="bg-gray-50 p-6 rounded-lg">
              {/* 统计概览 */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-600">总用户数</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    {growthData.total_users.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-600">期间新增</div>
                  <div className="text-2xl font-bold text-green-600 mt-1">
                    +{growthData.stats.reduce((sum, item) => sum + item.count, 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-600">日均新增</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">
                    {Math.round(growthData.stats.reduce((sum, item) => sum + item.count, 0) / growthData.stats.length).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* 图表区域 */}
              <div className="bg-white p-4 rounded-lg">
                <div className="relative h-64">
                  {/* Y轴标签 */}
                  <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-500">
                    {(() => {
                      const maxCount = Math.max(...growthData.stats.map(s => s.count), 1);
                      const step = Math.ceil(maxCount / 4);
                      return [4, 3, 2, 1, 0].map(i => (
                        <div key={i} className="text-right pr-2">{i * step}</div>
                      ));
                    })()}
                  </div>

                  {/* 图表主体 */}
                  <div className="absolute left-12 right-0 top-0 bottom-8 flex items-end gap-1">
                    {growthData.stats.map((stat, index) => {
                      const maxCount = Math.max(...growthData.stats.map(s => s.count), 1);
                      const height = (stat.count / maxCount) * 100;
                      return (
                        <div
                          key={index}
                          className="flex-1 group relative"
                          style={{ height: '100%' }}
                        >
                          {/* 数据条 */}
                          <div
                            className="absolute bottom-0 w-full bg-blue-500 hover:bg-blue-600 transition-all rounded-t cursor-pointer"
                            style={{ height: `${height}%`, minHeight: stat.count > 0 ? '4px' : '0' }}
                          >
                            {/* Tooltip */}
                            <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                              <div className="font-semibold">{stat.date}</div>
                              <div className="text-gray-300">新增: {stat.count} 人</div>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* X轴 */}
                  <div className="absolute left-12 right-0 bottom-0 h-8 border-t border-gray-200">
                    <div className="relative w-full h-full flex items-center">
                      {(() => {
                        const total = growthData.stats.length;
                        const showEvery = Math.ceil(total / 6); // 最多显示6个日期标签
                        console.log(`Total stats: ${total}, growthData:`, growthData);
                        return growthData.stats.map((stat, index) => {
                          if (index === 0 || index === total - 1 || index % showEvery === 0) {
                            const position = (index / (total - 1)) * 80 + 10;
                            return (
                              <div 
                                key={index} 
                                className="absolute text-xs text-gray-500 transform -translate-x-1/2 text-nowrap"
                                style={{ left: `${position}%` }}
                              >
                                {stat.date.slice(5, 10)} {/* 显示MM-DD */}
                              </div>
                            );
                          }
                          return null;
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              暂无数据
            </div>
          )}
        </div>
      </div>

      {/* User Detail Drawer */}
      <UserDetailDrawer
        user={selectedUser}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onSuccess={handleDrawerSuccess}
      />
    </div>
  );
};

export default UserManagement;
