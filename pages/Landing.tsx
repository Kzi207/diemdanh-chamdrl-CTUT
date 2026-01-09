import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Search, QrCode, Award, ChevronRight, LogOut, ArrowRight, User } from 'lucide-react';
import { isLoggedIn, getCurrentUser, logout } from '../services/storage';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [showAttendanceOptions, setShowAttendanceOptions] = useState(false);
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleDRLClick = () => {
      if (isLoggedIn()) {
          const currentUser = getCurrentUser();
          if (currentUser?.role === 'student') {
              // Sinh viên đã đăng nhập -> Vào form
              navigate(`/drl/form/${currentUser.username}`);
          } else {
              // Admin/BCH đã đăng nhập -> Vào quản lý
              navigate('/drl');
          }
      } else {
          // Chưa đăng nhập -> Vào login với đích đến là /drl
          navigate('/login', { state: { from: '/drl' } });
      }
  };

  const handleAttendanceLoginClick = () => {
      if (isLoggedIn()) {
          const currentUser = getCurrentUser();
          if (currentUser?.role === 'student') {
               // --- CHẶN SINH VIÊN VÀO QUẢN LÝ ---
               alert("Tài khoản Sinh viên không có quyền truy cập hệ thống Quản lý Điểm danh.");
               navigate('/public'); // Chuyển hướng sang trang Tra cứu
          } else {
               // Admin/Cán bộ -> Vào Dashboard
               navigate('/dashboard');
          }
      } else {
          navigate('/login', { state: { from: '/dashboard' } });
      }
  };

  const handleLogout = () => {
      logout();
      setUser(null);
      // Không reload để giữ trạng thái SPA mượt mà
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4 font-[Segoe UI,Arial,sans-serif] text-slate-800 overflow-hidden">
      
      {/* Top User Bar (Absolute) */}
      <div className="absolute top-4 right-4 z-20">
        {user ? (
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-white/50 pl-4 pr-2 py-1.5 rounded-full shadow-sm">
                <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đang đăng nhập</div>
                    <div className="text-sm font-bold text-slate-700 leading-none">{user.name}</div>
                </div>
                <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <User size={16}/>
                </div>
                <button onClick={handleLogout} className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 transition-colors shadow-sm ml-1" title="Đăng xuất">
                    <LogOut size={16} />
                </button>
            </div>
        ) : (
            <button 
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/50 rounded-full text-sm font-bold text-blue-600 hover:bg-white hover:shadow-md transition-all"
            >
                <LogIn size={16}/> Đăng nhập
            </button>
        )}
      </div>

      <div className="w-full max-w-5xl animate-fadeIn flex flex-col items-center justify-center h-full">
        
        {/* === HEADER SECTION (COMPACT) === */}
        <div className="text-center mb-6 flex flex-col items-center shrink-0">
             <img 
               src="https://file.kzii.site/logo_khoaktck_ctut.jpg" 
               alt="CTU Logo" 
               className="w-16 h-16 md:w-20 md:h-20 object-contain mb-3 drop-shadow-lg" 
             />
             <div className="flex flex-col items-center px-4">
                 <h1 className="text-lg md:text-2xl font-black text-[#1e3a8a] tracking-tight uppercase leading-tight mb-2 text-center">
                    TRƯỜNG ĐẠI HỌC KỸ THUẬT – CÔNG NGHỆ CẦN THƠ
                 </h1>
                 <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-2"></div>
                 <h3 className="text-xs md:text-sm font-bold text-[#2563eb] uppercase tracking-widest">KHOA KỸ THUẬT CƠ KHÍ</h3>
             </div>
        </div>

        {/* === MAIN CONTENT CARD (COMPACT) === */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-2 overflow-hidden w-full max-w-4xl">
            <div className="bg-white rounded-[0.8rem] p-6 md:p-8 min-h-[300px] flex flex-col justify-center">
                
                {!showAttendanceOptions ? (
                    <>
                        <div className="text-center mb-6">
                            <h2 className="text-xl md:text-2xl font-bold text-slate-800">Cổng Thông Tin Điện Tử</h2>
                            <p className="text-slate-500 text-sm mt-1">Vui lòng chọn phân hệ làm việc bên dưới</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto w-full">
                             {/* DRL CARD */}
                             <button 
                                onClick={handleDRLClick}
                                className="group relative flex flex-col items-center p-5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-500 hover:shadow-lg transition-all duration-300 text-center"
                             >
                                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-t-xl"></div>
                                <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                    <Award size={28} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-700 transition-colors mb-1">Điểm Rèn Luyện</h3>
                                <p className="text-xs text-slate-500 mb-3">Chấm điểm, đánh giá và quản lý hồ sơ rèn luyện.</p>
                                <div className="mt-auto flex items-center gap-1 text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                                    Truy cập <ArrowRight size={14}/>
                                </div>
                             </button>

                             {/* ATTENDANCE CARD */}
                             <button 
                                onClick={() => setShowAttendanceOptions(true)}
                                className="group relative flex flex-col items-center p-5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-500 hover:shadow-lg transition-all duration-300 text-center"
                             >
                                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-t-xl"></div>
                                <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                    <QrCode size={28} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-700 transition-colors mb-1">Điểm Danh QR</h3>
                                <p className="text-xs text-slate-500 mb-3">Quản lý lớp học, quét mã QR và báo cáo thống kê.</p>
                                <div className="mt-auto flex items-center gap-1 text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                                    Truy cập <ArrowRight size={14}/>
                                </div>
                             </button>
                        </div>
                    </>
                ) : (
                    <div className="max-w-md mx-auto w-full animate-fadeIn">
                        <button 
                            onClick={() => setShowAttendanceOptions(false)}
                            className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-medium mb-6 transition-colors group text-sm"
                        >
                            <div className="p-1 rounded-full bg-slate-100 group-hover:bg-blue-100 transition-colors"><ChevronRight className="rotate-180" size={14} /></div>
                            Quay lại
                        </button>

                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 mb-3">
                                <QrCode size={24}/>
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Hệ thống Điểm Danh</h2>
                            <p className="text-slate-500 text-sm">Chọn phương thức truy cập phù hợp</p>
                        </div>

                        <div className="space-y-3">
                            <button 
                                onClick={handleAttendanceLoginClick}
                                className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md font-bold flex items-center justify-between group transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-1.5 rounded-md"><LogIn size={18}/></div>
                                    <div className="text-left">
                                        <div className="text-xs opacity-90 font-normal">Dành cho Cán bộ / Lớp trưởng</div>
                                        <div className="text-sm">Đăng nhập Quản lý</div>
                                    </div>
                                </div>
                                <ChevronRight className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" size={18}/>
                            </button>
                            
                            <button 
                                onClick={() => navigate('/public')}
                                className="w-full p-3 bg-white border border-slate-200 hover:border-blue-300 text-slate-700 rounded-lg font-bold flex items-center justify-between group transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-100 text-slate-500 group-hover:text-blue-600 p-1.5 rounded-md transition-colors"><Search size={18}/></div>
                                    <div className="text-left">
                                        <div className="text-xs text-slate-400 font-normal">Dành cho Sinh viên</div>
                                        <div className="text-sm group-hover:text-blue-700 transition-colors">Tra cứu Điểm danh</div>
                                    </div>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" size={18}/>
                            </button>
                        </div>
                    </div>
                )}

            </div>
            
            {/* Footer */}
            <div className="bg-slate-50 p-2 text-center border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                    &copy; 2025 Khoa Kỹ thuật Cơ khí - Đại học Kỹ thuật Công nghệ Cần Thơ
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Landing;