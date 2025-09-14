import React from 'react';
import AdminLogin from './components/AdminLogin';

const AdminAuth: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <AdminLogin />
        </div>
        
        {/* 页面底部信息 */}
        <div className="text-center text-sm text-gray-500">
          <p>管理员专用登录页面</p>
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;
