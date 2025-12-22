import { useNavigate, useLocation } from 'react-router-dom';
import { Youtube, Home, Settings } from 'lucide-react';

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/80 border-b border-white/30 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center gap-4">
            {/* 品牌 */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 group"
            >
              <Youtube size={32} className="text-red-600 group-hover:scale-110 transition-transform" />
              <span className="text-lg md:text-xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                YouTube 聽打練習
              </span>
            </button>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* 首頁按鈕 */}
            {!isHome && (
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-gray-700 dark:text-gray-200 hover:bg-white/60 dark:hover:bg-white/10 transition"
              >
                <Home size={20} />
                <span className="hidden md:inline">首頁</span>
              </button>
            )}
            
            {/* 設定按鈕 */}
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-gray-700 dark:text-gray-200 hover:bg-white/60 dark:hover:bg-white/10 transition"
              title="AI 設定"
            >
              <Settings size={20} />
              <span className="hidden md:inline">設定</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
