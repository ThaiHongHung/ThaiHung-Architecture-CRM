
import React, { useState, useRef, useEffect } from 'react';
import { Project, Client, ProjectStageStatus, ContractType, ProjectType, PaymentMilestone, ProjectFile } from '../types';
import { PROJECT_STAGES, Icons } from '../constants';
import { formatCurrency, formatDate, generateId } from '../utils';

interface ProjectManagerProps {
  projects: Project[];
  clients: Client[];
  onUpdateProject: (project: Project) => void;
  onAddProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string) => void;
  preSelectedClientId?: string | null;
  clearPreSelectedClient?: () => void;
  onViewClient?: () => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ 
  projects, 
  clients, 
  onUpdateProject, 
  onAddProject,
  selectedProjectId,
  setSelectedProjectId,
  preSelectedClientId,
  clearPreSelectedClient,
  onViewClient
}) => {
  const [activeTab, setActiveTab] = useState<ProjectType | 'Tất cả'>('Tất cả');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeStageIdForUpload, setActiveStageIdForUpload] = useState<string | null>(null);
  
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [isEditingSigningDate, setIsEditingSigningDate] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  
  const [tempValue, setTempValue] = useState(0);
  const [tempLead, setTempLead] = useState('');
  const [tempSigningDate, setTempSigningDate] = useState('');
  const [tempCode, setTempCode] = useState('');
  const [tempPaymentAmount, setTempPaymentAmount] = useState(0);

  const todayStr = new Date().toISOString().split('T')[0];

  const [newProjectData, setNewProjectData] = useState({
    clientId: '',
    contractCode: '',
    name: '',
    leadName: '',
    contractSigningDate: todayStr,
    contractType: 'Thiết kế' as ContractType,
    projectType: 'Thấp tầng' as ProjectType,
    totalValue: 0,
  });

  useEffect(() => {
    if (preSelectedClientId) {
      setNewProjectData(prev => ({ ...prev, clientId: preSelectedClientId }));
      setShowNewProjectModal(true);
    }
  }, [preSelectedClientId]);

  const filteredProjects = activeTab === 'Tất cả' 
    ? projects 
    : projects.filter(p => p.projectType === activeTab);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const clientOfSelected = clients.find(c => c.id === selectedProject?.clientId);

  const totalPaymentsAllocated = selectedProject?.payments.reduce((sum, p) => sum + p.amount, 0) || 0;
  const balanceDifference = (selectedProject?.totalValue || 0) - totalPaymentsAllocated;
  const isBalanced = balanceDifference === 0;

  const balanceToLastPayment = (project: Project, newTotalValue?: number) => {
    if (project.payments.length === 0) return project;
    const targetTotal = newTotalValue !== undefined ? newTotalValue : project.totalValue;
    const paymentsExceptLast = project.payments.slice(0, -1);
    const sumExceptLast = paymentsExceptLast.reduce((sum, p) => sum + p.amount, 0);
    const lastPayment = project.payments[project.payments.length - 1];
    const newLastAmount = Math.max(0, targetTotal - sumExceptLast);
    const updatedPayments = [...paymentsExceptLast, { ...lastPayment, amount: newLastAmount }];
    return { ...project, totalValue: targetTotal, payments: updatedPayments };
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectData.clientId) return alert("Vui lòng chọn khách hàng");
    const initialStages = PROJECT_STAGES.map((name, i) => ({
      id: generateId(),
      name,
      status: i === 0 ? 'Đang làm' as ProjectStageStatus : 'Chưa làm' as ProjectStageStatus,
      deadline: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }));
    const p1 = Math.round(newProjectData.totalValue * 0.3);
    const p2 = newProjectData.totalValue - p1;
    onAddProject({
      ...newProjectData,
      stages: initialStages,
      payments: [
        { id: generateId(), name: 'Tạm ứng đợt 1 (Ký HĐ)', amount: p1, dueDate: newProjectData.contractSigningDate, status: 'Chưa thu' },
        { id: generateId(), name: 'Quyết toán & Bàn giao', amount: p2, dueDate: todayStr, status: 'Chưa thu' }
      ],
      files: []
    });
    setShowNewProjectModal(false);
    if (clearPreSelectedClient) clearPreSelectedClient();
  };

  const updateStageStatus = (stageId: string, newStatus: ProjectStageStatus) => {
    if (!selectedProject) return;
    const updatedStages = selectedProject.stages.map(s => 
      s.id === stageId ? { ...s, status: newStatus } : s
    );
    onUpdateProject({ ...selectedProject, stages: updatedStages });
  };

  const updateStageDeadline = (stageId: string, newDeadline: string) => {
    if (!selectedProject) return;
    const updatedStages = selectedProject.stages.map(s => 
      s.id === stageId ? { ...s, deadline: newDeadline } : s
    );
    onUpdateProject({ ...selectedProject, stages: updatedStages });
  };

  const handleFileUpload = (stageId: string) => {
    setActiveStageIdForUpload(stageId);
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedProject && activeStageIdForUpload) {
      const stage = selectedProject.stages.find(s => s.id === activeStageIdForUpload);
      const simulatedPath = `P:\\PROJECTS\\2024\\${selectedProject.name.replace(/\s+/g, '_')}\\${stage?.name.replace(/\s+/g, '_')}\\${file.name}`;
      const newFile: ProjectFile = {
        id: generateId(),
        name: file.name,
        type: file.type.split('/')[1] || 'doc',
        url: simulatedPath,
        uploadedAt: new Date().toISOString(),
        stageId: activeStageIdForUpload
      };
      const updatedStages = selectedProject.stages.map(s => 
        s.id === activeStageIdForUpload ? { ...s, status: 'Hoàn thành' as ProjectStageStatus } : s
      );
      onUpdateProject({ ...selectedProject, files: [...selectedProject.files, newFile], stages: updatedStages });
      setActiveStageIdForUpload(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveTotalValue = () => {
    if (!selectedProject) return;
    const updatedProject = balanceToLastPayment(selectedProject, tempValue);
    onUpdateProject(updatedProject);
    setIsEditingValue(false);
  };

  const handleSaveLead = () => {
    if (!selectedProject) return;
    onUpdateProject({ ...selectedProject, leadName: tempLead });
    setIsEditingLead(false);
  };

  const handleSaveSigningDate = () => {
    if (!selectedProject) return;
    onUpdateProject({ ...selectedProject, contractSigningDate: tempSigningDate });
    setIsEditingSigningDate(false);
  };

  const handleSaveCode = () => {
    if (!selectedProject) return;
    onUpdateProject({ ...selectedProject, contractCode: tempCode });
    setIsEditingCode(false);
  };

  const handleUpdatePayment = (paymentId: string, updates: Partial<PaymentMilestone>) => {
    if (!selectedProject) return;
    const updatedPayments = selectedProject.payments.map(p => 
      p.id === paymentId ? { ...p, ...updates } : p
    );
    onUpdateProject({ ...selectedProject, payments: updatedPayments });
    if (updates.amount !== undefined) setEditingPaymentId(null);
  };

  const handleAddPayment = () => {
    if (!selectedProject) return;
    const newPayment: PaymentMilestone = {
      id: generateId(),
      name: `Đợt thanh toán ${selectedProject.payments.length}`,
      amount: 0,
      dueDate: todayStr,
      status: 'Chưa thu'
    };
    
    // Đưa "Quyết toán & Bàn giao" xuống cuối: chèn mới vào trước phần tử cuối cùng
    const updatedPayments = [...selectedProject.payments];
    if (updatedPayments.length > 0) {
      updatedPayments.splice(updatedPayments.length - 1, 0, newPayment);
    } else {
      updatedPayments.push(newPayment);
    }
    
    onUpdateProject({ ...selectedProject, payments: updatedPayments });
  };

  const handleForceBalance = () => {
    if (!selectedProject) return;
    onUpdateProject(balanceToLastPayment(selectedProject));
  };

  const formatInputNumber = (value: string) => {
    const raw = value.replace(/\./g, '').replace(/[^0-9]/g, '');
    return raw === '' ? 0 : parseInt(raw, 10);
  };

  const displayFormatted = (val: number) => {
    return val === 0 ? "" : val.toLocaleString('vi-VN');
  };

  const inputBaseClass = "w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400";

  return (
    <div className="space-y-6">
      <input type="file" ref={fileInputRef} className="hidden" onChange={onFileChange} />
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dự án & Hồ sơ</h2>
          <div className="flex space-x-4 mt-2">
            {(['Tất cả', 'Cao tầng', 'Thấp tầng', 'Nội thất'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm font-medium pb-1 border-b-2 transition-all ${
                  activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <button 
          onClick={() => {
            setNewProjectData({ clientId: '', contractCode: '', name: '', leadName: '', contractSigningDate: todayStr, contractType: 'Thiết kế', projectType: 'Thấp tầng', totalValue: 0 });
            setShowNewProjectModal(true);
          }}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all"
        >
          <Icons.Plus />
          <span>Tạo dự án mới</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-72 space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
          {filteredProjects.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300">
              <p className="text-xs text-slate-400">Không có dự án phù hợp</p>
            </div>
          ) : filteredProjects.map(project => {
            const hasOverdue = project.stages.some(s => s.status !== 'Hoàn thành' && s.deadline && s.deadline < todayStr);
            return (
              <button
                key={project.id}
                onClick={() => {
                  setSelectedProjectId(project.id);
                  setIsEditingValue(false);
                  setIsEditingLead(false);
                  setIsEditingSigningDate(false);
                  setIsEditingCode(false);
                  setEditingPaymentId(null);
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all relative ${
                  selectedProjectId === project.id 
                    ? 'bg-white border-indigo-50 shadow-md ring-1 ring-indigo-500' 
                    : 'bg-white border-slate-200 hover:border-indigo-300'
                }`}
              >
                {hasOverdue && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-sm shadow-rose-200"></span>}
                <div className="flex justify-between items-start mb-1">
                  <p className="font-bold text-slate-800 line-clamp-1 flex-1">
                    <span className="text-[10px] font-black block text-indigo-600 mb-1">{project.contractCode}</span>
                    {project.name}
                  </p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ml-2 whitespace-nowrap ${
                    project.projectType === 'Cao tầng' ? 'bg-purple-100 text-purple-700' :
                    project.projectType === 'Thấp tầng' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {project.projectType}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium truncate">{clients.find(c => c.id === project.clientId)?.name}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">{project.contractType}</span>
                  <span className="text-xs font-semibold text-indigo-600">{formatCurrency(project.totalValue)}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex-1 space-y-6">
          {selectedProject ? (
            <>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center space-x-2 mb-1">
                      {isEditingCode ? (
                        <input 
                          type="text"
                          className="text-[10px] font-black bg-white text-indigo-700 px-2 py-0.5 rounded outline-none border border-indigo-200 uppercase"
                          value={tempCode}
                          onChange={(e) => setTempCode(e.target.value)}
                          autoFocus
                          onBlur={handleSaveCode}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveCode()}
                        />
                      ) : (
                        <span 
                          onClick={() => { setTempCode(selectedProject.contractCode); setIsEditingCode(true); }}
                          className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded uppercase tracking-wider cursor-pointer hover:bg-indigo-700 transition-colors"
                        >
                          {selectedProject.contractCode || 'NHẬP MÃ HĐ'}
                        </span>
                      )}
                      
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                        selectedProject.projectType === 'Cao tầng' ? 'bg-purple-100 text-purple-700' :
                        selectedProject.projectType === 'Thấp tầng' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {selectedProject.projectType}
                      </span>
                      <div className="flex items-center group cursor-pointer ml-2" onClick={() => { setTempSigningDate(selectedProject.contractSigningDate || todayStr); setIsEditingSigningDate(true); }}>
                        <svg className="w-3 h-3 text-emerald-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {isEditingSigningDate ? (
                          <input 
                            type="date"
                            className="text-[10px] font-bold text-emerald-600 border-b border-emerald-500 outline-none bg-white"
                            value={tempSigningDate}
                            onChange={(e) => setTempSigningDate(e.target.value)}
                            autoFocus
                            onBlur={handleSaveSigningDate}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveSigningDate()}
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 uppercase">Ký HĐ: {formatDate(selectedProject.contractSigningDate)}</span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">{selectedProject.name}</h3>
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-slate-500">
                      <div className="flex items-center group cursor-pointer" onClick={() => onViewClient && onViewClient()}>
                        <span className="text-sm font-medium">Khách hàng: <span className="text-indigo-600 font-bold hover:underline">{clientOfSelected?.name}</span></span>
                      </div>
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full hidden sm:block"></span>
                      <span className="text-sm font-medium">Loại HĐ: <span className="text-slate-700 font-bold">{selectedProject.contractType}</span></span>
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full hidden sm:block"></span>
                      <div className="flex items-center group cursor-pointer" onClick={() => { setTempLead(selectedProject.leadName); setIsEditingLead(true); }}>
                        <span className="text-sm font-medium">Chủ trì: </span>
                        {isEditingLead ? (
                          <div className="flex items-center ml-1">
                            <input 
                              className="text-sm font-bold text-indigo-600 border-b border-indigo-500 outline-none bg-white px-1"
                              value={tempLead}
                              onChange={(e) => setTempLead(e.target.value)}
                              autoFocus
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveLead()}
                              onBlur={handleSaveLead}
                            />
                          </div>
                        ) : (
                          <span className="text-slate-700 font-bold ml-1 flex items-center hover:text-indigo-600 transition-colors">
                            {selectedProject.leadName || 'Chưa phân công'}
                            <svg className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right group shrink-0">
                    {isEditingValue ? (
                      <div className="flex flex-col items-end">
                        <input 
                          type="text" 
                          className="text-right text-xl font-black text-indigo-600 border-b-2 border-indigo-500 outline-none w-48 bg-white py-1"
                          value={displayFormatted(tempValue)}
                          onChange={(e) => setTempValue(formatInputNumber(e.target.value))}
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveTotalValue()}
                        />
                        <p className="text-[10px] text-slate-400 mt-1">* Tự động cân đối vào đợt cuối</p>
                        <div className="flex space-x-2 mt-2">
                          <button onClick={handleSaveTotalValue} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase">Lưu & Cân đối</button>
                          <button onClick={() => setIsEditingValue(false)} className="text-[10px] font-bold text-slate-400 hover:text-slate-50 uppercase">Hủy</button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="cursor-pointer transition-all hover:bg-slate-50 p-2 -m-2 rounded-lg"
                        onClick={() => {
                          setTempValue(selectedProject.totalValue);
                          setIsEditingValue(true);
                        }}
                      >
                        <p className="text-2xl font-black text-indigo-600 flex items-center justify-end">
                          {formatCurrency(selectedProject.totalValue)}
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </p>
                        <p className="text-xs text-slate-400 font-medium">Giá trị hợp đồng</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Tiến độ giai đoạn</h4>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                      Đồng bộ Server: Hoạt động
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedProject.stages.map(stage => {
                      const isOverdue = stage.status !== 'Hoàn thành' && stage.deadline && stage.deadline < todayStr;
                      const hasFile = selectedProject.files.some(f => f.stageId === stage.id);
                      return (
                        <div key={stage.id} className={`p-4 rounded-xl border hover:bg-white hover:shadow-md transition-all border-l-4 ${isOverdue ? 'border-rose-200 bg-rose-50/30 border-l-rose-500' : 'border-slate-100 bg-slate-50/50 border-l-slate-200'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <p className={`font-semibold text-sm ${isOverdue ? 'text-rose-900' : 'text-slate-800'}`}>{stage.name}</p>
                            <select 
                              value={stage.status}
                              onChange={(e) => updateStageStatus(stage.id, e.target.value as ProjectStageStatus)}
                              className={`text-[10px] font-bold py-1 px-2 rounded outline-none border-none cursor-pointer bg-white transition-colors ${
                                stage.status === 'Hoàn thành' ? 'bg-emerald-100 text-emerald-700' :
                                stage.status === 'Đang làm' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              <option>Chưa làm</option>
                              <option>Đang làm</option>
                              <option>Hoàn thành</option>
                            </select>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <svg className={`w-3.5 h-3.5 transition-colors ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                              <input 
                                type="date"
                                value={stage.deadline || ''}
                                onChange={(e) => updateStageDeadline(stage.id, e.target.value)}
                                className={`text-xs font-bold bg-transparent border-none p-0 focus:ring-0 cursor-pointer transition-colors ${isOverdue ? 'text-rose-700' : 'text-slate-600 hover:text-indigo-600'}`}
                              />
                            </div>

                            <button 
                              onClick={() => handleFileUpload(stage.id)}
                              className={`w-full flex items-center justify-center space-x-1.5 py-1.5 rounded-lg border-2 border-dashed transition-all text-[10px] font-bold uppercase tracking-tight ${
                                hasFile 
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                                  : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500'
                              }`}
                            >
                              {hasFile ? (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  <span>Đã lưu vào máy chủ</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                  <span>Tải lên hồ sơ xác nhận</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-slate-800 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Kho lưu trữ dự án (Máy chủ Lead)
                    </h4>
                  </div>
                  <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2">
                    {selectedProject.stages.map(stage => {
                      const stageFiles = selectedProject.files.filter(f => f.stageId === stage.id);
                      if (stageFiles.length === 0) return null;
                      return (
                        <div key={stage.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stage.name}</p>
                            <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">SYNCED</span>
                          </div>
                          {stageFiles.map(file => (
                            <div key={file.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 group">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-rose-100 rounded text-rose-600 font-bold text-[10px] uppercase">{file.type}</div>
                                  <div>
                                    <p className="text-xs font-semibold text-slate-800 truncate max-w-[150px]">{file.name}</p>
                                    <p className="text-[10px] text-slate-400">{formatDate(file.uploadedAt)}</p>
                                  </div>
                                </div>
                                <a href="#" className="text-indigo-600 hover:underline text-xs font-bold uppercase" onClick={(e) => e.preventDefault()}>Mở File</a>
                              </div>
                              <div className="bg-slate-200/50 p-1.5 rounded flex items-center space-x-1.5 overflow-hidden">
                                <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                <p className="text-[9px] font-medium text-slate-500 truncate italic select-all" title={file.url}>{file.url}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                    {selectedProject.files.filter(f => !f.stageId).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Hồ sơ chung</p>
                        {selectedProject.files.filter(f => !f.stageId).map(file => (
                          <div key={file.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-indigo-100 rounded text-indigo-600 font-bold text-[10px] uppercase">{file.type}</div>
                              <div>
                                <p className="text-xs font-semibold text-slate-800 truncate max-w-[150px]">{file.name}</p>
                                <p className="text-[10px] text-slate-400">{formatDate(file.uploadedAt)}</p>
                              </div>
                            </div>
                            <a href="#" className="text-indigo-600 hover:underline text-xs font-bold uppercase" onClick={(e) => e.preventDefault()}>Mở File</a>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedProject.files.length === 0 && <p className="text-slate-400 italic text-xs text-center py-6">Chưa có hồ sơ được đồng bộ.</p>}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-slate-800 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      Thanh toán
                    </h4>
                    <button 
                      onClick={handleAddPayment}
                      className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition-colors uppercase"
                    >
                      + Thêm đợt
                    </button>
                  </div>

                  <div className={`mb-4 p-3 rounded-xl border ${isBalanced ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Trạng thái cân đối</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isBalanced ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white animate-pulse'}`}>
                        {isBalanced ? 'ĐÃ CÂN ĐỐI' : 'CHƯA CÂN ĐỐI'}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="text-xs">
                        <p className="text-slate-500">Phân bổ: <span className="font-bold text-slate-800">{formatCurrency(totalPaymentsAllocated)}</span></p>
                        <p className="text-slate-500">Hợp đồng: <span className="font-bold text-slate-800">{formatCurrency(selectedProject.totalValue)}</span></p>
                      </div>
                      {!isBalanced && (
                        <div className="text-right">
                          <p className={`text-xs font-black mb-1 ${balanceDifference > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {balanceDifference > 0 ? `Thiếu: ${formatCurrency(balanceDifference)}` : `Dư: ${formatCurrency(Math.abs(balanceDifference))}`}
                          </p>
                          <button 
                            onClick={handleForceBalance}
                            className="text-[9px] font-black bg-slate-800 text-white px-2 py-1 rounded hover:bg-slate-700 transition-all uppercase"
                          >
                            Cân đối vào đợt cuối
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedProject.payments.map((pay, index) => {
                      const isLast = index === selectedProject.payments.length - 1;
                      return (
                        <div key={pay.id} className={`flex items-center justify-between p-3 rounded-lg bg-slate-50 border group ${isLast ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-100'}`}>
                          <div className="overflow-hidden flex-1">
                            <div className="flex items-center">
                              <p className="text-xs font-semibold text-slate-800 truncate">{pay.name}</p>
                              {isLast && <span className="ml-2 text-[8px] font-bold bg-indigo-600 text-white px-1 rounded uppercase tracking-tighter">Quyết toán</span>}
                            </div>
                            <input 
                              type="date"
                              value={pay.dueDate}
                              onChange={(e) => handleUpdatePayment(pay.id, { dueDate: e.target.value })}
                              className="bg-transparent border-none p-0 text-[10px] text-slate-500 focus:ring-0 cursor-pointer hover:text-indigo-600"
                            />
                          </div>
                          <div className="text-right shrink-0 ml-4 flex flex-col items-end">
                            {editingPaymentId === pay.id ? (
                              <input 
                                type="text"
                                autoFocus
                                className="w-24 text-right text-xs font-bold text-indigo-600 border-b border-indigo-500 outline-none bg-white mb-1"
                                value={displayFormatted(tempPaymentAmount)}
                                onChange={(e) => setTempPaymentAmount(formatInputNumber(e.target.value))}
                                onKeyDown={(e) => e.key === 'Enter' && handleUpdatePayment(pay.id, { amount: tempPaymentAmount })}
                                onBlur={() => handleUpdatePayment(pay.id, { amount: tempPaymentAmount })}
                              />
                            ) : (
                              <div className="cursor-pointer group/amt mb-1" onClick={() => { setEditingPaymentId(pay.id); setTempPaymentAmount(pay.amount); }}>
                                <p className="text-xs font-bold text-slate-800 flex items-center justify-end hover:text-indigo-600">
                                  {formatCurrency(pay.amount)}
                                  <svg className="w-3 h-3 ml-1 opacity-0 group-hover/amt:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </p>
                              </div>
                            )}
                            <div className="flex items-center space-x-2">
                               <select
                                value={pay.status}
                                onChange={(e) => handleUpdatePayment(pay.id, { status: e.target.value as any })}
                                className={`text-[9px] font-black px-2 py-0.5 rounded border-none outline-none cursor-pointer bg-white ${
                                  pay.status === 'Đã thu' ? 'bg-emerald-100 text-emerald-700' : 
                                  pay.status === 'Quá hạn' ? 'bg-rose-100 text-rose-700' : 
                                  'bg-slate-200 text-slate-500'
                                }`}
                              >
                                <option value="Chưa thu">Chưa thu</option>
                                <option value="Đã thu">Đã thu</option>
                                <option value="Quá hạn">Quá hạn</option>
                              </select>
                              {!isLast && (
                                <button 
                                  onClick={() => {
                                    const newPayments = selectedProject.payments.filter(p => p.id !== pay.id);
                                    onUpdateProject({ ...selectedProject, payments: newPayments });
                                  }}
                                  className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" /></svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {selectedProject.payments.length === 0 && <p className="text-slate-400 italic text-xs text-center py-6">Chưa có thanh toán nào.</p>}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
              <p>Chọn một dự án để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>

      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">Khởi tạo dự án mới</h3>
              <button onClick={() => { setShowNewProjectModal(false); if(clearPreSelectedClient) clearPreSelectedClient(); }} className="text-slate-400 hover:text-slate-600 transition-colors"><Icons.Plus className="rotate-45" /></button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Chọn khách hàng *</label>
                  <select 
                    required 
                    value={newProjectData.clientId} 
                    onChange={e => setNewProjectData({...newProjectData, clientId: e.target.value})}
                    className={inputBaseClass}
                  >
                    <option value="">-- Chọn khách hàng --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mã hợp đồng *</label>
                  <input required type="text" value={newProjectData.contractCode} onChange={e => setNewProjectData({...newProjectData, contractCode: e.target.value.toUpperCase()})} className={`${inputBaseClass} font-black text-indigo-700 placeholder:font-normal`} placeholder="VÍ DỤ: HĐ2024/01" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên dự án *</label>
                  <input required type="text" value={newProjectData.name} onChange={e => setNewProjectData({...newProjectData, name: e.target.value})} className={inputBaseClass} placeholder="Ví dụ: Biệt thự nghỉ dưỡng Đà Lạt" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Người chủ trì *</label>
                  <input required type="text" value={newProjectData.leadName} onChange={e => setNewProjectData({...newProjectData, leadName: e.target.value})} className={inputBaseClass} placeholder="Tên KTS chủ trì" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ngày ký Hợp đồng *</label>
                  <input required type="date" value={newProjectData.contractSigningDate} onChange={e => setNewProjectData({...newProjectData, contractSigningDate: e.target.value})} className={inputBaseClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Loại dự án</label>
                  <select value={newProjectData.projectType} onChange={e => setNewProjectData({...newProjectData, projectType: e.target.value as ProjectType})} className={inputBaseClass}>
                    <option value="Cao tầng">Dự án cao tầng</option>
                    <option value="Thấp tầng">Dự án thấp tầng</option>
                    <option value="Nội thất">Hạng mục nội thất</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Hợp đồng</label>
                  <select value={newProjectData.contractType} onChange={e => setNewProjectData({...newProjectData, contractType: e.target.value as ContractType})} className={inputBaseClass}>
                    <option>Thiết kế</option>
                    <option>Thi công</option>
                    <option>Trọn gói</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Giá trị Hợp đồng (VND)</label>
                <input 
                  type="text" 
                  value={displayFormatted(newProjectData.totalValue)} 
                  onChange={e => setNewProjectData({...newProjectData, totalValue: formatInputNumber(e.target.value)})} 
                  className={`${inputBaseClass} font-bold text-indigo-600`} 
                />
              </div>
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => { setShowNewProjectModal(false); if(clearPreSelectedClient) clearPreSelectedClient(); }} className="flex-1 py-3 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors">Hủy</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-95">Tạo dự án</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
