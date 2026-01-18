import React, { useState, useEffect } from 'react';
import { showError } from '@/utils/toast';
import { getPublicBillingPackages } from '@/api/billing';
import type { BillingPackage } from '@/types/billing';
import { PACKAGE_TYPE_NAME_MAP } from '@/types/billing';

const PackagesList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<BillingPackage[]>([]);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const response = await getPublicBillingPackages();
      if (response.code === 0) {
        // 只显示前4个套餐
        setPackages((response.data || []).slice(0, 4));
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">暂无可用套餐</div>
      </div>
    );
  }

  return (
    <div className=" bg-white ">
      <h2 className="text-xl font-semibold mb-6">升级计划</h2>
      
      {/* 水平显示套餐卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="border border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-200 flex flex-col"
          >
            {/* 套餐名称 */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 lg:mb-4">
              {pkg.name}
            </h3>

            {/* 价格显示 */}
            <div className="mb-2 lg:mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-medium text-gray-900">
                  ¥{(pkg.price / 100).toFixed(2)}
                </span>
                {pkg.original_price && pkg.original_price > pkg.price && (
                  <span className="text-sm text-gray-500 line-through">
                    ¥{(pkg.original_price / 100).toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* 套餐详情 */}
            <div className="space-y-2 mb-2 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-md">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">积分数量</span>
                <span className="font-semibold text-gray-900">
                  {pkg.credits_amount} 积分
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">有效期</span>
                <span className="font-semibold text-gray-900">
                  {pkg.validity_days === 0 ? '永久' : `${pkg.validity_days} 天`}
                </span>
              </div>
            </div>

            {/* 套餐描述 */}
            {pkg.description && (
              <p className="text-sm text-gray-600 mb-4 flex-grow">
                {pkg.description}
              </p>
            )}

            <span className="w-fit inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
              {PACKAGE_TYPE_NAME_MAP[pkg.package_type]}
            </span>

            {/* 购买按钮 */}
            {/* <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors cursor-not-allowed"
              onClick={() => {
                // TODO: 实现购买逻辑
                console.log('购买套餐:', pkg.id);
              }}
              disabled={false}
            >
              选择套餐
            </button> */}
          </div>
        ))}
      </div>

      {/* 提示信息 */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          积分可用于简历优化、AI对话等服务
        </p>
      </div>
    </div>
  );
};

export default PackagesList;
