
import React, { useState, useEffect } from 'react';
import { Clock, Activity, Users, Package, AlertCircle, Calendar, X, BarChart, List, CheckCircle, Timer, Eye } from 'lucide-react';
import { ActiveView } from '../types/activeView';
import { systemStore, Employee, Client, ProductionEntry, DeliveryAlert, Product } from '../services/storage';

interface DashboardProps {
  onChangeView: (view: ActiveView) => void;
}

interface LiveProductionUI {
  id: string;
  employeeName: string;
  avatar: string | null;
  partName: string;
  partCode: string;
  currentSector: string;
  elapsedSeconds: number;
  dailyCount: number;
  status: 'working' | 'paused' | 'finished';
}

export const Dashboard: React.FC<DashboardProps> = ({ onChangeView }) => {
  const [liveProduction, setLiveProduction] = useState<LiveProductionUI[]>([]);
    const [productionEntries, setProductionEntries] = useState<ProductionEntry[]>([]);
  const [sectorStats, setSectorStats] = useState<any[]>([]);
  const [totalDailyProduction, setTotalDailyProduction] = useState(0);
    const [totalInProcess, setTotalInProcess] = useState(0);
    const [overdueByDeadlineCount, setOverdueByDeadlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
    const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
    const [showFullTimelineModal, setShowFullTimelineModal] = useState(false);
    const [deliveryAlerts, setDeliveryAlerts] = useState<DeliveryAlert[]>([]);
    const [refreshTick, setRefreshTick] = useState(0);
  
  // Modals State
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState<{name: string, sector: string, count: number, avatar: string | null}[]>([]);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showSectorDetailsModal, setShowSectorDetailsModal] = useState(false);
        const [showOverdueModal, setShowOverdueModal] = useState(false);
    const [selectedSectorName, setSelectedSectorName] = useState('');
  const [detailsTab, setDetailsTab] = useState<'clients' | 'employees' | 'production'>('production');
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [allProduction, setAllProduction] = useState<ProductionEntry[]>([]);
    const [showEmployeeHistoryModal, setShowEmployeeHistoryModal] = useState(false);
    const [employeeHistoryTitle, setEmployeeHistoryTitle] = useState('');
    const [employeeHistoryRows, setEmployeeHistoryRows] = useState<Array<{processId: string; partCode: string; partName: string; sector: string; durationSeconds: number; endedAt: number;}>>([]);

  // Update Loop
    useEffect(() => {
    const updateData = () => {
      const rawProduction = systemStore.getProduction();
      const stats = systemStore.getSectorStats();
      const allEmployees = systemStore.getEmployees();
            const allProducts = systemStore.getProducts();

      // 1. Calculate Total Production for Today (All Employees, Active or Not)
      let todayTotal = 0;
      allEmployees.forEach(emp => {
        todayTotal += systemStore.getDailyProductionCount(emp.name);
      });
      setTotalDailyProduction(todayTotal);

      // 2. Map Live Activity (Only those currently working)
      const uiProduction: LiveProductionUI[] = rawProduction.map(p => {
        // Calculate dynamic daily count for this employee
        const dynamicDailyCount = systemStore.getDailyProductionCount(p.employeeName);

        return {
            id: p.id,
            employeeName: p.employeeName,
            avatar: p.avatar,
            partName: p.partName,
            partCode: p.partCode,
            currentSector: p.currentSector,
            dailyCount: dynamicDailyCount,
            status: p.status,
            elapsedSeconds: Math.floor((Date.now() - (p.sectorStartTime || p.startTime)) / 1000)
        };
      }).filter(p => p.status === 'working' || p.status === 'paused'); // Only show active

    setTotalInProcess(rawProduction.filter(p => p.status === 'working' || p.status === 'paused').length);

            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            const overdueCount = rawProduction.filter(p => p.status === 'working' || p.status === 'paused').filter(p => {
                const product = allProducts.find(prod => prod.code === p.partCode);
                if (!product?.deliveryDeadline) return false;
                const deadline = new Date(`${product.deliveryDeadline}T23:59:59.999`);
                return Date.now() > deadline.getTime();
            }).length;
            setOverdueByDeadlineCount(overdueCount);

      // Sort by most recent (lowest elapsed time usually means just started, or reverse)
      uiProduction.sort((a, b) => a.elapsedSeconds - b.elapsedSeconds);

            setProductionEntries(rawProduction);
      setLiveProduction(uiProduction);
      setSectorStats(stats);
            setDeliveryAlerts(systemStore.getPendingDeliveryAlerts());
      setLoading(false);

            // Clear selection if process is no longer available.
            if (selectedProcessId && !rawProduction.some(p => p.id === selectedProcessId)) {
                setSelectedProcessId(null);
            }
    };

    // Initial call
    updateData();

    // Interval
    const interval = setInterval(updateData, 1000);

    return () => clearInterval(interval);
    }, [selectedProcessId, refreshTick]);

  const handleOpenMonthlyReport = () => {
      const employees = systemStore.getEmployees();
      const stats = employees.map(emp => ({
          name: emp.name,
          sector: emp.sector,
          avatar: emp.avatar,
          count: systemStore.getMonthlyProductionCount(emp.name)
      })).sort((a, b) => b.count - a.count); // Sort by highest production
      
      setMonthlyStats(stats);
      setShowMonthlyModal(true);
  };

  const handleOpenDetails = () => {
    setAllClients(systemStore.getClients());
    setAllEmployees(systemStore.getEmployees());
    setAllProduction(systemStore.getProduction());
    setShowDetailsModal(true);
  };

    const handleOpenEmployeeHistory = (employeeName: string) => {
        const rows = systemStore.getEmployeeProcessHistory(employeeName);
        setEmployeeHistoryTitle(employeeName);
        setEmployeeHistoryRows(rows);
        setShowEmployeeHistoryModal(true);
    };

    useEffect(() => {
        if (!showDetailsModal) return;

        const syncDetailsData = () => {
            setAllClients(systemStore.getClients());
            setAllEmployees(systemStore.getEmployees());
            setAllProduction(systemStore.getProduction());
        };

        syncDetailsData();
        const interval = setInterval(syncDetailsData, 1000);

        return () => clearInterval(interval);
    }, [showDetailsModal]);

  // Format Seconds to HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

    const getProductByCode = (code: string): Product | undefined => {
        return systemStore.getProducts().find(p => p.code === code);
    };

    const getDeadlineTimestamp = (product?: Product) => {
        if (!product?.deliveryDeadline) return null;
        return new Date(`${product.deliveryDeadline}T23:59:59`).getTime();
    };

    const getSectorRows = (sectorName: string) => {
        const activeRows = productionEntries
            .filter(p => (p.status === 'working' || p.status === 'paused') && p.currentSector === sectorName)
            .map(p => {
                const product = getProductByCode(p.partCode);
                const deadlineTs = getDeadlineTimestamp(product);
                const isOverdue = deadlineTs ? Date.now() > deadlineTs : false;

                return {
                    processId: p.id,
                    partName: p.partName,
                    partCode: p.partCode,
                    technician: p.employeeName,
                    elapsedSeconds: Math.max(0, Math.floor((Date.now() - (p.sectorStartTime || p.startTime)) / 1000)),
                    clientName: product?.client || 'Nao encontrado',
                    deadlineLabel: product?.deliveryDeadline ? new Date(product.deliveryDeadline).toLocaleDateString('pt-BR') : 'Sem prazo',
                    forecastLabel: product?.deliveryDeadline ? new Date(product.deliveryDeadline).toLocaleDateString('pt-BR') : 'Sem previsão',
                    isOverdue,
                    isActive: true,
                };
            });

        const activePartCodes = new Set(activeRows.map(row => row.partCode));
        const catalogRows = systemStore.getProducts()
            .filter(product => product.sector === sectorName && !activePartCodes.has(product.code))
            .map(product => {
                const deadlineTs = getDeadlineTimestamp(product);
                const isOverdue = deadlineTs ? Date.now() > deadlineTs : false;

                return {
                    processId: '-',
                    partName: product.name,
                    partCode: product.code,
                    technician: 'Aguardando início',
                    elapsedSeconds: 0,
                    clientName: product.client,
                    deadlineLabel: product.deliveryDeadline ? new Date(product.deliveryDeadline).toLocaleDateString('pt-BR') : 'Sem prazo',
                    forecastLabel: product.deliveryDeadline ? new Date(product.deliveryDeadline).toLocaleDateString('pt-BR') : 'Sem previsão',
                    isOverdue,
                    isActive: false,
                };
            });

        return [...activeRows, ...catalogRows];
    };

    const getOverdueRows = () => {
        return productionEntries
            .filter(p => p.status === 'working' || p.status === 'paused')
            .map(p => {
                const product = getProductByCode(p.partCode);
                const deadlineTs = getDeadlineTimestamp(product);
                return {
                    processId: p.id,
                    partName: p.partName,
                    partCode: p.partCode,
                    sector: p.currentSector,
                    technician: p.employeeName,
                    elapsedSeconds: Math.max(0, Math.floor((Date.now() - (p.sectorStartTime || p.startTime)) / 1000)),
                    clientName: product?.client || 'Nao encontrado',
                    deadlineLabel: product?.deliveryDeadline ? new Date(product.deliveryDeadline).toLocaleDateString('pt-BR') : 'Sem prazo',
                    deadlineTs,
                };
            })
            .filter(row => Boolean(row.deadlineTs) && Date.now() > Number(row.deadlineTs));
    };

    const getSectorTimesWithCurrent = (entry: ProductionEntry): Record<string, number> => {
        const merged = { ...(entry.sectorTimes || {}) };
        if (entry.status === 'working') {
            const startRef = entry.sectorStartTime || entry.startTime;
            const elapsedCurrent = Math.max(0, Math.floor((Date.now() - startRef) / 1000));
            merged[entry.currentSector] = (merged[entry.currentSector] || 0) + elapsedCurrent;
        }
        return merged;
    };

    const getTotalProcessSeconds = (entry: ProductionEntry): number => {
        const sectorTimes = getSectorTimesWithCurrent(entry);
        return Object.values(sectorTimes).reduce((sum, value) => sum + value, 0);
    };

    const formatDateTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('pt-BR');
    };

    const buildProcessTimeline = (entry: ProductionEntry) => {
        const sectorTimes = getSectorTimesWithCurrent(entry);
        const sectorsInOrder = systemStore.getSectors().map(s => s.name);
        const timeline: Array<{ sector: string; startedAt: number; endedAt: number | null; duration: number; isCurrent: boolean }> = [];
        let cursor = entry.startTime;

        sectorsInOrder.forEach(sector => {
            const duration = sectorTimes[sector] || 0;
            if (duration <= 0) return;

            const startedAt = cursor;
            const isCurrent = entry.status === 'working' && sector === entry.currentSector;
            const endedAt = isCurrent ? null : startedAt + duration * 1000;

            timeline.push({ sector, startedAt, endedAt, duration, isCurrent });
            cursor = startedAt + duration * 1000;
        });

        return timeline;
    };

    const selectedProcess = selectedProcessId ? productionEntries.find(p => p.id === selectedProcessId) || null : null;
    const selectedSectorRows = selectedSectorName ? getSectorRows(selectedSectorName) : [];
    const overdueRows = getOverdueRows();
    const currentUser = systemStore.getCurrentUser();
    const isAdmin = currentUser?.username?.trim().toLowerCase() === 'admin';

    const handleMarkAsDelivered = (alertId: string) => {
        const confirmed = window.confirm('Tem certeza que deseja marcar esta peça como entregue?');
        if (!confirmed) return;

        systemStore.markDeliveryAlertAsDelivered(alertId);
        setDeliveryAlerts(systemStore.getPendingDeliveryAlerts());
    };

    const handleDeleteProcess = (processId: string) => {
        if (!isAdmin) return;

        const confirmed = window.confirm('Tem certeza que deseja excluir este processo? Isso apagará todo o histórico e dados da peça vinculada.');
        if (!confirmed) return;

        systemStore.deleteProcessCompletely(processId);
        setShowFullTimelineModal(false);
        setSelectedProcessId(null);
        setRefreshTick(prev => prev + 1);
    };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-bold text-[#FFD700] tracking-wide">Visão Geral da Produção</h2>
          <p className="text-purple-200 text-sm mt-1 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Monitoramento em Tempo Real {loading && "..."}
          </p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
             
             <button 
                onClick={handleOpenDetails}
                className="bg-[#4a148c] hover:bg-[#3c0360] border border-[#570a8a] text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 text-sm font-bold transition-colors"
            >
                <List className="w-4 h-4 text-[#FFD700]" />
                Listar Detalhes
            </button>

             <button 
                onClick={handleOpenMonthlyReport}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 text-sm font-bold transition-colors mr-2"
            >
                <Calendar className="w-4 h-4" />
                Relatório Mensal
            </button>

            <div className="bg-[#1b002b] border border-[#570a8a] rounded-lg px-4 py-2 text-center min-w-[120px]">
                <span className="block text-xs text-purple-300 uppercase font-bold">Produção Hoje</span>
                <span className="text-xl font-bold text-white">{totalDailyProduction} <span className="text-xs font-normal text-gray-400">peças</span></span>
            </div>
            <div className="bg-[#1b002b] border border-[#570a8a] rounded-lg px-4 py-2 text-center min-w-[120px]">
                <span className="block text-xs text-purple-300 uppercase font-bold">Total em Processo</span>
                <span className="text-xl font-bold text-[#FFD700]">{totalInProcess} <span className="text-xs font-normal text-white/50">peças</span></span>
            </div>
        </div>
      </div>

            {overdueByDeadlineCount > 0 && (
                <button
                    type="button"
                    onClick={() => setShowOverdueModal(true)}
                    className="w-full text-left bg-red-900/40 border border-red-500 rounded-lg p-4 animate-pulse hover:bg-red-900/55 transition-colors"
                >
                    <p className="text-red-200 font-bold uppercase text-sm tracking-wide flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Alerta Global: {overdueByDeadlineCount} peça(s) com prazo estourado. Clique para ver.
                    </p>
                </button>
            )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Live Employee Monitor (2/3 width on large screens) */}
        <div className="xl:col-span-2 space-y-6">
            {deliveryAlerts.length > 0 && (
                <div className="bg-amber-900/40 border border-amber-400 rounded-lg p-4 animate-pulse">
                    <p className="text-amber-200 font-bold uppercase text-sm tracking-wide">
                        Alerta: {deliveryAlerts.length} peça(s) pronta(s) para entrega ao cliente.
                    </p>
                </div>
            )}
            
            {/* Live Activity Header */}
            <div className="flex items-center justify-between border-b border-[#FFD700]/30 pb-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#FFD700]" />
                    Em Produção - Agora
                </h3>
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-bold">
                    {liveProduction.length} Ativos
                </span>
            </div>

            {/* Employee Cards Grid */}
            {liveProduction.length === 0 ? (
                <div className="bg-[#1b002b] border border-[#570a8a] rounded-lg p-8 text-center text-gray-400">
                    Nenhuma atividade de produção no momento. Inicie uma produção na aba "Produção".
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {liveProduction.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedProcessId(item.id)}
                            className={`w-full text-left bg-[#1b002b] border-l-4 ${item.status === 'working' ? 'border-emerald-500' : 'border-amber-500'} rounded-r-lg shadow-lg p-4 relative overflow-hidden group hover:bg-[#2e0249] transition-colors ${selectedProcessId === item.id ? 'ring-2 ring-[#FFD700]' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-[#4a148c] border border-purple-500 flex items-center justify-center overflow-hidden">
                                        {item.avatar ? (
                                            <img src={item.avatar} alt={item.employeeName} className="w-full h-full object-cover" />
                                        ) : (
                                            <Users className="w-6 h-6 text-purple-300" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{item.employeeName}</h4>
                                        <div className="text-xs text-purple-300 flex items-center gap-1">
                                            <Package className="w-3 h-3" /> 
                                            <span className="text-[#FFD700] font-medium">{item.dailyCount}</span> peças hoje
                                        </div>
                                    </div>
                                </div>
                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${item.status === 'working' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-amber-900/50 text-amber-400'}`}>
                                    {item.status === 'working' ? 'Produzindo' : 'Pausa'}
                                </span>
                            </div>
                            
                            <div className="bg-[#4a148c]/50 rounded p-2 mb-3">
                                <div className="flex justify-between text-xs text-gray-300 mb-1">
                                    <span>Peça:</span>
                                    <span className="text-white font-medium truncate max-w-[150px]">{item.partName}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-300">
                                    <span>Setor:</span>
                                    <span className="text-[#FFD700] font-bold">{item.currentSector}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock className={`w-4 h-4 ${item.status === 'working' ? 'text-emerald-400 animate-pulse' : 'text-gray-500'}`} />
                                    <span className="font-mono text-xl font-bold text-white tracking-widest">
                                        {formatTime(item.elapsedSeconds)}
                                    </span>
                                </div>
                                {item.elapsedSeconds > 3600 && (
                                    <span className="text-xs text-red-400 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Atenção
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {selectedProcess && (
                <div className="bg-[#1b002b] rounded-lg border border-[#570a8a] p-5 mt-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Timer className="w-5 h-5 text-[#FFD700]" />
                        Histórico Detalhado do Processo
                    </h3>

                    <div className="mb-4 flex justify-end">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowFullTimelineModal(true)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-md shadow transition-colors font-bold uppercase tracking-wide"
                            >
                                Ver Histórico Completo
                            </button>
                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => handleDeleteProcess(selectedProcess.id)}
                                    className="bg-red-700 hover:bg-red-600 text-white text-xs px-4 py-2 rounded-md shadow transition-colors font-bold uppercase tracking-wide"
                                >
                                    Excluir Processo
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <div className="bg-[#2e0249] rounded-md p-3 border border-[#570a8a]">
                            <p className="text-xs text-purple-300 uppercase">ID Processo</p>
                            <p className="text-white font-mono font-bold mt-1">{selectedProcess.id}</p>
                        </div>
                        <div className="bg-[#2e0249] rounded-md p-3 border border-[#570a8a]">
                            <p className="text-xs text-purple-300 uppercase">Peça</p>
                            <p className="text-white font-bold mt-1">{selectedProcess.partName} <span className="text-purple-300 font-mono">({selectedProcess.partCode})</span></p>
                        </div>
                        <div className="bg-[#2e0249] rounded-md p-3 border border-[#570a8a]">
                            <p className="text-xs text-purple-300 uppercase">Tempo Total Gasto</p>
                            <p className="text-[#FFD700] font-mono font-bold mt-1 text-lg">{formatTime(getTotalProcessSeconds(selectedProcess))}</p>
                        </div>
                    </div>

                    <div className="bg-[#2e0249] rounded-md border border-[#570a8a] overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-[#3c0360] text-xs uppercase text-gray-300">
                                <tr>
                                    <th className="p-3">Setor</th>
                                    <th className="p-3 text-right">Tempo no Setor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#570a8a]/40 text-sm">
                                {systemStore.getSectors().map(sector => {
                                    const bySector = getSectorTimesWithCurrent(selectedProcess);
                                    const value = bySector[sector.name] || 0;
                                    if (value <= 0) return null;

                                    return (
                                        <tr key={sector.id}>
                                            <td className="p-3 text-white">{sector.name}</td>
                                            <td className="p-3 text-right text-cyan-300 font-mono">{formatTime(value)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {deliveryAlerts.length > 0 && (
                <div className="bg-[#1b002b] rounded-lg border border-amber-500/60 p-5 mt-6">
                    <h3 className="text-lg font-bold text-amber-300 mb-4 uppercase tracking-wide">Peças prontas para entrega</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {deliveryAlerts.map(alert => (
                            <div key={alert.id} className="bg-amber-900/30 border border-amber-400 rounded-md p-3 animate-pulse">
                                <p className="text-white font-bold">{alert.partName}</p>
                                <p className="text-xs text-amber-200 mt-1">Processo: {alert.processId} | Peça: {alert.partCode}</p>
                                <p className="text-xs text-amber-100 mt-1">Cliente: {alert.clientName}</p>
                                                                <p className="text-xs text-amber-100 mt-1">Telefone: {alert.clientContact || 'Nao informado'}</p>
                                                                <p className="text-xs text-amber-100 mt-1">Email: {alert.clientEmail || 'Nao informado'}</p>
                                <p className="text-[11px] text-amber-300 mt-2 font-semibold uppercase">Pronta para entrega</p>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleMarkAsDelivered(alert.id)}
                                                                    className="mt-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded font-bold transition-colors uppercase"
                                                                >
                                                                    Marcar como entregue
                                                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>

        {/* Right Column: Sector Inventory & Stats */}
        <div className="xl:col-span-1 space-y-6">
            <div className="bg-[#1b002b] rounded-lg border border-[#570a8a] p-5 h-full">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#FFD700]" />
                    Estoque por Setor
                </h3>

                <div className="space-y-6">
                    {sectorStats.map((sector: any, index: number) => {
                        const fillPercent = Math.min(100, Math.round((sector.count / sector.capacity) * 100));
                        return (
                            <div key={index} className="relative">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="font-medium text-sm text-gray-200">{sector.name}</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedSectorName(sector.name);
                                                setShowSectorDetailsModal(true);
                                            }}
                                            className="text-[10px] px-2 py-0.5 rounded border border-cyan-500 text-cyan-300 hover:bg-cyan-900/30 transition-colors"
                                            title="Ver detalhes das peças neste setor"
                                        >
                                            <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" /> Detalhes</span>
                                        </button>
                                        <span className="font-mono text-xs text-[#FFD700] font-bold">{sector.count} <span className="text-gray-500 font-normal">/ {sector.capacity}</span></span>
                                    </div>
                                </div>
                                <div className="w-full bg-[#2e0249] rounded-full h-3 border border-[#570a8a] overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${sector.color} transition-all duration-1000 ease-out relative`}
                                        style={{ width: `${fillPercent}%` }}
                                    >
                                        {/* Striped animation effect */}
                                        <div className="absolute inset-0 bg-white/10 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}></div>
                                    </div>
                                </div>
                                {fillPercent > 80 && (
                                    <div className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Alta Demanda
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-10 border-t border-[#570a8a] pt-6">
                    <h4 className="text-sm font-bold text-white mb-4">Eficiência Média (Semana)</h4>
                    <p className="text-xs text-gray-400">Sem dados suficientes para calcular eficiência.</p>
                </div>
            </div>
        </div>
      </div>

            {showFullTimelineModal && selectedProcess && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#2e0249] border border-[#FFD700] rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-[#570a8a] flex justify-between items-center bg-[#4a148c]">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Timer className="w-5 h-5 text-[#FFD700]" />
                                Histórico Completo - Processo {selectedProcess.id}
                            </h3>
                            <button
                                onClick={() => setShowFullTimelineModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                <div className="bg-[#1b002b] rounded-md p-3 border border-[#570a8a]">
                                    <p className="text-xs text-purple-300 uppercase">Tempo Total</p>
                                    <p className="text-[#FFD700] font-mono font-bold text-lg mt-1">{formatTime(getTotalProcessSeconds(selectedProcess))}</p>
                                </div>
                                <div className="bg-[#1b002b] rounded-md p-3 border border-[#570a8a]">
                                    <p className="text-xs text-purple-300 uppercase">Setor Atual</p>
                                    <p className="text-white font-bold mt-1">{selectedProcess.currentSector}</p>
                                </div>
                                <div className={`rounded-md p-3 border ${selectedProcess.status === 'finished' ? 'bg-emerald-900/30 border-emerald-500/50' : 'bg-cyan-900/30 border-cyan-500/50'}`}>
                                    <p className="text-xs text-purple-300 uppercase">Status</p>
                                    <div className="mt-1 flex items-center gap-2">
                                        {selectedProcess.status === 'finished' ? (
                                            <CheckCircle className="w-4 h-4 text-emerald-300" />
                                        ) : (
                                            <Activity className="w-4 h-4 text-cyan-300" />
                                        )}
                                        <p className={`font-bold ${selectedProcess.status === 'finished' ? 'text-emerald-300' : 'text-cyan-300'}`}>
                                            {selectedProcess.status === 'finished' ? 'Finalizado' : 'Em andamento'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#1b002b] rounded-lg border border-[#570a8a] overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-[#3c0360] text-gray-300 text-xs uppercase">
                                        <tr>
                                            <th className="p-3">Setor</th>
                                            <th className="p-3">Entrada</th>
                                            <th className="p-3">Saída</th>
                                            <th className="p-3 text-right">Tempo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#570a8a]/50 text-sm">
                                        {buildProcessTimeline(selectedProcess).length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="p-4 text-center text-gray-400">Sem histórico de setores para este processo.</td>
                                            </tr>
                                        ) : (
                                            buildProcessTimeline(selectedProcess).map((row, idx) => (
                                                <tr key={`${row.sector}-${idx}`} className="hover:bg-[#2e0249]">
                                                    <td className="p-3 text-white font-medium">{row.sector}</td>
                                                    <td className="p-3 text-gray-300 font-mono text-xs">{formatDateTime(row.startedAt)}</td>
                                                    <td className="p-3 text-gray-300 font-mono text-xs">{row.endedAt ? formatDateTime(row.endedAt) : 'Em andamento'}</td>
                                                    <td className="p-3 text-right text-cyan-300 font-mono">{formatTime(row.duration)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="p-4 border-t border-[#570a8a] bg-[#1b002b] flex justify-end">
                            <button
                                onClick={() => setShowFullTimelineModal(false)}
                                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded font-bold transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

      {/* Monthly Report Modal */}
      {showMonthlyModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-[#2e0249] border border-[#FFD700] rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden">
                  <div className="p-5 border-b border-[#570a8a] flex justify-between items-center bg-[#4a148c]">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <BarChart className="w-5 h-5 text-[#FFD700]" />
                          Produção Mensal de Funcionários
                      </h3>
                      <button onClick={() => setShowMonthlyModal(false)} className="text-gray-400 hover:text-white transition-colors">
                          <X className="w-6 h-6" />
                      </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                      <div className="bg-[#1b002b] rounded-lg border border-[#570a8a] overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-[#3c0360] text-[#FFD700] text-xs uppercase">
                                <tr>
                                    <th className="p-3">Funcionário</th>
                                    <th className="p-3">Setor</th>
                                    <th className="p-3 text-right">Total Produzido (Mês)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#570a8a]">
                                {monthlyStats.map((stat, idx) => (
                                    <tr key={idx} className="hover:bg-[#2e0249] transition-colors">
                                        <td className="p-3 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 border border-[#570a8a] flex items-center justify-center overflow-hidden">
                                                {stat.avatar ? (
                                                    <img src={stat.avatar} alt={stat.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Users className="w-4 h-4 text-gray-400" />
                                                )}
                                            </div>
                                            <span className="text-white font-medium">{stat.name}</span>
                                        </td>
                                        <td className="p-3 text-sm text-gray-400">{stat.sector}</td>
                                        <td className="p-3 text-right">
                                            <button
                                              type="button"
                                              onClick={() => handleOpenEmployeeHistory(stat.name)}
                                              className="bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-400 px-2 py-1 rounded font-bold font-mono transition-colors"
                                              title="Clique para ver o histórico das peças tratadas"
                                            >
                                                {stat.count}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      </div>
                      <p className="text-center text-xs text-gray-500 mt-4">
                          * Dados consolidados do mês vigente.
                      </p>
                  </div>
                  <div className="p-4 border-t border-[#570a8a] bg-[#1b002b] flex justify-end">
                      <button 
                        onClick={() => setShowMonthlyModal(false)}
                        className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded font-bold transition-colors"
                      >
                          Fechar
                      </button>
                  </div>
              </div>
          </div>
      )}

            {showOverdueModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#2e0249] border border-red-500 rounded-xl shadow-2xl max-w-5xl w-full max-h-[85vh] flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-[#570a8a] flex justify-between items-center bg-[#4a148c]">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-300" />
                                Peças com Prazo Estourado
                            </h3>
                            <button onClick={() => setShowOverdueModal(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="bg-[#1b002b] rounded-lg border border-[#570a8a] overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-[#3c0360] text-gray-300 text-xs uppercase">
                                        <tr>
                                            <th className="p-3">Peça</th>
                                            <th className="p-3">Setor</th>
                                            <th className="p-3">Técnico</th>
                                            <th className="p-3">Tempo no Setor</th>
                                            <th className="p-3">Cliente</th>
                                            <th className="p-3">Prazo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#570a8a]/50 text-sm">
                                        {overdueRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-4 text-center text-gray-500">Nenhuma peça atrasada no momento.</td>
                                            </tr>
                                        ) : (
                                            overdueRows.map((row, idx) => (
                                                <tr key={`${row.processId}-${idx}`} className="hover:bg-[#2e0249]">
                                                    <td className="p-3 text-white font-medium">
                                                        {row.partName}
                                                        <div className="text-xs text-gray-500 font-mono">{row.partCode}</div>
                                                    </td>
                                                    <td className="p-3 text-[#FFD700]">{row.sector}</td>
                                                    <td className="p-3 text-gray-300">{row.technician}</td>
                                                    <td className="p-3 text-cyan-300 font-mono">{formatTime(row.elapsedSeconds)}</td>
                                                    <td className="p-3 text-gray-300">{row.clientName}</td>
                                                    <td className="p-3">
                                                        <span className="text-xs px-2 py-1 rounded border border-red-600 text-red-300 bg-red-900/20">
                                                            {row.deadlineLabel}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="p-4 border-t border-[#570a8a] bg-[#1b002b] flex justify-end">
                            <button
                                onClick={() => setShowOverdueModal(false)}
                                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded font-bold transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSectorDetailsModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#2e0249] border border-cyan-400 rounded-xl shadow-2xl max-w-5xl w-full max-h-[85vh] flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-[#570a8a] flex justify-between items-center bg-[#4a148c]">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Eye className="w-5 h-5 text-cyan-300" />
                                Detalhes do Setor - {selectedSectorName}
                            </h3>
                            <button onClick={() => setShowSectorDetailsModal(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="bg-[#1b002b] rounded-lg border border-[#570a8a] overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-[#3c0360] text-gray-300 text-xs uppercase">
                                        <tr>
                                            <th className="p-3">Peça</th>
                                            <th className="p-3">Técnico</th>
                                            <th className="p-3">Tempo no Setor</th>
                                            <th className="p-3">Cliente</th>
                                            <th className="p-3">Previsão de Término</th>
                                            <th className="p-3">Status Prazo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#570a8a]/50 text-sm">
                                        {selectedSectorRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-4 text-center text-gray-500">Nenhuma peça ativa neste setor.</td>
                                            </tr>
                                        ) : (
                                            selectedSectorRows.map((row, idx) => (
                                                <tr key={`${row.processId}-${idx}`} className="hover:bg-[#2e0249]">
                                                    <td className="p-3 text-white font-medium">
                                                        {row.partName}
                                                        <div className="text-xs text-gray-500 font-mono">{row.partCode}</div>
                                                    </td>
                                                    <td className="p-3 text-gray-300">{row.technician}</td>
                                                    <td className="p-3 text-cyan-300 font-mono">{row.isActive ? formatTime(row.elapsedSeconds) : '--:--:--'}</td>
                                                    <td className="p-3 text-gray-300">{row.clientName}</td>
                                                    <td className="p-3 text-gray-200">{row.forecastLabel}</td>
                                                    <td className="p-3">
                                                        <span className={`text-xs px-2 py-1 rounded border ${row.isOverdue ? 'border-red-600 text-red-300 bg-red-900/20' : 'border-emerald-600 text-emerald-300 bg-emerald-900/20'}`}>
                                                            {row.isOverdue ? `Prazo estourado (${row.deadlineLabel})` : `No prazo (${row.deadlineLabel})`}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="p-4 border-t border-[#570a8a] bg-[#1b002b] flex justify-end">
                            <button
                                onClick={() => setShowSectorDetailsModal(false)}
                                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded font-bold transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

      {/* General Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#2e0249] border border-[#FFD700] rounded-xl shadow-2xl max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden">
                
                {/* Modal Header */}
                <div className="p-5 border-b border-[#570a8a] flex justify-between items-center bg-[#4a148c]">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <List className="w-5 h-5 text-[#FFD700]" />
                        Detalhamento Geral do Sistema
                    </h3>
                    <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[#570a8a] bg-[#1b002b]">
                    <button 
                        onClick={() => setDetailsTab('production')}
                        className={`flex-1 py-3 font-bold text-sm uppercase transition-colors flex items-center justify-center gap-2 ${detailsTab === 'production' ? 'bg-[#2e0249] text-[#FFD700] border-b-2 border-[#FFD700]' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Package className="w-4 h-4" /> Peças / Produção
                    </button>
                    <button 
                        onClick={() => setDetailsTab('employees')}
                        className={`flex-1 py-3 font-bold text-sm uppercase transition-colors flex items-center justify-center gap-2 ${detailsTab === 'employees' ? 'bg-[#2e0249] text-[#FFD700] border-b-2 border-[#FFD700]' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Users className="w-4 h-4" /> Funcionários
                    </button>
                    <button 
                        onClick={() => setDetailsTab('clients')}
                        className={`flex-1 py-3 font-bold text-sm uppercase transition-colors flex items-center justify-center gap-2 ${detailsTab === 'clients' ? 'bg-[#2e0249] text-[#FFD700] border-b-2 border-[#FFD700]' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Users className="w-4 h-4" /> Clientes
                    </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#2e0249]">
                    
                    {detailsTab === 'production' && (
                        <div className="space-y-8">
                             {/* Pending */}
                             <div>
                                <h4 className="text-[#FFD700] font-bold mb-3 flex items-center gap-2 text-sm uppercase">
                                    <Timer className="w-4 h-4" /> Em Processo (Pendentes)
                                </h4>
                                <div className="bg-[#1b002b] rounded-lg border border-[#570a8a] overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-[#3c0360] text-gray-300 text-xs uppercase">
                                            <tr>
                                                <th className="p-3">Peça</th>
                                                <th className="p-3">Funcionário</th>
                                                <th className="p-3">Setor Atual</th>
                                                <th className="p-3">Cliente</th>
                                                <th className="p-3">Previsão Término</th>
                                                <th className="p-3 text-right">Início</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#570a8a]/50 text-sm">
                                            {allProduction.filter(p => p.status !== 'finished').length === 0 ? (
                                                <tr><td colSpan={6} className="p-4 text-center text-gray-500">Nenhuma peça em produção no momento.</td></tr>
                                            ) : (
                                                allProduction.filter(p => p.status !== 'finished').map((prod, i) => (
                                                    <tr key={i} className="hover:bg-[#2e0249]">
                                                        <td className="p-3 text-white font-medium">
                                                            {prod.partName}
                                                            <div className="text-xs text-gray-500">{prod.partCode}</div>
                                                        </td>
                                                        <td className="p-3 text-gray-300">{prod.employeeName}</td>
                                                        <td className="p-3 text-[#FFD700]">{prod.currentSector}</td>
                                                        <td className="p-3 text-gray-300">{getProductByCode(prod.partCode)?.client || 'Nao encontrado'}</td>
                                                        <td className="p-3">
                                                            {getProductByCode(prod.partCode)?.deliveryDeadline ? (
                                                                <span className={`text-xs px-2 py-1 rounded border ${Date.now() > new Date(`${getProductByCode(prod.partCode)?.deliveryDeadline}T23:59:59`).getTime() ? 'border-red-600 text-red-300 bg-red-900/20' : 'border-emerald-600 text-emerald-300 bg-emerald-900/20'}`}>
                                                                    {new Date(getProductByCode(prod.partCode)!.deliveryDeadline!).toLocaleDateString('pt-BR')}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-gray-500">Sem previsão</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-right text-gray-400 font-mono text-xs">
                                                            {new Date(prod.startTime).toLocaleTimeString()}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                             </div>

                             {/* Finished */}
                             <div>
                                <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2 text-sm uppercase">
                                    <CheckCircle className="w-4 h-4" /> Finalizadas Hoje
                                </h4>
                                <div className="bg-[#1b002b] rounded-lg border border-[#570a8a] overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-[#3c0360] text-gray-300 text-xs uppercase">
                                            <tr>
                                                <th className="p-3">Peça</th>
                                                <th className="p-3">Funcionário</th>
                                                <th className="p-3">Setor Final</th>
                                                <th className="p-3 text-right">Data/Hora</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#570a8a]/50 text-sm">
                                             {allProduction.filter(p => p.status === 'finished').length === 0 ? (
                                                <tr><td colSpan={4} className="p-4 text-center text-gray-500">Nenhuma peça finalizada hoje.</td></tr>
                                            ) : (
                                                allProduction.filter(p => p.status === 'finished').map((prod, i) => (
                                                    <tr key={i} className="hover:bg-[#2e0249]">
                                                        <td className="p-3 text-white font-medium">
                                                            {prod.partName}
                                                            <div className="text-xs text-gray-500">{prod.partCode}</div>
                                                        </td>
                                                        <td className="p-3 text-gray-300">{prod.employeeName}</td>
                                                        <td className="p-3 text-emerald-400">Concluído</td>
                                                        <td className="p-3 text-right text-gray-400 font-mono text-xs">
                                                            {new Date(prod.startTime).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                             </div>
                        </div>
                    )}

                    {detailsTab === 'employees' && (
                        <div className="bg-[#1b002b] rounded-lg border border-[#570a8a] overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-[#3c0360] text-[#FFD700] text-xs uppercase">
                                    <tr>
                                        <th className="p-3">Nome</th>
                                        <th className="p-3">Setor</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3 text-right">Produção (Hoje)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#570a8a]/50 text-sm">
                                    {allEmployees.map((emp, i) => (
                                        <tr key={i} className="hover:bg-[#2e0249]">
                                            <td className="p-3 text-white font-bold flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden">
                                                    {emp.avatar ? <img src={emp.avatar} className="w-full h-full object-cover"/> : <Users className="w-3 h-3 m-1.5 text-gray-400"/>}
                                                </div>
                                                {emp.name}
                                            </td>
                                            <td className="p-3 text-gray-300">{emp.sector}</td>
                                            <td className="p-3">
                                                <span className={`text-[10px] px-2 py-0.5 rounded border ${emp.status === 'Online' ? 'border-emerald-500 text-emerald-400 bg-emerald-900/20' : 'border-gray-600 text-gray-400'}`}>
                                                    {emp.status || 'Offline'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right font-mono text-[#FFD700]">
                                                {systemStore.getDailyProductionCount(emp.name)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {detailsTab === 'clients' && (
                        <div className="bg-[#1b002b] rounded-lg border border-[#570a8a] overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-[#3c0360] text-[#FFD700] text-xs uppercase">
                                    <tr>
                                        <th className="p-3">Nome do Cliente</th>
                                        <th className="p-3">Documento</th>
                                        <th className="p-3">Email</th>
                                        <th className="p-3">Telefone</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#570a8a]/50 text-sm">
                                    {allClients.map((client, i) => (
                                        <tr key={i} className="hover:bg-[#2e0249]">
                                            <td className="p-3 text-white font-bold">{client.name}</td>
                                            <td className="p-3 text-gray-300">{client.doc}</td>
                                            <td className="p-3 text-gray-400">{client.email}</td>
                                            <td className="p-3 text-gray-400">{client.contact}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                </div>

                <div className="p-4 border-t border-[#570a8a] bg-[#1b002b] flex justify-end">
                      <button 
                        onClick={() => setShowDetailsModal(false)}
                        className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded font-bold transition-colors"
                      >
                          Fechar
                      </button>
                  </div>
            </div>
        </div>
      )}

            {showEmployeeHistoryModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#2e0249] border border-[#FFD700] rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-[#570a8a] flex justify-between items-center bg-[#4a148c]">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Timer className="w-5 h-5 text-[#FFD700]" />
                                Histórico de Peças Tratadas - {employeeHistoryTitle}
                            </h3>
                            <button onClick={() => setShowEmployeeHistoryModal(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="bg-[#1b002b] rounded-lg border border-[#570a8a] overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-[#3c0360] text-gray-300 text-xs uppercase">
                                        <tr>
                                            <th className="p-3">Processo</th>
                                            <th className="p-3">Peça</th>
                                            <th className="p-3">Setor Tratado</th>
                                            <th className="p-3 text-right">Tempo Gasto</th>
                                            <th className="p-3 text-right">Finalizado em</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#570a8a]/50 text-sm">
                                        {employeeHistoryRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-4 text-center text-gray-400">Nenhum tratamento de peça registrado para este funcionário no mês.</td>
                                            </tr>
                                        ) : (
                                            employeeHistoryRows.map((row, index) => (
                                                <tr key={`${row.processId}-${row.partCode}-${index}`} className="hover:bg-[#2e0249]">
                                                    <td className="p-3 text-cyan-300 font-mono">{row.processId}</td>
                                                    <td className="p-3 text-white">
                                                        {row.partName}
                                                        <div className="text-xs text-gray-500 font-mono">{row.partCode}</div>
                                                    </td>
                                                    <td className="p-3 text-[#FFD700]">{row.sector}</td>
                                                    <td className="p-3 text-right text-emerald-300 font-mono">{formatTime(row.durationSeconds)}</td>
                                                    <td className="p-3 text-right text-gray-400 font-mono text-xs">{new Date(row.endedAt).toLocaleString('pt-BR')}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="p-4 border-t border-[#570a8a] bg-[#1b002b] flex justify-end">
                            <button onClick={() => setShowEmployeeHistoryModal(false)} className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded font-bold transition-colors">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

    </div>
  );
};
