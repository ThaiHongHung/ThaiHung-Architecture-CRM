
import React from 'react';
import { View } from '../types';
import { Icons } from '../constants';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: <Icons.Dashboard /> },
    { id: 'clients', label: 'Khách hàng', icon: <Icons.Users /> },
    { id: 'projects', label: 'Dự án', icon: <Icons.Briefcase /> },
    { id: 'finances', label: 'Tài chính', icon: <Icons.Currency /> },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col z-30">
      <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-lg">TH</div>
        <div className="flex flex-col overflow-hidden">
          <h1 className="text-sm font-bold text-slate-800 leading-tight truncate">ThaiHung</h1>
          <p className="text-[10px] font-medium text-indigo-600 uppercase tracking-tighter">Architecture CRM</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id as View)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === item.id 
                ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center space-x-3 px-4 py-2">
          <img src="https://picsum.photos/40/40" className="w-10 h-10 rounded-full border border-slate-200" alt="Avatar" />
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-800 truncate">KTS. Nguyễn Ngọc Kiên</p>
            <p className="text-xs text-slate-500">P. Giám Đốc</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
