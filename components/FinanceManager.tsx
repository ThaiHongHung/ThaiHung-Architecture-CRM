
import React, { useState } from 'react';
import { Project, Client, PaymentMilestone } from '../types';
import { formatCurrency, formatDate } from '../utils';

interface FinanceManagerProps {
  projects: Project[];
  clients: Client[];
  onUpdateProject: (project: Project) => void;
}

const FinanceManager: React.FC<FinanceManagerProps> = ({ projects, clients, onUpdateProject }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempAmount, setTempAmount] = useState(0);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>(
    projects.reduce((acc, p) => ({ ...acc, [p.id]: true }), {})
  );

  const toggleProject = (id: string) => {
    setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allPaymentsFlat = projects.flatMap(p => p.payments);
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
            onClick={() => setExpandedProjects(projects.reduce((acc, p) => ({ ...acc, [p.id]: true }), {}))}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-100 transition-all hover:shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Tổng thực thu</p>
          <p className="text-3xl font-black">{formatCurrency(totalRevenue)}</p>
          <div className="mt-4 flex items-center text-[10px] font-bold bg-white/20 w-fit px-2 py-1 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 mr-2 animate-pulse"></span>
            Tiền mặt & Chuyển khoản
          </div>
        </div>
        <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-100 transition-all hover:shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Công nợ tồn đọng</p>
          <p className="text-3xl font-black">{formatCurrency(pendingRevenue)}</p>
          <div className="mt-4 flex items-center text-[10px] font-bold bg-white/20 w-fit px-2 py-1 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300 mr-2"></span>
            Đợi quyết toán
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {projects.map((project) => {
          const client = clients.find(c => c.id === project.clientId);
          const isExpanded = expandedProjects[project.id];
          const projectCollected = project.payments.filter(pay => pay.status === 'Đã thu').reduce((sum, pay) => sum + pay.amount, 0);
          const projectTotal = project.totalValue;
          const projectProgress = Math.round((projectCollected / projectTotal) * 100) || 0;

          return (
            <div key={project.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
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
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Khách hàng: <span className="text-slate-700">{client?.name}</span></p>
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
                        {project.payments.map((pay) => (
                          <tr key={pay.id} className="hover:bg-indigo-50/10 transition-colors group">
                            <td className="px-6 py-4 font-semibold text-slate-700">
                              {pay.name}
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
                                  <span className="font-bold text-slate-800 group-hover/amount:text-indigo-600 transition-colors">
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
                                className="bg-transparent border-none p-0 text-slate-600 font-medium text-xs focus:ring-0 cursor-pointer hover:text-indigo-600 transition-colors"
                              />
                            </td>
                            <td className="px-6 py-4 text-center">
                              <select
                                value={pay.status}
                                onChange={(e) => handleUpdatePayment(project.id, pay.id, { status: e.target.value as any })}
                                className={`text-[9px] font-black uppercase tracking-wider py-1.5 px-3 rounded-full border-none cursor-pointer outline-none bg-white transition-all shadow-sm ring-1 ${
                                  pay.status === 'Đã thu' ? 'ring-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100' : 
                                  pay.status === 'Quá hạn' ? 'ring-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100' : 
                                  'ring-slate-200 text-slate-500 bg-slate-50 hover:bg-slate-100'
                                }`}
                              >
                                <option value="Chưa thu">Chưa thu</option>
                                <option value="Đã thu">Đã thu</option>
                                <option value="Quá hạn">Quá hạn</option>
                              </select>
                            </td>
                          </tr>
                        ))}
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
        
        {projects.length === 0 && (
          <div className="bg-white p-16 text-center rounded-2xl border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <p className="text-slate-400 font-medium italic">Chưa có dự án nào để hiển thị tài chính.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceManager;
