import React, { useState, useEffect } from 'react';
import { Button, Input, Modal } from '@/components/ui';
import { showSuccess, showError } from '@/utils/toast';
import {
  listBillingPackages,
  createBillingPackage,
  updateBillingPackage,
} from '@/api/billing';
import type {
  BillingPackage,
  CreateBillingPackageRequest,
  PackageType,
} from '@/types/billing';
import { PACKAGE_TYPE_NAME_MAP } from '@/types/billing';

const BillingPackageManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<BillingPackage[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<BillingPackage | null>(null);
  const [formData, setFormData] = useState<CreateBillingPackageRequest>({
    name: '',
    description: '',
    package_type: 'credits',
    price: 0,
    original_price: 0,
    credits_amount: 10,
    validity_days: 0,
    is_active: true,
    is_visible: true,
    sort_order: 0,
  });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const response = await listBillingPackages();
      console.log('response', response);
      if (response.code === 0) {
        setPackages(response.data || []);
      } else {
        showError(response.msg || '加载套餐列表失败');
      }
    } catch (error) {
      console.error('加载套餐列表失败:', error);
      showError('加载套餐列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingPackage(null);
    setFormData({
      name: '',
      description: '',
      package_type: 'credits',
      price: 0,
      original_price: 0,
      credits_amount: 10,
      validity_days: 0,
      is_active: true,
      is_visible: true,
      sort_order: 0,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (pkg: BillingPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description,
      package_type: pkg.package_type,
      price: pkg.price,
      original_price: pkg.original_price || 0,
      credits_amount: pkg.credits_amount,
      validity_days: pkg.validity_days,
      is_active: pkg.is_active,
      is_visible: pkg.is_visible,
      sort_order: pkg.sort_order,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const response = editingPackage
        ? await updateBillingPackage(editingPackage.id, formData)
        : await createBillingPackage(formData);

      if (response.code === 0) {
        showSuccess(editingPackage ? '套餐更新成功' : '套餐创建成功');
        setModalOpen(false);
        loadPackages();
      } else {
        showError(response.msg || '操作失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      showError('操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">套餐管理</h2>
        <Button onClick={handleOpenCreateModal}>创建套餐</Button>
      </div>

      {loading && <div>加载中...</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 border">ID</th>
              <th className="px-4 py-2 border">名称</th>
              <th className="px-4 py-2 border">类型</th>
              <th className="px-4 py-2 border">积分</th>
              <th className="px-4 py-2 border">有效期(天)</th>
              <th className="px-4 py-2 border">价格(元)</th>
              <th className="px-4 py-2 border">状态</th>
              <th className="px-4 py-2 border">可见</th>
              <th className="px-4 py-2 border">操作</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg) => (
              <tr key={pkg.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border text-center">{pkg.id}</td>
                <td className="px-4 py-2 border">{pkg.name}</td>
                <td className="px-4 py-2 border text-center">
                  {PACKAGE_TYPE_NAME_MAP[pkg.package_type as PackageType]}
                </td>
                <td className="px-4 py-2 border text-center">{pkg.credits_amount}</td>
                <td className="px-4 py-2 border text-center">
                  {pkg.validity_days === 0 ? '永久' : pkg.validity_days}
                </td>
                <td className="px-4 py-2 border text-center">
                  ¥{(pkg.price / 100).toFixed(2)}
                </td>
                <td className="px-4 py-2 border text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      pkg.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {pkg.is_active ? '启用' : '禁用'}
                  </span>
                </td>
                <td className="px-4 py-2 border text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      pkg.is_visible
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {pkg.is_visible ? '可见' : '隐藏'}
                  </span>
                </td>
                <td className="px-4 py-2 border text-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEditModal(pkg)}
                  >
                    编辑
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal 
        title={editingPackage ? '编辑套餐' : '创建套餐'} 
        open={modalOpen} onClose={() => setModalOpen(false)}
        onConfirm={handleSubmit}
        confirmText={loading ? '提交中...' : '确定'}
        confirmLoading={loading}
        confirmDisabled={!formData.name || !formData.package_type}
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">套餐名称</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：新用户体验包"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="套餐描述"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">套餐类型</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={formData.package_type}
              onChange={(e) =>
                setFormData({ ...formData, package_type: e.target.value as PackageType })
              }
            >
              <option value="credits">积分包</option>
              <option value="duration">时长型</option>
              <option value="hybrid">混合型</option>
              <option value="permanent">永久型</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">积分数量</label>
            <Input
              type="number"
              value={formData.credits_amount}
              onChange={(e) =>
                setFormData({ ...formData, credits_amount: parseInt(e.target.value) || 0 })
              }
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">有效期(天，0表示永久)</label>
            <Input
              type="number"
              value={formData.validity_days}
              onChange={(e) =>
                setFormData({ ...formData, validity_days: parseInt(e.target.value) || 0 })
              }
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">价格(分)</label>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
              }
              min="0"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="mr-2"
              />
              启用
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_visible}
                onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                className="mr-2"
              />
              前台可见
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BillingPackageManagement;

