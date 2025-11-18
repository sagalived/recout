
import React, { useState, useEffect } from 'react';
import { Clock, Activity, Users, Package, TrendingUp, AlertCircle, Calendar, X, BarChart, List, CheckCircle, Timer } from 'lucide-react';
import { ActiveView } from '../App';
import { systemStore, Employee, Client, ProductionEntry } from '../services/storage';

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
  const [sectorStats, setSectorStats] = useState<any[]>([]);
  const [totalDailyProduction, setTotalDailyProduction] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Modals State
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState<{name: string, sector: string, count: number, avatar: string | null}[]>([]);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'clients' | 'employees' | 'production'>('production');
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [allProduction, setAllProduction] = useState<ProductionEntry[]>([]);

  // Mock Client Orders (can be moved to storage later)
  const [clientOrders] = useState([
    { id: '101', client: 'Padaria Pão Dourado', orderRef: 'PED-2023-001', totalItems: 500, completedItems: 350, status: 'Em Produção', deadline: '15/11' },
    { id: '102', client: 'Malharia Têxtil Sul', orderRef: 'PED-2023-005', totalItems: 1000, completedItems: 120, status: 'Atrasado', deadline: '10/11' },
    { id: '103', client: 'João da Silva', orderRef: 'PED-2023-008', totalItems: 50, completedItems: 45, status: 'Finalizando', deadline: '12/11' },
  ]);

  // Update Loop
  useEffect(() => {
    const updateData = () => {
      const rawProduction = systemStore.getProduction();
      const stats = systemStore.getSectorStats();
      const allEmployees = systemStore.getEmployees();

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
            elapsedSeconds: Math.floor((Date.now() - p.startTime) / 1000)
        };
      }).filter(p => p.status === 'working' || p.status === 'paused'); // Only show active

      // Sort by most recent (lowest elapsed time usually means just started, or reverse)
      uiProduction.sort((a, b) => a.elapsedSeconds - b.elapsedSeconds);

      setLiveProduction(uiProduction);
      setSectorStats(stats);
      setLoading(false);
    };

    // Initial call
    updateData();

    // Interval
    const interval = setInterval(updateData, 1000);

    return () => clearInterval(interval);
  }, []);

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

  // Format Seconds to HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalWIP = sectorStats.reduce((acc: number, curr: any) => acc + curr.count, 0);

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
                <span className="text-xl font-bold text-[#FFD700]">{totalWIP} <span className="text-xs font-normal text-white/50">peças</span></span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Live Employee Monitor (2/3 width on large screens) */}
        <div className="xl:col-span-2 space-y-6">
            
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
                        <div key={item.id} className={`bg-[#1b002b] border-l-4 ${item.status === 'working' ? 'border-emerald-500' : 'border-amber-500'} rounded-r-lg shadow-lg p-4 relative overflow-hidden group hover:bg-[#2e0249] transition-colors`}>
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
                        </div>
                    ))}
                </div>
            )}

            {/* Client Orders Table */}
            <div className="bg-[#1b002b] rounded-lg border border-[#570a8a] p-5 mt-8">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#FFD700]" />
                    Pedidos em Produção
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs text-purple-300 uppercase bg-[#2e0249]">
                            <tr>
                                <th className="p-3">Cliente / Pedido</th>
                                <th className="p-3 text-center">Progresso</th>
                                <th className="p-3 text-center">Prazo</th>
                                <th className="p-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#570a8a]/30 text-sm">
                            {clientOrders.map(order => {
                                const percentage = Math.round((order.completedItems / order.totalItems) * 100);
                                return (
                                    <tr key={order.id} className="hover:bg-[#2e0249]/50">
                                        <td className="p-3">
                                            <div className="font-bold text-white">{order.client}</div>
                                            <div className="text-xs text-gray-400">{order.orderRef}</div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-700 rounded-full h-2">
                                                    <div 
                                                        className={`h-2 rounded-full ${percentage > 80 ? 'bg-emerald-500' : percentage > 40 ? 'bg-blue-500' : 'bg-amber-500'}`} 
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-mono text-white w-8 text-right">{percentage}%</span>
                                            </div>
                                            <div className="text-[10px] text-gray-500 text-center mt-1">
                                                {order.completedItems} / {order.totalItems} peças
                                            </div>
                                        </td>
                                        <td className="p-3 text-center text-gray-300 font-mono">
                                            {order.deadline}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                                order.status === 'Atrasado' ? 'bg-red-900/50 text-red-400' :
                                                order.status === 'Finalizando' ? 'bg-emerald-900/50 text-emerald-400' :
                                                'bg-blue-900/50 text-blue-400'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

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
                                    <span className="font-mono text-xs text-[#FFD700] font-bold">{sector.count} <span className="text-gray-500 font-normal">/ {sector.capacity}</span></span>
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
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-400">Corte</span>
                        <span className="text-xs text-emerald-400 font-bold">+12%</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-400">Costura</span>
                        <span className="text-xs text-red-400 font-bold">-5%</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Montagem</span>
                        <span className="text-xs text-emerald-400 font-bold">+3%</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

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
                                            <span className="bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded font-bold font-mono">
                                                {stat.count}
                                            </span>
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
                                                <th className="p-3 text-right">Início</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#570a8a]/50 text-sm">
                                            {allProduction.filter(p => p.status !== 'finished').length === 0 ? (
                                                <tr><td colSpan={4} className="p-4 text-center text-gray-500">Nenhuma peça em produção no momento.</td></tr>
                                            ) : (
                                                allProduction.filter(p => p.status !== 'finished').map((prod, i) => (
                                                    <tr key={i} className="hover:bg-[#2e0249]">
                                                        <td className="p-3 text-white font-medium">
                                                            {prod.partName}
                                                            <div className="text-xs text-gray-500">{prod.partCode}</div>
                                                        </td>
                                                        <td className="p-3 text-gray-300">{prod.employeeName}</td>
                                                        <td className="p-3 text-[#FFD700]">{prod.currentSector}</td>
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

    </div>
  );
};
