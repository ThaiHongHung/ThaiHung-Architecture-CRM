
export type ClientType = 'Nhà phố' | 'Biệt thự' | 'Cải tạo' | 'Nội thất';
export type ClientStatus = 'Mới' | 'Đang tư vấn' | 'Đã ký' | 'Hủy';

export interface Client {
  id: string;
  name: string;
  phone: string;
  zalo: string;
  type: ClientType;
  status: ClientStatus;
  notes: string;
  nextFollowUp?: string;
  createdAt: string;
}

export type ProjectStageStatus = 'Chưa làm' | 'Đang làm' | 'Hoàn thành';

export interface ProjectStage {
  id: string;
  name: string;
  status: ProjectStageStatus;
  deadline?: string;
  assignedTo?: string;
}

export type ContractType = 'Thiết kế' | 'Thi công' | 'Trọn gói';
export type ProjectType = 'Cao tầng' | 'Thấp tầng' | 'Nội thất';

export interface PaymentMilestone {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: 'Chưa thu' | 'Đã thu' | 'Quá hạn';
}

export interface ProjectFile {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  stageId?: string; // Liên kết với ProjectStage.id
}

export interface Project {
  id: string;
  clientId: string;
  contractCode: string; // Mã hợp đồng
  name: string;
  leadName: string; 
  contractSigningDate?: string; 
  contractType: ContractType;
  projectType: ProjectType;
  totalValue: number;
  stages: ProjectStage[];
  payments: PaymentMilestone[];
  files: ProjectFile[];
  createdAt: string;
}

export type View = 'dashboard' | 'clients' | 'projects' | 'finances';
