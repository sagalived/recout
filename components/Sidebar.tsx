import React from 'react';
import { ActiveView } from '../App';
import { Users, UserCircle, Package, Layers, LogOut, LayoutDashboard, HelpCircle, Factory } from 'lucide-react';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onLogout }) => {
  const navItems = [
    {
      id: ActiveView.DASHBOARD,
      label: 'Visão Geral',
      icon: LayoutDashboard,
    },
    {
      id: ActiveView.EMPLOYEE,
      label: 'Funcionários',
      icon: Users,
    },
    {
      id: ActiveView.CLIENT,
      label: 'Clientes',
      icon: UserCircle,
    },
    {
      id: ActiveView.PRODUCT,
      label: 'Produtos',
      icon: Package,
    },
    {
      id: ActiveView.SECTOR,
      label: 'Setores',
      icon: Layers,
    },
    {
      id: ActiveView.PRODUCTION,
      label: 'Produção',
      icon: Factory,
    },
    {
      id: ActiveView.FAQ,
      label: 'Ajuda',
      icon: HelpCircle,
    },
  ];

  return (
    <aside className="w-64 bg-[#2e0249] border-r border-[#570a8a] flex-shrink-0 flex flex-col hidden md:flex shadow-xl z-10">
      <div className="h-24 flex items-center justify-center px-6 border-b border-[#570a8a]">
        <h1 className="text-3xl font-bold text-[#FFD700] tracking-wider uppercase drop-shadow-sm">
          Recout
        </h1>
      </div>

      <nav className="flex-1 py-8 px-4 space-y-2">
        <div className="px-2 mb-4 text-xs font-bold text-[#FFD700]/60 uppercase tracking-widest">
          Navegação
        </div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-bold transition-all duration-200 ${
              activeView === item.id
                ? `bg-[#FFD700] text-[#2e0249] shadow-md shadow-yellow-500/20 scale-105`
                : `text-purple-200 hover:bg-[#570a8a] hover:text-[#FFD700]`
            }`}
          >
            <item.icon className={`w-5 h-5 ${activeView === item.id ? 'text-[#2e0249]' : 'text-[#FFD700]'}`} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[#570a8a]">
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-[#570a8a] rounded-lg text-[#FFD700] hover:bg-[#570a8a] transition-colors font-semibold"
        >
          <LogOut className="w-4 h-4" />
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
};