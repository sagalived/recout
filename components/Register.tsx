
import React, { useState, useRef } from 'react';
import { ArrowLeft, Camera, Save } from 'lucide-react';
import { systemStore, Employee } from '../services/storage';

interface RegisterProps {
  onBack: () => void;
  onRegisterSuccess: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onBack, onRegisterSuccess }) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    cpf: '',
    street: '', // Added to match UI
    status: 'funcionario'
  });

  // --- MASK HELPER ---
  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '') 
      .replace(/(\d{3})(\d)/, '$1.$2') 
      .replace(/(\d{3})(\d)/, '$1.$2') 
      .replace(/(\d{3})(\d{1,2})/, '$1-$2') 
      .replace(/(-\d{2})\d+?$/, '$1')
      .slice(0, 14); 
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Special handler for inputs where I can't easily change the onChange signature in one go without adding name attrs
  const setField = (field: string, value: string) => {
      let finalValue = value;
      if (field === 'cpf') {
          finalValue = formatCPF(value);
      } else if (field === 'username') {
          finalValue = value.trim();
      }
      setFormData(prev => ({ ...prev, [field]: finalValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.username || !formData.password || !formData.cpf) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
    }

    if (formData.password !== formData.confirmPassword) {
        alert("As senhas não coincidem.");
        return;
    }

    if (formData.cpf.length !== 14) {
        alert("Erro: O CPF está incompleto ou inválido.");
        return;
    }

    // Duplicate Check
    const isDuplicate = systemStore.getEmployees().some(
        emp => emp.username?.toLowerCase() === formData.username.toLowerCase() || emp.cpf === formData.cpf
    );

    if (isDuplicate) {
        alert("Erro: Usuário ou CPF já cadastrado.");
        return;
    }

    // Create Employee Object
    const newEmployee: Employee = {
        id: Date.now(),
        name: formData.name,
        sector: 'Triagem', // Default sector for external registration
        avatar: photoPreview,
        status: 'Offline',
        cpf: formData.cpf,
        dailyProductionBase: 0,
        username: formData.username.trim(),
        password: formData.password.trim()
    };

    // Save to Store
    systemStore.addEmployee(newEmployee);
    
    alert("Cadastro realizado com sucesso! Agora faça login com seus dados.");
    onRegisterSuccess();
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#2e0249] p-4 font-sans overflow-y-auto">
      <div className="w-full max-w-3xl animate-in fade-in zoom-in duration-500 my-8">
        
        <div className="bg-[#4a148c] rounded-lg shadow-2xl shadow-purple-900/50 overflow-hidden relative border-t-8 border-[#FFD700]">
          
          <div className="p-6 md:p-10">
            <button 
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 text-[#FFD700] hover:text-white transition-colors text-xs font-bold mb-2 uppercase tracking-wide"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar ao Login
            </button>

            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Photo Section */}
              <div className="flex flex-col items-center justify-center -mt-4 mb-6">
                <div 
                  className="relative group cursor-pointer"
                  onClick={handlePhotoClick}
                >
                  <div className="w-32 h-32 bg-[#2e0249] border-2 border-[#FFD700] rounded-full flex items-center justify-center shadow-lg overflow-hidden relative">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-10 h-10 text-[#FFD700] opacity-50 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 bg-[#FFD700] rounded-full p-2 text-[#2e0249] shadow-md border-2 border-[#4a148c]">
                     <Camera className="w-4 h-4" />
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden" 
                    accept="image/*"
                  />
                </div>
                <span className="text-[#FFD700] font-bold text-sm mt-3">Carregar Foto</span>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                
                {/* Row 1 */}
                <div className="space-y-1.5">
                  <label className="block text-[#FFD700] font-bold text-[11px] uppercase tracking-wide">Nome Completo</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setField('name', e.target.value)}
                    className="w-full bg-[#1b002b] border-none rounded p-3 text-white focus:ring-1 focus:ring-[#FFD700] focus:outline-none shadow-inner placeholder-gray-500" 
                    placeholder="Ex: Joao Silva" 
                    required 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[#FFD700] font-bold text-[11px] uppercase tracking-wide">Status / Tipo</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setField('status', e.target.value)}
                    className="w-full bg-[#1b002b] border-none rounded p-3 text-white focus:ring-1 focus:ring-[#FFD700] focus:outline-none shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="funcionario">Funcionário</option>
                    <option value="cliente" disabled>Cliente (Apenas Admin)</option>
                  </select>
                </div>

                {/* Row 2 */}
                <div className="space-y-1.5">
                  <label className="block text-[#FFD700] font-bold text-[11px] uppercase tracking-wide">Usuário (Login)</label>
                  <input 
                    type="text" 
                    value={formData.username}
                    onChange={(e) => setField('username', e.target.value)}
                    className="w-full bg-[#1b002b] border-none rounded p-3 text-white focus:ring-1 focus:ring-[#FFD700] focus:outline-none shadow-inner placeholder-gray-500" 
                    placeholder="Ex: joaosilva" 
                    required 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[#FFD700] font-bold text-[11px] uppercase tracking-wide">Senha</label>
                  <input 
                    type="password" 
                    value={formData.password}
                    onChange={(e) => setField('password', e.target.value)}
                    className="w-full bg-[#1b002b] border-none rounded p-3 text-white focus:ring-1 focus:ring-[#FFD700] focus:outline-none shadow-inner placeholder-gray-500" 
                    placeholder="••••••••" 
                    required 
                  />
                </div>

                {/* Row 3 */}
                <div className="space-y-1.5">
                  <label className="block text-[#FFD700] font-bold text-[11px] uppercase tracking-wide">CPF</label>
                  <input 
                    type="text" 
                    value={formData.cpf}
                    maxLength={14}
                    onChange={(e) => setField('cpf', e.target.value)}
                    className="w-full bg-[#1b002b] border-none rounded p-3 text-white focus:ring-1 focus:ring-[#FFD700] focus:outline-none shadow-inner placeholder-gray-500" 
                    placeholder="000.000.000-00" 
                    required 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[#FFD700] font-bold text-[11px] uppercase tracking-wide">Confirmar Senha</label>
                  <input 
                    type="password" 
                    value={formData.confirmPassword}
                    onChange={(e) => setField('confirmPassword', e.target.value)}
                    className="w-full bg-[#1b002b] border-none rounded p-3 text-white focus:ring-1 focus:ring-[#FFD700] focus:outline-none shadow-inner placeholder-gray-500" 
                    placeholder="••••••••" 
                    required 
                  />
                </div>

                {/* Row 4 - Full Width Address */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-[#FFD700] font-bold text-[11px] uppercase tracking-wide">Endereço Completo</label>
                  <textarea 
                    value={formData.street}
                    onChange={(e) => setField('street', e.target.value)}
                    className="w-full bg-[#1b002b] border-none rounded p-3 text-white focus:ring-1 focus:ring-[#FFD700] focus:outline-none shadow-inner h-24 resize-none" 
                  ></textarea>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-[#FFD700] hover:bg-[#ffe033] text-[#2e0249] font-bold py-3 px-4 rounded shadow-lg transition-all active:scale-95 uppercase text-sm tracking-wide"
                >
                  <Save className="w-4 h-4" />
                  Finalizar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
