
import React, { useState, useEffect } from 'react';
import { Package, Trash2, Edit, Save, UserCircle, UserPlus, X as CloseIcon } from 'lucide-react';
import { systemStore, Product, Client } from '../services/storage';

export const ProductForm: React.FC = () => {
  const [generatedCode, setGeneratedCode] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingProductData, setEditingProductData] = useState({
    name: '',
    client: '',
    sector: 'Triagem',
    deliveryDeadline: ''
  });
  const [clientFormData, setClientFormData] = useState({
    name: '',
    doc: '',
    contact: '',
    email: '',
    address: ''
  });
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    initialSector: 'Triagem',
    deliveryDeadline: ''
  });

  useEffect(() => {
    // Initial Load
    setProducts([...systemStore.getProducts()]); // Load copy
    setClients(systemStore.getClients());
    generateNewCode(); // Generate first code on mount
  }, []);

  const generateNewCode = () => {
    const allProducts = systemStore.getProducts();
    let maxId = 0;
    
    // Find the highest numeric ID currently in use
    allProducts.forEach(p => {
        // Remove non-numeric characters just in case, though we expect clean IDs
        const cleanCode = p.code.replace(/\D/g, '');
        const num = parseInt(cleanCode);
        if (!isNaN(num) && num > maxId) {
            maxId = num;
        }
    });

    // Calculate next ID (Start at 1001 if list is empty or has only low numbers/text)
    const nextId = maxId > 0 ? maxId + 1 : 1001;
    
    setGeneratedCode(nextId.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClientInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setClientFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuickClientSave = () => {
    const { name, doc, contact, email, address } = clientFormData;

    if (!name.trim() || !doc.trim() || !contact.trim() || !email.trim() || !address.trim()) {
      alert('Erro: Preencha todos os campos do cliente.');
      return;
    }

    const duplicate = systemStore.getClients().some(
      c => c.name.trim().toLowerCase() === name.trim().toLowerCase() || c.doc.trim().toLowerCase() === doc.trim().toLowerCase()
    );

    if (duplicate) {
      alert('Erro: Já existe um cliente com este nome ou documento.');
      return;
    }

    const newClient: Client = {
      id: Date.now(),
      name: name.trim(),
      doc: doc.trim(),
      contact: contact.trim(),
      email: email.trim(),
      address: address.trim()
    };

    systemStore.addClient(newClient);
    const updatedClients = [...systemStore.getClients()];
    setClients(updatedClients);
    setFormData(prev => ({ ...prev, client: newClient.name }));

    setClientFormData({
      name: '',
      doc: '',
      contact: '',
      email: '',
      address: ''
    });
    setShowClientModal(false);
    alert('Cliente cadastrado com sucesso!');
  };

  const handleSave = () => {
    if (!formData.name || !formData.client || !formData.initialSector || !formData.deliveryDeadline) {
      alert("Erro: Todos os campos são obrigatórios (Nome do Produto, Cliente, Setor Inicial e Prazo de Entrega).");
      return;
    }

    const newProduct: Product = {
      id: Date.now(),
      name: formData.name,
      code: generatedCode,
      client: formData.client,
      sector: formData.initialSector,
      deliveryDeadline: formData.deliveryDeadline
    };

    // Save to Store
    systemStore.addProduct(newProduct);
    
    // Update local state with a NEW array reference to trigger React re-render
    setProducts([...systemStore.getProducts()]);

    // Clear Form
    setFormData({
      name: '',
      client: '',
      initialSector: 'Triagem',
      deliveryDeadline: ''
    });
    
    // Force generate new code for the next entry immediately
    // We call this inside a timeout to ensure it runs after the state update has processed the previous ID
    setTimeout(() => {
        generateNewCode();
    }, 50);
    
    alert("Produto cadastrado com sucesso!");
  };

  const handleDelete = (id: number) => {
    try {
    const currentUser = systemStore.getCurrentUser();
    const isAdmin = currentUser?.username?.trim().toLowerCase() === 'admin';
    if (!isAdmin) {
      alert('Somente o administrador pode excluir produtos.');
      return;
    }

    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      systemStore.removeProduct(id);
      setProducts([...systemStore.getProducts()]); // Refresh with new reference
      // Regenerate code in case we deleted the last one (optional, but keeps sequence tight)
      setTimeout(generateNewCode, 50);
    }
    } catch (error) {
      console.error('Falha ao excluir produto:', error);
      alert('Não foi possível excluir o produto.');
    }
  };

  const handleStartEdit = (product: Product) => {
    const currentUser = systemStore.getCurrentUser();
    const isAdmin = currentUser?.username?.trim().toLowerCase() === 'admin';
    if (!isAdmin) {
      alert('Somente o administrador pode editar produtos.');
      return;
    }

    setEditingProductId(product.id);
    setEditingProductData({
      name: product.name || '',
      client: product.client || '',
      sector: product.sector || 'Triagem',
      deliveryDeadline: product.deliveryDeadline || ''
    });
  };

  const handleEditingProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditingProductData(prev => ({ ...prev, [name]: value }));
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
  };

  const handleUpdate = (productId: number) => {
    const currentUser = systemStore.getCurrentUser();
    const isAdmin = currentUser?.username?.trim().toLowerCase() === 'admin';
    if (!isAdmin) {
      alert('Somente o administrador pode editar produtos.');
      return;
    }

    const normalized = {
      name: String(editingProductData.name || '').trim(),
      client: String(editingProductData.client || '').trim(),
      sector: String(editingProductData.sector || '').trim(),
      deliveryDeadline: String(editingProductData.deliveryDeadline || '').trim(),
    };

    if (!normalized.name || !normalized.client || !normalized.sector || !normalized.deliveryDeadline) {
      alert('Erro: preencha nome, cliente, setor e prazo.');
      return;
    }

    const original = products.find(p => p.id === productId);
    if (!original) return;

    systemStore.updateProduct({
      ...original,
      name: normalized.name,
      client: normalized.client,
      sector: normalized.sector,
      deliveryDeadline: normalized.deliveryDeadline,
    });

    setProducts([...systemStore.getProducts()]);
    setEditingProductId(null);
    alert('Produto atualizado com sucesso!');
  };

  const currentUser = systemStore.getCurrentUser();
  const isAdmin = currentUser?.username?.trim().toLowerCase() === 'admin';

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-[#FFD700] text-2xl font-bold mb-6 border-b border-[#FFD700]/30 pb-2 flex items-center gap-2">
        <Package className="w-6 h-6" />
        Cadastro de Produto
      </h2>
      
      <form className="space-y-6 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Name */}
          <div className="space-y-1">
            <label className="block text-[#FFD700] font-bold text-base">Nome do Produto:</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full bg-[#2e0249] border-none rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none shadow-inner placeholder-purple-300/30" 
              placeholder="Ex: Camiseta Estampada"
            />
          </div>

          {/* Unique ID (Auto-generated) */}
          <div className="space-y-1">
            <label className="block text-[#FFD700] font-bold text-base">ID Único (Peça):</label>
            <input 
                type="text" 
                value={generatedCode}
                readOnly
                className="w-full bg-[#1b002b] border border-[#570a8a] rounded-md p-3 text-white cursor-not-allowed shadow-inner font-mono tracking-widest font-bold text-lg"
            />
            <p className="text-[10px] text-purple-300 mt-1 opacity-80">* Gerado sequencialmente. Vinculado ao cliente.</p>
          </div>
          
          {/* Client */}
          <div className="space-y-1">
            <label className="block text-[#FFD700] font-bold text-base">Cliente:</label>
            <select 
              name="client"
              value={formData.client}
              onChange={handleInputChange}
              className="w-full bg-[#2e0249] border-none rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none shadow-inner appearance-none cursor-pointer"
            >
              <option value="">Selecione o Cliente...</option>
              {clients.length > 0 ? (
                clients.map(client => (
                  <option key={client.id} value={client.name}>{client.name}</option>
                ))
              ) : (
                <option value="" disabled>Nenhum cliente cadastrado</option>
              )}
            </select>
            <button
              type="button"
              onClick={() => setShowClientModal(true)}
              className="mt-2 text-xs text-[#FFD700] hover:text-white font-semibold transition-colors inline-flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Não localizou o cliente? Cadastrar cliente
            </button>
          </div>

          {/* Initial Sector */}
          <div className="space-y-1">
            <label className="block text-[#FFD700] font-bold text-base">Setor Inicial:</label>
            <input 
              type="text" 
              name="initialSector"
              value={formData.initialSector}
              onChange={handleInputChange}
              className="w-full bg-[#2e0249] border-none rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none shadow-inner placeholder-purple-300/30" 
              placeholder="Ex: Triagem"
            />
            <p className="text-[10px] text-purple-300 mt-1 opacity-80">Padrão: Triagem</p>
          </div>

          <div className="space-y-1">
            <label className="block text-[#FFD700] font-bold text-base">Prazo de Entrega:</label>
            <input
              type="date"
              name="deliveryDeadline"
              value={formData.deliveryDeadline}
              onChange={handleInputChange}
              className="w-full bg-[#2e0249] border-none rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none shadow-inner"
            />
            <p className="text-[10px] text-purple-300 mt-1 opacity-80">Usado para previsão e alerta de prazo estourado.</p>
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="button" 
            onClick={handleSave}
            className="w-full bg-[#FFD700] hover:bg-[#e6c200] text-[#2e0249] font-bold py-3 rounded-md shadow-md transition-colors text-lg uppercase tracking-wide flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Cadastrar Produto
          </button>
        </div>
      </form>

      {/* Registered Products List */}
      <div className="mt-12">
        <h3 className="text-[#FFD700] text-xl font-bold mb-4 pl-2 border-l-4 border-[#FFD700]">Produtos Cadastrados</h3>
        <div className="bg-[#2e0249] rounded-lg shadow-xl overflow-hidden border border-[#570a8a]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#1b002b] text-[#FFD700]">
                <tr>
                  <th className="p-4 font-bold text-sm uppercase">Produto</th>
                  <th className="p-4 font-bold text-sm uppercase">ID Único</th>
                  <th className="p-4 font-bold text-sm uppercase">Setor Atual</th>
                  <th className="p-4 font-bold text-sm uppercase">Cliente</th>
                  <th className="p-4 font-bold text-sm uppercase">Prazo</th>
                  <th className="p-4 font-bold text-sm uppercase text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#570a8a]">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-[#3c0360] transition-colors">
                    <td className="p-4 text-white font-medium">
                      {editingProductId === product.id ? (
                        <input name="name" value={editingProductData.name} onChange={handleEditingProductChange} className="w-full bg-[#1b002b] border border-[#570a8a] rounded px-2 py-1 text-sm text-white" />
                      ) : product.name}
                    </td>
                    <td className="p-4 text-purple-200 font-mono text-sm font-bold">{product.code}</td>
                    <td className="p-4">
                      {editingProductId === product.id ? (
                        <select name="sector" value={editingProductData.sector} onChange={handleEditingProductChange} className="w-full bg-[#1b002b] border border-[#570a8a] rounded px-2 py-1 text-sm text-purple-200">
                          <option value="Triagem">Triagem</option>
                          <option value="CAD">CAD</option>
                          <option value="CAM">CAM</option>
                          <option value="Freezagem">Freezagem</option>
                          <option value="Acabamento">Acabamento</option>
                        </select>
                      ) : (
                        <span className="bg-purple-900 text-purple-200 px-2 py-1 rounded text-xs border border-purple-700">
                          {product.sector}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-purple-200 text-sm flex items-center gap-2">
                        {editingProductId === product.id ? (
                          <select name="client" value={editingProductData.client} onChange={handleEditingProductChange} className="w-full bg-[#1b002b] border border-[#570a8a] rounded px-2 py-1 text-sm text-purple-200">
                            <option value="">Selecione o cliente...</option>
                            {clients.map(client => (
                              <option key={client.id} value={client.name}>{client.name}</option>
                            ))}
                          </select>
                        ) : (
                          <>
                            <UserCircle className="w-3 h-3 opacity-70" />
                            {product.client}
                          </>
                        )}
                    </td>
                    <td className="p-4 text-sm">
                      {editingProductId === product.id ? (
                        <input name="deliveryDeadline" type="date" value={editingProductData.deliveryDeadline} onChange={handleEditingProductChange} className="w-full bg-[#1b002b] border border-[#570a8a] rounded px-2 py-1 text-sm text-purple-200" />
                      ) : (
                        product.deliveryDeadline ? (
                          <span className={`px-2 py-1 rounded text-xs border ${new Date(product.deliveryDeadline).getTime() < new Date(new Date().toDateString()).getTime() ? 'bg-red-900/40 text-red-300 border-red-700' : 'bg-emerald-900/40 text-emerald-300 border-emerald-700'}`}>
                            {new Date(product.deliveryDeadline).toLocaleDateString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Sem prazo</span>
                        )
                      )}
                    </td>
                    <td className="p-4 flex justify-center gap-3">
                      {editingProductId === product.id ? (
                        <>
                          <button type="button" onClick={() => handleUpdate(product.id)} className="text-emerald-400 hover:text-emerald-300 transition-colors" title="Salvar edição">
                            <Save className="w-5 h-5" />
                          </button>
                          <button type="button" onClick={handleCancelEdit} className="text-gray-300 hover:text-white transition-colors" title="Cancelar edição">
                            <CloseIcon className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => handleStartEdit(product)} disabled={!isAdmin} className={`transition-colors ${isAdmin ? 'text-blue-400 hover:text-blue-300' : 'text-gray-500 cursor-not-allowed'}`} title={isAdmin ? 'Editar produto' : 'Somente administrador pode editar'}>
                            <Edit className="w-5 h-5" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            disabled={!isAdmin}
                            className={`transition-colors ${isAdmin ? 'text-red-400 hover:text-red-300' : 'text-gray-500 cursor-not-allowed'}`}
                            title={isAdmin ? 'Excluir produto' : 'Somente administrador pode excluir'}
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
            <div className="p-3 bg-[#1b002b] text-center text-xs text-purple-400 border-t border-[#570a8a]">
                Exibindo {products.length} registros
            </div>
          </div>
        </div>
      </div>

      {showClientModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl bg-[#2e0249] border border-[#FFD700] rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#570a8a] bg-[#4a148c]">
              <h3 className="text-[#FFD700] text-lg font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Cadastrar Cliente
              </h3>
              <button
                type="button"
                onClick={() => setShowClientModal(false)}
                className="text-gray-300 hover:text-white transition-colors"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[#FFD700] font-bold text-sm">Nome</label>
                  <input
                    type="text"
                    name="name"
                    value={clientFormData.name}
                    onChange={handleClientInputChange}
                    className="w-full bg-[#1b002b] border border-[#570a8a] rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none"
                    placeholder="Ex: Cliente XPTO"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[#FFD700] font-bold text-sm">Documento (CPF/CNPJ)</label>
                  <input
                    type="text"
                    name="doc"
                    value={clientFormData.doc}
                    onChange={handleClientInputChange}
                    className="w-full bg-[#1b002b] border border-[#570a8a] rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none"
                    placeholder="Ex: 00.000.000/0001-00"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[#FFD700] font-bold text-sm">Telefone</label>
                  <input
                    type="text"
                    name="contact"
                    value={clientFormData.contact}
                    onChange={handleClientInputChange}
                    className="w-full bg-[#1b002b] border border-[#570a8a] rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none"
                    placeholder="Ex: (11) 99999-9999"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[#FFD700] font-bold text-sm">E-mail</label>
                  <input
                    type="email"
                    name="email"
                    value={clientFormData.email}
                    onChange={handleClientInputChange}
                    className="w-full bg-[#1b002b] border border-[#570a8a] rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none"
                    placeholder="Ex: cliente@empresa.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[#FFD700] font-bold text-sm">Endereço</label>
                <textarea
                  name="address"
                  value={clientFormData.address}
                  onChange={handleClientInputChange}
                  className="w-full bg-[#1b002b] border border-[#570a8a] rounded-md p-3 text-white focus:ring-2 focus:ring-[#FFD700] focus:outline-none h-24 resize-none"
                  placeholder="Ex: Rua Exemplo, 123 - Centro"
                />
              </div>
            </div>

            <div className="px-6 pb-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClientModal(false)}
                className="px-4 py-2 rounded-md border border-[#570a8a] text-white hover:bg-[#3c0360] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleQuickClientSave}
                className="px-5 py-2 rounded-md bg-[#FFD700] hover:bg-[#e6c200] text-[#2e0249] font-bold transition-colors"
              >
                Salvar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
