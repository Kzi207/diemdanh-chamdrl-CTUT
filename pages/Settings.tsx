import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser, saveApiConfig, getApiUrl, checkSystemStatus, resetApiConfig, getCurrentUser, changePassword } from '../services/storage';
import { Save, Server, UserPlus, Trash2, Users, CheckCircle, XCircle, RefreshCw, Globe, AlertTriangle, Terminal, RotateCcw, Lock, Edit, X } from 'lucide-react';
import { User } from '../types';

const Settings: React.FC = () => {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  
  const [activeTab, setActiveTab] = useState<'connection' | 'users' | 'profile'>('profile');
  
  const [apiUrl, setApiUrl] = useState('');
  const [serverStatus, setServerStatus] = useState<'checking' | 'ok' | 'error' | 'warning'>('checking');
  const [statusMsg, setStatusMsg] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // User Mgmt State
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'monitor' as const, classId: '' });
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  // Change Password State
  const [passData, setPassData] = useState({ old: '', new: '', confirm: '' });

  useEffect(() => {
    setApiUrl(getApiUrl());
    checkConnection();
  }, []);

  useEffect(() => {
    if (activeTab === 'users' && serverStatus === 'ok' && isAdmin) fetchUsers();
  }, [activeTab, serverStatus]);

  const checkConnection = async () => {
      setServerStatus('checking');
      const res = await checkSystemStatus();
      setServerStatus(res.status as any);
      setStatusMsg(res.message);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveApiConfig(apiUrl);
    setIsSaved(true);
    checkConnection();
    setTimeout(() => setIsSaved(false), 2000);
  };

  const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
          const data = await getUsers();
          setUsers(data);
      } catch (error) {
          console.error(error);
      } finally {
          setLoadingUsers(false);
      }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (isEditingUser) {
              await updateUser(newUser as any);
              alert("Cập nhật tài khoản thành công!");
          } else {
              await createUser(newUser as any);
              alert("Thêm tài khoản thành công!");
          }
          setNewUser({ username: '', password: '', name: '', role: 'monitor', classId: '' });
          setIsEditingUser(false);
          setShowUserModal(false);
          fetchUsers();
      } catch (e) {
          alert("Lỗi: " + (e as Error).message);
      }
  };

  const handleAddClick = () => {
      setNewUser({ username: '', password: '', name: '', role: 'monitor', classId: '' });
      setIsEditingUser(false);
      setShowUserModal(true);
  };

  const handleEditClick = (user: User) => {
      setNewUser({
          username: user.username,
          password: user.password,
          name: user.name,
          role: user.role as any,
          classId: user.classId || ''
      });
      setIsEditingUser(true);
      setShowUserModal(true);
  };

  const handleDeleteUser = async (username: string) => {
      if(!window.confirm(`Bạn chắc chắn muốn xóa user: ${username}?`)) return;
      try {
          await deleteUser(username);
          fetchUsers();
      } catch (e) {
          alert("Lỗi xóa user");
      }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (passData.new !== passData.confirm) {
          alert("Mật khẩu xác nhận không khớp!");
          return;
      }
      if (currentUser?.password && passData.old !== currentUser.password) {
          alert("Mật khẩu cũ không đúng!");
          return;
      }
      try {
          await changePassword(currentUser!.username, passData.new);
          alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
      } catch (e) {
          alert("Lỗi đổi mật khẩu");
      }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Cài đặt Hệ thống</h1>

      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <Lock size={18} /> Tài khoản cá nhân
          </button>
          {isAdmin && (
              <>
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Users size={18} /> Quản lý Users (Admin)
                </button>
                <button 
                    onClick={() => setActiveTab('connection')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'connection' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Globe size={18} /> Kết nối Database
                </button>
              </>
          )}
      </div>

      {activeTab === 'profile' && (
          <div className="max-w-md bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-fadeIn">
              <h3 className="font-bold text-lg mb-4 text-gray-800">Đổi Mật Khẩu</h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu cũ</label>
                      <input 
                        type="password" 
                        value={passData.old} 
                        onChange={e => setPassData({...passData, old: e.target.value})}
                        className="w-full border p-2 rounded-lg bg-white" required 
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                      <input 
                        type="password" 
                        value={passData.new} 
                        onChange={e => setPassData({...passData, new: e.target.value})}
                        className="w-full border p-2 rounded-lg bg-white" required 
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nhập lại mật khẩu mới</label>
                      <input 
                        type="password" 
                        value={passData.confirm} 
                        onChange={e => setPassData({...passData, confirm: e.target.value})}
                        className="w-full border p-2 rounded-lg bg-white" required 
                      />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium">
                      Cập nhật mật khẩu
                  </button>
              </form>
          </div>
      )}

      {activeTab === 'connection' && (
        <div className="space-y-6 max-w-3xl animate-fadeIn">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                 <div className="flex justify-between items-center mb-4">
                     <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">Trạng thái Kết nối</h2>
                     <div className={`text-sm px-3 py-1 rounded-full flex items-center gap-1 font-bold ${
                         serverStatus === 'ok' ? 'bg-green-100 text-green-700' : 
                         serverStatus === 'error' ? 'bg-red-100 text-red-700' : 'bg-gray-100'
                     }`}>
                         {serverStatus === 'ok' ? <CheckCircle size={14}/> : 
                          serverStatus === 'error' ? <XCircle size={14}/> : <RefreshCw size={14} className="animate-spin"/>}
                         {statusMsg || 'Đang kiểm tra...'}
                     </div>
                </div>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-orange-500"/>
                        Nếu kết nối thất bại, vui lòng liên hệ Admin để kiểm tra Server.
                    </p>
                </div>

                <form onSubmit={handleSaveConfig} className="space-y-4 pt-2 border-t border-gray-100">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Server API URL
                        </label>
                        <input 
                            type="url" 
                            value={apiUrl}
                            onChange={(e) => setApiUrl(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                            placeholder="https://database.kzii.site"
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        className={`w-full flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-colors ${isSaved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {isSaved ? 'Đã lưu!' : <><Save size={18} /> Lưu Cấu Hình Server</>}
                    </button>
                </form>
            </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="animate-fadeIn">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Users size={20}/> Danh sách Người dùng</h3>
                <button 
                    onClick={handleAddClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm"
                >
                    <UserPlus size={16}/> Thêm Tài khoản
                </button>
            </div>

            <div className="bg-white p-0 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {serverStatus !== 'ok' ? (
                    <div className="p-6 bg-orange-50 text-orange-700 rounded-lg text-sm m-4">Vui lòng kết nối Server để quản lý tài khoản.</div>
                ) : loadingUsers ? (
                    <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2"><RefreshCw className="animate-spin" size={16}/> Đang tải...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                                <tr>
                                    <th className="p-4">Username</th>
                                    <th className="p-4">Họ Tên</th>
                                    <th className="p-4">Vai trò</th>
                                    <th className="p-4 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map(u => (
                                    <tr key={u.username} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium">{u.username}</td>
                                        <td className="p-4">{u.name}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                u.role === 'admin' ? 'bg-red-100 text-red-700' :
                                                u.role === 'doankhoa' ? 'bg-purple-100 text-purple-700' :
                                                u.role === 'bch' ? 'bg-indigo-100 text-indigo-700' :
                                                u.role === 'monitor' ? 'bg-green-100 text-green-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>{u.role}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleEditClick(u)}
                                                    className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 rounded hover:bg-blue-100 transition-colors flex items-center gap-1 font-medium"
                                                    title="Sửa thông tin"
                                                >
                                                    <Edit size={16} /> Sửa
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteUser(u.username)}
                                                    className="text-red-600 hover:text-red-800 p-1.5 bg-red-50 rounded hover:bg-red-100 transition-colors"
                                                    title="Xóa tài khoản"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">Danh sách trống</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL POPUP */}
            {showUserModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                {isEditingUser ? <Edit size={18} className="text-orange-600"/> : <UserPlus size={18} className="text-blue-600"/>}
                                {isEditingUser ? 'Cập nhật Tài khoản' : 'Thêm Tài khoản Mới'}
                            </h3>
                            <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200">
                                <X size={20}/>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập (Username)</label>
                                <input 
                                    type="text" required
                                    value={newUser.username}
                                    onChange={e => setNewUser({...newUser, username: e.target.value})}
                                    disabled={isEditingUser}
                                    className={`w-full border p-2.5 rounded-lg outline-none bg-white text-gray-900 ${isEditingUser ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
                                    placeholder="VD: admin, mssv..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                                <input 
                                    type="text" required
                                    value={newUser.password}
                                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                                    className="w-full border p-2.5 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
                                    placeholder={isEditingUser ? "Nhập MK mới để thay đổi" : "Mật khẩu"}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và Tên</label>
                                <input 
                                    type="text" required
                                    value={newUser.name}
                                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                                    className="w-full border p-2.5 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
                                    placeholder="VD: Nguyễn Văn A"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò (Quyền hạn)</label>
                                <select 
                                    value={newUser.role}
                                    onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                                    className="w-full border p-2.5 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
                                >
                                    <option value="monitor">Ban cán sự (Lớp trưởng)</option>
                                    <option value="bch">Ban chấp hành</option>
                                    <option value="doankhoa">Đoàn khoa</option>
                                    <option value="admin">Quản trị viên (Admin)</option>
                                    <option value="student">Sinh viên</option>
                                </select>
                            </div>
                            
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-bold">
                                    Hủy
                                </button>
                                <button type="submit" disabled={serverStatus !== 'ok'} className={`flex-1 text-white py-2.5 rounded-lg transition-colors font-bold disabled:bg-gray-400 ${isEditingUser ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                    {isEditingUser ? 'Lưu Thay Đổi' : 'Thêm Mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default Settings;