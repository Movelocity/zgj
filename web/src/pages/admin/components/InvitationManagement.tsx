import React, { useState, useEffect } from 'react';
import { invitationAPI } from '@/api/invitation';
import { adminAPI } from '@/api/admin';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { showSuccess, showError } from '@/utils/toast';
import type { InvitationCode } from '@/types/invitation';
import type { User } from '@/types/user';
import { FiCopy, FiCheck, FiPlus, FiUsers, FiEdit } from 'react-icons/fi';

const InvitationManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<InvitationCode[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // 创建邀请码的表单
  const [createForm, setCreateForm] = useState({
    max_uses: 1,
    expires_in_days: null as number | null,
    note: '',
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // 批量创建邀请码
  const [showBatchCreateModal, setShowBatchCreateModal] = useState(false);
  const [batchCreateLoading, setBatchCreateLoading] = useState(false);

  // 批量更新邀请码
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [showBatchUpdateModal, setShowBatchUpdateModal] = useState(false);
  const [batchUpdateForm, setBatchUpdateForm] = useState({
    max_uses: null as number | null,
    expires_in_days: null as number | null,
  });
  const [batchUpdateLoading, setBatchUpdateLoading] = useState(false);

  // 编辑单个邀请码
  const [editingInvitation, setEditingInvitation] = useState<InvitationCode | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    max_uses: null as number | null,
    expires_in_days: null as number | null,
    note: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  // 加载邀请码列表
  const loadInvitations = async (page = 1) => {
    try {
      setLoading(true);
      const response = await invitationAPI.getInvitationList({
        page,
        limit: pagination.pageSize,
      });
      
      if (response.code === 0) {
        setInvitations(response.data.data || []);
        setPagination(prev => ({
          ...prev,
          current: response.data.page || 1,
          total: response.data.total || 0,
        }));
      } else {
        showError(response.msg || '加载邀请码列表失败');
      }
    } catch (error) {
      console.error('加载邀请码列表失败:', error);
      showError('加载邀请码列表失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 创建邀请码
  const handleCreateInvitation = async () => {
    if (createForm.max_uses < -1 || createForm.max_uses === 0) {
      showError('使用次数必须为 -1（无限次）或大于 0');
      return;
    }

    try {
      setLoading(true);
      const response = await invitationAPI.createInvitation(createForm);
      
      if (response.code === 0) {
        showSuccess('邀请码创建成功');
        setShowCreateForm(false);
        setCreateForm({ max_uses: 1, expires_in_days: null, note: '' });
        await loadInvitations(pagination.current);
      } else {
        showError(response.msg || '创建邀请码失败');
      }
    } catch (error) {
      console.error('创建邀请码失败:', error);
      showError('创建邀请码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 批量更新邀请码
  const handleBatchUpdateInvitations = async () => {
    if (selectedCodes.length === 0) {
      showError('请先选择要更新的邀请码');
      return;
    }

    // 验证表单数据
    if (batchUpdateForm.max_uses !== null && (batchUpdateForm.max_uses < -1 || batchUpdateForm.max_uses === 0)) {
      showError('使用次数必须为 -1（无限次）或大于 0');
      return;
    }

    if (batchUpdateForm.expires_in_days !== null && batchUpdateForm.expires_in_days < 0) {
      showError('有效期必须大于等于 0（0 表示永不过期）');
      return;
    }

    // 检查是否至少有一个字段要更新
    if (batchUpdateForm.max_uses === null && batchUpdateForm.expires_in_days === null) {
      showError('请至少填写一个要更新的字段');
      return;
    }

    try {
      setBatchUpdateLoading(true);
      const response = await invitationAPI.batchUpdateInvitations({
        codes: selectedCodes,
        max_uses: batchUpdateForm.max_uses,
        expires_in_days: batchUpdateForm.expires_in_days,
      });

      if (response.code === 0) {
        showSuccess(`成功更新 ${selectedCodes.length} 个邀请码`);
        setShowBatchUpdateModal(false);
        setBatchUpdateForm({ max_uses: null, expires_in_days: null });
        setSelectedCodes([]);
        await loadInvitations(pagination.current);
      } else {
        showError(response.msg || '批量更新失败');
      }
    } catch (error) {
      console.error('批量更新邀请码失败:', error);
      showError('批量更新邀请码失败，请重试');
    } finally {
      setBatchUpdateLoading(false);
    }
  };

  // 批量为所有没有邀请码的用户创建邀请码
  const handleBatchCreateInvitations = async () => {
    try {
      setBatchCreateLoading(true);
      
      // 获取所有用户（分页获取）
      const allUsers: User[] = [];
      let currentPage = 1;
      const pageSize = 100; // 每页100条
      
      while (true) {
        const usersResponse = await adminAPI.getUsers({ page: currentPage, page_size: pageSize });
        if (usersResponse.code !== 0) {
          showError('获取用户列表失败');
          return;
        }

        const users = usersResponse.data.list || [];
        allUsers.push(...users);
        
        // 检查是否还有更多数据
        const total = usersResponse.data.total || 0;
        if (allUsers.length >= total) {
          break;
        }
        
        currentPage++;
      }
      
      // 获取所有邀请码（分页获取）
      const allInvitations: InvitationCode[] = [];
      currentPage = 1;
      const invitationPageSize = 100; // 每页100条
      
      while (true) {
        const invitationsResponse = await invitationAPI.getInvitationList({ 
          page: currentPage, 
          limit: invitationPageSize 
        });
        if (invitationsResponse.code !== 0) {
          showError('获取邀请码列表失败');
          return;
        }

        const invitations = invitationsResponse.data.data || [];
        allInvitations.push(...invitations);
        
        // 检查是否还有更多数据
        const total = invitationsResponse.data.total || 0;
        if (allInvitations.length >= total) {
          break;
        }
        
        currentPage++;
      }
      
      // 统计每个用户（按ID）拥有的邀请码数量
      const userIdsWithInvitation = new Set<string>();
      for (const inv of allInvitations) {
        if (inv.creator_id) {
          userIdsWithInvitation.add(inv.creator_id);
        }
      }

      // 找出没有邀请码的用户
      const usersWithoutInvitation = allUsers.filter(user => !userIdsWithInvitation.has(user.id));

      if (usersWithoutInvitation.length === 0) {
        showSuccess('所有用户都已有邀请码');
        setShowBatchCreateModal(false);
        return;
      }

      // 为每个用户创建邀请码（使用管理员API，指定创建者为具体用户）
      let successCount = 0;
      let failCount = 0;

      for (const user of usersWithoutInvitation) {
        try {
          const response = await invitationAPI.adminCreateInvitation({
            creator_id: user.id, // 指定创建者为该用户
            max_uses: 10, // 默认每个邀请码可使用10次
            expires_in_days: null, // 永不过期
            note: `为用户 ${user.name || user.phone} 自动创建`,
          });
          
          if (response.code === 0) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`为用户 ${user.id} 创建邀请码失败:`, error);
          failCount++;
        }
      }

      showSuccess(`批量创建完成：成功 ${successCount} 个，失败 ${failCount} 个`);
      setShowBatchCreateModal(false);
      await loadInvitations(1);
    } catch (error) {
      console.error('批量创建邀请码失败:', error);
      showError('批量创建邀请码失败，请重试');
    } finally {
      setBatchCreateLoading(false);
    }
  };

  // 切换邀请码状态
  const handleToggleStatus = async (code: string, isActive: boolean) => {
    try {
      setLoading(true);
      const response = isActive
        ? await invitationAPI.deactivateInvitation(code)
        : await invitationAPI.activateInvitation(code);
      
      if (response.code === 0) {
        showSuccess(`邀请码已${isActive ? '禁用' : '激活'}`);
        await loadInvitations(pagination.current);
      } else {
        showError(response.msg || `邀请码${isActive ? '禁用' : '激活'}失败`);
      }
    } catch (error) {
      console.error('操作邀请码状态失败:', error);
      showError(`邀请码${isActive ? '禁用' : '激活'}失败，请重试`);
    } finally {
      setLoading(false);
    }
  };

  // 复制邀请码
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      showSuccess('邀请码已复制到剪贴板');
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  // 切换选择单个邀请码
  const toggleSelectCode = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedCodes.length === invitations.length) {
      setSelectedCodes([]);
    } else {
      setSelectedCodes(invitations.map((inv) => inv.code));
    }
  };

  // 打开批量更新弹窗
  const handleOpenBatchUpdate = () => {
    if (selectedCodes.length === 0) {
      showError('请先选择要更新的邀请码');
      return;
    }
    setShowBatchUpdateModal(true);
  };

  // 打开编辑弹窗
  const handleOpenEdit = (invitation: InvitationCode) => {
    setEditingInvitation(invitation);
    setEditForm({
      max_uses: invitation.max_uses,
      expires_in_days: null, // 不预填，让用户选择
      note: invitation.note || '',
    });
    setShowEditModal(true);
  };

  // 编辑邀请码
  const handleEditInvitation = async () => {
    if (!editingInvitation) return;

    // 验证表单数据
    if (editForm.max_uses !== null && (editForm.max_uses < -1 || editForm.max_uses === 0)) {
      showError('使用次数必须为 -1（无限次）或大于 0');
      return;
    }

    if (editForm.expires_in_days !== null && editForm.expires_in_days < 0) {
      showError('有效期必须大于等于 0（0 表示永不过期）');
      return;
    }

    try {
      setEditLoading(true);
      const response = await invitationAPI.updateInvitation(editingInvitation.code, {
        max_uses: editForm.max_uses,
        expires_in_days: editForm.expires_in_days,
        note: editForm.note,
      });

      if (response.code === 0) {
        showSuccess('邀请码更新成功');
        setShowEditModal(false);
        setEditingInvitation(null);
        setEditForm({ max_uses: null, expires_in_days: null, note: '' });
        await loadInvitations(pagination.current);
      } else {
        showError(response.msg || '更新邀请码失败');
      }
    } catch (error) {
      console.error('更新邀请码失败:', error);
      showError('更新邀请码失败，请重试');
    } finally {
      setEditLoading(false);
    }
  };

  // 翻页
  const handlePageChange = (page: number) => {
    loadInvitations(page);
  };

  // 格式化过期时间
  const formatExpiresAt = (expiresAt: string | null) => {
    if (!expiresAt) return '永不过期';
    const date = new Date(expiresAt);
    const now = new Date();
    if (date < now) return <span className="text-red-600">已过期</span>;
    return date.toLocaleString('zh-CN');
  };

  // 获取使用进度
  const getUsageProgress = (invitation: InvitationCode) => {
    if (invitation.max_uses === -1) {
      return `${invitation.used_count} / 无限`;
    }
    const percentage = (invitation.used_count / invitation.max_uses) * 100;
    return (
      <div className="flex items-center gap-2">
        <span>{invitation.used_count} / {invitation.max_uses}</span>
        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${
              percentage >= 100 ? 'bg-red-500' : percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        {/* 头部操作栏 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">邀请码管理</h2>
            <p className="text-sm text-gray-500 mt-1">
              管理和查看所有邀请码的使用情况
              {selectedCodes.length > 0 && (
                <span className="ml-2 text-blue-600 font-medium">
                  （已选择 {selectedCodes.length} 个）
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {selectedCodes.length > 0 && (
              <Button
                variant="outline"
                onClick={handleOpenBatchUpdate}
                disabled={loading}
              >
                <FiEdit className="mr-2" />
                批量更新
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowBatchCreateModal(true)}
              disabled={loading}
            >
              <FiUsers className="mr-2" />
              批量创建
            </Button>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              disabled={loading}
            >
              <FiPlus className="mr-2" />
              创建邀请码
            </Button>
          </div>
        </div>

        {/* 邀请码统计 */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">总邀请码数</div>
              <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">激活中</div>
              <div className="text-2xl font-bold text-green-600">
                {invitations.filter(inv => inv.is_active).length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">已禁用</div>
              <div className="text-2xl font-bold text-red-600">
                {invitations.filter(inv => !inv.is_active).length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">总使用次数</div>
              <div className="text-2xl font-bold text-blue-600">
                {invitations.reduce((sum, inv) => sum + inv.used_count, 0)}
              </div>
            </div>
          </div>
        </div>

        {/* 创建邀请码表单 */}
        {showCreateForm && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-4">创建新邀请码</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  使用次数（-1 表示无限次）
                </label>
                <Input
                  type="number"
                  value={createForm.max_uses}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm({ ...createForm, max_uses: parseInt(e.target.value) || 0 })
                  }
                  min="-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  有效期（天，空表示永不过期）
                </label>
                <Input
                  type="number"
                  value={createForm.expires_in_days || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm({
                      ...createForm,
                      expires_in_days: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  min="1"
                  placeholder="永不过期"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <Input
                  type="text"
                  value={createForm.note}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm({ ...createForm, note: e.target.value })
                  }
                  placeholder="可选"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateInvitation} disabled={loading}>
                创建
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                取消
              </Button>
            </div>
          </div>
        )}

        {/* 邀请码列表 */}
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
                      <input
                        type="checkbox"
                        checked={invitations.length > 0 && selectedCodes.length === invitations.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      邀请码
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      使用情况
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      过期时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      创建者
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      备注
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invitations.map((invitation) => (
                    <tr key={invitation.code} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCodes.includes(invitation.code)}
                          onChange={() => toggleSelectCode(invitation.code)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            {invitation.code}
                          </code>
                          <button
                            onClick={() => handleCopyCode(invitation.code)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {copiedCode === invitation.code ? (
                              <FiCheck className="text-green-600" />
                            ) : (
                              <FiCopy />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getUsageProgress(invitation)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatExpiresAt(invitation.expires_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invitation.creator || '未知'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {invitation.is_active ? (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            激活中
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                            已禁用
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-xs truncate" title={invitation.note}>
                          {invitation.note || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="text"
                            size="sm"
                            onClick={() => handleOpenEdit(invitation)}
                            disabled={loading}
                          >
                            编辑
                          </Button>
                          <Button
                            variant="text"
                            size="sm"
                            onClick={() => handleToggleStatus(invitation.code, invitation.is_active)}
                            disabled={loading}
                          >
                            {invitation.is_active ? '禁用' : '激活'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {invitations.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">暂无邀请码数据</div>
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
              disabled={
                pagination.current >= Math.ceil(pagination.total / pagination.pageSize) || loading
              }
            >
              下一页
            </Button>
          </div>
        )}
      </div>

      {/* 批量创建确认模态框 */}
      {showBatchCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">批量创建邀请码</h3>
            <p className="text-gray-600 mb-6">
              此操作将为所有没有邀请码的用户创建邀请码（每个邀请码可使用10次，永不过期）。确认继续？
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBatchCreateModal(false)}
                disabled={batchCreateLoading}
              >
                取消
              </Button>
              <Button onClick={handleBatchCreateInvitations} disabled={batchCreateLoading}>
                {batchCreateLoading ? '创建中...' : '确认创建'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 批量更新模态框 */}
      {showBatchUpdateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">批量更新邀请码</h3>
            <p className="text-sm text-gray-600 mb-4">
              将更新 <span className="font-semibold text-blue-600">{selectedCodes.length}</span> 个邀请码
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  使用次数上限
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={batchUpdateForm.max_uses ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setBatchUpdateForm({
                        ...batchUpdateForm,
                        max_uses: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="不修改则留空"
                    min="-1"
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    （-1 = 无限次）
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  有效期（天）
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={batchUpdateForm.expires_in_days ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setBatchUpdateForm({
                        ...batchUpdateForm,
                        expires_in_days: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="不修改则留空"
                    min="0"
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    （0 = 永不过期）
                  </span>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>注意：</strong>
                  留空的字段不会被更新。至少需要填写一个字段。
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBatchUpdateModal(false);
                  setBatchUpdateForm({ max_uses: null, expires_in_days: null });
                }}
                disabled={batchUpdateLoading}
              >
                取消
              </Button>
              <Button onClick={handleBatchUpdateInvitations} disabled={batchUpdateLoading}>
                {batchUpdateLoading ? '更新中...' : '确认更新'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑邀请码模态框 */}
      {showEditModal && editingInvitation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">编辑邀请码</h3>
            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>邀请码：</span>
                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {editingInvitation.code}
                </code>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  使用次数上限
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={editForm.max_uses ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditForm({
                        ...editForm,
                        max_uses: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="不修改则留空"
                    min="-1"
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    （-1 = 无限次）
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  当前：{editingInvitation.max_uses === -1 ? '无限次' : editingInvitation.max_uses}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  有效期（天）
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={editForm.expires_in_days ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditForm({
                        ...editForm,
                        expires_in_days: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="不修改则留空"
                    min="0"
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    （0 = 永不过期）
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  当前过期时间：{formatExpiresAt(editingInvitation.expires_at)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  备注
                </label>
                <Input
                  type="text"
                  value={editForm.note}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm({
                      ...editForm,
                      note: e.target.value,
                    })
                  }
                  placeholder="可选备注信息"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>提示：</strong>
                  留空的字段（备注除外）不会被更新。设置有效期会从当前时间开始计算。
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingInvitation(null);
                  setEditForm({ max_uses: null, expires_in_days: null, note: '' });
                }}
                disabled={editLoading}
              >
                取消
              </Button>
              <Button onClick={handleEditInvitation} disabled={editLoading}>
                {editLoading ? '更新中...' : '确认更新'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitationManagement;

