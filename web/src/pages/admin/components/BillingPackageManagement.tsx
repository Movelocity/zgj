import React, { useState, useEffect } from 'react';
import { Button, Input, Modal, Loading, Badge } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    is_active: false,
    is_visible: false,
    sort_order: 0,
    display_order: 0,
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
      display_order: 100,
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
      display_order: pkg.display_order,
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">套餐管理</CardTitle>
              <p className="text-sm text-gray-500 mt-1">管理系统中的所有计费套餐</p>
            </div>
            <Button onClick={handleOpenCreateModal} size="lg" variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              创建套餐
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loading size="lg" />
              <span className="ml-3 text-gray-500">加载中...</span>
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">暂无套餐</h3>
              <p className="mt-1 text-sm text-gray-500">开始创建第一个计费套餐</p>
              <div className="mt-6">
                <Button onClick={handleOpenCreateModal}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  创建套餐
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">套餐信息</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">积分/有效期</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">价格</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">排序</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {packages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{pkg.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                          {pkg.description && (
                            <div className="text-sm text-gray-500 mt-1">{pkg.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {PACKAGE_TYPE_NAME_MAP[pkg.package_type as PackageType]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="text-sm font-medium text-gray-900">
                            {pkg.credits_amount} 积分
                          </div>
                          <div className="text-xs text-gray-500">
                            {pkg.validity_days === 0 ? '永久有效' : `${pkg.validity_days} 天有效`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="text-sm font-semibold text-gray-900">
                            ¥{(pkg.price / 100).toFixed(2)}
                          </div>
                          {pkg.original_price && pkg.original_price > pkg.price && (
                            <div className="text-xs text-gray-400 line-through">
                              ¥{(pkg.original_price / 100).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-2">
                          <Badge
                            variant={pkg.is_active ? 'default' : 'secondary'}
                            className={pkg.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}
                          >
                            {pkg.is_active ? '已启用' : '已禁用'}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={pkg.is_visible ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'}
                          >
                            {pkg.is_visible ? '前台可见' : '前台隐藏'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col gap-1">
                          <div className="text-xs">管理: {pkg.sort_order}</div>
                          <div className="text-xs">用户: {pkg.display_order}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
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
          )}
        </CardContent>
      </Card>

      <Modal 
        title={editingPackage ? '编辑套餐' : '创建套餐'} 
        open={modalOpen} onClose={() => setModalOpen(false)}
        onConfirm={handleSubmit}
        confirmText={loading ? '提交中...' : '确定'}
        confirmLoading={loading}
        confirmDisabled={!formData.name || !formData.package_type}
      >
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              套餐名称 <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：新用户体验包"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">套餐描述</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="请输入套餐描述，帮助用户了解套餐内容"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              套餐类型 <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.package_type}
              onChange={(e) =>
                setFormData({ ...formData, package_type: e.target.value as PackageType })
              }
            >
              <option value="credits">积分包 - 按积分消耗</option>
              <option value="duration">时长型 - 按时间有效</option>
              <option value="hybrid">混合型 - 积分+时长</option>
              <option value="permanent">永久型 - 永久有效</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                积分数量 <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={formData.credits_amount}
                onChange={(e) =>
                  setFormData({ ...formData, credits_amount: parseInt(e.target.value) || 0 })
                }
                min="1"
                placeholder="10"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                有效期（天）
              </label>
              <Input
                type="number"
                value={formData.validity_days}
                onChange={(e) =>
                  setFormData({ ...formData, validity_days: parseInt(e.target.value) || 0 })
                }
                min="0"
                placeholder="0 表示永久有效"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">0 表示永久有效</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                售价（分）<span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                }
                min="0"
                placeholder="9900"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                = ¥{((formData.price || 0) / 100).toFixed(2)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                原价（分）
              </label>
              <Input
                type="number"
                value={formData.original_price}
                onChange={(e) =>
                  setFormData({ ...formData, original_price: parseFloat(e.target.value) || 0 })
                }
                min="0"
                placeholder="可选，用于显示折扣"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                = ¥{((formData.original_price || 0) / 100).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">管理员排序</label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) =>
                  setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
                }
                min="0"
                placeholder="0"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">管理后台显示顺序，越小越靠前</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">用户展示排序</label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: parseInt(e.target.value) || 100 })
                }
                min="0"
                placeholder="0"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">用户前台显示顺序，越小越靠前</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">状态设置</label>
            <div className="space-y-3 flex gap-8">
              <label className="flex items-start cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mt-0.5 mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                    启用套餐
                  </div>
                  <div className="text-xs text-gray-500">
                    启用后套餐才能被购买和使用
                  </div>
                </div>
              </label>
              <label className="flex items-start cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.is_visible}
                  onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                  className="mt-0.5 mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                    前台可见
                  </div>
                  <div className="text-xs text-gray-500">
                    在用户升级页面显示此套餐
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BillingPackageManagement;

