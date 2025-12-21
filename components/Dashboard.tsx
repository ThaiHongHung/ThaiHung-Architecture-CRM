
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
  
  // Lọc các hạng mục trễ hạn nộp hồ sơ (Nội bộ)
  const overdueStages = projects.flatMap(p => 
    p.stages
      .filter(s => s.status !== 'Hoàn thành' && s.deadline && s.deadline < todayStr)
      .map(s => ({ ...s, projectName: p.name, projectId: p.id, contractCode: p.contractCode }))
  );

  const totalCollected = projects.reduce((acc, p) => 
    acc + p.payments.filter(pay => pay.status === 'Đã thu').reduce((sum, pay) => sum + pay.amount, 0), 0
  );

  const totalPending = projects.reduce((acc, p) => 
    acc + p.payments.filter(pay => pay.status !== 'Đã thu').reduce((sum, pay) => sum + pay.amount, 0), 0
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Chào mừng trở lại, KTS. Kiên</h2>
          <p className="text-slate-500 mt-1 text-sm">ThaiHung Architecture - Quản lý tiến độ cam kết Hợp đồng.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest shadow-sm">
          Hôm nay: {formatDate(todayStr)}
        </div>
      </div>

      {/* CẢNH BÁO TRỄ HẠN NỘP HỒ SƠ NỘI BỘ */}
      {overdueStages.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-rose-600 p-2 rounded-lg text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-rose-800 uppercase tracking-tight">Trễ hạn hồ sơ kỹ thuật ({overdueStages.length})</h3>
              <p className="text-rose-600 text-xs font-medium">Hồ sơ trễ hạn nội bộ so với kế hoạch triển khai.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overdueStages.slice(0, 6).map((stage, idx) => (
              <div 
                key={idx} 
                onClick={() => onViewProject && onViewProject(stage.projectId)}
                className="bg-white p-3 rounded-xl border border-rose-100 flex items-center justify-between group hover:border-rose-300 transition-all cursor-pointer shadow-sm"
              >
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-800 truncate">{stage.projectName}</p>
                  <p className="text-[10px] text-slate-500">Hạng mục: {stage.name}</p>
                </div>
                <div className="text-right ml-3">
                  <p className="text-[10px] font-black text-rose-600">Hạn: {formatDate(stage.deadline)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* THỐNG KÊ NHANH */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Đang triển khai" value={activeProjects.length} color="indigo" />
        <StatCard 
          title="Trễ hạn nội bộ" 
          value={overdueStages.length} 
          color={overdueStages.length > 0 ? "rose" : "emerald"} 
          subText={overdueStages.length > 0 ? "Cần đôn đốc nội bộ" : "Tiến độ nộp hồ sơ tốt"} 
        />
        <StatCard title="Đã thu thực tế" value={formatCurrency(totalCollected)} color="emerald" />
        <StatCard title="Tổng nợ phải thu" value={formatCurrency(totalPending)} color="slate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* TIẾN ĐỘ NỘP HỒ SƠ DỰ ÁN */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Tiến độ nộp hồ sơ & Cam kết Hợp đồng
            </h3>
            <div className="space-y-8">
              {activeProjects.slice(0, 5).map(p => {
                const currentStage = p.stages.find(s => s.status === 'Đang làm') || p.stages[0];
                const completedCount = p.stages.filter(s => s.status === 'Hoàn thành').length;
                const progress = Math.round((completedCount / p.stages.length) * 100);
                const isContractOverdue = p.contractDeadline && p.contractDeadline < todayStr;
                
                return (
                  <div key={p.id} className="cursor-pointer group" onClick={() => onViewProject && onViewProject(p.id)}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-tighter">{p.contractCode}</span>
                          <p className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">{p.name}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                          <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 uppercase">
                             <span>Đang làm:</span>
                             <span className="text-slate-700">{currentStage.name}</span>
                          </div>
                          
                          {currentStage.deadline && (
                            <div className="flex items-center space-x-1 text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-lg">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                              <span>Hạn nộp: {formatDate(currentStage.deadline)}</span>
                            </div>
                          )}

                          {p.contractDeadline && (
                            <div className={`flex items-center space-x-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${isContractOverdue ? 'text-rose-700 bg-rose-50 border-rose-200 animate-pulse' : 'text-emerald-600 bg-emerald-50 border-emerald-100'}`}>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              <span>Hạn HĐ: {formatDate(p.contractDeadline)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <span className="text-xs font-black text-indigo-600">{progress}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
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
              Các đợt thanh toán đến hạn
            </h3>
            <div className="space-y-4">
              {projects.flatMap(p => p.payments.map(pay => ({ ...pay, projectName: p.name, contractCode: p.contractCode, projectId: p.id })))
                .filter(pay => pay.status !== 'Đã thu')
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .slice(0, 5)
                .map((pay, idx) => {
                  const isLate = new Date(pay.dueDate) < new Date();
                  return (
                    <div 
                      key={idx} 
                      onClick={() => onViewProject && onViewProject(pay.projectId)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all group cursor-pointer ${isLate ? 'bg-rose-50 border-rose-200 hover:bg-rose-100/50' : 'bg-slate-50/30 border-slate-50 hover:bg-emerald-50/30'}`}
                    >
                      <div className="overflow-hidden">
                        <p className={`text-sm font-bold truncate ${isLate ? 'text-rose-900' : 'text-slate-800'}`}>{pay.projectName}</p>
                        <p className={`text-[11px] font-medium text-slate-500 truncate`}>{pay.name} - {pay.contractCode}</p>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className={`text-sm font-black ${isLate ? 'text-rose-800' : 'text-slate-800'}`}>{formatCurrency(pay.amount)}</p>
                        <div className={`mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${isLate ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200' : 'text-slate-400'}`}>
                          {isLate ? 'Quá hạn' : `Hạn: ${formatDate(pay.dueDate)}`}
                        </div>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Khối lượng Chủ trì
            </h3>
            <div className="space-y-4">
              {(Object.entries(activeProjects.reduce((acc, p) => {
                  const lead = p.leadName || 'Chưa phân';
                  acc[lead] = (acc[lead] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)) as [string, number][])
                .sort((a, b) => b[1] - a[1])
                .map(([lead, count]) => (
                  <div key={lead} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                        {lead.charAt(0)}
                      </div>
                      <p className="text-sm font-bold text-slate-800">{lead}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-lg font-black text-indigo-600">{count}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Dự án</span>
                    </div>
                  </div>
                ))
              }
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
    rose: 'bg-rose-600 shadow-rose-100',
    slate: 'bg-slate-700 shadow-slate-100'
  };

  return (
    <div className={`p-6 rounded-2xl text-white shadow-xl transition-transform hover:-translate-y-1 ${colors[color] || colors.slate}`}>
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
