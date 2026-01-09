import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, LogOut, Menu, X, BarChart3, Settings as SettingsIcon, Globe, QrCode, Award, Home, Repeat, Search, Calendar } from 'lucide-react';
import { isLoggedIn, logout, getCurrentUser } from './services/storage';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClassManagement from './pages/ClassManagement';
import ActivityManager from './pages/ActivityManager';
import AttendanceScanner from './pages/AttendanceScanner';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import GuestView from './pages/GuestView';
import QuickScan from './pages/QuickScan';
import DRLManager from './pages/DRLManager';
import DRLForm from './pages/DRLForm';
import GradingPeriods from './pages/GradingPeriods';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return isLoggedIn() ? <>{children}</> : <Navigate to="/login" />;
};

const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isAdmin = currentUser?.role === 'admin';
  const isStudent = currentUser?.role === 'student';
  const isDRLMode = location.pathname.startsWith('/drl');

  // --- MENU CONFIGURATION ---
  let menuItems = [];

  if (isDRLMode) {
      // === MENU CHO HỆ THỐNG DRL ===
      menuItems = [
          { path: '/drl', icon: Award, label: 'Chấm Điểm Rèn Luyện' },
      ];

      // Thêm Menu Quản lý cho Admin/BCH/Lớp trưởng
      if (['admin', 'monitor', 'bch', 'doankhoa'].includes(currentUser?.role || '')) {
           menuItems.push({ path: '/drl/classes', icon: Users, label: 'Quản lý Lớp & SV' });
      }
      
      // Thêm Menu Quản lý Đợt chấm cho Admin
      if (currentUser?.role === 'admin') {
           // MỚI: Link trực tiếp đến trang quản lý đợt
           menuItems.push({ path: '/drl/periods', icon: Calendar, label: 'Quản lý Đợt chấm' });
      }

      // Settings luôn ở cuối
      menuItems.push({ path: '/drl/settings', icon: SettingsIcon, label: 'Cài Đặt / Cá nhân' });

  } else {
      // === MENU CHO HỆ THỐNG ĐIỂM DANH ===
      if (['admin', 'monitor', 'doankhoa'].includes(currentUser?.role || '')) {
          menuItems = [
              { path: '/dashboard', icon: LayoutDashboard, label: 'Tổng Quan' },
              { path: '/classes', icon: Users, label: 'Lớp Học & SV' },
              { path: '/activities', icon: BookOpen, label: 'Học Phần & Điểm Danh' }, 
              { path: '/scan', icon: QrCode, label: 'Quét Nhanh' },
              { path: '/reports', icon: BarChart3, label: 'Báo Cáo Thống Kê' },
          ];
      } else if (currentUser?.role === 'student') {
          // Menu cho Sinh viên
          menuItems = [
              { path: '/public', icon: Search, label: 'Tra cứu Điểm danh' },
              { path: '/settings', icon: SettingsIcon, label: 'Cài đặt Tài khoản' },
          ];
      }
      if (!isStudent) {
        menuItems.push({ path: '/settings', icon: SettingsIcon, label: 'Cài Đặt / Cá nhân' });
      }
  }

  const overlayClass = isOpen ? "fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" : "hidden";
  const sidebarClass = `fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-30 transform transition-transform duration-300 md:translate-x-0 md:static md:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col font-[Segoe UI,Arial,sans-serif]`;

  return (
    <>
      <div className="hidden">{/* Preload */}</div>
      <div className={overlayClass} onClick={onClose}></div>
      <div className={sidebarClass}>
        {/* BRAND HEADER */}
        <div className="flex flex-col items-center px-4 py-6 border-b border-gray-100 shrink-0 bg-white text-center relative">
           <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600 absolute top-4 right-4"><X /></button>
           <div className="mb-4">
             <img src="./logo_khoaktck_ctut.png" alt="Logo" className="w-[56px] h-[56px] object-contain mx-auto" />
           </div>
           <div className="w-full">
             <div className="font-bold text-[#1e3a8a] text-[10px] uppercase mb-0.5">TRƯỜNG ĐẠI HỌC</div>
             <div className="font-black text-[#1e3a8a] text-[12px] uppercase leading-tight mb-2">KỸ THUẬT – CÔNG NGHỆ CẦN THƠ</div>
             
             <div className="w-12 h-[1px] bg-blue-400 mx-auto mb-1"></div>
             
             <div className="font-bold text-[#2563eb] text-[9px] uppercase">KHOA KỸ THUẬT CƠ KHÍ</div>
           </div>
           <div className={`mt-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase w-fit tracking-wide ${isDRLMode ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
               {isDRLMode ? 'Hệ thống DRL' : 'Hệ thống Điểm Danh'}
           </div>
        </div>
        
        {/* USER INFO */}
        <div className={`px-4 py-3 border-b ${isDRLMode ? 'bg-indigo-50 border-indigo-100' : 'bg-blue-50 border-blue-100'}`}>
             <div className={`text-xs font-bold uppercase tracking-wide ${isDRLMode ? 'text-indigo-500' : 'text-blue-500'}`}>Xin chào</div>
             <div className={`text-sm font-bold truncate ${isDRLMode ? 'text-indigo-900' : 'text-blue-900'}`}>{currentUser?.name}</div>
             <div className={`text-xs capitalize ${isDRLMode ? 'text-indigo-600' : 'text-blue-600'}`}>{currentUser?.role}</div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => { if(window.innerWidth < 768) onClose() }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${location.pathname === item.path ? (isDRLMode ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600') : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* FOOTER ACTIONS */}
        <div className="p-4 border-t border-gray-100 shrink-0 space-y-2">
          {/* Nút chuyển hệ thống: Ẩn đối với sinh viên */}
          {!isStudent && (
              <Link 
                to="/"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
                title="Quay về màn hình chọn hệ thống"
              >
                <Repeat size={20} /> Chuyển hệ thống
              </Link>
          )}

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} /> Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();
  const isScanner = location.pathname.includes('/attendance/');
  const isDRLMode = location.pathname.startsWith('/drl');

  if (isScanner) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white h-16 border-b border-gray-100 flex items-center px-4 md:hidden shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600">
            <Menu />
          </button>
          <span className={`ml-4 font-bold ${isDRLMode ? 'text-indigo-700' : 'text-blue-700'}`}>
              {isDRLMode ? 'Điểm Rèn Luyện' : 'Điểm Danh QR'}
          </span>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/public" element={<GuestView />} />
        
        <Route path="/*" element={
          <PrivateRoute>
            <Layout>
              <Routes>
                {/* --- ROUTES HỆ THỐNG DRL --- */}
                <Route path="/drl" element={<DRLManager />} />
                <Route path="/drl/form/:studentId" element={<DRLForm />} />
                <Route path="/drl/classes" element={<ClassManagement />} />
                <Route path="/drl/periods" element={<GradingPeriods />} />
                <Route path="/drl/settings" element={<Settings />} />
                
                {/* --- ROUTES HỆ THỐNG ĐIỂM DANH --- */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/scan" element={<QuickScan />} />
                <Route path="/classes" element={<ClassManagement />} />
                <Route path="/activities" element={<ActivityManager />} />
                <Route path="/reports" element={<Reports />} />
                
                {/* --- CHUNG (Mặc định là Điểm danh) --- */}
                <Route path="/settings" element={<Settings />} />
                <Route path="/attendance/:activityId" element={<AttendanceScanner />} />
                
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </HashRouter>
  );
};

export default App;