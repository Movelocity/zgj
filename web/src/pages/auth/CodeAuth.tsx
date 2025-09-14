import React from 'react';
import CodeLogin from './components/CodeLogin';

const AdminAuth: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <CodeLogin />
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;
