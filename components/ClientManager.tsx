
import React, { useState, useEffect } from 'react';
import { Client, ClientType, ClientStatus, Project } from '../types';
import { Icons } from '../constants';
import { formatDate } from '../utils';

interface ClientManagerProps {
  clients: Client[];
  projects: Project[];
  onAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onViewProject: (projectId: string) => void;
  onCreateProjectForClient: (clientId: string) => void;
}

const ClientManager: React.FC<ClientManagerProps> = ({ 
  clients, 
  onAddClient, 
  onUpdateClient, 
  onDeleteClient,
  projects, 
  onViewProject,
  onCreateProjectForClient
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [createProjectImmediately, setCreateProjectImmediately] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    zalo: '',
    type: 'Nhà phố' as ClientType,
    status: 'Mới' as ClientStatus,
    notes: '',
    nextFollowUp: ''
  });

  useEffect(() => {
    if (editingClient) {
      setFormData({
        name: editingClient.name,
        phone: editingClient.phone,
        zalo: editingClient.zalo,
        type: editingClient.type,
        status: editingClient.status,
        notes: editingClient.notes,
        nextFollowUp: editingClient.nextFollowUp || ''
      });
      setCreateProjectImmediately(false);
    } else {
      setFormData({ name: '', phone: '', zalo: '', type: 'Nhà phố', status: 'Mới', notes: '', nextFollowUp: '' });
      setCreateProjectImmediately(false);
    }
  }, [editingClient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      const updatedClient = { ...editingClient, ...formData };
      onUpdateClient(updatedClient);
      handleCloseModal();
    } else {
      const newClient = onAddClient(formData);
      handleCloseModal();
      if (createProjectImmediately) {
        onCreateProjectForClient(newClient.id);
      }
    }
  };

  const handleEditClick = (client: Client) => {
    setEditingClient(client);
    setShowModal(true);
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (clientToDelete) {
      onDeleteClient(clientToDelete.id);
      setShowDeleteModal(false);
      setClientToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setCreateProjectImmediately(false);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Khách hàng</h2>
          <p className="text-slate-500">Quản lý thông tin và lịch sử tư vấn.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Icons.Plus />
          <span>Thêm khách hàng</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 bg-slate-50/30">
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên hoặc số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-700 placeholder:text-slate-400 placeholder:font-medium transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Loại & Trạng thái</th>
                <th className="px-6 py-4 text-center">Lịch hẹn</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map(client => {
                const clientProject = projects.find(p => p.clientId === client.id);
                return (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase cursor-pointer hover:bg-indigo-200" onClick={() => handleEditClick(client)}>
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 cursor-pointer hover:text-indigo-600" onClick={() => handleEditClick(client)}>{client.name}</p>
                          <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                            <span>{client.phone}</span>
                            {client.zalo && (
                              <span className="bg-blue-50 text-blue-600 px-1 rounded font-bold text-[9px] uppercase">Zalo</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-600 uppercase tracking-tight">
                          {client.type}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            client.status === 'Đã ký' ? 'bg-emerald-500' : 
                            client.status === 'Hủy' ? 'bg-rose-500' : 'bg-amber-400'
                          }`}></span>
                          <span className="text-xs font-medium text-slate-600">{client.status}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-1">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <p className={`text-xs font-semibold ${client.nextFollowUp && new Date(client.nextFollowUp) < new Date() ? 'text-rose-600' : 'text-slate-600'}`}>
                          {formatDate(client.nextFollowUp)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {clientProject ? (
                          <button 
                            onClick={() => onViewProject(clientProject.id)}
                            className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100"
                          >
                            Dự án: {clientProject.name.substring(0, 15)}...
                          </button>
                        ) : (
                          <button 
                            onClick={() => onCreateProjectForClient(client.id)}
                            className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                          >
                            + Tạo dự án
                          </button>
                        )}
                        <button 
                          onClick={() => handleEditClick(client)}
                          className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors"
                          title="Sửa khách hàng"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(client)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors"
                          title="Xóa khách hàng"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredClients.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-slate-400 italic">Không tìm thấy khách hàng nào.</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">
                {editingClient ? 'Cập nhật khách hàng' : 'Thêm khách hàng mới'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên khách hàng *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Ví dụ: Nguyễn Văn A" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số điện thoại *</label>
                    <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Zalo</label>
                    <input type="text" value={formData.zalo} onChange={e => setFormData({...formData, zalo: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Loại khách</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as ClientType})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option>Nhà phố</option>
                      <option>Biệt thự</option>
                      <option>Cải tạo</option>
                      <option>Nội thất</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Trạng thái</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as ClientStatus})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option>Mới</option>
                      <option>Đang tư vấn</option>
                      <option>Đã ký</option>
                      <option>Hủy</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nhắc lịch follow-up</label>
                  <input type="date" value={formData.nextFollowUp} onChange={e => setFormData({...formData, nextFollowUp: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ghi chú nhanh</label>
                  <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Yêu cầu cụ thể, sở thích..."></textarea>
                </div>
                
                {/* CREATE PROJECT IMMEDIATELY TOGGLE */}
                {!editingClient && (
                  <div className="pt-2">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only" 
                          checked={createProjectImmediately}
                          onChange={e => setCreateProjectImmediately(e.target.checked)}
                        />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${createProjectImmediately ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${createProjectImmediately ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">Tạo dự án ngay sau khi lưu</span>
                        <span className="text-[10px] text-slate-400 font-medium italic">Tự động chuyển đến màn hình khởi tạo dự án cho khách này</span>
                      </div>
                    </label>
                  </div>
                )}
              </div>
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={handleCloseModal} className="flex-1 py-3 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors">Hủy</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-95">
                  Lưu khách hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in duration-200 p-8 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 uppercase">Xác nhận xóa khách hàng</h3>
            <p className="text-slate-500 mb-4 text-sm px-4">
              Bạn có chắc chắn muốn xóa khách hàng <span className="font-bold text-slate-800">{clientToDelete?.name}</span>?
            </p>
            {projects.some(p => p.clientId === clientToDelete?.id) && (
              <p className="mb-8 text-rose-600 font-bold text-[10px] uppercase tracking-wider bg-rose-50 p-3 rounded-xl border border-rose-100">
                Lưu ý: Khách hàng này đang có dự án liên kết. Xóa khách hàng sẽ khiến dự án không còn thông tin chủ đầu tư.
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => {setShowDeleteModal(false); setClientToDelete(null);}}
                className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManager;
