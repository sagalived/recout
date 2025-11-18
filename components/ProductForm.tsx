
import React, { useState, useEffect } from 'react';
import { Package, Trash2, Edit, Save, UserCircle } from 'lucide-react';
import { systemStore, Product, Client } from '../services/storage';

export const ProductForm: React.FC = () => {
  const [generatedCode, setGeneratedCode] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    initialSector: 'Triagem'
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

  const handleSave = () => {
    if (!formData.name || !formData.client || !formData.initialSector) {
      alert("Erro: Todos os campos são obrigatórios (Nome do Produto, Cliente, Setor Inicial).");
      return;
    }

    const newProduct: Product = {
      id: Date.now(),
      name: formData.name,
      code: generatedCode,
      client: formData.client,
      sector: formData.initialSector
    };

    // Save to Store
    systemStore.addProduct(newProduct);
    
    // Update local state with a NEW array reference to trigger React re-render
    setProducts([...systemStore.getProducts()]);

    // Clear Form
    setFormData({
      name: '',
      client: '',
      initialSector: 'Triagem'
    });
    
    // Force generate new code for the next entry immediately
    // We call this inside a timeout to ensure it runs after the state update has processed the previous ID
    setTimeout(() => {
        generateNewCode();
    }, 50);
    
    alert("Produto cadastrado com sucesso!");
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      systemStore.removeProduct(id);
      setProducts([...systemStore.getProducts()]); // Refresh with new reference
      // Regenerate code in case we deleted the last one (optional, but keeps sequence tight)
      setTimeout(generateNewCode, 50);
    }
  };

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
                  <th className="p-4 font-bold text-sm uppercase text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#570a8a]">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-[#3c0360] transition-colors">
                    <td className="p-4 text-white font-medium">{product.name}</td>
                    <td className="p-4 text-purple-200 font-mono text-sm font-bold">{product.code}</td>
                    <td className="p-4">
                      <span className="bg-purple-900 text-purple-200 px-2 py-1 rounded text-xs border border-purple-700">
                        {product.sector}
                      </span>
                    </td>
                    <td className="p-4 text-purple-200 text-sm flex items-center gap-2">
                        <UserCircle className="w-3 h-3 opacity-70" />
                        {product.client}
                    </td>
                    <td className="p-4 flex justify-center gap-3">
                      <button className="text-blue-400 hover:text-blue-300 transition-colors">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
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
    </div>
  );
};
