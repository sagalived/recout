
import React, { useState, useEffect } from 'react';
import { Layers, Trash2, Edit, Save, XCircle } from 'lucide-react';
import { systemStore, Sector } from '../services/storage';

export const SectorForm: React.FC = () => {
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    manager: '',
    description: ''
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [sectors, setSectors] = useState<Sector[]>([]);

  useEffect(() => {
    setSectors(systemStore.getSectors());
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Validation: Name and Manager are mandatory, Description is optional
    if (!formData.name || !formData.manager) {
      alert("Erro: Nome do Setor e Responsável são obrigatórios.");
      return;
    }

    if (editingId) {
        // Update existing
        const updatedSector: Sector = {
            id: editingId,
            name: formData.name,
            manager: formData.manager,
            description: formData.description
        };
        systemStore.updateSector(updatedSector);
        alert("Setor atualizado com sucesso!");
    } else {
        // Create New
        // Duplicate Check
        const isDuplicate = sectors.some(
          sector => sector.name.toLowerCase() === formData.name.toLowerCase()
        );
    
        if (isDuplicate) {
          alert("Erro: Já existe um setor cadastrado com este nome.");
          return;
        }
    
        const newSector: Sector = {
          id: Date.now(),
          name: formData.name,
          manager: formData.manager,
          description: formData.description
        };
        systemStore.addSector(newSector);
        alert("Setor salvo com sucesso!");
    }

    // Update List & Clear Form
    setSectors([...systemStore.getSectors()]); // Force new array reference
    handleCancelEdit();
  };

  const handleEdit = (sector: Sector) => {
      setFormData({
          name: sector.name,
          manager: sector.manager,
          description: sector.description
      });
      setEditingId(sector.id);
  };

  const handleCancelEdit = () => {
      setFormData({
        name: '',
        manager: '',
        description: ''
      });
      setEditingId(null);
  };

  const handleDelete = (id: number) => {
    // Removed window.confirm to ensure action works immediately
    systemStore.removeSector(id);
    setSectors([...systemStore.getSectors()]); // Force new array reference to trigger render
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-[#FFD700] text-2xl font-bold mb-6 border-b border-[#FFD700]/30 pb-2 flex items-center gap-2">
        <Layers className="w-6 h-6" />
        {editingId ? 'Editar Setor' : 'Cadastro de Setor'}
      </h2>
      
      <form className="space-y-6 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
            <label className="block text-[#FFD700] font-bold text-base">Nome do Setor:</label>
            <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: Recursos Humanos" 
                className="w-full bg-[#2e0249] border-none rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none shadow-inner"
            />
            </div>

            <div className="space-y-1">
            <label className="block text-[#FFD700] font-bold text-base">Responsável pelo Setor:</label>
            <input 
                type="text" 
                name="manager"
                value={formData.manager}
                onChange={handleInputChange}
                className="w-full bg-[#2e0249] border-none rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none shadow-inner"
            />
            </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[#FFD700] font-bold text-base">Descrição / Observações:</label>
          <textarea 
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full bg-[#2e0249] border-none rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none shadow-inner h-32 resize-none"
          ></textarea>
        </div>

        <div className="pt-4 flex gap-4">
          <button 
            type="button" 
            onClick={handleSave}
            className={`flex-1 font-bold py-3 rounded-md shadow-md transition-colors text-lg uppercase tracking-wide flex items-center justify-center gap-2 ${editingId ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-[#FFD700] hover:bg-[#e6c200] text-[#2e0249]'}`}
          >
            <Save className="w-5 h-5" />
            {editingId ? 'Atualizar Setor' : 'Salvar Setor'}
          </button>
          
          {editingId && (
              <button 
                type="button" 
                onClick={handleCancelEdit}
                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-md shadow-md transition-colors text-lg uppercase tracking-wide flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Cancelar
              </button>
          )}
        </div>
      </form>

      {/* Registered Sectors List */}
      <div className="mt-12">
        <h3 className="text-[#FFD700] text-xl font-bold mb-4 pl-2 border-l-4 border-[#FFD700]">Setores Cadastrados</h3>
        <div className="bg-[#2e0249] rounded-lg shadow-xl overflow-hidden border border-[#570a8a]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#1b002b] text-[#FFD700]">
                <tr>
                  <th className="p-4 font-bold text-sm uppercase">Nome do Setor</th>
                  <th className="p-4 font-bold text-sm uppercase">Responsável</th>
                  <th className="p-4 font-bold text-sm uppercase">Descrição</th>
                  <th className="p-4 font-bold text-sm uppercase text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#570a8a]">
                {sectors.map((sector) => (
                  <tr key={sector.id} className={`transition-colors ${editingId === sector.id ? 'bg-[#3c0360]' : 'hover:bg-[#3c0360]'}`}>
                    <td className="p-4 text-white font-medium">{sector.name}</td>
                    <td className="p-4 text-purple-200">{sector.manager}</td>
                    <td className="p-4 text-purple-200 text-sm truncate max-w-xs">{sector.description}</td>
                    <td className="p-4 flex justify-center gap-3">
                      <button 
                        onClick={() => handleEdit(sector)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(sector.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Excluir"
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
            Exibindo {sectors.length} setores
          </div>
        </div>
      </div>
    </div>
  );
};
