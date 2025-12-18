
import React from 'react';
import { Client, Project } from '../types';
import { formatCurrency, formatDate } from '../utils';

interface DashboardProps {
  clients: Client[];
  projects: Project[];
  onViewProject?: (projectId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ clients, projects, onViewProject }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  const activeProjects = projects.filter(p => p.stages[p.stages.length - 1].status !== 'Hoàn thành');
  
  const overdueStages = projects.flatMap(p => 
    p.stages
      .filter(s => s.status !== 'Hoàn thành' && s.deadline && s.deadline < todayStr)
      .map(s => ({ ...s, projectName: p.name, projectId: p.id, contractCode: p.contractCode }))
  );

  const lateProjectsCount = projects.filter(p => 
    p.stages.some(s => s.status !== 'Hoàn thành' && s.deadline && s.deadline < todayStr)
  ).length;

  const totalCollected = projects.reduce((acc, p) => 
    acc + p.payments.filter(pay => pay.status === 'Đã thu').reduce((sum, pay) => sum + pay.amount, 0), 0
  );

  const totalPending = projects.reduce((acc, p) => 
    acc + p.payments.filter(pay => pay.status !== 'Đã thu').reduce((sum, pay) => sum + pay.amount, 0), 0
  );

  // Thống kê chủ trì
  const leadWorkload = activeProjects.reduce((acc, p) => {
    const lead = p.leadName || 'Chưa phân công';
    acc[lead] = (acc[lead] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedLeads = Object.entries(leadWorkload).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Chào mừng trở lại, KTS. Kiên</h2>
          <p className="text-slate-500 mt-1 text-sm">Hệ thống quản lý tiến độ và tài chính ThaiHung Architecture.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest shadow-sm">
          Hôm nay: {formatDate(todayStr)}
        </div>
      </div>

      {overdueStages.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 shadow-sm animate-pulse-slow">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-rose-500 p-2 rounded-lg text-white shadow-md">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-rose-800 uppercase tracking-tight">Cảnh báo: Có {overdueStages.length} hạng mục trễ hạn</h3>
              <p className="text-rose-600 text-xs font-medium">Lãnh đạo cần kiểm tra và đôn đốc các dự án bên dưới.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overdueStages.slice(0, 6).map((stage, idx) => (
              <div 
                key={idx} 
                onClick={() => onViewProject && onViewProject(stage.projectId)}
                className="bg-white p-3 rounded-xl border border-rose-100 flex items-center justify-between group hover:border-rose-300 transition-all shadow-sm cursor-pointer"
              >
                <div className="overflow-hidden">
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <span className="text-[9px] font-black bg-rose-100 text-rose-600 px-1 py-0.5 rounded">{stage.contractCode}</span>
                    <p className="text-xs font-bold text-rose-700 truncate">{stage.projectName}</p>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">Hạng mục: <span className="text-slate-700">{stage.name}</span></p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-[10px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">Trễ: {formatDate(stage.deadline)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Dự án đang triển khai" value={activeProjects.length} color="indigo" />
        <StatCard title="Dự án trễ hạn" value={lateProjectsCount} color="amber" subText={lateProjectsCount > 0 ? "Cần xử lý ngay" : "Tiến độ ổn định"} />
        <StatCard title="Đã thu thực tế" value={formatCurrency(totalCollected)} color="emerald" />
        <StatCard title="Tổng nợ phải thu" value={formatCurrency(totalPending)} color="slate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột 1 & 2: Tiến độ thực hiện */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Tiến độ thực hiện ({activeProjects.length})
            </h3>
            <div className="space-y-6">
              {activeProjects.slice(0, 5).map(p => {
                const currentStage = p.stages.find(s => s.status === 'Đang làm') || p.stages[0];
                const completedCount = p.stages.filter(s => s.status === 'Hoàn thành').length;
                const progress = Math.round((completedCount / p.stages.length) * 100);
                
                return (
                  <div key={p.id} className="cursor-pointer group" onClick={() => onViewProject && onViewProject(p.id)}>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded group-hover:bg-indigo-600 group-hover:text-white transition-colors">{p.contractCode}</span>
                          <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{p.name}</p>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">Giai đoạn: {currentStage.name}</p>
                      </div>
                      <span className="text-xs font-bold text-indigo-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                      <div className="bg-indigo-600 h-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Thanh toán đến hạn
            </h3>
            <div className="space-y-4">
              {projects.flatMap(p => p.payments.map(pay => ({ ...pay, projectName: p.name, contractCode: p.contractCode, projectId: p.id })))
                .filter(pay => pay.status === 'Chưa thu')
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .slice(0, 5)
                .map((pay, idx) => {
                  const isLate = new Date(pay.dueDate) < new Date();
                  return (
                    <div 
                      key={idx} 
                      onClick={() => onViewProject && onViewProject(pay.projectId)}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:border-indigo-100 transition-all hover:bg-indigo-50/30 group cursor-pointer"
                    >
                      <div className="overflow-hidden">
                        <div className="flex items-center space-x-1.5 mb-0.5">
                           <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-1 rounded">{pay.contractCode}</span>
                           <p className="text-sm font-bold text-slate-800 truncate">{pay.projectName}</p>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">Đợt: {pay.name}</p>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="text-sm font-black text-slate-800">{formatCurrency(pay.amount)}</p>
                        <p className={`text-[10px] font-bold ${isLate ? 'text-rose-500' : 'text-slate-400'}`}>
                          {isLate ? 'Đã quá hạn' : `Hạn: ${formatDate(pay.dueDate)}`}
                        </p>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>

        {/* Cột 3: Thống kê nhân sự chủ trì */}
        <div className="space-y-8">
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Khối lượng Chủ trì
            </h3>
            <div className="space-y-4">
              {sortedLeads.length > 0 ? (
                sortedLeads.map(([lead, count]) => (
                  <div key={lead} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 transition-all hover:border-indigo-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        {lead.split(' ').pop()?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{lead}</p>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">KTS. Chủ trì</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 justify-end">
                        <span className="text-lg font-black text-indigo-600">{count}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Dự án</span>
                      </div>
                      <div className="w-16 bg-slate-200 h-1 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full rounded-full" 
                          style={{ width: `${Math.min(count * 20, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                   <p className="text-sm text-slate-400 italic">Chưa có dữ liệu phân công dự án.</p>
                </div>
              )}
            </div>
            
            <div className="mt-8 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <p className="text-xs font-semibold text-indigo-800 mb-1 flex items-center">
                <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Ghi chú điều hành
              </p>
              <p className="text-[10px] text-indigo-600 leading-relaxed font-medium">
                Dữ liệu dựa trên các dự án đang ở trạng thái 'Đang triển khai'. Chủ trì có trên 5 dự án nên được xem xét hỗ trợ thêm nhân lực.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color, subText }: { title: string, value: string | number, color: string, subText?: string }) => {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-600 shadow-indigo-100',
    amber: 'bg-amber-500 shadow-amber-100',
    emerald: 'bg-emerald-600 shadow-emerald-100',
    slate: 'bg-slate-700 shadow-slate-100'
  };

  return (
    <div className={`p-6 rounded-2xl text-white shadow-xl transition-transform hover:-translate-y-1 ${colors[color]}`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">{title}</p>
      <p className="text-3xl font-black truncate">{value}</p>
      {subText && (
        <div className="mt-3 flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80 animate-pulse"></span>
          <p className="text-[10px] font-bold text-white opacity-90 truncate">{subText}</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
