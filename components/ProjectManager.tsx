
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Project, Client, ProjectStageStatus, ContractType, ProjectType, PaymentMilestone, ProjectFile, ProjectStage } from '../types';
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

type TabType = ProjectType | 'Tất cả' | 'Files';

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
  const [activeTab, setActiveTab] = useState<TabType>('Tất cả');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeStageIdForUpload, setActiveStageIdForUpload] = useState<string | null>(null);
  
  const [isEditingTotalValue, setIsEditingTotalValue] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editingPaymentNameId, setEditingPaymentNameId] = useState<string | null>(null);
  
  const [tempTotalValue, setTempTotalValue] = useState(0);
  const [tempPaymentAmount, setTempPaymentAmount] = useState(0);
  const [tempPaymentName, setTempPaymentName] = useState("");

  const todayStr = new Date().toISOString().split('T')[0];

  const [newProjectData, setNewProjectData] = useState({
    clientId: '',
    contractCode: '',
    name: '',
    leadName: '',
    architect: '',
    structuralEngineer: '',
    meEngineer: '',
    plumbingEngineer: '',
    contractSigningDate: todayStr,
    contractDeadline: '',
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

  const filteredProjects = activeTab === 'Files' || activeTab === 'Tất cả' 
    ? projects 
    : projects.filter(p => p.projectType === activeTab);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const clientOfSelected = clients.find(c => c.id === selectedProject?.clientId);

  const totalPaymentsAllocated = selectedProject?.payments.reduce((sum, p) => sum + p.amount, 0) || 0;
  const balanceDifference = (selectedProject?.totalValue || 0) - totalPaymentsAllocated;
  const isBalanced = Math.abs(balanceDifference) < 1;

  const formatVietnameseCurrency = (val: number) => {
    return (
      <span className="inline-flex items-baseline">
        {val.toLocaleString('vi-VN')} <span className="ml-1 underline decoration-1 underline-offset-2">đ</span>
      </span>
    );
  };

  const displayFormatted = (val: number) => {
    return val === 0 ? "" : val.toLocaleString('vi-VN');
  };

  const formatInputNumber = (value: string) => {
    const raw = value.replace(/\./g, '').replace(/[^0-9]/g, '');
    return raw === '' ? 0 : parseInt(raw, 10);
  };

  const handleUpdatePayment = (paymentId: string, updates: Partial<PaymentMilestone>) => {
    if (!selectedProject) return;
    const updatedPayments = selectedProject.payments.map(p => 
      p.id === paymentId ? { ...p, ...updates } : p
    );
    onUpdateProject({ ...selectedProject, payments: updatedPayments });
    setEditingPaymentId(null);
    setEditingPaymentNameId(null);
  };

  const handleSaveTotalValue = () => {
    if (!selectedProject) return;
    onUpdateProject({ ...selectedProject, totalValue: tempTotalValue });
    setIsEditingTotalValue(false);
  };

  const balanceToLastPayment = () => {
    if (!selectedProject || selectedProject.payments.length === 0) return;
    const paymentsExceptLast = selectedProject.payments.slice(0, -1);
    const sumExceptLast = paymentsExceptLast.reduce((sum, p) => sum + p.amount, 0);
    const lastPayment = selectedProject.payments[selectedProject.payments.length - 1];
    const newLastAmount = Math.max(0, selectedProject.totalValue - sumExceptLast);
    const updatedPayments = [...paymentsExceptLast, { ...lastPayment, amount: newLastAmount }];
    onUpdateProject({ ...selectedProject, payments: updatedPayments });
  };

  const handleAddPayment = () => {
    if (!selectedProject) return;
    
    const newPayment: PaymentMilestone = {
      id: generateId(),
      name: `Tạm ứng đợt ${selectedProject.payments.length}`, 
      amount: 0,
      dueDate: todayStr,
      status: 'Chưa thu'
    };

    const currentPayments = [...selectedProject.payments];
    if (currentPayments.length > 0) {
      const lastPayment = currentPayments.pop()!;
      onUpdateProject({ 
        ...selectedProject, 
        payments: [...currentPayments, newPayment, lastPayment] 
      });
    } else {
      onUpdateProject({ 
        ...selectedProject, 
        payments: [newPayment] 
      });
    }
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

  const updateProjectBasicInfo = (updates: Partial<Project>) => {
    if (!selectedProject) return;
    onUpdateProject({ ...selectedProject, ...updates });
  };

  const handleFileUpload = (stageId: string) => {
    setActiveStageIdForUpload(stageId);
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedProject && activeStageIdForUpload) {
      const newFile: ProjectFile = {
        id: generateId(),
        name: file.name,
        type: file.name.split('.').pop() || 'doc',
        url: '#',
        uploadedAt: new Date().toISOString(),
        stageId: activeStageIdForUpload
      };
      onUpdateProject({ ...selectedProject, files: [...selectedProject.files, newFile] });
      setActiveStageIdForUpload(null);
    }
  };

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectData.clientId || !newProjectData.contractCode || !newProjectData.name) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc (*)");
      return;
    }
    
    const p1 = Math.round(newProjectData.totalValue * 0.3);
    const p2 = newProjectData.totalValue - p1;

    onAddProject({
      ...newProjectData,
      contractCode: newProjectData.contractCode.toUpperCase(),
      stages: PROJECT_STAGES.map((name, i) => ({
        id: generateId(),
        name,
        status: i === 0 ? 'Đang làm' : 'Chưa làm',
        deadline: todayStr,
      })),
      payments: [
        { id: generateId(), name: 'Tạm ứng đợt 1', amount: p1, dueDate: todayStr, status: 'Chưa thu' },
        { id: generateId(), name: 'Quyết toán', amount: p2, dueDate: todayStr, status: 'Chưa thu' }
      ],
      files: []
    });
    
    setShowNewProjectModal(false);
    if (clearPreSelectedClient) clearPreSelectedClient();
    setNewProjectData({
      clientId: '',
      contractCode: '',
      name: '',
      leadName: '',
      architect: '',
      structuralEngineer: '',
      meEngineer: '',
      plumbingEngineer: '',
      contractSigningDate: todayStr,
      contractDeadline: '',
      contractType: 'Thiết kế',
      projectType: 'Thấp tầng',
      totalValue: 0,
    });
  };

  const inputClass = "w-full px-5 py-3.5 bg-white border border-slate-200 rounded-[1.25rem] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 placeholder:text-slate-300 placeholder:font-medium";
  const labelClass = "block text-[13px] font-bold text-slate-600 mb-2.5 ml-1";

  return (
    <div className="space-y-6">
      <input type="file" ref={fileInputRef} className="hidden" onChange={onFileChange} />
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center px-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Dự án & Hồ sơ</h2>
          <div className="flex space-x-6 mt-4">
            {(['Tất cả', 'Cao tầng', 'Thấp tầng', 'Nội thất'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm font-bold pb-2 border-b-2 transition-all ${
                  activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <button 
          onClick={() => setShowNewProjectModal(true)}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
        >
          <Icons.Plus />
          <span>Tạo dự án mới</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT LIST SECTION */}
        <div className="w-full lg:w-72 space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto px-4">
          {filteredProjects.map(project => (
            <button
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              className={`w-full text-left p-4 rounded-2xl border transition-all relative ${
                selectedProjectId === project.id 
                  ? 'bg-white border-indigo-200 shadow-md ring-2 ring-indigo-500/20' 
                  : 'bg-white border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <div>
                  <span className="text-[10px] font-black block text-indigo-600 mb-1">{project.contractCode}</span>
                  <p className="font-bold text-slate-800 line-clamp-1">{project.name}</p>
                </div>
                <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded uppercase">{project.projectType}</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate mt-1">{clients.find(c => c.id === project.clientId)?.name}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase text-slate-400 tracking-tighter">{project.contractType}</span>
                <span className="text-xs font-black text-indigo-600">{formatVietnameseCurrency(project.totalValue)}</span>
              </div>
            </button>
          ))}
        </div>

        {/* DETAIL SECTION */}
        <div className="flex-1 space-y-8 px-4">
          {selectedProject ? (
            <>
              {/* CHI TIẾT DỰ ÁN HEADER */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center space-x-1 bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">
                        <input 
                          type="text" 
                          value={selectedProject.contractCode} 
                          onChange={(e) => updateProjectBasicInfo({ contractCode: e.target.value.toUpperCase() })}
                          className="bg-transparent border-none p-0 text-[10px] font-black text-white focus:ring-0 w-24 uppercase"
                        />
                      </div>
                      <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">{selectedProject.projectType}</span>
                      
                      {/* Ngày ký HĐ - Đậm màu hơn */}
                      <div className="flex items-center space-x-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-sm">
                         <Icons.Dashboard />
                         <span className="text-[10px] font-black uppercase whitespace-nowrap">Ký:</span>
                         <input 
                          type="date" 
                          value={selectedProject.contractSigningDate || todayStr} 
                          onChange={(e) => updateProjectBasicInfo({ contractSigningDate: e.target.value })}
                          className="bg-transparent border-none p-0 text-[10px] font-black text-emerald-800 focus:ring-0 w-24 cursor-pointer"
                        />
                      </div>

                      {/* Hạn HĐ tổng thể - Đậm màu hơn */}
                      <div className="flex items-center space-x-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 shadow-sm">
                         <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         <span className="text-[10px] font-black uppercase whitespace-nowrap">Hạn HĐ:</span>
                         <input 
                          type="date" 
                          value={selectedProject.contractDeadline || ''} 
                          onChange={(e) => updateProjectBasicInfo({ contractDeadline: e.target.value })}
                          className="bg-transparent border-none p-0 text-[10px] font-black text-rose-800 focus:ring-0 w-24 cursor-pointer"
                        />
                      </div>
                    </div>
                    
                    <input 
                      type="text" 
                      value={selectedProject.name} 
                      onChange={(e) => updateProjectBasicInfo({ name: e.target.value })}
                      className="text-3xl font-black text-slate-800 bg-transparent border-none p-0 focus:ring-0 w-full hover:bg-slate-50/50 rounded transition-colors"
                      placeholder="Nhập tên dự án..."
                    />
                    
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-slate-500">
                      <p className="text-sm font-medium">Khách hàng: <span className="text-indigo-600 font-bold">{clientOfSelected?.name}</span></p>
                      
                      <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Loại HĐ:</span>
                        <select 
                          value={selectedProject.contractType} 
                          onChange={(e) => updateProjectBasicInfo({ contractType: e.target.value as ContractType })}
                          className="text-[11px] font-black text-slate-800 bg-transparent border-none outline-none cursor-pointer appearance-none hover:text-indigo-600 transition-colors p-0 pr-1"
                        >
                          <option value="Thiết kế">THIẾT KẾ</option>
                          <option value="Thi công">THI CÔNG</option>
                          <option value="Trọn gói">TRỌN GÓI</option>
                        </select>
                        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {isEditingTotalValue ? (
                      <div className="flex flex-col items-end">
                        <input 
                          type="text" 
                          autoFocus
                          className="text-right text-4xl font-black text-indigo-600 border-b-2 border-indigo-500 outline-none w-64 bg-white px-4 py-2 rounded-xl shadow-sm"
                          value={displayFormatted(tempTotalValue)}
                          onChange={(e) => setTempTotalValue(formatInputNumber(e.target.value))}
                          onBlur={handleSaveTotalValue}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveTotalValue()}
                        />
                      </div>
                    ) : (
                      <div className="group cursor-pointer" onClick={() => { setTempTotalValue(selectedProject.totalValue); setIsEditingTotalValue(true); }}>
                        <p className="text-4xl font-black text-indigo-600 group-hover:underline decoration-slate-200 underline-offset-8">
                          {formatVietnameseCurrency(selectedProject.totalValue)}
                        </p>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Giá trị hợp đồng</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ĐỘI NGŨ THỰC HIỆN */}
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">ĐỘI NGŨ THỰC HIỆN DỰ ÁN</h4>
                    <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Chủ trì:</span>
                      <input 
                        type="text" 
                        value={selectedProject.leadName || ''} 
                        onChange={(e) => updateProjectBasicInfo({ leadName: e.target.value })}
                        placeholder="Tên KTS chủ trì..."
                        className="bg-transparent border-none p-0 text-[10px] font-bold text-indigo-700 focus:ring-0 w-32 placeholder:text-indigo-200"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                      <label className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block mb-1">Kiến trúc</label>
                      <input 
                        type="text" 
                        value={selectedProject.architect || ''} 
                        onChange={(e) => updateProjectBasicInfo({ architect: e.target.value })}
                        placeholder="Tên nhân sự..."
                        className="bg-transparent border-none p-0 w-full text-sm font-bold text-indigo-700 focus:ring-0 placeholder:text-indigo-200"
                      />
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Kết cấu</label>
                      <input 
                        type="text" 
                        value={selectedProject.structuralEngineer || ''} 
                        onChange={(e) => updateProjectBasicInfo({ structuralEngineer: e.target.value })}
                        placeholder="Tên nhân sự..."
                        className="bg-transparent border-none p-0 w-full text-sm font-bold text-slate-700 focus:ring-0 placeholder:text-slate-300"
                      />
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Cơ điện (M&E)</label>
                      <input 
                        type="text" 
                        value={selectedProject.meEngineer || ''} 
                        onChange={(e) => updateProjectBasicInfo({ meEngineer: e.target.value })}
                        placeholder="Tên nhân sự..."
                        className="bg-transparent border-none p-0 w-full text-sm font-bold text-slate-700 focus:ring-0 placeholder:text-slate-300"
                      />
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Cấp thoát nước</label>
                      <input 
                        type="text" 
                        value={selectedProject.plumbingEngineer || ''} 
                        onChange={(e) => updateProjectBasicInfo({ plumbingEngineer: e.target.value })}
                        placeholder="Tên nhân sự..."
                        className="bg-transparent border-none p-0 w-full text-sm font-bold text-slate-700 focus:ring-0 placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                </div>

                {/* TIẾN ĐỘ GIAI ĐOẠN GRID */}
                <div className="mt-12">
                   <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">TIẾN ĐỘ & MỐC HẠN HỒ SƠ</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {selectedProject.stages.map(stage => {
                        const isOverdue = stage.status !== 'Hoàn thành' && stage.deadline && stage.deadline < todayStr;
                        return (
                          <div key={stage.id} className={`p-6 rounded-2xl border transition-all ${isOverdue ? 'bg-rose-50 border-rose-200 ring-2 ring-rose-100 shadow-sm' : 'bg-slate-50/30 border-slate-100'}`}>
                             <div className="flex justify-between items-start mb-4">
                                <h5 className={`font-bold ${isOverdue ? 'text-rose-900' : 'text-slate-800'}`}>{stage.name}</h5>
                                <select 
                                  value={stage.status}
                                  onChange={(e) => updateStageStatus(stage.id, e.target.value as ProjectStageStatus)}
                                  className={`text-[10px] font-black px-3 py-1.5 rounded-xl border-none outline-none cursor-pointer appearance-none ${
                                    stage.status === 'Hoàn thành' ? 'bg-emerald-600 text-white' :
                                    stage.status === 'Đang làm' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                                  }`}
                                >
                                   <option>Chưa làm</option>
                                   <option>Đang làm</option>
                                   <option>Hoàn thành</option>
                                </select>
                             </div>
                             
                             <div className="space-y-4">
                                <div>
                                   <label className={`text-[9px] font-black uppercase tracking-wider mb-1 block ${isOverdue ? 'text-rose-600 animate-pulse' : 'text-slate-500'}`}>
                                      Hạn nộp hồ sơ
                                   </label>
                                   <div className="flex items-center space-x-2">
                                      <Icons.Dashboard />
                                      <input 
                                        type="date" 
                                        value={stage.deadline || ''} 
                                        onChange={(e) => updateStageDeadline(stage.id, e.target.value)}
                                        className={`bg-transparent border-none p-0 text-xs font-black focus:ring-0 cursor-pointer ${isOverdue ? 'text-rose-700' : 'text-slate-700'}`}
                                      />
                                   </div>
                                </div>

                                <div className="flex justify-end pt-2 border-t border-slate-200/50">
                                  <button 
                                    onClick={() => handleFileUpload(stage.id)}
                                    className={`p-2 rounded-lg transition-colors ${isOverdue ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                    title="Tải hồ sơ nộp"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                  </button>
                                </div>
                             </div>
                          </div>
                        );
                      })}
                   </div>
                </div>
              </div>

              {/* PHẦN KHO LƯU TRỮ VÀ THANH TOÁN */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* THANH TOÁN DỰ ÁN */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3 text-emerald-600">
                      <div className="bg-emerald-50 p-2 rounded-lg">
                        <Icons.Currency />
                      </div>
                      <h4 className="text-2xl font-bold text-slate-800">Thanh toán</h4>
                    </div>
                    <button 
                      onClick={handleAddPayment}
                      className="text-[11px] font-black bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors uppercase tracking-widest"
                    >
                      + THÊM ĐỢT
                    </button>
                  </div>

                  <div className={`p-6 rounded-2xl border flex justify-between items-center transition-all ${isBalanced ? 'bg-emerald-50/40 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div className="space-y-1">
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-tight">Cân đối dòng tiền</p>
                      <p className="text-sm font-bold text-slate-800">
                        {isBalanced ? 'Đã phân bổ đủ giá trị HĐ' : `Còn thiếu: ${formatCurrency(balanceDifference)}`}
                      </p>
                    </div>
                    {!isBalanced && (
                      <button 
                        onClick={balanceToLastPayment}
                        className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase"
                      >
                        Cân đối vào quyết toán
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {selectedProject.payments.map((pay, index) => {
                      const isLast = index === selectedProject.payments.length - 1;
                      const isEditing = editingPaymentId === pay.id;
                      const isEditingName = editingPaymentNameId === pay.id;
                      const isOverdue = pay.status !== 'Đã thu' && pay.dueDate < todayStr;
                      const effectiveStatus = isOverdue ? 'Quá hạn' : pay.status;

                      return (
                        <div key={pay.id} className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${
                          isLast ? 'bg-slate-50/50 border-indigo-200 ring-1 ring-indigo-50 shadow-sm' : 'bg-white border-slate-50'
                        } ${(isEditing || isEditingName) ? 'ring-2 ring-indigo-500 border-indigo-200' : ''}`}>
                          <div className="flex-1 pr-4">
                            <div className="flex items-center space-x-2 mb-1">
                              {isEditingName ? (
                                <input 
                                  type="text" 
                                  autoFocus
                                  className="text-base font-bold text-indigo-800 border-b border-indigo-500 outline-none bg-white px-1"
                                  value={tempPaymentName}
                                  onChange={(e) => setTempPaymentName(e.target.value)}
                                  onBlur={() => handleUpdatePayment(pay.id, { name: tempPaymentName })}
                                  onKeyDown={(e) => e.key === 'Enter' && handleUpdatePayment(pay.id, { name: tempPaymentName })}
                                />
                              ) : (
                                <h5 
                                  className={`text-base font-bold cursor-pointer hover:text-indigo-600 transition-colors ${isLast ? 'text-indigo-900' : 'text-slate-800'}`}
                                  onClick={() => { setEditingPaymentNameId(pay.id); setTempPaymentName(pay.name); }}
                                >
                                  {isLast ? 'Quyết toán' : pay.name}
                                </h5>
                              )}
                              
                              {isLast && (
                                <span className="bg-indigo-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter">Final</span>
                              )}
                              {isOverdue && (
                                <span className="bg-rose-100 text-rose-700 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase animate-pulse">Trễ hạn</span>
                              )}
                            </div>
                            <input 
                              type="date"
                              value={pay.dueDate}
                              onChange={(e) => handleUpdatePayment(pay.id, { dueDate: e.target.value })}
                              className={`bg-transparent border-none p-0 text-xs font-black focus:ring-0 cursor-pointer ${isOverdue ? 'text-rose-700' : 'text-slate-600'}`}
                            />
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                             {isEditing ? (
                                <input 
                                  type="text"
                                  autoFocus
                                  className="w-40 text-right text-sm font-black text-indigo-600 border-b border-indigo-500 outline-none bg-white px-3 py-1.5 rounded-lg shadow-inner ring-1 ring-slate-100"
                                  value={displayFormatted(tempPaymentAmount)}
                                  onChange={(e) => setTempPaymentAmount(formatInputNumber(e.target.value))}
                                  onBlur={() => handleUpdatePayment(pay.id, { amount: tempPaymentAmount })}
                                  onKeyDown={(e) => e.key === 'Enter' && handleUpdatePayment(pay.id, { amount: tempPaymentAmount })}
                                />
                             ) : (
                                <p 
                                  className={`text-sm font-black cursor-pointer hover:text-indigo-600 transition-colors ${isLast ? 'text-indigo-800 text-lg' : 'text-slate-900'}`} 
                                  onClick={() => { setEditingPaymentId(pay.id); setTempPaymentAmount(pay.amount); }}
                                >
                                  {formatVietnameseCurrency(pay.amount)}
                                </p>
                             )}
                             <select
                                value={pay.status}
                                onChange={(e) => handleUpdatePayment(pay.id, { status: e.target.value as any })}
                                className={`text-[9px] font-black px-3 py-1 rounded-lg border-none outline-none cursor-pointer transition-all ${
                                  pay.status === 'Đã thu' ? 'bg-emerald-600 text-white' : 
                                  effectiveStatus === 'Quá hạn' ? 'bg-rose-600 text-white ring-2 ring-rose-200 shadow-sm' : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                <option value="Chưa thu">Chưa thu</option>
                                <option value="Đã thu">Đã thu</option>
                                <option value="Quá hạn">Quá hạn</option>
                              </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* KHO HỒ SƠ */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                  <div className="flex items-center space-x-3 text-indigo-600">
                    <div className="bg-indigo-50 p-2 rounded-lg"><Icons.Briefcase /></div>
                    <h4 className="text-2xl font-bold text-slate-800">Kho hồ sơ</h4>
                  </div>
                  <div className="space-y-3">
                    {selectedProject.files.map(file => (
                      <div key={file.id} className="bg-slate-50/60 p-4 rounded-2xl flex items-center justify-between group border border-transparent hover:border-indigo-100 hover:bg-white transition-all shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 font-black text-[9px] uppercase shadow-inner">{file.type}</div>
                          <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{file.name}</p>
                        </div>
                        <button className="text-[10px] font-black text-indigo-700 uppercase hover:underline">Mở</button>
                      </div>
                    ))}
                    {selectedProject.files.length === 0 && (
                      <div className="py-8 text-center text-slate-400 text-xs italic">Chưa có hồ sơ tải lên</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 italic bg-white rounded-3xl border border-dashed border-slate-200 min-h-[500px]">
               <div className="text-center">
                  <Icons.Briefcase />
                  <p className="mt-4">Chọn một dự án để xem chi tiết.</p>
               </div>
            </div>
          )}
        </div>
      </div>

      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in duration-300">
            <div className="px-10 pt-8 pb-4 flex justify-between items-center border-b border-slate-50">
              <h3 className="text-[22px] font-bold text-[#1e293b]">Khởi tạo dự án mới</h3>
              <button onClick={() => setShowNewProjectModal(false)} className="text-slate-300 hover:text-slate-500 p-1">
                <Icons.Plus className="rotate-45 w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateProjectSubmit} className="px-10 py-8 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Khách hàng *</label>
                  <select required value={newProjectData.clientId} onChange={e => setNewProjectData({...newProjectData, clientId: e.target.value})} className={inputClass}>
                    <option value="">-- Chọn khách hàng --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Mã hợp đồng *</label>
                  <input required type="text" value={newProjectData.contractCode} onChange={e => setNewProjectData({...newProjectData, contractCode: e.target.value})} className={`${inputClass} font-bold text-indigo-700 uppercase`} placeholder="VÍ DỤ: HĐ2024/01" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Tên dự án *</label>
                <input required type="text" value={newProjectData.name} onChange={e => setNewProjectData({...newProjectData, name: e.target.value})} className={inputClass} placeholder="Ví dụ: Biệt thự nghỉ dưỡng Đà Lạt" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Kiến trúc sư Chủ trì *</label>
                  <input required type="text" value={newProjectData.leadName} onChange={e => setNewProjectData({...newProjectData, leadName: e.target.value})} className={inputClass} placeholder="KTS phụ trách chính" />
                </div>
                <div>
                  <label className={labelClass}>Ngày ký HĐ *</label>
                  <input required type="date" value={newProjectData.contractSigningDate} onChange={e => setNewProjectData({...newProjectData, contractSigningDate: e.target.value})} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Hạn hoàn thành (Theo Hợp đồng) *</label>
                <input required type="date" value={newProjectData.contractDeadline} onChange={e => setNewProjectData({...newProjectData, contractDeadline: e.target.value})} className={`${inputClass} border-rose-100 bg-rose-50/30`} />
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Phân công nhân sự bộ môn</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>KTS Kiến trúc</label>
                    <input type="text" value={newProjectData.architect} onChange={e => setNewProjectData({...newProjectData, architect: e.target.value})} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>KS Kết cấu</label>
                    <input type="text" value={newProjectData.structuralEngineer} onChange={e => setNewProjectData({...newProjectData, structuralEngineer: e.target.value})} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>KS Cơ điện</label>
                    <input type="text" value={newProjectData.meEngineer} onChange={e => setNewProjectData({...newProjectData, meEngineer: e.target.value})} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>KS Nước</label>
                    <input type="text" value={newProjectData.plumbingEngineer} onChange={e => setNewProjectData({...newProjectData, plumbingEngineer: e.target.value})} className={inputClass} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Loại dự án</label>
                  <select value={newProjectData.projectType} onChange={e => setNewProjectData({...newProjectData, projectType: e.target.value as ProjectType})} className={inputClass}>
                    <option value="Thấp tầng">Thấp tầng</option>
                    <option value="Cao tầng">Cao tầng</option>
                    <option value="Nội thất">Nội thất</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Hợp đồng</label>
                  <select value={newProjectData.contractType} onChange={e => setNewProjectData({...newProjectData, contractType: e.target.value as ContractType})} className={inputClass}>
                    <option value="Thiết kế">Thiết kế</option>
                    <option value="Thi công">Thi công</option>
                    <option value="Trọn gói">Trọn gói</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Giá trị Hợp đồng (VND)</label>
                <input type="text" value={displayFormatted(newProjectData.totalValue)} onChange={e => setNewProjectData({...newProjectData, totalValue: formatInputNumber(e.target.value)})} className={`${inputClass} font-black text-indigo-600 text-[18px]`} />
              </div>

              <div className="pt-6 flex items-center justify-center space-x-12">
                <button type="button" onClick={() => setShowNewProjectModal(false)} className="text-slate-500 font-bold">Hủy</button>
                <button type="submit" className="px-12 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95">Tạo dự án</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
