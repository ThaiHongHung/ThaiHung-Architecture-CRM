
import React, { useState, useMemo } from 'react';
import { Project, Client, PaymentMilestone } from '../types';
import { formatCurrency, formatDate } from '../utils';

interface FinanceManagerProps {
  projects: Project[];
  clients: Client[];
  onUpdateProject: (project: Project) => void;
}

type SortOption = 'default' | 'valueAsc' | 'valueDesc' | 'dateNew' | 'dateOld';
type StatusFilter = 'Tất cả' | 'Đang triển khai' | 'Đã hoàn thành';

const FinanceManager: React.FC<FinanceManagerProps> = ({ projects, clients, onUpdateProject }) => {
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('Tất cả');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempAmount, setTempAmount] = useState(0);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>(
    projects.reduce((acc, p) => ({ ...acc, [p.id]: true }), {})
  );

  const todayStr = new Date().toISOString().split('T')[0];

  const toggleProject = (id: string) => {
    setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const processedProjects = useMemo(() => {
    let result = [...projects];

    if (filterStatus !== 'Tất cả') {
      result = result.filter(p => {
        const isCompleted = p.stages[p.stages.length - 1].status === 'Hoàn thành';
        return filterStatus === 'Đã hoàn thành' ? isCompleted : !isCompleted;
      });
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'valueAsc':
          return a.totalValue - b.totalValue;
        case 'valueDesc':
          return b.totalValue - a.totalValue;
        case 'dateNew':
          return new Date(b.contractSigningDate || 0).getTime() - new Date(a.contractSigningDate || 0).getTime();
        case 'dateOld':
          return new Date(a.contractSigningDate || 0).getTime() - new Date(b.contractSigningDate || 0).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [projects, filterStatus, sortBy]);

  const allPaymentsFlat = processedProjects.flatMap(p => p.payments);
  const totalRevenue = allPaymentsFlat.filter(p => p.status === 'Đã thu').reduce((acc, p) => acc + p.amount, 0);
  const pendingRevenue = allPaymentsFlat.filter(p => p.status !== 'Đã thu').reduce((acc, p) => acc + p.amount, 0);

  const handleUpdatePayment = (projectId: string, paymentId: string, updates: Partial<PaymentMilestone>) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedPayments = project.payments.map(p => 
      p.id === paymentId ? { ...p, ...updates } : p
    );

    onUpdateProject({ ...project, payments: updatedPayments });
    if (updates.amount !== undefined) setEditingId(null);
  };

  const formatInputNumber = (value: string) => {
    const raw = value.replace(/\./g, '').replace(/[^0-9]/g, '');
    return raw === '' ? 0 : parseInt(raw, 10);
  };

  const displayFormatted = (val: number) => {
    return val === 0 ? "" : val.toLocaleString('vi-VN');
  };

  const isFilterActive = filterStatus !== 'Tất cả' || sortBy !== 'default';

  const resetFilters = () => {
    setFilterStatus('Tất cả');
    setSortBy('default');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tài chính dự án</h2>
          <p className="text-slate-500">Quản lý dòng tiền và kế hoạch thu hồi công nợ.</p>
        </div>
        <div className="flex space-x-3">
           <button 
            onClick={() => setExpandedProjects(processedProjects.reduce((acc, p) => ({ ...acc, [p.id]: true }), {}))}
            className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 uppercase tracking-wider transition-colors shadow-sm"
           >
             Mở rộng
           </button>
           <button 
            onClick={() => setExpandedProjects({})}
            className="text-[10px] font-black text-slate-500 bg-slate-100 px-4 py-2 rounded-xl hover:bg-slate-200 uppercase tracking-wider transition-colors shadow-sm"
           >
             Thu gọn
           </button>
        </div>
      </div>

      {/* NEW IMPROVED FILTER & SORT BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center gap-6">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          {/* Status Filter */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trạng thái dự án</span>
            <div className={`relative transition-all duration-200 rounded-xl border-2 ${filterStatus !== 'Tất cả' ? 'border-indigo-400 ring-4 ring-indigo-50' : 'border-slate-100 hover:border-slate-300'}`}>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
                className="appearance-none bg-white text-sm font-bold text-slate-700 px-4 py-2.5 pr-10 rounded-xl outline-none min-w-[180px] cursor-pointer"
              >
                <option value="Tất cả">Tất cả dự án</option>
                <option value="Đang triển khai">Đang triển khai</option>
                <option value="Đã hoàn thành">Đã hoàn thành</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {/* Sort Control */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sắp xếp theo</span>
            <div className={`relative transition-all duration-200 rounded-xl border-2 ${sortBy !== 'default' ? 'border-indigo-400 ring-4 ring-indigo-50' : 'border-slate-100 hover:border-slate-300'}`}>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none bg-white text-sm font-bold text-slate-700 px-4 py-2.5 pr-10 rounded-xl outline-none min-w-[200px] cursor-pointer"
              >
                <option value="default">Mặc định (ID)</option>
                <option value="valueDesc">Giá trị HĐ: Giảm dần</option>
                <option value="valueAsc">Giá trị HĐ: Tăng dần</option>
                <option value="dateNew">Ngày ký: Mới nhất</option>
                <option value="dateOld">Ngày ký: Cũ nhất</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
              </div>
            </div>
          </div>

          {isFilterActive && (
            <button 
              onClick={resetFilters}
              className="mt-5 lg:mt-0 flex items-center space-x-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border border-rose-100"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>
        
        <div className="lg:text-right border-t lg:border-t-0 pt-4 lg:pt-0 lg:pl-6 lg:border-l border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kết quả</p>
          <p className="text-xl font-black text-slate-800">
            {processedProjects.length} <span className="text-slate-300 text-sm font-bold">/ {projects.length}</span>
          </p>
          <p className="text-[10px] font-bold text-indigo-500 uppercase">Dự án phù hợp</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-100 transition-all hover:shadow-xl group">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Tổng thực thu (Bộ lọc)</p>
          <p className="text-2xl font-black">{formatCurrency(totalRevenue)}</p>
          <div className="mt-4 flex items-center text-[10px] font-bold bg-white/20 w-fit px-2 py-1 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 mr-2 animate-pulse"></span>
            Tiền mặt & Chuyển khoản
          </div>
        </div>
        
        <div className="bg-rose-600 p-6 rounded-2xl text-white shadow-lg shadow-rose-100 transition-all hover:shadow-xl group">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Công nợ tồn đọng (Bộ lọc)</p>
          <p className="text-2xl font-black">{formatCurrency(pendingRevenue)}</p>
          <div className="mt-4 flex items-center text-[10px] font-bold bg-white/20 w-fit px-2 py-1 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300 mr-2"></span>
            Chưa quyết toán
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {processedProjects.map((project) => {
          const client = clients.find(c => c.id === project.clientId);
          const isExpanded = expandedProjects[project.id];
          const projectCollected = project.payments.filter(pay => pay.status === 'Đã thu').reduce((sum, pay) => sum + pay.amount, 0);
          const projectTotal = project.totalValue;
          const projectProgress = Math.round((projectCollected / projectTotal) * 100) || 0;
          const isCompleted = project.stages[project.stages.length - 1].status === 'Hoàn thành';

          return (
            <div key={project.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-1 ring-indigo-100' : ''} ${isCompleted ? 'border-slate-200' : 'border-indigo-100'}`}>
              <div 
                className={`p-4 flex items-center justify-between cursor-pointer select-none transition-colors ${isExpanded ? 'bg-slate-50/80 border-b border-slate-100' : 'hover:bg-slate-50'}`}
                onClick={() => toggleProject(project.id)}
              >
                <div className="flex items-center space-x-4 flex-1 overflow-hidden">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${projectProgress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}>
                    {projectProgress}%
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase tracking-tighter">{project.contractCode}</span>
                      <h3 className="font-bold text-slate-800 truncate">{project.name}</h3>
                      {isCompleted && (
                        <span className="text-[8px] font-bold bg-emerald-50 text-emerald-600 px-1 py-0.5 rounded border border-emerald-100 uppercase">Hoàn thành</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 mt-0.5">
                      <p className="text-xs text-slate-500 font-medium">Khách hàng: <span className="text-slate-700">{client?.name}</span></p>
                      <span className="text-slate-300">|</span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Ngày ký: {formatDate(project.contractSigningDate)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-8 px-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Đã thu / Tổng</p>
                    <p className="text-sm font-black text-slate-700">
                      {formatCurrency(projectCollected)} <span className="text-slate-300 font-normal">/ {formatCurrency(projectTotal)}</span>
                    </p>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {isExpanded && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase tracking-tight text-[10px]">
                        <tr>
                          <th className="px-6 py-3">Đợt thanh toán</th>
                          <th className="px-6 py-3">Số tiền</th>
                          <th className="px-6 py-3">Hạn thu</th>
                          <th className="px-6 py-3 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {project.payments.map((pay) => {
                          const isOverdue = pay.status !== 'Đã thu' && pay.dueDate < todayStr;
                          return (
                            <tr key={pay.id} className={`transition-colors group ${isOverdue ? 'bg-rose-50/30' : 'hover:bg-indigo-50/10'}`}>
                              <td className={`px-6 py-4 font-semibold ${isOverdue ? 'text-rose-900' : 'text-slate-700'}`}>
                                {pay.name}
                                {isOverdue && <span className="ml-2 text-[8px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded uppercase align-middle shadow-sm">Trễ</span>}
                              </td>
                              <td className="px-6 py-4">
                                {editingId === pay.id ? (
                                  <input 
                                    type="text"
                                    className="w-32 border-b-2 border-indigo-500 outline-none font-bold text-indigo-600 bg-white py-1"
                                    autoFocus
                                    value={displayFormatted(tempAmount)}
                                    onChange={(e) => setTempAmount(formatInputNumber(e.target.value))}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdatePayment(project.id, pay.id, { amount: tempAmount })}
                                    onBlur={() => handleUpdatePayment(project.id, pay.id, { amount: tempAmount })}
                                  />
                                ) : (
                                  <div 
                                    className="cursor-pointer flex items-center group/amount"
                                    onClick={() => { setEditingId(pay.id); setTempAmount(pay.amount); }}
                                  >
                                    <span className={`font-bold transition-colors ${isOverdue ? 'text-rose-900' : 'text-slate-800 group-hover/amount:text-indigo-600'}`}>
                                      {formatCurrency(pay.amount)}
                                    </span>
                                    <svg className="w-3.5 h-3.5 ml-2 opacity-0 group-hover/amount:opacity-100 transition-opacity text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <input 
                                  type="date"
                                  value={pay.dueDate}
                                  onChange={(e) => handleUpdatePayment(project.id, pay.id, { dueDate: e.target.value })}
                                  className={`bg-transparent border-none p-0 font-bold text-xs focus:ring-0 cursor-pointer transition-colors ${isOverdue ? 'text-rose-700 underline underline-offset-4 decoration-rose-300' : 'text-slate-600 hover:text-indigo-600'}`}
                                />
                              </td>
                              <td className="px-6 py-4 text-center">
                                <select
                                  value={pay.status}
                                  onChange={(e) => handleUpdatePayment(project.id, pay.id, { status: e.target.value as any })}
                                  className={`text-[9px] font-black uppercase tracking-wider py-1.5 px-3 rounded-full border-none cursor-pointer outline-none transition-all shadow-sm ring-2 ${
                                    pay.status === 'Đã thu' ? 'ring-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100' : 
                                    isOverdue || pay.status === 'Quá hạn' ? 'ring-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100' : 
                                    'ring-slate-100 text-slate-500 bg-white hover:bg-slate-50'
                                  }`}
                                >
                                  <option value="Chưa thu">Chưa thu</option>
                                  <option value="Đã thu">Đã thu</option>
                                  <option value="Quá hạn">Quá hạn</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 bg-slate-50/30 border-t border-slate-100 flex justify-between items-center">
                     <p className="text-[10px] text-slate-400 italic">* Click vào số tiền hoặc ngày để chỉnh sửa nhanh.</p>
                     <div className="flex space-x-4">
                        <div className="text-xs">
                          <span className="text-slate-500">Tiền còn nợ:</span>
                          <span className="ml-2 font-black text-rose-700">{formatCurrency(projectTotal - projectCollected)}</span>
                        </div>
                     </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {processedProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 text-slate-400">
            <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
            </svg>
            <p className="text-lg font-bold">Không tìm thấy dự án</p>
            <p className="text-sm italic">Thử thay đổi bộ lọc hoặc tiêu chí sắp xếp.</p>
            {isFilterActive && (
              <button 
                onClick={resetFilters}
                className="mt-6 text-indigo-600 font-bold border-b-2 border-indigo-200 hover:border-indigo-600 transition-all"
              >
                Đặt lại tất cả bộ lọc
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceManager;
