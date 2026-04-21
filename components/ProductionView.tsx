
import React, { useState, useEffect, useMemo } from 'react';
import { Factory, Play, CheckCircle, RotateCcw, X, Box, Search, PlusCircle, Upload, ImageIcon, Film, Cuboid, ChevronDown, ChevronRight } from 'lucide-react';
import { systemStore, Product, ProductionEntry, ProductionSession, PartMediaAsset } from '../services/storage';

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
  const [showPartModal, setShowPartModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showProgressionModal, setShowProgressionModal] = useState(false);
  const [activeProductions, setActiveProductions] = useState<ProductionEntry[]>([]);
  const [loadedProductionId, setLoadedProductionId] = useState('');
  const [mediaAssets, setMediaAssets] = useState<PartMediaAsset[]>([]);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'current'>('all');
  const [collapsedSectors, setCollapsedSectors] = useState<Record<string, boolean>>({});

  const filteredMediaAssets = useMemo(() => {
    if (mediaFilter === 'current') {
      return mediaAssets.filter(asset => asset.sector === currentSector);
    }
    return mediaAssets;
  }, [mediaAssets, mediaFilter, currentSector]);

  const latestImageAsset = useMemo(() => {
    return mediaAssets.find(asset => asset.fileType.startsWith('image/')) || null;
  }, [mediaAssets]);

  const progressionGroupedBySector = useMemo(() => {
    const grouped: Record<string, PartMediaAsset[]> = {};
    mediaAssets.forEach((asset) => {
      const sectorKey = asset.sector || 'Sem setor';
      if (!grouped[sectorKey]) {
        grouped[sectorKey] = [];
      }
      grouped[sectorKey].push(asset);
    });

    return Object.entries(grouped).sort((a, b) => {
      const latestA = Math.max(...a[1].map(item => item.uploadedAt));
      const latestB = Math.max(...b[1].map(item => item.uploadedAt));
      return latestB - latestA;
    });
  }, [mediaAssets]);

  useEffect(() => {
    setCollapsedSectors(prev => {
      const next: Record<string, boolean> = { ...prev };
      progressionGroupedBySector.forEach(([sectorName]) => {
        if (next[sectorName] === undefined) {
          next[sectorName] = false;
        }
      });
      return next;
    });
  }, [progressionGroupedBySector]);

  const getNextSectorInFlow = (sector: string, sectors: string[]) => {
    const currentIndex = sectors.findIndex(s => s === sector);
    if (currentIndex === -1 || currentIndex >= sectors.length - 1) return '';
    return sectors[currentIndex + 1];
  };

  const getPreviousSectorInFlow = (sector: string, sectors: string[]) => {
    const currentIndex = sectors.findIndex(s => s === sector);
    if (currentIndex <= 0) return '';
    return sectors[currentIndex - 1];
  };

  const refreshActiveProductions = (viewer?: { name?: string; sector?: string; isAdmin?: boolean }) => {
    const allActive = systemStore.getActiveProductions();
    if (viewer?.isAdmin) {
      setActiveProductions(allActive);
      return;
    }

    if (viewer?.sector) {
      setActiveProductions(allActive.filter(p => p.currentSector === viewer.sector));
      return;
    }

    setActiveProductions([]);
  };

  const clearPanelForNextWork = () => {
    const triagem = availableSectors.find(s => s.toLowerCase() === 'triagem') || availableSectors[0] || '';
    setPartId('');
    setPartName('');
    setClientName('');
    setCurrentSector(triagem);
    setNextSector(getNextSectorInFlow(triagem, availableSectors));
    setLoadedProductionId('');
    setProcessId('');
    setIsRunning(false);
    setIsFinished(false);
    setElapsedTime(0);
    setStartTime(0);
    setStopTime(null);
    setMediaAssets([]);
    setMediaFilter('all');
    systemStore.clearCurrentSession();
  };

  const refreshPartMedia = (code: string) => {
    if (!code) {
      setMediaAssets([]);
      return;
    }
    setMediaAssets(systemStore.getPartMedia(code));
  };

  // Initialization & Persistence Restoration
  useEffect(() => {
    const products = systemStore.getProducts().filter(p => !p.completedAt);
    setRegisteredParts(products);

    // Load Sectors Dynamically
    const sectors = systemStore.getSectors().map(s => s.name);
    setAvailableSectors(sectors);

    // Lock to Current User
    const currentUser = systemStore.getCurrentUser();
    const isAdminUser = currentUser?.username?.trim().toLowerCase() === 'admin';
    const triagem = sectors.find(s => s.toLowerCase() === 'triagem') || sectors[0] || '';
    const nextFromTriagem = getNextSectorInFlow(triagem, sectors);

    if (currentUser) {
      setEmployeeName(currentUser.name);
      setCurrentSector(triagem); // Setor inicial sempre Triagem
      setNextSector(nextFromTriagem);
      setSelectedAvatar(currentUser.avatar);
      refreshActiveProductions({ name: currentUser.name, sector: currentUser.sector, isAdmin: isAdminUser });
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
             setLoadedProductionId(savedSession.processId || savedSession.partId);
             const safeCurrentSector = savedSession.currentSector || triagem;
             setCurrentSector(safeCurrentSector);
             setNextSector(getNextSectorInFlow(safeCurrentSector, sectors));
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

  const getSectorTimesForDisplay = (production: ProductionEntry) => {
    const merged = { ...(production.sectorTimes || {}) };
    if (production.status === 'working') {
      const startRef = production.sectorStartTime || production.startTime;
      const currentElapsed = Math.max(0, Math.floor((Date.now() - startRef) / 1000));
      merged[production.currentSector] = (merged[production.currentSector] || 0) + currentElapsed;
    }
    return merged;
  };

  const formatSectorTimes = (production: ProductionEntry) => {
    const bySector = getSectorTimesForDisplay(production);
    return availableSectors
      .filter(sector => (bySector[sector] || 0) > 0)
      .map(sector => `${sector} ${formatTime(bySector[sector])}`)
      .join(' | ');
  };

  // Handlers
  const loadProductionIntoPanel = (production: ProductionEntry) => {
    const currentUser = systemStore.getCurrentUser();
    const isAdminUser = currentUser?.username?.trim().toLowerCase() === 'admin';

    if (!isAdminUser && currentUser?.sector && production.currentSector !== currentUser.sector) {
      alert('Esta peça já foi encaminhada para outro setor e não está mais disponível para você.');
      return;
    }

    setPartId(production.partCode);
    setPartName(production.partName);
    setClientName(systemStore.getProducts().find(p => p.code === production.partCode)?.client || clientName);
    if (currentUser?.name) {
      setEmployeeName(currentUser.name);
      setSelectedAvatar(currentUser.avatar);
    }
    setCurrentSector(production.currentSector);
    setNextSector(getNextSectorInFlow(production.currentSector, availableSectors));
    setProcessId(production.id);
    setLoadedProductionId(production.id);
    setStartTime(production.sectorStartTime || production.startTime);
    setStopTime(null);
    setIsRunning(production.status === 'working');
    setIsFinished(production.status === 'finished');
    setElapsedTime(Math.floor((Date.now() - (production.sectorStartTime || production.startTime)) / 1000));
    refreshPartMedia(production.partCode);
  };

  const handleSelectPart = (part: Product) => {
    setPartId(part.code);
    setPartName(part.name);
    setClientName(part.client);
    const triagem = availableSectors.find(s => s.toLowerCase() === 'triagem') || availableSectors[0] || '';
    setCurrentSector(triagem);
    setNextSector(getNextSectorInFlow(triagem, availableSectors));
    setLoadedProductionId('');
    setIsRunning(false);
    setIsFinished(false);
    setElapsedTime(0);
    setMediaFilter('all');
    refreshPartMedia(part.code);
    setShowPartModal(false);
  };

  const handleUploadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0 || !partId) return;

    let pending = files.length;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        if (dataUrl) {
          systemStore.addPartMedia({
            partCode: partId,
            processId: processId || undefined,
            sector: currentSector || undefined,
            uploadedBy: employeeName || undefined,
            fileName: file.name,
            fileType: file.type || 'application/octet-stream',
            dataUrl,
          });
        }

        pending -= 1;
        if (pending === 0) {
          refreshPartMedia(partId);
          alert(`${files.length} arquivo(s) enviado(s) para o setor ${currentSector}.`);
        }
      };
      reader.readAsDataURL(file);
    });

    event.target.value = '';
  };

  const handleRemoveMedia = (mediaId: string) => {
    systemStore.removePartMedia(mediaId);
    refreshPartMedia(partId);
  };

  const handleStartProduction = () => {
    if (!partId || !clientName) return;

    const triagem = availableSectors.find(s => s.toLowerCase() === 'triagem') || availableSectors[0] || '';
    const nextFromTriagem = getNextSectorInFlow(triagem, availableSectors);

    setCurrentSector(triagem);
    setNextSector(nextFromTriagem);

    const now = Date.now();
    const newProcessId = systemStore.getNextProcessId();
    setStartTime(now);
    setElapsedTime(0);
    setProcessId(newProcessId);
    setLoadedProductionId(newProcessId);
    setIsRunning(true);
    setIsFinished(false);
    
    systemStore.startProduction({
      id: newProcessId,
        employeeName: employeeName,
        avatar: selectedAvatar,
        partName: partName,
        partCode: partId,
        currentSector: triagem,
        startTime: now,
        sectorStartTime: now,
        sectorTimes: {},
        status: 'working',
        dailyCount: 0 
    });

    const currentUser = systemStore.getCurrentUser();
    const isAdminUser = currentUser?.username?.trim().toLowerCase() === 'admin';
    refreshActiveProductions({ name: currentUser?.name, sector: currentUser?.sector, isAdmin: isAdminUser });
  };

  const handleNextSector = () => {
    if (!isRunning) return;
    const targetProcessId = processId || loadedProductionId;
    if (!targetProcessId) return;

    if (nextSector) {
        const newCurrent = nextSector;
        const upcoming = getNextSectorInFlow(newCurrent, availableSectors);
        const now = Date.now();
        setCurrentSector(newCurrent);
        setNextSector(upcoming);
        setStartTime(now);
        setElapsedTime(0);
        systemStore.updateProductionSector(targetProcessId, newCurrent, employeeName);

        const currentUser = systemStore.getCurrentUser();
        const isAdminUser = currentUser?.username?.trim().toLowerCase() === 'admin';
        refreshActiveProductions({ name: currentUser?.name, sector: currentUser?.sector, isAdmin: isAdminUser });

        if (!isAdminUser) {
          // User comum não acompanha peça fora do seu setor após o envio.
          clearPanelForNextWork();
        }
        return;
    }

    const now = Date.now();
    setStopTime(now);
    setIsRunning(false);
    setIsFinished(true);
    systemStore.finishProduction(targetProcessId, employeeName);

    alert('A peca esta pronta para entrega. Pressione OK para continuar.');
    const clientData = systemStore.getClients().find(c => c.name === clientName);
    systemStore.addDeliveryAlert({
      processId: targetProcessId,
      partCode: partId,
      partName,
      clientName,
      clientContact: clientData?.contact || '',
      clientEmail: clientData?.email || '',
    });

    const currentUser = systemStore.getCurrentUser();
    const isAdminUser = currentUser?.username?.trim().toLowerCase() === 'admin';
    refreshActiveProductions({ name: currentUser?.name, sector: currentUser?.sector, isAdmin: isAdminUser });

    if (!isAdminUser) {
      clearPanelForNextWork();
    }
  };

  const handlePreviousSectorAdmin = () => {
    const currentUser = systemStore.getCurrentUser();
    const isAdmin = currentUser?.username?.trim().toLowerCase() === 'admin';

    if (!isAdmin) {
      alert('Somente o administrador pode voltar para o setor anterior.');
      return;
    }

    const previous = getPreviousSectorInFlow(currentSector, availableSectors);
    if (!previous) {
      alert('Nao existe setor anterior para o setor atual.');
      return;
    }

    setCurrentSector(previous);
    setNextSector(getNextSectorInFlow(previous, availableSectors));

    const targetProcessId = processId || loadedProductionId;
    if (targetProcessId && isRunning) {
      systemStore.updateProductionSector(targetProcessId, previous, employeeName);
      const now = Date.now();
      setStartTime(now);
      setElapsedTime(0);
    }

    const user = systemStore.getCurrentUser();
    const admin = user?.username?.trim().toLowerCase() === 'admin';
    refreshActiveProductions({ name: user?.name, sector: user?.sector, isAdmin: admin });
  };

  const handleSearchProduction = () => {
    const user = systemStore.getCurrentUser();
    const admin = user?.username?.trim().toLowerCase() === 'admin';
    refreshActiveProductions({ name: user?.name, sector: user?.sector, isAdmin: admin });
    setShowProcessModal(true);
  };

  const handleNewProductionFromSearch = () => {
    const triagem = availableSectors.find(s => s.toLowerCase() === 'triagem') || availableSectors[0] || '';
    setPartId('');
    setPartName('');
    setClientName('');
    setCurrentSector(triagem);
    setNextSector(getNextSectorInFlow(triagem, availableSectors));
    setLoadedProductionId('');
    setProcessId('');
    setIsRunning(false);
    setIsFinished(false);
    setElapsedTime(0);
    setStartTime(0);
    setStopTime(null);
    setMediaFilter('all');
    setShowProcessModal(false);
    setShowPartModal(true);
  };

  const handleReset = () => {
    systemStore.clearCurrentSession();
    setIsRunning(false);
    setIsFinished(false);
    setElapsedTime(0);
    setStartTime(0);
    setStopTime(null);
    setMediaFilter('all');
    setProcessId('');
    setLoadedProductionId('');
    setPartId('');
    setPartName('');
    setClientName('');
    const triagem = availableSectors.find(s => s.toLowerCase() === 'triagem') || availableSectors[0] || '';
    setCurrentSector(triagem);
    setNextSector(getNextSectorInFlow(triagem, availableSectors));

    const currentUser = systemStore.getCurrentUser();
    const isAdminUser = currentUser?.username?.trim().toLowerCase() === 'admin';
    refreshActiveProductions({ name: currentUser?.name, sector: currentUser?.sector, isAdmin: isAdminUser });
    
    // Keep production start sector fixed to Triagem.
  };

  const currentUser = systemStore.getCurrentUser();
  const isAdmin = currentUser?.username?.trim().toLowerCase() === 'admin';
  const userSector = currentUser?.sector || '';
  const isTriagem = userSector.toLowerCase() === 'triagem';
  // Usuários não-admin fora da Triagem só enxergam peças do seu setor em produção ativa
  const canOpenCatalog = isAdmin || isTriagem;

  const handleOpenPartSearch = () => {
    if (isRunning) return;
    setRegisteredParts(systemStore.getProducts().filter(p => !p.completedAt));
    if (canOpenCatalog) {
      setShowPartModal(true);
    } else {
      handleSearchProduction();
    }
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 relative pb-20">
      <div className="mb-8 border-b border-[#FFD700]/30 pb-2 flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-[#FFD700] text-2xl font-bold flex items-center gap-2">
          <Factory className="w-6 h-6" />
          Controle de Produção
        </h2>
        <button
          type="button"
          onClick={handleSearchProduction}
          className="bg-[#4a148c] hover:bg-[#3c0360] border border-[#570a8a] text-white px-4 py-2 rounded-md shadow-md text-sm font-bold transition-colors flex items-center gap-2"
        >
          <Search className="w-4 h-4 text-[#FFD700]" />
          Pesquisar
        </button>
      </div>

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
                            onClick={handleOpenPartSearch}
                            className={`w-full border border-[#570a8a] rounded-sm p-3 text-white focus:outline-none shadow-inner placeholder-purple-300/50 ${isRunning ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                            placeholder={canOpenCatalog ? "Selecione a peça..." : "Buscar peça no seu setor..."} 
                            style={{ backgroundColor: '#3b0764' }} 
                        />
                        <button 
                            onClick={handleOpenPartSearch}
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
                            className="w-full border border-[#570a8a] rounded-sm p-3 text-white focus:outline-none shadow-inner placeholder-purple-300/50" 
                            placeholder="Setor onde a peça esta" 
                            style={{ backgroundColor: '#3b0764' }}
                        />
                        <button 
                            disabled
                            className="bg-gray-700 text-gray-300 text-xs px-4 py-1 rounded-sm shadow-md font-medium cursor-not-allowed"
                        >
                            Auto
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
                            className="w-full border border-[#570a8a] rounded-sm p-3 text-white focus:outline-none shadow-inner placeholder-purple-300/50" 
                            placeholder="Para onde a peça vai" 
                            style={{ backgroundColor: '#3b0764' }}
                        />
                        <button 
                            disabled
                            className="bg-gray-700 text-gray-300 text-xs px-4 py-1 rounded-sm shadow-md font-medium cursor-not-allowed"
                        >
                            Auto
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Full Width Action Button Row */}
            <div className="pt-4">
                 {!isRunning && !isFinished ? (
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <button 
                          onClick={handleStartProduction}
                          disabled={!partId || !partName || !employeeName}
                          className={`md:col-span-3 w-full font-bold py-4 rounded-md shadow-lg transition-all text-lg flex items-center justify-center gap-3 uppercase tracking-wide ${(!partId || !partName || !employeeName) ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-[#FFD700] hover:bg-[#e6c200] text-[#2e0249] hover:scale-[1.01]'}`}
                        >
                          <Play className="w-6 h-6" /> Iniciar Produção
                        </button>

                        <label className={`md:col-span-1 w-full font-bold py-4 rounded-md shadow-lg transition-all text-sm flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer ${partId ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
                          <Upload className="w-4 h-4" /> Upload
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleUploadFile}
                            disabled={!partId}
                            multiple
                            accept="image/*,video/*,.stl,.obj,.3mf,.step,.stp,.iges,.igs,model/*"
                          />
                        </label>
                     </div>
                 ) : (
                    <div className="flex flex-col gap-3">
                     {isRunning && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button 
                          onClick={handleNextSector}
                          className="w-full font-bold py-4 rounded-md shadow-lg transition-all text-xl flex items-center justify-center gap-3 uppercase tracking-wide bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-[1.01]"
                        >
                          <CheckCircle className="w-6 h-6" /> Próximo Setor
                        </button>
                        <button
                          onClick={handlePreviousSectorAdmin}
                          disabled={!isAdmin}
                          className={`w-full font-bold py-4 rounded-md shadow-lg transition-all text-base flex items-center justify-center gap-2 uppercase tracking-wide ${isAdmin ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                        >
                            <RotateCcw className="w-5 h-5" /> Voltar Setor
                        </button>
                          <label className={`w-full font-bold py-4 rounded-md shadow-lg transition-all text-base flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer ${partId ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
                            <Upload className="w-5 h-5" /> Upload
                            <input
                              type="file"
                              className="hidden"
                              onChange={handleUploadFile}
                              disabled={!partId}
                              multiple
                              accept="image/*,video/*,.stl,.obj,.3mf,.step,.stp,model/*,.iges,.igs"
                            />
                          </label>
                      </div>
                     )}
                     {isRunning && partId && (
                      <p className="text-xs text-cyan-200">Dica: no upload, selecione várias imagens/arquivos de uma vez (Ctrl ou Shift no Windows).</p>
                     )}
                        
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
          <div className="border-2 border-dashed border-[#FFD700] rounded-lg p-6 bg-[#2e0249]/50 h-fit shadow-2xl relative">
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

            <div className="mt-6 border border-[#570a8a] rounded-lg p-4 bg-[#1b002b]/80 shadow-xl">
              <h4 className="text-[#FFD700] font-bold mb-3 uppercase tracking-wide text-sm">Evolução da peça por setor</h4>
              {partId && (
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setMediaFilter('all')}
                    className={`text-xs px-3 py-1 rounded border transition-colors ${mediaFilter === 'all' ? 'bg-[#FFD700] text-[#2e0249] border-[#FFD700] font-bold' : 'bg-transparent text-gray-300 border-[#570a8a] hover:bg-[#2e0249]'}`}
                  >
                    Ver todos os setores
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaFilter('current')}
                    className={`text-xs px-3 py-1 rounded border transition-colors ${mediaFilter === 'current' ? 'bg-[#FFD700] text-[#2e0249] border-[#FFD700] font-bold' : 'bg-transparent text-gray-300 border-[#570a8a] hover:bg-[#2e0249]'}`}
                  >
                    Só setor atual
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProgressionModal(true)}
                    className="text-xs px-3 py-1 rounded border border-cyan-500 text-cyan-300 hover:bg-cyan-900/30 transition-colors"
                  >
                    Ver Progressão
                  </button>
                </div>
              )}
              {partId && currentSector === 'CAD' && (
                <p className="text-[11px] text-cyan-300 mb-3">Setor CAD: upload liberado para arquivos 3D (.stl, .obj, .3mf, .step, .stp, .iges, .igs).</p>
              )}
              {partId && latestImageAsset && (
                <div className="mb-3 border border-cyan-700/60 rounded-md p-2 bg-cyan-900/20">
                  <p className="text-[10px] text-cyan-200 uppercase tracking-wide mb-2">Última imagem enviada</p>
                  <img src={latestImageAsset.dataUrl} alt={latestImageAsset.fileName} className="w-full h-28 object-cover rounded" />
                  <p className="text-[10px] text-cyan-100 mt-1 truncate" title={latestImageAsset.fileName}>{latestImageAsset.fileName}</p>
                </div>
              )}
              {!partId ? (
                <p className="text-xs text-gray-400">Selecione uma peça para armazenar e visualizar imagens, vídeos e arquivos 3D.</p>
              ) : filteredMediaAssets.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhuma evolução enviada para esta peça ainda.</p>
              ) : (
                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                  {filteredMediaAssets.map(asset => {
                    const isImage = asset.fileType.startsWith('image/');
                    const isVideo = asset.fileType.startsWith('video/');
                    const isModel = !isImage && !isVideo;

                    return (
                      <div key={asset.id} className="border border-[#570a8a] rounded-md p-2 bg-[#2e0249]">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {isImage && <ImageIcon className="w-4 h-4 text-cyan-300" />}
                            {isVideo && <Film className="w-4 h-4 text-emerald-300" />}
                            {isModel && <Cuboid className="w-4 h-4 text-amber-300" />}
                            <p className="text-xs text-white truncate" title={asset.fileName}>{asset.fileName}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(asset.id)}
                            className="text-[10px] px-2 py-1 rounded bg-red-700 hover:bg-red-600 text-white"
                          >
                            Excluir
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-2">
                          {asset.sector && <span className="text-[10px] px-2 py-1 rounded bg-indigo-900/70 text-indigo-200 border border-indigo-700">Setor: {asset.sector}</span>}
                          {asset.uploadedBy && <span className="text-[10px] px-2 py-1 rounded bg-purple-900/70 text-purple-200 border border-purple-700">Usuário: {asset.uploadedBy}</span>}
                          <span className="text-[10px] px-2 py-1 rounded bg-slate-800/70 text-slate-200 border border-slate-600">{new Date(asset.uploadedAt).toLocaleString('pt-BR')}</span>
                        </div>

                        {isImage && (
                          <img src={asset.dataUrl} alt={asset.fileName} className="w-full h-28 object-cover rounded" />
                        )}

                        {isVideo && (
                          <video src={asset.dataUrl} controls className="w-full rounded" />
                        )}

                        {isModel && (
                          <a
                            href={asset.dataUrl}
                            download={asset.fileName}
                            className="text-xs text-cyan-300 underline"
                          >
                            Baixar arquivo 3D
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
        </div>
      </div>

      {/* Search Running Production Modal */}
      {showProcessModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-[#2e0249] border-2 border-[#FFD700] rounded-lg shadow-2xl max-w-2xl w-full animate-in zoom-in duration-300 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#570a8a]">
              <h3 className="text-[#FFD700] text-lg font-bold flex items-center gap-2">
                <Search className="w-5 h-5" />
                {isAdmin ? 'Peças em Produção' : `Peças no setor: ${userSector}`}
              </h3>
              <button
                onClick={() => setShowProcessModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-2 max-h-[60vh] overflow-y-auto">
              {activeProductions.length === 0 ? (
                <div className="p-6 text-center text-gray-400">Nenhuma peça em produção no momento.</div>
              ) : (
                activeProductions.map((prod) => (
                  <button
                    key={`${prod.id}-${prod.startTime}`}
                    onClick={() => {
                      loadProductionIntoPanel(prod);
                      setShowProcessModal(false);
                    }}
                    className={`w-full text-left p-4 border-b border-[#570a8a]/50 last:border-none transition-colors ${loadedProductionId === prod.id ? 'bg-[#3c0360]' : 'hover:bg-[#3c0360]'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-[#FFD700]">{prod.partName}</p>
                        <p className="text-xs text-gray-300">ID Processo: {prod.id} | ID Peça: {prod.partCode} | Setor: {prod.currentSector}</p>
                        <p className="text-xs text-gray-400">Funcionário: {prod.employeeName}</p>
                        <p className="text-xs text-cyan-300 mt-1">{formatSectorTimes(prod) || 'Sem tempo acumulado ainda.'}</p>
                      </div>
                      <span className="text-xs bg-emerald-900/50 text-emerald-300 px-2 py-1 rounded uppercase">Em processo</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-4 border-t border-[#570a8a] bg-[#1b002b] flex justify-end gap-3">
              <button
                onClick={() => setShowProcessModal(false)}
                className="px-4 py-2 rounded border border-[#570a8a] text-gray-300 hover:text-white hover:bg-[#3c0360] transition-colors"
              >
                Fechar
              </button>
              {(isAdmin || isTriagem) && (
                <button
                  onClick={handleNewProductionFromSearch}
                  className="px-4 py-2 rounded bg-[#FFD700] hover:bg-[#e6c200] text-[#2e0249] font-bold transition-colors flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  Nova Produção
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full Progression Modal */}
      {showProgressionModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-[#2e0249] border-2 border-cyan-400 rounded-lg shadow-2xl max-w-3xl w-full animate-in zoom-in duration-300 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#570a8a]">
              <h3 className="text-cyan-300 text-lg font-bold">Progressão Completa da Peça</h3>
              <button
                onClick={() => setShowProgressionModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {!partId ? (
                <p className="text-gray-300">Selecione uma peça para visualizar a progressão completa.</p>
              ) : mediaAssets.length === 0 ? (
                <p className="text-gray-300">Nenhum upload registrado para esta peça.</p>
              ) : (
                <div className="space-y-3">
                  {progressionGroupedBySector.map(([sectorName, assets]) => (
                    <div key={`group-${sectorName}`} className="border border-[#570a8a] rounded-md p-3 bg-[#1b002b]">
                      <button
                        type="button"
                        onClick={() => setCollapsedSectors(prev => ({ ...prev, [sectorName]: !prev[sectorName] }))}
                        className="w-full flex items-center justify-between text-left mb-2"
                      >
                        <h4 className="text-sm font-bold text-[#FFD700] uppercase tracking-wide">{sectorName} ({assets.length})</h4>
                        {collapsedSectors[sectorName] ? <ChevronRight className="w-4 h-4 text-[#FFD700]" /> : <ChevronDown className="w-4 h-4 text-[#FFD700]" />}
                      </button>
                      {!collapsedSectors[sectorName] && <div className="space-y-3">
                        {assets.map(asset => {
                          const isImage = asset.fileType.startsWith('image/');
                          const isVideo = asset.fileType.startsWith('video/');
                          const isModel = !isImage && !isVideo;

                          return (
                            <div key={`progress-${asset.id}`} className="border border-[#570a8a] rounded-md p-3 bg-[#2e0249]">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                {asset.uploadedBy && <span className="text-[10px] px-2 py-1 rounded bg-purple-900/70 text-purple-200 border border-purple-700">Usuário: {asset.uploadedBy}</span>}
                                <span className="text-[10px] px-2 py-1 rounded bg-slate-800/70 text-slate-200 border border-slate-600">{new Date(asset.uploadedAt).toLocaleString('pt-BR')}</span>
                              </div>

                              <p className="text-xs text-white mb-2" title={asset.fileName}>{asset.fileName}</p>

                              {isImage && <img src={asset.dataUrl} alt={asset.fileName} className="w-full max-h-64 object-contain rounded bg-black/20" />}
                              {isVideo && <video src={asset.dataUrl} controls className="w-full rounded" />}
                              {isModel && (
                                <a href={asset.dataUrl} download={asset.fileName} className="text-sm text-cyan-300 underline">
                                  Baixar arquivo 3D
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#570a8a] bg-[#1b002b] flex justify-end">
              <button
                onClick={() => setShowProgressionModal(false)}
                className="px-4 py-2 rounded border border-[#570a8a] text-gray-300 hover:text-white hover:bg-[#3c0360] transition-colors"
              >
                Fechar
              </button>
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
