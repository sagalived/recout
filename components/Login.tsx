
import React, { useState } from 'react';
import { User, Lock, ArrowRight } from 'lucide-react';
import { systemStore } from '../services/storage';

interface LoginProps {
  onLogin: () => void;
  onRegisterClick?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onRegisterClick }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      // Perform login check with password
      const success = systemStore.login(username, password);
      if (success) {
          onLogin();
      } else {
          alert("Usuário ou senha incorretos. Tente 'admin' / '123' ou cadastre um novo.");
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#2e0249] p-4 font-sans">
      <div className="w-full max-w-[380px] animate-in fade-in zoom-in duration-500">
        
        {/* Header / Logo area */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[#FFD700] tracking-widest uppercase drop-shadow-lg mb-2">
            RECOUT
          </h1>
          <p className="text-white text-[10px] md:text-xs uppercase tracking-widest font-bold opacity-90">
            SISTEMA DE GESTÃO INTEGRADO
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#4a148c] rounded-lg shadow-2xl shadow-purple-900/50 overflow-hidden relative">
          {/* Top Yellow Line */}
          <div className="h-2 bg-[#FFD700] w-full"></div>
          
          <div className="p-8 pb-6">
            <h2 className="text-xl font-bold text-white mb-6 text-center">Acesso ao Sistema</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[#FFD700] font-bold text-[11px] uppercase tracking-wide">
                  USUÁRIO
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-[#FFD700]/80" strokeWidth={1.5} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-[#1b002b] border-none rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all text-sm shadow-inner"
                    placeholder="Digite seu usuario"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[#FFD700] font-bold text-[11px] uppercase tracking-wide">
                  SENHA
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-[#FFD700]/80" strokeWidth={1.5} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-[#1b002b] border-none rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all text-sm shadow-inner"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs mt-4 mb-2">
                <label className="flex items-center text-white cursor-pointer select-none">
                  <input type="checkbox" className="w-3.5 h-3.5 text-[#2e0249] rounded bg-white border-transparent focus:ring-[#FFD700]" />
                  <span className="ml-2 font-medium">Lembrar-me</span>
                </label>
                <a href="#" className="text-[#FFD700] hover:text-[#ffe55c] font-medium transition-colors">
                  Esqueceu a senha?
                </a>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-[#FFD700] hover:bg-[#ffe033] text-[#2e0249] font-bold py-3 px-4 rounded shadow-lg transition-all active:scale-95 uppercase text-sm tracking-wide"
                >
                  ENTRAR
                  <ArrowRight className="w-4 h-4" />
                </button>
                
                <button
                  type="button"
                  onClick={onRegisterClick}
                  className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-[#5d1a9e] text-white border border-[#FFD700] font-bold py-3 px-4 rounded shadow-sm transition-all active:scale-95 uppercase text-sm tracking-wide opacity-90 hover:opacity-100"
                >
                  CADASTRAR
                </button>
              </div>
            </form>
          </div>
          
          <div className="pb-6 pt-0 text-center px-4">
            <p className="text-purple-300/70 text-[10px] font-medium">
              &copy; 2025 Recout Systems. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
