
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

export enum ActiveView {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  DASHBOARD = 'DASHBOARD',
  EMPLOYEE = 'EMPLOYEE',
  CLIENT = 'CLIENT',
  PRODUCT = 'PRODUCT',
  SECTOR = 'SECTOR',
  PRODUCTION = 'PRODUCTION',
  RECOVERY = 'RECOVERY',
  FAQ = 'FAQ'
}

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
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#4a148c] p-4 md:p-8">
        <div className="flex-1 overflow-y-auto scroll-smooth rounded-2xl bg-[#581c87]/50 border border-purple-700/30 shadow-2xl p-6 md:p-10">
          <div className="max-w-4xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
