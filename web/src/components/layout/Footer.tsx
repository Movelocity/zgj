import { ROUTES } from '@/utils/constants';
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 公司信息 */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">职管加</h3>
            <p className="text-gray-400 mb-4">
              专业的简历润色工具，帮助求职者打造完美简历，提升求职成功率。
            </p>
            <p className="text-gray-400 text-sm">
              © 2024 职管加. All rights reserved.
            </p>
          </div>

          {/* 产品功能 */}
          <div>
            <h4 className="text-md font-semibold mb-4">产品功能</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="/simple-resume" className="hover:text-white">
                  简历优化
                </Link>
              </li>
              <li>
                <Link to="/job-resume" className="hover:text-white">
                  职位匹配
                </Link>
              </li>
              <li>
                <Link to="/resumes" className="hover:text-white">
                  简历管理
                </Link>
              </li>
              {/* 开发环境下显示API测试链接 */}
              {import.meta.env.DEV && (
                <li>
                  <Link to={ROUTES.API_TEST} className="hover:text-white">
                    API 测试页面 (开发模式)
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* 帮助支持 */}
          <div>
            <h4 className="text-md font-semibold mb-4">帮助支持</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#" className="hover:text-white">
                  使用指南
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  常见问题
                </a>
              </li>
              <li>
                <Link to={ROUTES.CONTACT} className="hover:text-white">
                  联系我们
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  隐私政策
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>技术支持：AI 驱动的简历优化系统</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
