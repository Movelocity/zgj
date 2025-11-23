import React, { useEffect } from 'react';
import { useSiteVariable } from '@/hooks/useSiteVariable';
import Loading from '@/components/ui/Loading';
import Footer from '@/components/layout/Footer';

const Contact: React.FC = () => {
  const { value: contactImg, loading: imgLoading } = useSiteVariable('contact_img');
  const isLoading = imgLoading

  useEffect(() => {
    // 打开页面滑动到顶部
    window.scrollTo(0, 0);
  }, []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-4 animate-fade-in">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              联系我们
            </h1>
            <div className="w-20 h-1 bg-blue-600 mx-auto mb-4 rounded-full"></div>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              有任何问题或建议？欢迎扫描二维码加群
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loading size="lg" text="加载中..." />
            </div>
          ) : (
            <div className="flex justify-center mb-12">

              {/* Right Section - QR Code */}
              <div className="animate-fade-in-right">
                <div className="bg-white rounded-xl shadow-md p-12 flex flex-col items-center justify-center">

                  {contactImg ? (
                    <div className="relative group">
                      <img
                        src={contactImg}
                        alt="联系二维码"
                        className="relative w-64 h-96 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = 'w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400';
                            fallback.innerHTML = '<div class="text-center"><svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-xs">二维码图片加载失败</p></div>';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <svg
                          className="w-12 h-12 mx-auto mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                          />
                        </svg>
                        <p className="text-xs">暂无二维码</p>
                      </div>
                    </div>
                  )}

                  {/* <p className="text-gray-500 text-xs mt-4 text-center">
                    使用微信扫描二维码
                  </p> */}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Section */}
      <Footer />
    </div>
  );
};

export default Contact;

