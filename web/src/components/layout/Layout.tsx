import React from 'react';
import { Outlet } from 'react-router-dom';
// import Header from './Header';
// import Footer from './Footer';
import { useGlobalStore } from '@/store';
import Header2 from './Header2';

const Layout: React.FC = () => {
  // const location = useLocation();
  // const isHomePage = location.pathname === '/';
  const { showBanner } = useGlobalStore();

  // const [footerVisible, setFooterVisible] = useState(false);

  // useEffect(() => {
  //   if (isHomePage) {
  //     setTimeout(() => {
  //       // 延迟加载页脚，防止在开始动画前占据页面
  //       setFooterVisible(true);
  //     }, 1);
  //   } else {
  //     setFooterVisible(false);
  //   }
  // }, [isHomePage]); 

  return (
    <div className="bg-gray-50 flex flex-col">
      {/* 导航栏 */}
      {showBanner && (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
          <Header2 />
        </nav>
      )}
      <main className="flex-1 min-h-screen">
        <Outlet />
      </main>
      {/* {footerVisible && <Footer />} */}
    </div>
  );
};

export default Layout;
