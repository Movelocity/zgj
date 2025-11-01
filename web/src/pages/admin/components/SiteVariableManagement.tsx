import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { siteVariableAPI } from '@/api/siteVariable';
import { showSuccess, showError } from '@/utils/toast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import type { 
  SiteVariable, 
  CreateSiteVariableRequest, 
  UpdateSiteVariableRequest 
} from '@/types/siteVariable';

const SiteVariableManagement: React.FC = () => {
  const [variables, setVariables] = useState<SiteVariable[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  // const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // 模态框状态
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVariable, setSelectedVariable] = useState<SiteVariable | null>(null);
  
  // 表单数据
  const [formData, setFormData] = useState<CreateSiteVariableRequest>({
    key: '',
    value: '',
    description: '',
  });

  // 加载网站变量列表
  const loadVariables = async () => {
    try {
      setLoading(true);
      const response = await siteVariableAPI.getSiteVariableList({
        page: currentPage,
        pageSize,
        key: searchKeyword || undefined,
      });
      
      if (response.code === 0) {
        setVariables(response.data.list || []);
        // setTotal(response.data.total || 0);
        setTotalPages(response.data.totalPages || 0);
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '加载网站变量列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建网站变量
  const handleCreate = async () => {
    if (!formData.key.trim()) {
      showError('请输入变量键名');
      return;
    }

    try {
      const response = await siteVariableAPI.createSiteVariable(formData);
      if (response.code === 0) {
        showSuccess('创建成功');
        setShowCreateModal(false);
        setFormData({ key: '', value: '', description: '' });
        loadVariables();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '创建失败');
    }
  };

  // 更新网站变量
  const handleUpdate = async () => {
    if (!selectedVariable) return;

    try {
      const updateData: UpdateSiteVariableRequest = {
        value: formData.value,
        description: formData.description,
      };
      
      const response = await siteVariableAPI.updateSiteVariable(selectedVariable.id, updateData);
      if (response.code === 0) {
        showSuccess('更新成功');
        setShowEditModal(false);
        setSelectedVariable(null);
        setFormData({ key: '', value: '', description: '' });
        loadVariables();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '更新失败');
    }
  };

  // 删除网站变量
  const handleDelete = async () => {
    if (!selectedVariable) return;

    try {
      const response = await siteVariableAPI.deleteSiteVariable(selectedVariable.id);
      if (response.code === 0) {
        showSuccess('删除成功');
        setShowDeleteModal(false);
        setSelectedVariable(null);
        loadVariables();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '删除失败');
    }
  };

  // 打开编辑模态框
  const openEditModal = (variable: SiteVariable) => {
    setSelectedVariable(variable);
    setFormData({
      key: variable.key,
      value: variable.value,
      description: variable.description,
    });
    setShowEditModal(true);
  };

  // 打开删除确认模态框
  const openDeleteModal = (variable: SiteVariable) => {
    setSelectedVariable(variable);
    setShowDeleteModal(true);
  };

  // 初始加载
  useEffect(() => {
    loadVariables();
  }, [currentPage, searchKeyword]);

  // 搜索处理
  const handleSearch = () => {
    setCurrentPage(1);
    loadVariables();
  };

  return (
    <div className="space-y-6">
      {/* 头部操作栏 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索变量键名..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <Button
            onClick={handleSearch}
            variant="outline"
            icon={<FiSearch />}
          >
            搜索
          </Button>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={loadVariables}
            variant="outline"
            icon={<FiRefreshCw className={loading ? 'animate-spin mr-1' : 'mr-1'} />}
            disabled={loading}
          >
            刷新
          </Button>
          <Button
            onClick={() => {
              setFormData({ key: '', value: '', description: '' });
              setShowCreateModal(true);
            }}
            icon={<FiPlus />}
          >
            新增变量
          </Button>
        </div>
      </div>

      {/* 统计信息 */}
      {/* <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-600">
          共 <span className="font-semibold text-gray-900">{total}</span> 个网站变量
        </div>
      </div> */}

      {/* 变量列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  键名 (Key)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  值 (Value)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  描述
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  更新时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : variables.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                variables.map((variable) => (
                  <tr key={variable.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {variable.key}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={variable.value}>
                        {variable.value || <span className="text-gray-400">（空）</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate" title={variable.description}>
                        {variable.description || <span className="text-gray-400">无描述</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(variable.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(variable.updated_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(variable)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        title="编辑"
                      >
                        <FiEdit2 className="inline" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(variable)}
                        className="text-red-600 hover:text-red-900"
                        title="删除"
                      >
                        <FiTrash2 className="inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                variant="outline"
              >
                上一页
              </Button>
              <Button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
              >
                下一页
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  第 <span className="font-medium">{currentPage}</span> 页，共{' '}
                  <span className="font-medium">{totalPages}</span> 页
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    首页
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    尾页
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 创建模态框 */}
      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({ key: '', value: '', description: '' });
        }}
        title="新增网站变量"
      >
        <div className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              键名 (Key) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="例如：site_name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="mt-1 text-xs text-gray-500">键名必须唯一，建议使用下划线分隔的小写字母</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              值 (Value)
            </label>
            <textarea
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="输入变量的值"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="描述这个变量的用途"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={() => {
                setShowCreateModal(false);
                setFormData({ key: '', value: '', description: '' });
              }}
              variant="outline"
            >
              取消
            </Button>
            <Button onClick={handleCreate}>
              创建
            </Button>
          </div>
        </div>
      </Modal>

      {/* 编辑模态框 */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedVariable(null);
          setFormData({ key: '', value: '', description: '' });
        }}
        title="编辑网站变量"
      >
        <div className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              键名 (Key)
            </label>
            <input
              type="text"
              value={formData.key}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">键名不可修改</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              值 (Value)
            </label>
            <textarea
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="输入变量的值"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="描述这个变量的用途"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={() => {
                setShowEditModal(false);
                setSelectedVariable(null);
                setFormData({ key: '', value: '', description: '' });
              }}
              variant="outline"
            >
              取消
            </Button>
            <Button onClick={handleUpdate}>
              保存
            </Button>
          </div>
        </div>
      </Modal>

      {/* 删除确认模态框 */}
      <Modal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedVariable(null);
        }}
        title="确认删除"
      >
        <div className="space-y-4 p-4">
          <p className="text-sm text-gray-600">
            确定要删除变量 <span className="font-semibold text-gray-900">{selectedVariable?.key}</span> 吗？此操作不可恢复。
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedVariable(null);
              }}
              variant="outline"
            >
              取消
            </Button>
            <Button onClick={handleDelete} variant="danger">
              删除
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SiteVariableManagement;

