
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { EmployeeForm } from './components/EmployeeForm';
import { ClientForm } from './components/ClientForm';
import { ProductForm } from './components/ProductForm';
import { SectorForm } from './components/SectorForm';
import { ProductionView } from './components/ProductionView';
import { Dashboard } from './components/Dashboard';
import { RecoveryTool } from './components/RecoveryTool';
import { Faq } from './components/Faq';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { systemStore } from './services/storage';
import { ActiveView } from './types/activeView';

const mobileNavItems = [
  { id: ActiveView.DASHBOARD, label: 'Visão Geral' },
  { id: ActiveView.EMPLOYEE, label: 'Usuários' },
  { id: ActiveView.CLIENT, label: 'Clientes' },
  { id: ActiveView.PRODUCT, label: 'Produtos' },
  { id: ActiveView.SECTOR, label: 'Setores' },
  { id: ActiveView.PRODUCTION, label: 'Produção' },
  { id: ActiveView.FAQ, label: 'Ajuda' },
];

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>(ActiveView.LOGIN);

  const handleLogin = () => {
    setActiveView(ActiveView.DASHBOARD);
  };

  const handleLogout = () => {
    systemStore.logout();
    setActiveView(ActiveView.LOGIN);
  };

  const handleRegisterClick = () => {
    setActiveView(ActiveView.REGISTER);
  };

  const handleRegisterSuccess = () => {
    // Redirect to Login so user can sign in with new credentials
    setActiveView(ActiveView.LOGIN);
  };

  const handleBackToLogin = () => {
    setActiveView(ActiveView.LOGIN);
  }

  const renderContent = () => {
    switch (activeView) {
      case ActiveView.DASHBOARD:
        return <Dashboard onChangeView={setActiveView} />;
      case ActiveView.RECOVERY:
        return <RecoveryTool />;
      case ActiveView.FAQ:
        return <Faq />;
      case ActiveView.EMPLOYEE:
        return <EmployeeForm onBackToLogin={handleLogout} />;
      case ActiveView.CLIENT:
        return <ClientForm />;
      case ActiveView.PRODUCT:
        return <ProductForm />;
      case ActiveView.SECTOR:
        return <SectorForm />;
      case ActiveView.PRODUCTION:
        return <ProductionView />;
      default:
        return <Dashboard onChangeView={setActiveView} />;
    }
  };

  // Full screen views (No Sidebar)
  if (activeView === ActiveView.LOGIN) {
    return <Login onLogin={handleLogin} onRegisterClick={handleRegisterClick} />;
  }

  if (activeView === ActiveView.REGISTER) {
    return <Register onBack={handleBackToLogin} onRegisterSuccess={handleRegisterSuccess} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#4a148c]">
      {/* Sidebar */}
      <Sidebar activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#4a148c] p-3 md:p-8">
        <div className="md:hidden bg-[#2e0249] border border-[#570a8a] rounded-xl p-3 mb-3 shadow-lg">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h1 className="text-[#FFD700] font-bold text-base uppercase tracking-wide">Gestão de Produção</h1>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-bold text-[#FFD700] border border-[#570a8a] px-3 py-1.5 rounded-md"
            >
              Sair
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {mobileNavItems.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`whitespace-nowrap text-xs font-bold px-3 py-2 rounded-md border transition-colors ${activeView === item.id ? 'bg-[#FFD700] text-[#2e0249] border-[#FFD700]' : 'bg-[#3c0360] text-purple-100 border-[#570a8a]'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scroll-smooth rounded-2xl bg-[#581c87]/50 border border-purple-700/30 shadow-2xl p-4 md:p-10">
          <div className="max-w-5xl mx-auto pb-6 md:pb-0">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
