import React, { useState } from 'react';
import { Modal, Button } from '@/components/ui';
import { FiSave, FiTrash2 } from 'react-icons/fi';

/**
 * Modal组件使用示例
 * 这个文件展示了如何使用通用Modal组件的各种配置
 */
const ModalExample: React.FC = () => {
  const [basicModalOpen, setBasicModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 模拟异步操作
  const handleAsyncAction = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    setConfirmModalOpen(false);
  };

  return (
    <div className="p-24 space-y-4">
      <h2 className="text-2xl font-bold mb-6">Modal组件使用示例</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 基础模态框 */}
        <Button onClick={() => setBasicModalOpen(true)}>
          基础模态框
        </Button>
        
        {/* 确认模态框 */}
        <Button onClick={() => setConfirmModalOpen(true)} variant="danger">
          确认模态框
        </Button>
        
        {/* 表单模态框 */}
        <Button onClick={() => setFormModalOpen(true)} variant="outline">
          表单模态框
        </Button>
        
        {/* 自定义模态框 */}
        <Button onClick={() => setCustomModalOpen(true)} variant="ghost">
          自定义模态框
        </Button>
      </div>

      {/* 基础模态框 - 仅显示内容 */}
      <Modal
        open={basicModalOpen}
        onClose={() => setBasicModalOpen(false)}
        title="基础模态框"
        size="md"
      >
        <div className="p-6">
          <p className="text-gray-600">
            这是一个基础的模态框示例，只包含标题和内容，没有底部操作按钮。
          </p>
          <p className="mt-4 text-sm text-gray-500">
            可以通过点击右上角的X按钮、点击遮罩或按ESC键关闭。
          </p>
        </div>
      </Modal>

      {/* 确认模态框 - 带确认和取消按钮 */}
      <Modal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="删除确认"
        size="sm"
        showFooter={true}
        confirmText="删除"
        cancelText="取消"
        confirmVariant="danger"
        confirmLoading={loading}
        onConfirm={handleAsyncAction}
        onCancel={() => setConfirmModalOpen(false)}
      >
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <FiTrash2 className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-gray-900">确定要删除这个项目吗？</p>
              <p className="mt-2 text-sm text-gray-500">
                此操作不可撤销，请谨慎操作。
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* 表单模态框 - 大尺寸，自定义内容 */}
      <Modal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title="编辑用户信息"
        size="lg"
        showFooter={true}
        confirmText="保存"
        cancelText="取消"
        confirmVariant="primary"
        onConfirm={() => {
          // 处理表单提交逻辑
          console.log('保存表单');
          setFormModalOpen(false);
        }}
      >
        <div className="p-6">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入姓名"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入邮箱"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  电话
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入电话号码"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  部门
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">请选择部门</option>
                  <option value="dev">开发部</option>
                  <option value="design">设计部</option>
                  <option value="product">产品部</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                个人简介
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入个人简介"
              />
            </div>
          </form>
        </div>
      </Modal>

      {/* 自定义模态框 - 自定义底部、禁用遮罩关闭 */}
      <Modal
        open={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        title="自定义模态框"
        size="md"
        showFooter={true}
        maskClosable={false}
        escClosable={false}
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-500">
              自定义底部内容
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCustomModalOpen(false)}
              >
                稍后处理
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                icon={<FiSave />}
                onClick={() => setCustomModalOpen(false)}
              >
                立即保存
              </Button>
            </div>
          </div>
        }
      >
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  注意事项
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>这个模态框禁用了通过遮罩和ESC键关闭的功能，只能通过底部按钮关闭。</p>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-gray-600">
            这是一个完全自定义的模态框示例，展示了如何：
          </p>
          <ul className="mt-2 text-sm text-gray-500 list-disc list-inside space-y-1">
            <li>自定义底部内容</li>
            <li>禁用遮罩点击关闭</li>
            <li>禁用ESC键关闭</li>
            <li>使用不同的按钮组合</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
};

export default ModalExample;
