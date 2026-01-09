import React, { useState, useEffect, useRef } from 'react';
import { ClassGroup, Student, User } from '../types';
import { getClasses, createClass, getStudents, importStudents, deleteClass, updateClass, createUsersBatch, getUsers, updateUser, createUser } from '../services/storage';
import { Plus, Upload, Download, FileSpreadsheet, Eye, Trash2, Edit2, X, Check, AlertTriangle, RefreshCw, Key, Save, UserPlus, Lock } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<User[]>([]); // Danh sách tài khoản tương ứng
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  
  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  
  // Edit/Delete State
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  // Password Editing State
  const [editingPassword, setEditingPassword] = useState<Record<string, string>>({});

  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadClassData(selectedClassId);
    } else {
      setStudents([]);
      setUsers([]);
    }
  }, [selectedClassId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
        const data = await getClasses();
        setClasses(data);
    } catch (e: any) { 
        console.error(e); 
        setError(e.message || "Không thể tải danh sách lớp.");
    } finally {
        setLoading(false);
    }
  };

  const loadClassData = async (classId: string) => {
    try {
        setLoading(true);
        const [studentData, allUsers] = await Promise.all([
            getStudents(classId),
            getUsers()
        ]);
        setStudents(studentData);
        
        // Filter users that belong to this class OR match student IDs
        const classUsers = allUsers.filter(u => 
            u.classId === classId || studentData.some(s => s.id === u.username)
        );
        setUsers(classUsers);
        setEditingPassword({}); // Reset edit state
    } catch (e) { 
        console.error(e); 
        setError("Lỗi tải dữ liệu sinh viên/tài khoản.");
    } finally {
        setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;
    try {
        const newClass: ClassGroup = {
            id: newClassName.trim(),
            name: newClassName.trim(),
        };
        await createClass(newClass);
        setNewClassName('');
        setShowCreateModal(false);
        fetchData();
    } catch (e: any) {
        alert("Lỗi tạo lớp: " + e.message);
    }
  };

  const handleUpdateClass = async (id: string) => {
     if (!editName.trim()) return;
     try {
         await updateClass(id, editName);
         setEditingClassId(null);
         fetchData();
     } catch(e: any) { alert("Lỗi cập nhật: " + e.message); }
  };

  const handleDeleteClass = async (id: string, name: string) => {
     if (window.confirm(`Bạn có chắc muốn xóa lớp "${name}"? Thao tác này sẽ xóa lớp khỏi danh sách (Dữ liệu SV vẫn còn trong DB).`)) {
        try {
            await deleteClass(id);
            if (selectedClassId === id) setSelectedClassId(null);
            fetchData();
        } catch(e: any) { alert("Lỗi xóa: " + e.message); }
     }
  };

  // --- ACCOUNT MANAGEMENT HANDLERS ---

  const handlePasswordChangeInput = (username: string, val: string) => {
      setEditingPassword(prev => ({ ...prev, [username]: val }));
  };

  const handleSavePassword = async (user: User) => {
      const newPass = editingPassword[user.username];
      if (newPass === undefined || newPass === user.password) return; // No change
      
      if (!window.confirm(`Đổi mật khẩu cho sinh viên ${user.name} thành "${newPass}"?`)) return;

      try {
          await updateUser({ ...user, password: newPass });
          
          // Update local state
          setUsers(prev => prev.map(u => u.username === user.username ? { ...u, password: newPass } : u));
          setEditingPassword(prev => {
              const newState = { ...prev };
              delete newState[user.username];
              return newState;
          });
          alert("Đã cập nhật mật khẩu!");
      } catch (e) {
          alert("Lỗi cập nhật: " + (e as Error).message);
      }
  };

  const handleCreateSingleAccount = async (student: Student) => {
      const cleanId = student.id.trim();
      const password = cleanId.length > 3 ? cleanId.slice(-3) : cleanId;
      const newUser: User = {
          username: cleanId,
          password: password,
          name: `${student.lastName} ${student.firstName}`.trim(),
          role: 'student',
          classId: student.classId
      };

      try {
          await createUser(newUser);
          setUsers(prev => [...prev, newUser]);
          alert(`Đã tạo tài khoản cho ${cleanId}. Mật khẩu: ${password}`);
      } catch (e) {
          alert("Lỗi tạo tài khoản: " + (e as Error).message);
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedClassId) {
      alert("Vui lòng chọn lớp trước khi nhập sinh viên!");
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const newStudents: Student[] = [];
        
        // Format: [STT, Mã SV, Họ Đệm, Tên, Ngày Sinh]
        for (let i = 1; i < data.length; i++) {
          const row: any = data[i];
          if (row && row[1] !== undefined) {
             const idStr = String(row[1]).trim();
             if (idStr) {
                newStudents.push({
                    id: idStr,
                    lastName: row[2] ? String(row[2]).trim() : '',
                    firstName: row[3] ? String(row[3]).trim() : '',
                    dob: row[4] ? String(row[4]).trim() : '',
                    classId: selectedClassId
                });
             }
          }
        }

        if (newStudents.length > 0) {
          // 1. Import Students into Database
          await importStudents(newStudents);
          
          // 2. Automatically Create User Accounts
          const newUsers: User[] = newStudents.map(s => {
              const cleanId = s.id.toString().trim();
              const password = cleanId.length > 3 ? cleanId.slice(-3) : cleanId;
              
              return {
                  username: cleanId,
                  password: password,
                  name: `${s.lastName} ${s.firstName}`.trim(),
                  role: 'student',
                  classId: selectedClassId
              };
          });
          
          const userRes = await createUsersBatch(newUsers);

          await loadClassData(selectedClassId);
          alert(`Thành công!\n- Đã nhập ${newStudents.length} sinh viên.\n- Đã tự động tạo ${userRes.count} tài khoản đăng nhập (Mật khẩu: 3 số cuối MSSV).`);
        } else {
            alert("Không tìm thấy dữ liệu. Kiểm tra cột Mã SV.");
        }
      } catch (error) {
        alert("Lỗi: " + (error as Error).message);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const createStudentCardImage = async (student: Student): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = 600; canvas.height = 250;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 250);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 596, 246);

    try {
        const qrDataUrl = await QRCode.toDataURL(student.id, { width: 200, margin: 1 });
        const qrImg = new Image();
        qrImg.src = qrDataUrl;
        await new Promise((resolve) => { qrImg.onload = resolve; });
        ctx.drawImage(qrImg, 20, 25, 200, 200);
    } catch (e) {}

    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`${student.lastName} ${student.firstName}`, 240, 80);
    ctx.font = '24px Arial';
    ctx.fillText(`MSSV: ${student.id}`, 240, 130);
    ctx.font = '22px Arial';
    ctx.fillStyle = '#555555';
    ctx.fillText(`Ngày sinh: ${student.dob}`, 240, 170);
    return canvas.toDataURL('image/png');
  };

  const generateQRPDF = async () => {
    if (students.length === 0) {
      alert("Lớp chưa có sinh viên."); return;
    }
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;
    const imgWidth = 170;
    const imgHeight = 70;
    
    doc.setFont("helvetica", "bold");
    doc.text(`QR Code - ${classes.find(c => c.id === selectedClassId)?.name}`, pageWidth / 2, 10, { align: 'center' });

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      if (yPos + imgHeight > 280) {
        doc.addPage();
        yPos = 20;
      }
      const imgData = await createStudentCardImage(s);
      doc.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 10;
    }
    doc.save(`QR_Lop_${selectedClassId}.pdf`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Quản Lý Lớp Học & Tài Khoản</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Tạo Lớp Mới
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md flex items-center justify-between">
            <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-500" />
                <div>
                    <h3 className="text-red-800 font-bold">Lỗi Database</h3>
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            </div>
            <button onClick={fetchData} className="text-red-700 hover:underline flex items-center gap-1 font-bold"><RefreshCw size={16}/> Thử lại</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Class List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700 flex justify-between items-center">
            <span>Danh sách lớp</span>
            {loading && <RefreshCw size={14} className="animate-spin text-gray-400"/>}
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {classes.map(cls => (
              <div 
                key={cls.id} 
                className={`group flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedClassId === cls.id ? 'bg-blue-50' : ''}`}
              >
                 {editingClassId === cls.id ? (
                    <div className="flex flex-1 items-center gap-2">
                        <input 
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full border p-1 rounded text-sm bg-white text-gray-900"
                        />
                        <button onClick={() => handleUpdateClass(cls.id)} className="text-green-600"><Check size={16}/></button>
                        <button onClick={() => setEditingClassId(null)} className="text-gray-500"><X size={16}/></button>
                    </div>
                 ) : (
                    <>
                        <button 
                            onClick={() => setSelectedClassId(cls.id)} 
                            className={`flex-1 text-left ${selectedClassId === cls.id ? 'text-blue-700 font-medium' : 'text-gray-600'}`}
                        >
                            {cls.name}
                        </button>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setEditingClassId(cls.id); setEditName(cls.name); }} 
                                className="text-gray-400 hover:text-blue-500"
                            >
                                <Edit2 size={14}/>
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id, cls.name); }} 
                                className="text-gray-400 hover:text-red-500"
                            >
                                <Trash2 size={14}/>
                            </button>
                        </div>
                    </>
                 )}
              </div>
            ))}
            {classes.length === 0 && !loading && <div className="p-4 text-center text-gray-400 text-sm">Chưa có lớp nào</div>}
            {loading && classes.length === 0 && <div className="p-4 text-center text-gray-400 text-sm">Đang tải...</div>}
          </div>
        </div>

        {/* Right: Student Table */}
        <div className="lg:col-span-3 space-y-6">
          {selectedClassId ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Sinh viên lớp: {classes.find(c => c.id === selectedClassId)?.name}
                </h2>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors disabled:bg-gray-400"
                  >
                    {isUploading ? 'Đang lưu...' : <><FileSpreadsheet size={16} /> Nhập Excel</>}
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
                  
                  <button 
                    onClick={generateQRPDF}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors"
                  >
                    <Download size={16} /> Xuất PDF QR
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3">MSSV</th>
                      <th className="px-6 py-3">Họ và tên</th>
                      <th className="px-6 py-3 text-center">Tài khoản</th>
                      <th className="px-6 py-3 w-48">Mật khẩu (Sửa)</th>
                      <th className="px-6 py-3 text-center">QR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((student) => {
                      // Tìm account tương ứng
                      const user = users.find(u => u.username === student.id);
                      const currentPass = editingPassword[student.id] !== undefined ? editingPassword[student.id] : (user?.password || '');
                      const isChanged = user && currentPass !== user.password;

                      return (
                      <tr key={student.id} className="bg-white hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{student.id}</td>
                        <td className="px-6 py-4">{student.lastName} {student.firstName}</td>
                        <td className="px-6 py-4 text-center">
                            {user ? (
                                <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs font-bold">
                                    <Check size={12}/> Có TK
                                </span>
                            ) : (
                                <button 
                                    onClick={() => handleCreateSingleAccount(student)}
                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-0.5 rounded text-xs font-bold border border-blue-200 transition-colors"
                                >
                                    <UserPlus size={12}/> Tạo TK
                                </button>
                            )}
                        </td>
                        <td className="px-6 py-4">
                            {user ? (
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Lock className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={12}/>
                                        <input 
                                            type="text" 
                                            value={currentPass}
                                            onChange={(e) => handlePasswordChangeInput(student.id, e.target.value)}
                                            className={`w-full pl-6 pr-2 py-1 border rounded text-xs outline-none focus:ring-1 ${isChanged ? 'border-orange-300 bg-orange-50 focus:ring-orange-500' : 'border-gray-200 bg-gray-50 focus:ring-blue-500'}`}
                                            placeholder="Mật khẩu"
                                        />
                                    </div>
                                    {isChanged && (
                                        <button 
                                            onClick={() => handleSavePassword(user)}
                                            className="text-white bg-green-500 hover:bg-green-600 p-1.5 rounded transition-colors shadow-sm"
                                            title="Lưu mật khẩu mới"
                                        >
                                            <Save size={14}/>
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <span className="text-gray-300 text-xs italic">Chưa có tài khoản</span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Eye className="w-5 h-5 mx-auto text-gray-400 cursor-pointer hover:text-blue-500" />
                        </td>
                      </tr>
                      );
                    })}
                    {students.length === 0 && (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-400">Danh sách trống. Hãy nhập Excel.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
              Chọn một lớp để quản lý sinh viên & tài khoản
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
            <h3 className="text-lg font-bold mb-4">Tạo Lớp Mới</h3>
            <input 
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Tên lớp (VD: K13-CNCD2511)"
              className="w-full border border-gray-300 rounded-lg p-2 mb-4 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
              <button onClick={handleCreateClass} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Tạo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;