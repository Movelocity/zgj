import React, { useState } from 'react';
import { ProfileInfo } from './components';

const Profile: React.FC = () => {
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          个人中心
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <ProfileInfo loading={loading} setLoading={setLoading} />
        </div>
      </div>
    </div>
  );
};

export default Profile;
