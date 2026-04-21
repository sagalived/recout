
import React, { useState, useEffect } from 'react';
import { UserCircle, Trash2, Edit, Save } from 'lucide-react';
import { systemStore, Client } from '../services/storage';

export const ClientForm: React.FC = () => {
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    doc: '', // CPF/CNPJ
    email: '',
    contact: '',
    address: ''
  });

  // Clients List State - Loaded from store
  const [clients, setClients] = useState<Client[]>([]);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [editingClientData, setEditingClientData] = useState({
    name: '',
    doc: '',
    email: '',
    contact: '',
    address: ''
  });

  useEffect(() => {
    // Load clients from central storage on mount
    setClients(systemStore.getClients());
  }, []);

  // --- MASK HELPERS ---
  const formatDocument = (value: string) => {
    // Remove non-numeric characters
    const v = value.replace(/\D/g, '');
    
    // If length is greater than 11, assume CNPJ mask
    if (v.length > 11) {
        return v
          .replace(/^(\d{2})(\d)/, '$1.$2')
          .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
          .replace(/\.(\d{3})(\d)/, '.$1/$2')
          .replace(/(\d{4})(\d)/, '$1-$2')
          .slice(0, 18); // Limit to 18 chars (CNPJ format)
    } else {
        // CPF Mask
        return v
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d{1,2})/, '$1-$2')
          .replace(/(-\d{2})\d+?$/, '$1')
          .slice(0, 14); // Limit to 14 chars (CPF format)
    }
  };

  const formatPhone = (value: string) => {
    const v = value.replace(/\D/g, '');
    return v.replace(/^(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .slice(0, 15);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'doc') {
        finalValue = formatDocument(value);
    } else if (name === 'contact') {
        finalValue = formatPhone(value);
    } else if (name === 'email') {
        finalValue = value.toLowerCase().trim();
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSave = () => {
    // Strict Validation: Check ALL fields
    if (!formData.name || !formData.doc || !formData.email || !formData.contact || !formData.address) {
      alert("Erro: Todos os campos são obrigatórios (Nome, CNPJ/CPF, Email, Telefone, Endereço).");
      return;
    }

    // Validation: Check if doc is valid length (14 for CPF or 18 for CNPJ)
    if (formData.doc.length !== 14 && formData.doc.length !== 18) {
        alert("Erro: O documento (CPF ou CNPJ) está incompleto ou inválido.");
        return;
    }

    // Duplicate Check (against store data)
    const isDuplicate = systemStore.getClients().some(
      client => client.doc === formData.doc || client.name.toLowerCase() === formData.name.toLowerCase()
    );

    if (isDuplicate) {
      alert("Erro: Já existe um cliente cadastrado com este Documento ou Nome.");
      return;
    }

    // Create Client
    const newClient: Client = {
      id: Date.now(),
      ...formData
    };

    // Save to Store
    systemStore.addClient(newClient);

    // Update Local View
    setClients([...systemStore.getClients()]);

    // Clear Form
    setFormData({
      name: '',
      doc: '',
      email: '',
      contact: '',
      address: ''
    });

    alert("Cliente salvo com sucesso!");
  };

  const handleDelete = (id: number) => {
    const currentUser = systemStore.getCurrentUser();
    const isAdmin = currentUser?.username?.trim().toLowerCase() === 'admin';
    if (!isAdmin) {
      alert('Somente o administrador pode excluir clientes.');
      return;
    }

    if (!window.confirm('Tem certeza que deseja excluir este cliente?')) return;
    systemStore.removeClient(id);
    setClients([...systemStore.getClients()]); // Force Refresh list with new reference
  };

  const handleStartEdit = (client: Client) => {
    const currentUser = systemStore.getCurrentUser();
    const isAdmin = currentUser?.username?.trim().toLowerCase() === 'admin';
    if (!isAdmin) {
      alert('Somente o administrador pode editar clientes.');
      return;
    }

    setEditingClientId(client.id);
    setEditingClientData({
      name: client.name,
      doc: client.doc,
      email: client.email,
      contact: client.contact,
      address: client.address,
    });
  };

  const handleEditingInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'doc') finalValue = formatDocument(value);
    if (name === 'contact') finalValue = formatPhone(value);
    if (name === 'email') finalValue = value.toLowerCase().trim();

    setEditingClientData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleCancelEdit = () => {
    setEditingClientId(null);
  };

  const handleUpdate = (id: number) => {
    const currentUser = systemStore.getCurrentUser();
    const isAdmin = currentUser?.username?.trim().toLowerCase() === 'admin';
    if (!isAdmin) {
      alert('Somente o administrador pode editar clientes.');
      return;
    }

    if (!editingClientData.name || !editingClientData.doc || !editingClientData.email || !editingClientData.contact || !editingClientData.address) {
      alert('Erro: preencha todos os campos do cliente.');
      return;
    }

    const duplicate = systemStore.getClients().some(c =>
      c.id !== id && (
        c.doc.trim().toLowerCase() === editingClientData.doc.trim().toLowerCase() ||
        c.name.trim().toLowerCase() === editingClientData.name.trim().toLowerCase()
      )
    );

    if (duplicate) {
      alert('Erro: já existe outro cliente com este nome ou documento.');
      return;
    }

    systemStore.updateClient({
      id,
      name: editingClientData.name.trim(),
      doc: editingClientData.doc.trim(),
      email: editingClientData.email.trim(),
      contact: editingClientData.contact.trim(),
      address: editingClientData.address.trim(),
    });

    setClients([...systemStore.getClients()]);
    setEditingClientId(null);
    alert('Cliente atualizado com sucesso!');
  };

  const currentUser = systemStore.getCurrentUser();
  const isAdmin = currentUser?.username?.trim().toLowerCase() === 'admin';

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-[#FFD700] text-2xl font-bold mb-6 border-b border-[#FFD700]/30 pb-2 flex items-center gap-2">
        <UserCircle className="w-6 h-6" />
        Cadastro de Cliente
      </h2>
      
      <form className="space-y-6 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block text-[#FFD700] font-bold text-base">Nome do Cliente:</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full bg-[#2e0249] border-none rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none shadow-inner"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[#FFD700] font-bold text-base">CNPJ/CPF:</label>
            <input 
              type="text" 
              name="doc"
              value={formData.doc}
              onChange={handleInputChange}
              placeholder="00.000.000/0000-00"
              maxLength={18}
              className="w-full bg-[#2e0249] border-none rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none shadow-inner"
            />
          </div>
          
          <div className="space-y-1">
            <label className="block text-[#FFD700] font-bold text-base">Email de Contato:</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="exemplo@empresa.com"
              className="w-full bg-[#2e0249] border-none rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none shadow-inner"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[#FFD700] font-bold text-base">Telefone:</label>
            <input 
              type="tel" 
              name="contact"
              value={formData.contact}
              onChange={handleInputChange}
              placeholder="(00) 90000-0000"
              className="w-full bg-[#2e0249] border-none rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none shadow-inner"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[#FFD700] font-bold text-base">Endereço Completo:</label>
          <textarea 
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="w-full bg-[#2e0249] border-none rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none shadow-inner h-24 resize-none"
          ></textarea>
        </div>

        <div className="pt-4">
          <button 
            type="button" 
            onClick={handleSave}
            className="w-full bg-[#FFD700] hover:bg-[#e6c200] text-[#2e0249] font-bold py-3 rounded-md shadow-md transition-colors text-lg uppercase tracking-wide flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Salvar Cliente
          </button>
        </div>
      </form>

      {/* Registered Clients List */}
      <div className="mt-12">
        <h3 className="text-[#FFD700] text-xl font-bold mb-4 pl-2 border-l-4 border-[#FFD700]">Clientes Cadastrados</h3>
        <div className="bg-[#2e0249] rounded-lg shadow-xl overflow-hidden border border-[#570a8a]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#1b002b] text-[#FFD700]">
                <tr>
                  <th className="p-4 font-bold text-sm uppercase">Nome</th>
                  <th className="p-4 font-bold text-sm uppercase">Documento</th>
                  <th className="p-4 font-bold text-sm uppercase">Contato</th>
                  <th className="p-4 font-bold text-sm uppercase text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#570a8a]">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-[#3c0360] transition-colors">
                    <td className="p-4 text-white font-medium">
                      {editingClientId === client.id ? (
                        <div className="space-y-2">
                          <input name="name" value={editingClientData.name} onChange={handleEditingInputChange} className="w-full bg-[#1b002b] border border-[#570a8a] rounded px-2 py-1 text-sm text-white" />
                          <input name="email" value={editingClientData.email} onChange={handleEditingInputChange} className="w-full bg-[#1b002b] border border-[#570a8a] rounded px-2 py-1 text-xs text-purple-200" />
                        </div>
                      ) : (
                        <>
                          {client.name}
                          <div className="text-xs text-purple-300 opacity-70">{client.email}</div>
                        </>
                      )}
                    </td>
                    <td className="p-4 text-purple-200">
                      {editingClientId === client.id ? (
                        <input name="doc" value={editingClientData.doc} onChange={handleEditingInputChange} className="w-full bg-[#1b002b] border border-[#570a8a] rounded px-2 py-1 text-sm text-purple-200" />
                      ) : client.doc}
                    </td>
                    <td className="p-4 text-purple-200">
                      {editingClientId === client.id ? (
                        <input name="contact" value={editingClientData.contact} onChange={handleEditingInputChange} className="w-full bg-[#1b002b] border border-[#570a8a] rounded px-2 py-1 text-sm text-purple-200" />
                      ) : client.contact}
                    </td>
                    <td className="p-4 flex justify-center gap-3">
                      {editingClientId === client.id ? (
                        <>
                          <button onClick={() => handleUpdate(client.id)} className="text-emerald-400 hover:text-emerald-300 transition-colors" title="Salvar edição">
                            <Save className="w-5 h-5" />
                          </button>
                          <button onClick={handleCancelEdit} className="text-gray-300 hover:text-white transition-colors" title="Cancelar edição">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleStartEdit(client)} disabled={!isAdmin} className={`transition-colors ${isAdmin ? 'text-blue-400 hover:text-blue-300' : 'text-gray-500 cursor-not-allowed'}`} title={isAdmin ? 'Editar cliente' : 'Somente administrador pode editar'}>
                            <Edit className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(client.id)}
                            disabled={!isAdmin}
                            className={`transition-colors ${isAdmin ? 'text-red-400 hover:text-red-300' : 'text-gray-500 cursor-not-allowed'}`}
                            title={isAdmin ? 'Excluir cliente' : 'Somente administrador pode excluir'}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-[#1b002b] text-center text-xs text-purple-400">
            Exibindo {clients.length} registros
          </div>
        </div>
      </div>
    </div>
  );
};
