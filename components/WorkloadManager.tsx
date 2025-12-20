
import React, { useState, useMemo } from 'react';
import { Project, ProjectStage } from '../types';
import { Icons } from '../constants';
import { formatDate } from '../utils';

interface WorkloadManagerProps {
  projects: Project[];
  onViewProject: (projectId: string) => void;
}

const WorkloadManager: React.FC<WorkloadManagerProps> = ({ projects, onViewProject }) => {
  const [selectedLead, setSelectedLead] = useState<string | null>(null);

  // Nhóm dữ liệu theo KTS chủ trì
  const workloadData = useMemo(() => {
    const data: Record<string, {
      activeProjects: Project[];
      completedProjects: Project[];
      totalProjects: number;
      avgProgress: number;
      overdueCount: number;
    }> = {};

    projects.forEach(p => {
      const lead = p.leadName || 'Chưa phân công';
      if (!data[lead]) {
        data[lead] = { activeProjects: [], completedProjects: [], totalProjects: 0, avgProgress: 0, overdueCount: 0 };
      }

      const isCompleted = p.stages[p.stages.length - 1].status === 'Hoàn thành';
      const completedStages = p.stages.filter(s => s.status === 'Hoàn thành').length;
      const progress = Math.round((completedStages / p.stages.length) * 100);
      const isOverdue = p.stages.some(s => s.status !== 'Hoàn thành' && s.deadline && s.deadline < new Date().toISOString().split('T')[0]);

      if (isCompleted) {
        data[lead].completedProjects.push(p);
      } else {
        data[lead].activeProjects.push(p);
      }
      
      data[lead].totalProjects++;
      data[lead].avgProgress += progress;
      if (isOverdue) data[lead].overdueCount++;
    });

    Object.keys(data).forEach(lead => {
      data[lead].avgProgress = Math.round(data[lead].avgProgress / data[lead].totalProjects);
    });

    return data;
  }, [projects]);

  const leads = Object.keys(workloadData).sort((a, b) => workloadData[b].activeProjects.length - workloadData[a].activeProjects.length);
  
  if (!selectedLead && leads.length > 0) setSelectedLead(leads[0]);

  const currentLeadData = selectedLead ? workloadData[selectedLead] : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Quản lý Nhân sự thực hiện Dự án</h2>
        <p className="text-slate-500">Giám sát khối lượng dự án và chi tiết nhân sự theo bộ môn.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Danh sách KTS */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Kiến trúc sư chủ trì ({leads.length})</h3>
            <div className="space-y-2">
              {leads.map(lead => {
                const data = workloadData[lead];
                const activeCount = data.activeProjects.length;
                const isSelected = selectedLead === lead;
                return (
                  <div 
                    key={lead}
                    onClick={() => setSelectedLead(lead)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 hover:border-indigo-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isSelected ? 'bg-white/20' : 'bg-indigo-100 text-indigo-600'}`}>
                        {lead.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{lead}</p>
                        <p className={`text-[10px] uppercase font-black ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>
                          {activeCount} Dự án đang làm
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chi tiết tải trọng KTS */}
        <div className="lg:col-span-8 space-y-6">
          {selectedLead && currentLeadData ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">DANH SÁCH DỰ ÁN & NHÂN SỰ PHỐI HỢP</h4>
              <div className="space-y-4">
                {currentLeadData.activeProjects.map(p => {
                  const completedStages = p.stages.filter(s => s.status === 'Hoàn thành').length;
                  const progress = Math.round((completedStages / p.stages.length) * 100);
                  const currentStage = p.stages.find(s => s.status === 'Đang làm') || p.stages[0];

                  return (
                    <div key={p.id} onClick={() => onViewProject(p.id)} className="p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">{p.contractCode}</span>
                          <h5 className="font-bold text-slate-800 mt-1">{p.name}</h5>
                          <p className="text-[10px] text-slate-400">Giai đoạn hiện tại: <span className="text-indigo-600 font-bold uppercase">{currentStage.name}</span></p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-indigo-600">{progress}%</span>
                        </div>
                      </div>

                      {/* HIỂN THỊ NHÂN SỰ BỘ MÔN CỐ ĐỊNH CỦA DỰ ÁN */}
                      <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 border border-slate-100">
                        <PersonnelBox label="Kiến trúc" name={p.architect} active={!!p.architect} color="indigo" />
                        <PersonnelBox label="Kết cấu" name={p.structuralEngineer} active={!!p.structuralEngineer} color="slate" />
                        <PersonnelBox label="Cơ điện" name={p.meEngineer} active={!!p.meEngineer} color="slate" />
                        <PersonnelBox label="Nước" name={p.plumbingEngineer} active={!!p.plumbingEngineer} color="slate" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
              <Icons.Staff />
              <p className="mt-2 text-sm italic font-medium">Chọn một kiến trúc sư để xem chi tiết đội ngũ phối hợp.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PersonnelBox = ({ label, name, active, color }: { label: string, name?: string, active: boolean, color: 'indigo' | 'slate' }) => (
  <div className="overflow-hidden">
    <p className={`text-[8px] font-black uppercase tracking-wider mb-1 ${color === 'indigo' ? 'text-indigo-400' : 'text-slate-400'}`}>{label}</p>
    <p className={`text-[11px] font-bold truncate ${active ? 'text-slate-800' : 'text-slate-300 italic'}`}>
      {name || 'Chưa phân'}
    </p>
  </div>
);

const StatItem = ({ label, value, color }: { label: string, value: number, color: 'indigo' | 'emerald' | 'rose' }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };
  return (
    <div className={`p-4 rounded-xl border ${colors[color]} text-center`}>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</p>
    </div>
  );
};

export default WorkloadManager;
