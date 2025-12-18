
import React, { useState, useEffect } from 'react';
import { View, Client, Project } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClientManager from './components/ClientManager';
import ProjectManager from './components/ProjectManager';
import FinanceManager from './components/FinanceManager';
import { PROJECT_STAGES } from './constants';
import { generateId } from './utils';

const INITIAL_CLIENTS: Client[] = [
  { id: 'c1', name: 'Nguyễn Văn An', phone: '0901234567', zalo: '0901234567', type: 'Biệt thự', status: 'Đã ký', notes: 'Khách hàng thích phong cách hiện đại.', createdAt: '2023-10-01' },
  { id: 'c2', name: 'Trần Thị Bình', phone: '0911222333', zalo: '0911222333', type: 'Nhà phố', status: 'Đang tư vấn', notes: 'Cần thiết kế 3 tầng.', createdAt: '2023-10-05' },
];

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    clientId: 'c1',
    contractCode: 'HĐ2023/KT-01',
    name: 'Biệt thự Anh Quân Lông',
    leadName: 'KTS. Nguyễn Ngọc Kiên',
    contractSigningDate: '2023-12-01',
    contractType: 'Trọn gói',
    projectType: 'Thấp tầng',
    totalValue: 500000000,
    createdAt: '2023-10-02',
    stages: PROJECT_STAGES.map((name, i) => ({
      id: `s${i}`,
      name,
      status: i < 2 ? 'Hoàn thành' : (i === 2 ? 'Đang làm' : 'Chưa làm'),
      deadline: i === 2 ? '2024-12-30' : undefined
    })),
    payments: [
      { id: 'pay1', name: 'Tạm ứng đợt 1', amount: 150000000, dueDate: '2023-10-02', status: 'Đã thu' },
      { id: 'pay2', name: 'Hoàn thành Concept', amount: 150000000, dueDate: '2023-11-15', status: 'Đã thu' },
      { id: 'pay3', name: 'Bàn giao Hồ sơ KT', amount: 200000000, dueDate: '2024-12-15', status: 'Chưa thu' },
    ],
    files: [
      { id: 'f1', name: 'Hop_Dong_Thiet_Ke.pdf', type: 'pdf', url: '#', uploadedAt: '2023-10-02' }
    ]
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(INITIAL_PROJECTS[0]?.id || null);
  const [targetClientIdForNewProject, setTargetClientIdForNewProject] = useState<string | null>(null);

  const addClient = (client: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...client,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setClients(prev => [...prev, newClient]);
  };

  const addProject = (project: Omit<Project, 'id' | 'createdAt'>) => {
    const newId = generateId();
    const newProject: Project = {
      ...project,
      id: newId,
      createdAt: new Date().toISOString()
    };
    setProjects(prev => [...prev, newProject]);
    setSelectedProjectId(newId);
    setTargetClientIdForNewProject(null);
  };

  const updateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const updateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const handleViewProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('projects');
  };

  const handleCreateProjectForClient = (clientId: string) => {
    setTargetClientIdForNewProject(clientId);
    setCurrentView('projects');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard clients={clients} projects={projects} onViewProject={handleViewProject} />;
      case 'clients':
        return (
          <ClientManager 
            clients={clients} 
            onAddClient={addClient} 
            onUpdateClient={updateClient} 
            projects={projects} 
            onViewProject={handleViewProject}
            onCreateProjectForClient={handleCreateProjectForClient}
          />
        );
      case 'projects':
        return (
          <ProjectManager 
            projects={projects} 
            clients={clients} 
            onUpdateProject={updateProject} 
            onAddProject={addProject}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
            preSelectedClientId={targetClientIdForNewProject}
            clearPreSelectedClient={() => setTargetClientIdForNewProject(null)}
            onViewClient={() => setCurrentView('clients')}
          />
        );
      case 'finances':
        return <FinanceManager projects={projects} clients={clients} onUpdateProject={updateProject} />;
      default:
        return <Dashboard clients={clients} projects={projects} onViewProject={handleViewProject} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-1 p-8 lg:ml-64 transition-all duration-300">
        {renderContent()}
      </main>
    </div>
  );
}
