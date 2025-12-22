import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PracticePage from './pages/PracticePage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 relative overflow-hidden">
        {/* 背景浮動氣泡 */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <span className="float-bubble w-20 h-20 bg-blue-400/30 left-[10%] top-[20%]"></span>
          <span className="float-bubble w-28 h-28 bg-purple-400/20 left-[70%] top-[30%]" style={{animationDelay: '0.8s'}}></span>
          <span className="float-bubble w-16 h-16 bg-indigo-400/30 left-[40%] top-[60%]" style={{animationDelay: '0.4s'}}></span>
          <span className="float-bubble w-24 h-24 bg-blue-400/20 left-[80%] top-[70%]" style={{animationDelay: '1.2s'}}></span>

          {/* 模糊圓圈 */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1.5s'}}></div>
        </div>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/practice/:videoId" element={<PracticePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

