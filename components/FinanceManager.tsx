
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tài chính theo dự án</h2>
          <p className="text-slate-500">Quản lý dòng tiền chi tiết cho từng hợp đồng.</p>
        </div>
        <div className="flex space-x-2">
           <button 
            onClick={() => setExpandedProjects(processedProjects.reduce((acc, p) => ({ ...acc, [p.id]: true }), {}))}
            className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 uppercase"
           >
             Mở rộng tất cả
           </button>
           <button 
            onClick={() => setExpandedProjects({})}
            className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 uppercase"
           >
             Thu gọn
           </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái:</span>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
            className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Tất cả">Tất cả dự án</option>
            <option value="Đang triển khai">Đang triển khai</option>
            <option value="Đã hoàn thành">Đã hoàn thành</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sắp xếp:</span>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="default">Mặc định</option>
            <option value="valueDesc">Giá trị HĐ (Giảm dần)</option>
            <option value="valueAsc">Giá trị HĐ (Tăng dần)</option>
            <option value="dateNew">Ngày ký (Mới nhất)</option>
            <option value="dateOld">Ngày ký (Cũ nhất)</option>
          </select>
        </div>
        
        <div className="ml-auto text-[10px] font-bold text-slate-400">
          Hiển thị: <span className="text-indigo-600">{processedProjects.length}</span> / {projects.length} dự án
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
                              <td className={`px-6 py-4 font-semibold ${isOverdue ? 'text-rose-700' : 'text-slate-700'}`}>
                                {pay.name}
                                {isOverdue && <span className="ml-2 text-[8px] font-black text-white bg-rose-500 px-1.5 py-0.5 rounded uppercase align-middle">Trễ</span>}
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
                                    <span className={`font-bold transition-colors ${isOverdue ? 'text-rose-700' : 'text-slate-800 group-hover/amount:text-indigo-600'}`}>
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
                                  className={`bg-transparent border-none p-0 font-medium text-xs focus:ring-0 cursor-pointer transition-colors ${isOverdue ? 'text-rose-600 font-bold underline decoration-rose-200 decoration-2 underline-offset-4' : 'text-slate-600 hover:text-indigo-600'}`}
                                />
                              </td>
                              <td className="px-6 py-4 text-center">
                                <select
                                  value={pay.status}
                                  onChange={(e) => handleUpdatePayment(project.id, pay.id, { status: e.target.value as any })}
                                  className={`text-[9px] font-black uppercase tracking-wider py-1.5 px-3 rounded-full border-none cursor-pointer outline-none bg-white transition-all shadow-sm ring-1 ${
                                    pay.status === 'Đã thu' ? 'ring-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100' : 
                                    isOverdue || pay.status === 'Quá hạn' ? 'ring-rose-300 text-white bg-rose-500 hover:bg-rose-600' : 
                                    'ring-slate-200 text-slate-500 bg-slate-50 hover:bg-slate-100'
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
                          <span className="ml-2 font-black text-rose-600">{formatCurrency(projectTotal - projectCollected)}</span>
                        </div>
                     </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FinanceManager;
