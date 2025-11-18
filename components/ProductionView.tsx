
import React, { useState, useEffect } from 'react';
import { Factory, Play, CheckCircle, RotateCcw, X, ChevronRight, Box, Users } from 'lucide-react';
import { systemStore, Product, Employee, ProductionSession } from '../services/storage';

export const ProductionView: React.FC = () => {
  // Load data from store
  const [registeredParts, setRegisteredParts] = useState<Product[]>([]);
  const [availableSectors, setAvailableSectors] = useState<string[]>([]);

  // Form State
  const [employeeName, setEmployeeName] = useState('');
  const [clientName, setClientName] = useState('');
  const [partName, setPartName] = useState(''); 
  const [partId, setPartId] = useState('');     
  const [currentSector, setCurrentSector] = useState('');
  const [nextSector, setNextSector] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  // Timer & Process State
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [processId, setProcessId] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  
  // Internal Start/Stop Timestamps
  const [startTime, setStartTime] = useState<number>(0);
  const [stopTime, setStopTime] = useState<number | null>(null);

  // Modal State
  const [showSectorModal, setShowSectorModal] = useState<'current' | 'next' | null>(null);
  const [showPartModal, setShowPartModal] = useState(false);

  // Initialization & Persistence Restoration
  useEffect(() => {
    const products = systemStore.getProducts();
    setRegisteredParts(products);

    // Load Sectors Dynamically
    const sectors = systemStore.getSectors().map(s => s.name);
    setAvailableSectors(sectors);

    // Lock to Current User
    const currentUser = systemStore.getCurrentUser();
    if (currentUser) {
        setEmployeeName(currentUser.name);
        setCurrentSector(currentUser.sector); // Default to user's sector
        setSelectedAvatar(currentUser.avatar);
    }

    // Check for active session
    const savedSession = systemStore.getCurrentSession();

    if (savedSession) {
        // Restore State - But keep employee locked to current user if logic dictates, 
        // or allow session restoration if user is same. For now, session takes precedence if exists.
        if (savedSession.employeeName === currentUser?.name) {
             setClientName(savedSession.clientName);
             setPartName(savedSession.partName);
             setPartId(savedSession.partId);
             setCurrentSector(savedSession.currentSector);
             setNextSector(savedSession.nextSector);
             setProcessId(savedSession.processId);
             setIsRunning(savedSession.isRunning);
             setIsFinished(savedSession.isFinished);
             setStartTime(savedSession.startTime);
             setStopTime(savedSession.stopTime);

            // Recalculate elapsed time instantly
            if (savedSession.isRunning) {
                setElapsedTime(Math.floor((Date.now() - savedSession.startTime) / 1000));
            } else if (savedSession.isFinished && savedSession.stopTime) {
                setElapsedTime(Math.floor((savedSession.stopTime - savedSession.startTime) / 1000));
            }
        } else {
            // If stored session user is different from current user (rare case of logout/login without clear),
            // we should probably clear the session or strictly enforce current user.
            // Enforcing current user defaults:
            systemStore.clearCurrentSession();
        }
    }
  }, []);

  // Save state to store whenever relevant data changes
  useEffect(() => {
      const session: ProductionSession = {
          employeeName,
          clientName,
          partName,
          partId,
          currentSector,
          nextSector,
          selectedAvatar,
          processId,
          isRunning,
          isFinished,
          startTime,
          stopTime
      };
      systemStore.saveCurrentSession(session);
  }, [employeeName, clientName, partName, partId, currentSector, nextSector, selectedAvatar, processId, isRunning, isFinished, startTime, stopTime]);


  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const formatTime = (totalSeconds: number) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handlers
  const handleSelectPart = (part: Product) => {
    setPartId(part.code);
    setPartName(part.name);
    setClientName(part.client);
    setShowPartModal(false);
  };

  const handleSectorSearch = (type: 'current' | 'next') => {
    // Refresh sectors just in case
    const sectors = systemStore.getSectors().map(s => s.name);
    setAvailableSectors(sectors);
    setShowSectorModal(type);
  };

  const handleSelectSector = (sector: string) => {
    if (showSectorModal === 'current') {
      setCurrentSector(sector);
    } else {
      setNextSector(sector);
    }
    setShowSectorModal(null);
  };

  const handleStartProduction = () => {
    if (!partId || !clientName) return;

    const now = Date.now();
    setStartTime(now);
    setProcessId(partId); // Use Original ID
    setIsRunning(true);
    setIsFinished(false);
    
    systemStore.startProduction({
        id: partId, 
        employeeName: employeeName,
        avatar: selectedAvatar,
        partName: partName,
        partCode: partId,
        currentSector: currentSector,
        startTime: now,
        status: 'working',
        dailyCount: 0 
    });
  };

  const handleNextSector = () => {
    const now = Date.now();
    setStopTime(now);
    setIsRunning(false);
    setIsFinished(true);
    
    if (nextSector) {
        systemStore.updateProductionSector(partId, nextSector);
    }
    systemStore.finishProduction(partId);
  };

  const handleReset = () => {
    systemStore.clearCurrentSession();
    setIsRunning(false);
    setIsFinished(false);
    setElapsedTime(0);
    setStartTime(0);
    setStopTime(null);
    setProcessId('');
    setPartId('');
    setPartName('');
    setClientName('');
    setNextSector('');
    
    // Re-assert current user sector if needed
    const currentUser = systemStore.getCurrentUser();
    if (currentUser) setCurrentSector(currentUser.sector);
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 relative pb-20">
      <h2 className="text-[#FFD700] text-2xl font-bold mb-8 border-b border-[#FFD700]/30 pb-2 flex items-center gap-2">
        <Factory className="w-6 h-6" />
        Controle de Produção
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Form Fields */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Light Input Fields Group */}
            <div className="space-y-6">
                <div>
                    <label className="block text-white text-lg mb-1">Funcionário:</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={employeeName}
                            readOnly
                            className="w-full bg-[#e2e8f0] border-none rounded-sm p-3 text-gray-800 focus:outline-none font-bold cursor-not-allowed opacity-80" 
                            placeholder="Funcionário Logado"
                        />
                        {/* Search button removed as requested */}
                    </div>
                </div>

                <div>
                    <label className="block text-white text-lg mb-1">Nome do Cliente:</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={clientName}
                            readOnly
                            className="w-full bg-[#e2e8f0] border-none rounded-sm p-3 text-gray-800 focus:outline-none placeholder-gray-500 font-medium" 
                            placeholder="Cliente solicitante (Preenchido automaticamente)" 
                        />
                        <button disabled className="bg-gray-600 text-white text-xs px-4 py-1 rounded-sm cursor-not-allowed shadow-md font-medium opacity-70">
                            Automático
                        </button>
                    </div>
                </div>
            </div>

            {/* Dark Input Fields Group */}
            <div className="space-y-6 pt-4">
                <div>
                    <label className="block text-white text-lg mb-1">Peça:</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={partName}
                            readOnly
                            onClick={() => !isRunning && setShowPartModal(true)}
                            className={`w-full border border-[#570a8a] rounded-sm p-3 text-white focus:outline-none shadow-inner placeholder-purple-300/50 ${isRunning ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                            placeholder="Selecione a peça..." 
                            style={{ backgroundColor: '#3b0764' }} 
                        />
                        <button 
                            onClick={() => setShowPartModal(true)}
                            disabled={isRunning}
                            className={`bg-gray-600 hover:bg-gray-500 text-white text-xs px-4 py-1 rounded-sm transition-colors shadow-md font-medium ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Buscar
                        </button>
                    </div>
                    {partId && <p className="text-xs text-purple-300 mt-1 pl-1 font-mono">ID Original: {partId}</p>}
                </div>

                <div>
                    <label className="block text-white text-lg mb-1">Setor Atual:</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={currentSector}
                            readOnly
                            className="w-full border border-[#570a8a] rounded-sm p-3 text-white focus:outline-none shadow-inner placeholder-purple-300/50 cursor-pointer" 
                            placeholder="Setor onde a peça esta" 
                            style={{ backgroundColor: '#3b0764' }}
                            onClick={() => !isRunning && handleSectorSearch('current')}
                        />
                        <button 
                            onClick={() => handleSectorSearch('current')}
                            disabled={isRunning}
                            className={`bg-gray-600 hover:bg-gray-500 text-white text-xs px-4 py-1 rounded-sm transition-colors shadow-md font-medium ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Buscar
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-white text-lg mb-1">Próximo Setor:</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={nextSector}
                            readOnly
                            className="w-full border border-[#570a8a] rounded-sm p-3 text-white focus:outline-none shadow-inner placeholder-purple-300/50 cursor-pointer" 
                            placeholder="Para onde a peça vai" 
                            style={{ backgroundColor: '#3b0764' }}
                            onClick={() => handleSectorSearch('next')}
                        />
                        <button 
                            onClick={() => handleSectorSearch('next')}
                            className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-4 py-1 rounded-sm transition-colors shadow-md font-medium"
                        >
                            Buscar
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Full Width Action Button Row */}
            <div className="pt-4">
                 {!isRunning && !isFinished ? (
                     <button 
                        onClick={handleStartProduction}
                        disabled={!partId || !partName || !employeeName}
                        className={`w-full font-bold py-4 rounded-md shadow-lg transition-all text-lg flex items-center justify-center gap-3 uppercase tracking-wide ${(!partId || !partName || !employeeName) ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-[#FFD700] hover:bg-[#e6c200] text-[#2e0249] hover:scale-[1.01]'}`}
                    >
                        <Play className="w-6 h-6" /> Iniciar Produção
                    </button>
                 ) : (
                    <div className="flex flex-col gap-3">
                         <button 
                            onClick={handleNextSector}
                            disabled={!isRunning}
                            className={`w-full font-bold py-4 rounded-md shadow-lg transition-all text-xl flex items-center justify-center gap-3 uppercase tracking-wide ${!isRunning ? 'hidden' : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-[1.01]'}`}
                        >
                            <CheckCircle className="w-6 h-6" /> Próximo Setor
                        </button>
                        
                        {isFinished && (
                             <button 
                                onClick={handleReset}
                                className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-4 rounded-md shadow-lg transition-colors text-lg flex items-center justify-center gap-2 uppercase tracking-wide"
                            >
                                <RotateCcw className="w-5 h-5" /> Novo Processo
                            </button>
                        )}
                    </div>
                 )}
            </div>
        </div>

        {/* Right Column - Technical Details Box */}
        <div className="lg:col-span-1">
            <div className="border-2 border-dashed border-[#FFD700] rounded-lg p-6 bg-[#2e0249]/50 h-fit sticky top-6 shadow-2xl relative">
                <h3 className="text-[#FFD700] text-2xl font-bold text-center mb-8 drop-shadow-md">Detalhes Técnicos</h3>
                
                <div className="space-y-8">
                    <div>
                        <label className="block text-white text-lg mb-2 font-medium">ID (Processo)</label>
                        <div className="w-full bg-[#e2e8f0] rounded-md p-4 text-gray-900 font-mono text-center font-bold text-xl shadow-inner tracking-wider min-h-[60px] flex items-center justify-center break-all">
                             {processId || <span className="text-gray-800 text-base font-mono font-bold opacity-60">Aguardando Início...</span>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-white text-lg mb-2 font-medium">Tempo Decorrido</label>
                        <div className={`w-full rounded-md p-6 text-center shadow-inner transition-colors duration-300 bg-[#e2e8f0]`}>
                            <div className={`text-4xl font-mono font-bold tracking-widest ${isRunning ? 'text-gray-900' : isFinished ? 'text-emerald-600' : 'text-gray-800'}`}>
                                {formatTime(elapsedTime)}
                            </div>
                        </div>
                        {isFinished && (
                            <div className="mt-4 bg-emerald-900/50 border border-emerald-500/50 rounded p-3 text-center animate-pulse">
                                <p className="text-emerald-400 font-bold uppercase tracking-wide">Processo Registrado</p>
                                <p className="text-emerald-200 text-xs mt-1">Dashboard Atualizado</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Sector Selection Modal */}
      {showSectorModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-[#2e0249] border-2 border-[#FFD700] rounded-lg shadow-2xl max-w-md w-full animate-in zoom-in duration-300">
            <div className="flex items-center justify-between p-4 border-b border-[#570a8a]">
              <h3 className="text-[#FFD700] text-lg font-bold">
                Selecionar {showSectorModal === 'current' ? 'Setor Atual' : 'Próximo Setor'}
              </h3>
              <button 
                onClick={() => setShowSectorModal(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-2 max-h-[60vh] overflow-y-auto">
              {availableSectors.length > 0 ? (
                availableSectors.map((sector) => (
                <button
                  key={sector}
                  onClick={() => handleSelectSector(sector)}
                  className="w-full text-left p-3 hover:bg-[#3c0360] text-white border-b border-[#570a8a]/50 last:border-none transition-colors flex items-center justify-between group"
                >
                  <span>{sector}</span>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-[#FFD700]" />
                </button>
              ))) : (
                 <div className="p-4 text-center text-gray-400">Nenhum setor cadastrado.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Part Selection Modal */}
      {showPartModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-[#2e0249] border-2 border-[#FFD700] rounded-lg shadow-2xl max-w-lg w-full animate-in zoom-in duration-300">
            <div className="flex items-center justify-between p-4 border-b border-[#570a8a]">
              <h3 className="text-[#FFD700] text-lg font-bold flex items-center gap-2">
                <Box className="w-5 h-5" /> Selecionar Peça
              </h3>
              <button 
                onClick={() => setShowPartModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-2 max-h-[60vh] overflow-y-auto">
                {registeredParts.length > 0 ? (
                    registeredParts.map((part) => (
                        <button
                        key={part.code}
                        onClick={() => handleSelectPart(part)}
                        className="w-full text-left p-4 hover:bg-[#3c0360] text-white border-b border-[#570a8a]/50 last:border-none transition-colors flex flex-col group"
                        >
                            <div className="flex justify-between items-center w-full mb-1">
                                <span className="font-bold text-[#FFD700]">{part.name}</span>
                                <span className="text-xs bg-purple-900 text-purple-200 px-2 py-0.5 rounded font-mono border border-purple-700">ID: {part.code}</span>
                            </div>
                            <div className="text-sm text-gray-300 flex items-center gap-1">
                                <span className="opacity-60">Cliente:</span> {part.client}
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="p-8 text-center text-gray-400">
                        Nenhuma peça cadastrada.
                    </div>
                )}
            </div>
            <div className="p-3 border-t border-[#570a8a] bg-[#1b002b] text-center text-xs text-purple-400 rounded-b-lg">
                 Mostrando {registeredParts.length} peças cadastradas
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
