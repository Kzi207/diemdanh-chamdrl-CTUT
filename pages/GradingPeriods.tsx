import React, { useState, useEffect } from 'react';
import { getGradingPeriods, createGradingPeriod, updateGradingPeriod, deleteGradingPeriod } from '../services/storage';
import { GradingPeriod } from '../types';
import { Calendar, PlusCircle, Edit, Trash2, ArrowLeft, Save, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GradingPeriods: React.FC = () => {
  const navigate = useNavigate();
  const [periods, setPeriods] = useState<GradingPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [newPeriod, setNewPeriod] = useState({ id: '', name: '', startDate: '', endDate: '' });
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    setLoading(true);
    try {
        const data = await getGradingPeriods();
        setPeriods(data);
        setError(null);
    } catch (e) {
        setError("Lỗi tải dữ liệu: " + (e as Error).message);
    } finally {
        setLoading(false);
    }
  };

  const handleSavePeriod = async () => {
      if (!newPeriod.id || !newPeriod.name) {
          alert("Vui lòng nhập ID và Tên đợt chấm.");
          return;
      }
      try {
          if (editingPeriodId) {
              await updateGradingPeriod(newPeriod);
              alert("Cập nhật đợt chấm thành công!");
          } else {
              await createGradingPeriod(newPeriod);
              alert("Tạo đợt chấm thành công!");
          }
          
          await fetchPeriods();
          handleCancelEdit();
      } catch (e) {
          alert("Lỗi: " + (e as Error).message);
      }
  };

  const handleEditPeriod = (period: GradingPeriod) => {
      setNewPeriod({ 
        id: period.id, 
        name: period.name, 
        startDate: period.startDate || '', 
        endDate: period.endDate || '' 
      });
      setEditingPeriodId(period.id);
  };

  const handleCancelEdit = () => {
      setNewPeriod({ id: '', name: '', startDate: '', endDate: '' });
      setEditingPeriodId(null);
  };

  const handleDeletePeriod = async (id: string) => {
      if(!window.confirm(`Bạn có chắc muốn xóa đợt chấm "${id}"?`)) return;
      try {
          await deleteGradingPeriod(id);
          fetchPeriods();
      } catch(e) {
          alert("Lỗi xóa: " + (e as Error).message);
      }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
             <button onClick={() => navigate('/drl')} className="p-2 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
                <ArrowLeft size={20} />
             </button>
             <div>
                 <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="text-blue-600"/> Quản Lý Đợt Chấm
                 </h1>
                 <p className="text-gray-500 text-sm">Thiết lập các học kỳ và thời gian chấm điểm rèn luyện.</p>
             </div>
        </div>

        {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm mb-6 flex items-start gap-3">
                <AlertTriangle size={24} className="text-red-600"/>
                <p className="text-red-700">{error}</p>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
                <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">
                    {editingPeriodId ? 'Cập Nhật Đợt Chấm' : 'Thêm Đợt Mới'}
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Mã Đợt (ID) <span className="text-red-500">*</span></label>
                        <input 
                            placeholder="VD: HK2_2024" 
                            className={`w-full border p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${editingPeriodId ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
                            value={newPeriod.id} 
                            onChange={e => setNewPeriod({...newPeriod, id: e.target.value})}
                            disabled={!!editingPeriodId}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Mã đợt là duy nhất và không thể sửa sau khi tạo.</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Tên Hiển Thị <span className="text-red-500">*</span></label>
                        <input 
                            placeholder="VD: Học kỳ 2, Năm 2024" 
                            className="w-full border p-2.5 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                            value={newPeriod.name} onChange={e => setNewPeriod({...newPeriod, name: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Ngày Bắt Đầu</label>
                            <input 
                                type="date"
                                className="w-full border p-2.5 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                value={newPeriod.startDate} onChange={e => setNewPeriod({...newPeriod, startDate: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Ngày Kết Thúc</label>
                            <input 
                                type="date"
                                className="w-full border p-2.5 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                value={newPeriod.endDate} onChange={e => setNewPeriod({...newPeriod, endDate: e.target.value})}
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                        {editingPeriodId && (
                            <button onClick={handleCancelEdit} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-bold flex items-center justify-center gap-2">
                                <X size={16}/> Hủy
                            </button>
                        )}
                        <button 
                            onClick={handleSavePeriod} 
                            className={`flex-1 py-2.5 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors ${editingPeriodId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {editingPeriodId ? <Save size={16}/> : <PlusCircle size={16}/>} 
                            {editingPeriodId ? 'Lưu Thay Đổi' : 'Tạo Mới'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Column: List */}
            <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Danh Sách Đợt Chấm</h3>
                    <button onClick={fetchPeriods} className="text-gray-500 hover:text-blue-600 p-1 rounded-full hover:bg-white"><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/></button>
                </div>
                
                <div className="overflow-auto flex-1">
                    <table className="w-full text-sm text-left">
                          <thead className="bg-white text-gray-500 border-b uppercase text-xs">
                              <tr>
                                  <th className="p-4 font-bold">Thông tin đợt</th>
                                  <th className="p-4 font-bold text-center">Thời gian mở</th>
                                  <th className="p-4 font-bold text-right">Thao tác</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {periods.length === 0 && !loading && (
                                  <tr>
                                      <td colSpan={3} className="p-8 text-center text-gray-400">Chưa có đợt chấm nào.</td>
                                  </tr>
                              )}
                              {periods.map(p => (
                                  <tr key={p.id} className={`hover:bg-blue-50 transition-colors ${editingPeriodId === p.id ? 'bg-indigo-50' : ''}`}>
                                      <td className="p-4">
                                          <div className="font-bold text-gray-800 text-base">{p.name}</div>
                                          <div className="text-xs text-gray-500 font-mono bg-gray-100 inline-block px-1.5 rounded mt-1">{p.id}</div>
                                      </td>
                                      <td className="p-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${p.startDate ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-400'}`}>
                                                Từ: {p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : '--/--/----'}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${p.endDate ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-100 text-gray-400'}`}>
                                                Đến: {p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : '--/--/----'}
                                            </span>
                                        </div>
                                      </td>
                                      <td className="p-4 text-right">
                                          <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleEditPeriod(p)} 
                                                className="bg-white border border-gray-200 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 p-2 rounded-lg transition-all shadow-sm"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit size={16}/>
                                            </button>
                                            <button 
                                                onClick={() => handleDeletePeriod(p.id)} 
                                                className="bg-white border border-gray-200 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 p-2 rounded-lg transition-all shadow-sm"
                                                title="Xóa"
                                            >
                                                <Trash2 size={16}/>
                                            </button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                </div>
            </div>
        </div>
    </div>
  );
};

export default GradingPeriods;