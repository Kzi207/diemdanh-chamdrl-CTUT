import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { login, getApiUrl, getCurrentUser, logout } from '../services/storage';
import { Lock, LogIn, User, ArrowLeft, Settings, AlertCircle, Info, HelpCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
        const result = await login(username, password);
        
        if (result.success) {
            // Lấy thông tin user vừa đăng nhập
            const user = getCurrentUser();
            
            // --- LOGIC PHÂN QUYỀN VÀ ĐIỀU HƯỚNG ---
            
            if (user?.role === 'student') {
                // SINH VIÊN:
                // 1. Nếu đích đến là DRL -> Vào Form DRL cá nhân
                if (from.startsWith('/drl')) {
                    navigate(`/drl/form/${user.username}`, { replace: true });
                } 
                // 2. Nếu đích đến là Dashboard (Quản lý) -> Chuyển sang trang Tra cứu (Public)
                //    (Sinh viên không được phép vào Dashboard)
                else if (from.startsWith('/dashboard')) {
                    navigate('/public', { replace: true });
                } 
                // 3. Mặc định (Login trực tiếp) -> Vào DRL Form
                else {
                    navigate(`/drl/form/${user.username}`, { replace: true });
                }
                return;
            }

            // ADMIN / MONITOR / CÁN BỘ:
            // 1. Nếu đích đến là DRL
            if (from === '/drl' || from.startsWith('/drl')) {
                 navigate('/drl', { replace: true });
                 return;
            }

            // 2. Mặc định: Chuyển hướng đến trang đích hoặc Dashboard
            if (from === '/' || from === '/login') {
                navigate('/dashboard', { replace: true });
            } else {
                navigate(from, { replace: true });
            }

        } else {
            setError(result.message || 'Đăng nhập thất bại.');
        }
    } catch (e: any) {
        console.error("Login Error:", e);
        setError(e.message || 'Lỗi kết nối Server.');
    } finally {
        setLoading(false);
    }
  };

  // Xác định tiêu đề dựa trên trang đích để hiển thị cho thân thiện
  const getSystemName = () => {
      if (from.includes('/drl')) return 'Hệ Thống Điểm Rèn Luyện';
      if (from.includes('/dashboard')) return 'Quản Lý Điểm Danh';
      return 'Đăng Nhập Hệ Thống';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-[Segoe UI,Arial,sans-serif]">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden relative">
        <button 
            onClick={() => navigate('/')} 
            className="absolute top-4 left-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors z-10"
            title="Quay lại trang chủ"
        >
            <ArrowLeft size={20} />
        </button>

        <Link 
            to="/settings"
            className="absolute top-4 right-4 p-2 text-gray-300 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors z-10"
            title="Cài đặt kết nối"
        >
            <Settings size={18} />
        </Link>

        <div className="bg-white p-8 border-b border-gray-100 flex flex-col items-center text-center pt-10">
          <img src="./logo_khoaktck_ctut.png" alt="Logo" className="w-[80px] h-[80px] object-contain mb-4" />
          <div className="flex flex-col items-center justify-center w-full px-2">
             <div className="font-bold text-[#1e3a8a] leading-none mb-1 text-[13px] sm:text-[14px]">TRƯỜNG ĐẠI HỌC</div>
             <div className="font-black text-[#1e3a8a] uppercase leading-none mb-3 text-[16px] sm:text-[18px]">KỸ THUẬT – CÔNG NGHỆ CẦN THƠ</div>
             <div className="w-16 h-[2px] bg-blue-600 mb-2"></div>
             <div className="font-bold text-[#2563eb] uppercase text-[12px] sm:text-[13px] tracking-wide">
                KHOA KỸ THUẬT CƠ KHÍ
             </div>
          </div>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 pt-6">
          <h3 className="text-center text-lg font-bold text-gray-700 mb-6">{getSystemName()}</h3>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Tên đăng nhập
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="text-gray-400" size={18}/>
                </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white text-gray-900"
                placeholder="VD: MSSV (CNCD2511...)"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Mật khẩu
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="text-gray-400" size={18}/>
                </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white text-gray-900"
                placeholder="VD: 3 số cuối MSSV"
                required
              />
            </div>
            
            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-fadeIn text-left">
                    <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5"/>
                        <span className="text-sm text-red-700 font-bold">{error}</span>
                    </div>
                    
                    {/* Hướng dẫn cụ thể khi lỗi là "không tồn tại" (Chưa tạo account) */}
                    {(error.includes("không tồn tại") || error.includes("chưa có dữ liệu")) && (
                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-900">
                             <div className="font-bold flex items-center gap-1 mb-1 text-orange-700">
                                <HelpCircle size={14}/> Tài khoản chưa được tạo?
                             </div>
                             <p className="mb-1">Nếu bạn nhập đúng MSSV mà vẫn báo lỗi này, nghĩa là tài khoản của bạn chưa được kích hoạt trên hệ thống.</p>
                             <div className="font-semibold text-orange-800 mt-2">Cách khắc phục:</div>
                             <ul className="list-disc list-inside space-y-1 ml-1 mt-1 text-orange-800">
                                <li>Liên hệ <b>Lớp trưởng</b> hoặc <b>Admin</b>.</li>
                                <li>Yêu cầu họ vào mục <b>Quản lý DRL {'>'} Chọn Lớp {'>'} Tạo TK</b> để tạo tài khoản tự động cho cả lớp.</li>
                                <li>Sau khi tạo, mật khẩu mặc định sẽ là <b>3 số cuối MSSV</b>.</li>
                             </ul>
                        </div>
                    )}
                </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2563eb] hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline flex items-center justify-center gap-2 transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Đang kiểm tra...' : <><LogIn size={20} /> Đăng nhập</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;