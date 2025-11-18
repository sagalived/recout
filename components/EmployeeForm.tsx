
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Users, Edit, Trash2, Save } from 'lucide-react';
import { systemStore, Employee } from '../services/storage';

interface EmployeeFormProps {
  onBackToLogin?: () => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ onBackToLogin }) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    sector: '',
    username: '',
    password: '',
    confirmPassword: '',
    street: '',
    neighborhood: '',
    number: ''
  });

  useEffect(() => {
    setEmployees(systemStore.getEmployees());
  }, []);

  // --- MASK HELPER ---
  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '') // Remove non-digits
      .replace(/(\d{3})(\d)/, '$1.$2') // Add first dot
      .replace(/(\d{3})(\d)/, '$1.$2') // Add second dot
      .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Add dash
      .replace(/(-\d{2})\d+?$/, '$1') // Limit length
      .slice(0, 14); // Strict Limit
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'cpf') {
        finalValue = formatCPF(value);
    } else if (name === 'username') {
        finalValue = value.trim();
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSave = () => {
    // Strict Validation: Check ALL fields
    if (
        !formData.name || 
        !formData.cpf || 
        !formData.sector || 
        !formData.street || 
        !formData.neighborhood || 
        !formData.number || 
        !formData.username || 
        !formData.password || 
        !formData.confirmPassword
    ) {
      alert("Erro: Todos os campos são obrigatórios. Por favor, preencha todas as informações do funcionário.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Erro: As senhas não coincidem.");
      return;
    }

    // Validate CPF length
    if (formData.cpf.length !== 14) {
        alert("Erro: O CPF está incompleto ou inválido.");
        return;
    }

    // Duplicate Check
    const isDuplicate = systemStore.getEmployees().some(
      emp => emp.cpf === formData.cpf || 
             emp.name.toLowerCase() === formData.name.trim().toLowerCase() ||
             (emp.username && emp.username.trim().toLowerCase() === formData.username.trim().toLowerCase())
    );

    if (isDuplicate) {
      alert("Erro: Já existe um funcionário cadastrado com este CPF, Nome ou Usuário (Login).");
      return;
    }

    // Create New Employee
    const newEmployee: Employee = {
      id: Date.now(),
      name: formData.name.trim(),
      cpf: formData.cpf,
      sector: formData.sector,
      status: 'Offline', 
      avatar: photoPreview,
      dailyProductionBase: 0,
      username: formData.username.trim(),
      password: formData.password.trim()
    };

    // Save to Store
    systemStore.addEmployee(newEmployee);
    setEmployees([...systemStore.getEmployees()]); // Force update

    // Clear Form
    setFormData({
      name: '',
      cpf: '',
      sector: '',
      username: '',
      password: '',
      confirmPassword: '',
      street: '',
      neighborhood: '',
      number: ''
    });
    setPhotoPreview(null);

    // Generate Feedback
    const uniqueId = Math.floor(Math.random() * 100000).toString().padStart(6, '0');
    alert(`Funcionário salvo com sucesso!\nID Vinculado: EMP-${uniqueId}`);
  };

  const handleDelete = (id: number) => {
    // Instant Delete without confirm
    systemStore.removeEmployee(id);
    setEmployees([...systemStore.getEmployees()]); // Force state update
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-[#FFD700] text-2xl font-bold mb-6 border-b border-[#FFD700]/30 pb-2 flex items-center gap-2">
        <Users className="w-6 h-6" />
        Gestão de Funcionários
      </h2>

      <form className="space-y-6 mb-10" onSubmit={(e) => e.preventDefault()}>
        
        {/* Photo Upload Section */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div 
            className="relative group cursor-pointer"
            onClick={handlePhotoClick}
          >
            <div className="w-32 h-32 bg-[#2e0249] border-2 border-[#FFD700] rounded-lg flex items-center justify-center shadow-lg overflow-hidden relative">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center">
                   <span className="text-[#FFD700] font-bold text-lg mb-1">Foto</span>
                   <Camera className="w-6 h-6 text-[#FFD700] opacity-50" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-[#FFD700] rounded-full p-2 text-[#2e0249] shadow-md border-2 border-[#4a148c]">
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
          <div className="flex gap-0 mt-4">
             <label className="cursor-pointer bg-gray-200 hover:bg-white text-gray-800 px-4 py-2 rounded-l-sm text-sm font-medium transition-colors">
                Escolher arquivo
                <input type="file" onChange={handleFileChange} className="hidden" />
             </label>
             <div className="bg-[#2e0249] border border-[#570a8a] text-purple-200 px-4 py-2 rounded-r-sm text-sm min-w-[120px] flex items-center justify-center">
                {photoPreview ? "Imagem carregada" : "Nen...lhido"}
             </div>
          </div>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Row 1 - Name (Full Width) */}
          <div className="space-y-1 md:col-span-2">
            <label className="block text-[#FFD700] font-bold text-base">Nome Completo:</label>
            <input 
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full bg-[#2e0249] border-none rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none shadow-inner"
              placeholder="Ex: João Silva"
            />
          </div>

          {/* Row 2 - CPF & Username (Swapped position) */}
          <div className="space-y-1">
            <label className="block text-[#FFD700] font-bold text-base">CPF:</label>
            <input 
              type="text"
              name="cpf"
              value={formData.cpf}
              onChange={handleInputChange}
              placeholder="000.000.000-00"
              maxLength={14}
              className="w-full bg-[#2e0249] border-none rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none shadow-inner"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[#FFD700] font-bold text-base">Nome de Login:</label>
            <input 
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full bg-[#2e0249] border-none rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none shadow-inner"
            />
          </div>
          
          {/* Row 3 - Sector (Moved here) & Spacer */}
          <div className="space-y-1">
            <label className="block text-[#FFD700] font-bold text-base">Setor:</label>
            <select 
              name="sector"
              value={formData.sector}
              onChange={handleInputChange}
              className="w-full bg-[#2e0249] border-none rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none shadow-inner appearance-none"
            >
              <option value="">Selecione...</option>
              <option value="Administração">Administração</option>
              <option value="Vendas">Vendas</option>
              <option value="TI">TI</option>
              <option value="Produção">Produção</option>
              <option value="Montagem Final">Montagem Final</option>
              <option value="Costura">Costura</option>
              <option value="Corte">Corte</option>
              <option value="Bordado">Bordado</option>
              <option value="Triagem">Triagem</option>
            </select>
          </div>
          <div className="hidden md:block"></div> {/* Spacer to fill grid */}

          {/* Row 4 - Address */}
          <div className="space-y-1">
             <label className="block text-[#FFD700] font-bold text-base">Rua:</label>
             <input 
                type="text"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                className="w-full bg-[#2e0249] border-none rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none shadow-inner" 
              />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <label className="block text-[#FFD700] font-bold text-base">Bairro:</label>
                <input 
                  type="text"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleInputChange}
                  className="w-full bg-[#2e0249] border-none rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none shadow-inner" 
                />
             </div>
             <div className="space-y-1">
                <label className="block text-[#FFD700] font-bold text-base">Nº:</label>
                <input 
                  type="text"
                  name="number"
                  value={formData.number}
                  onChange={handleInputChange}
                  className="w-full bg-[#2e0249] border-none rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none shadow-inner" 
                />
             </div>
          </div>

          {/* Row 5 - Password & Confirm Password (Side by side now) */}
          <div className="space-y-1">
            <label className="block text-[#FFD700] font-bold text-base">Senha:</label>
            <input 
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full bg-[#2e0249] border-none rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none shadow-inner"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[#FFD700] font-bold text-base">Confirmar Senha:</label>
            <input 
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full bg-[#2e0249] border-none rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none shadow-inner"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="pt-6 space-y-3">
          <button 
            type="button" 
            onClick={handleSave}
            className="w-full bg-[#FFD700] hover:bg-[#e6c200] text-[#2e0249] font-bold py-3 rounded-md shadow-md transition-colors text-lg uppercase tracking-wide flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Salvar Usuário
          </button>
          <button 
            type="button" 
            onClick={onBackToLogin}
            className="w-full bg-[#2e0249] hover:bg-[#3c0360] border border-[#FFD700] text-[#FFD700] font-medium py-2 rounded-md transition-colors uppercase text-sm"
          >
            Voltar ao Login
          </button>
        </div>
      </form>

       {/* Registered / Online Employees List */}
       <div className="mt-12">
        <h3 className="text-[#FFD700] text-xl font-bold mb-4 pl-2 border-l-4 border-[#FFD700]">Funcionários Cadastrados</h3>
        <div className="bg-[#2e0249] rounded-lg shadow-xl overflow-hidden border border-[#570a8a]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#1b002b] text-[#FFD700]">
                <tr>
                  <th className="p-4 font-bold text-sm uppercase w-20 text-center">Foto</th>
                  <th className="p-4 font-bold text-sm uppercase">Nome</th>
                  <th className="p-4 font-bold text-sm uppercase">CPF</th>
                  <th className="p-4 font-bold text-sm uppercase">Setor</th>
                  <th className="p-4 font-bold text-sm uppercase text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#570a8a]">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#3c0360] transition-colors">
                    <td className="p-3 flex justify-center">
                        <div className="w-10 h-10 rounded-full bg-slate-700 border border-[#FFD700] flex items-center justify-center overflow-hidden">
                            {emp.avatar ? (
                              <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-6 h-6 text-gray-400" />
                            )}
                        </div>
                    </td>
                    <td className="p-4 text-white font-medium">{emp.name}</td>
                    <td className="p-4 text-purple-200">{emp.cpf}</td>
                    <td className="p-4 text-purple-200">{emp.sector}</td>
                    <td className="p-4 flex justify-center gap-3">
                      <button className="text-blue-400 hover:text-blue-300 transition-colors">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(emp.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-[#1b002b] text-center text-xs text-purple-400">
            Exibindo {employees.length} funcionários
          </div>
        </div>
      </div>
    </div>
  );
};
