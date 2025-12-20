
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
  deadline?: string;     // Hạn nộp hồ sơ (Nội bộ/Kỹ thuật)
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
  contractDeadline?: string;    // Hạn hoàn thành cuối cùng theo HĐ
  contractType: ContractType;
  projectType: ProjectType;
  totalValue: number;
  stages: ProjectStage[];
  payments: PaymentMilestone[];
  files: ProjectFile[];
  createdAt: string;
  // Nhân sự thực hiện cố định cho toàn dự án
  architect?: string;           // Kiến trúc
  structuralEngineer?: string;  // Kết cấu
  meEngineer?: string;          // Hệ thống cơ điện
  plumbingEngineer?: string;    // Hệ thống cấp thoát nước
}

export type View = 'dashboard' | 'clients' | 'projects' | 'finances' | 'workload';
