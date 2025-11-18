
export interface Product {
  id: number;
  name: string;
  code: string;
  client: string;
  sector: string;
}

export interface Employee {
  id: number;
  name: string;
  sector: string;
  avatar: string | null;
  cpf?: string;
  status?: string;
  dailyProductionBase: number;
  username?: string;
  password?: string;
}

export interface ProductionEntry {
  id: string;
  employeeName: string;
  avatar: string | null;
  partName: string;
  partCode: string;
  currentSector: string;
  startTime: number; // timestamp
  status: 'working' | 'paused' | 'finished';
  dailyCount: number; 
}

export interface Client {
    id: number;
    name: string;
    doc: string;
    contact: string;
    email: string;
    address: string;
}

export interface Sector {
  id: number;
  name: string;
  manager: string;
  description: string;
}

// Interface for UI Persistence (Active Tab State)
export interface ProductionSession {
  employeeName: string;
  clientName: string;
  partName: string;
  partId: string;
  currentSector: string;
  nextSector: string;
  selectedAvatar: string | null;
  processId: string;
  isRunning: boolean;
  isFinished: boolean;
  startTime: number;
  stopTime: number | null;
}

class SystemStore {
  // Initial Data Defaults (Clean State - Only Admin)
  employees: Employee[] = [
     { id: 1, name: 'Administrador', sector: 'Administração', avatar: null, status: 'Online', cpf: '000.000.000-00', dailyProductionBase: 0, username: 'admin', password: '123' }
  ];

  products: Product[] = [];
  clients: Client[] = [];
  production: ProductionEntry[] = [];
  
  sectors: Sector[] = [
    { id: 1, name: 'Triagem', manager: 'João Paulo', description: 'Recebimento e separação inicial de materiais.' },
    { id: 2, name: 'Corte', manager: 'Ana Maria', description: 'Corte de tecidos conforme moldes.' },
    { id: 3, name: 'Costura', manager: 'Pedro Santos', description: 'Montagem das peças.' },
    { id: 4, name: 'Montagem Final', manager: 'Carlos Oliveira', description: 'Acabamento e verificação final.' },
    { id: 5, name: 'Bordado', manager: 'Fernanda Lima', description: 'Aplicação de bordados e detalhes.' },
    { id: 6, name: 'Embalagem', manager: 'Roberto Costa', description: 'Embalamento final dos produtos.' },
    { id: 7, name: 'Expedição', manager: 'Juliana Silva', description: 'Envio para o cliente.' },
  ];

  // Persistence State
  currentSession: ProductionSession | null = null;
  currentUser: Employee | null = null; 
  
  // Storage Key - Changed to force a fresh start and clean data
  private STORAGE_KEY = 'recout_system_v5_reset';

  constructor() {
    this.loadFromStorage();
  }

  // --- STORAGE PERSISTENCE ---
  private loadFromStorage() {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (parsed.employees && Array.isArray(parsed.employees)) this.employees = parsed.employees;
        if (parsed.products && Array.isArray(parsed.products)) this.products = parsed.products;
        if (parsed.clients && Array.isArray(parsed.clients)) this.clients = parsed.clients;
        if (parsed.production && Array.isArray(parsed.production)) this.production = parsed.production;
        if (parsed.sectors && Array.isArray(parsed.sectors)) this.sectors = parsed.sectors;
        
        // Restore logged in user from storage if available
        if (parsed.currentUser) {
            this.currentUser = parsed.currentUser;
        }
      }
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    }
  }

  private saveToStorage() {
    try {
      const data = {
        employees: this.employees,
        products: this.products,
        clients: this.clients,
        production: this.production,
        sectors: this.sectors,
        currentUser: this.currentUser 
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Erro ao salvar dados:", e);
    }
  }

  // --- AUTH ---
  login(username: string, password?: string): boolean {
    this.loadFromStorage(); // Force sync before login to find newly registered users
    
    const user = this.employees.find(e => e.username?.trim().toLowerCase() === username.trim().toLowerCase());
    
    if (user) {
      // Simple password check
      if (user.password === password) {
        this.currentUser = user;
        this.saveToStorage(); // Save session
        return true;
      }
    }
    return false;
  }

  logout() {
    this.currentUser = null;
    this.clearCurrentSession();
    this.saveToStorage();
  }

  getCurrentUser() {
    // Check validity of current session on load
    if (!this.currentUser && this.employees.length > 0) {
        // Fallback to prevent crash in demo, but preferably return null
        // this.currentUser = this.employees[0];
    }
    return this.currentUser;
  }

  // --- PRODUCTS ---
  getProducts() { return this.products; }
  addProduct(p: Product) { 
    this.loadFromStorage(); // Sync
    this.products.push(p); 
    this.saveToStorage(); 
  }
  removeProduct(id: number) { 
    this.loadFromStorage();
    this.products = this.products.filter(p => p.id !== id); 
    this.saveToStorage();
  }

  // --- EMPLOYEES ---
  getEmployees() { return this.employees; }
  addEmployee(e: Employee) { 
    this.loadFromStorage(); // Critical: Load existing users first so we don't overwrite
    this.employees.push(e); 
    this.saveToStorage();
  }
  removeEmployee(id: number) { 
    this.loadFromStorage();
    this.employees = this.employees.filter(e => e.id !== id); 
    this.saveToStorage();
  }

  // --- CLIENTS ---
  getClients() { return this.clients; }
  addClient(c: Client) { 
    this.loadFromStorage();
    this.clients.push(c); 
    this.saveToStorage();
  }
  removeClient(id: number) { 
    this.loadFromStorage();
    this.clients = this.clients.filter(c => c.id !== id); 
    this.saveToStorage();
  }

  // --- SECTORS ---
  getSectors() { return this.sectors; }
  addSector(s: Sector) {
    this.loadFromStorage();
    this.sectors.push(s);
    this.saveToStorage();
  }
  updateSector(updatedSector: Sector) {
    this.loadFromStorage();
    this.sectors = this.sectors.map(s => s.id === updatedSector.id ? updatedSector : s);
    this.saveToStorage();
  }
  removeSector(id: number) {
    this.loadFromStorage();
    this.sectors = this.sectors.filter(s => s.id !== id);
    this.saveToStorage();
  }

  // --- PRODUCTION ---
  getProduction() { return this.production; }
  
  startProduction(entry: ProductionEntry) {
    this.loadFromStorage();
    this.production.push(entry);
    this.saveToStorage();
  }

  updateProductionSector(id: string, sector: string) {
    this.loadFromStorage();
    const p = this.production.find(x => x.id === id || x.partCode === id); 
    if(p) {
        p.currentSector = sector;
        this.saveToStorage();
    }
  }

  finishProduction(id: string) {
    this.loadFromStorage();
    const index = this.production.slice().reverse().findIndex(x => (x.id === id || x.partCode === id) && x.status === 'working');
    if(index !== -1) {
        const realIndex = this.production.length - 1 - index;
        this.production[realIndex].status = 'finished';
        this.saveToStorage();
    }
  }

  getDailyProductionCount(employeeName: string): number {
    // No loadFromStorage here to avoid perf hit in loops, assume sync is handled by modifiers or initial load
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    
    const emp = this.employees.find(e => e.name === employeeName);
    const baseCount = emp?.dailyProductionBase || 0;

    const actualFinished = this.production.filter(p => 
        p.employeeName === employeeName && 
        p.status === 'finished' && 
        p.startTime >= startOfDay.getTime()
    ).length;

    return baseCount + actualFinished;
  }

  getMonthlyProductionCount(employeeName: string): number {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    const emp = this.employees.find(e => e.name === employeeName);
    
    const actualFinished = this.production.filter(p => 
        p.employeeName === employeeName && 
        p.status === 'finished' && 
        p.startTime >= startOfMonth
    ).length;

    const daysPassed = now.getDate();
    const simulatedHistory = (emp?.dailyProductionBase || 0) * daysPassed;

    return simulatedHistory + actualFinished;
  }

  // --- SESSION ---
  getCurrentSession() { return this.currentSession; }
  saveCurrentSession(session: ProductionSession) { 
      this.currentSession = session; 
  }
  clearCurrentSession() { this.currentSession = null; }

  // --- STATS ---
  getSectorStats() {
    const sectors = ['Triagem', 'Corte', 'Costura', 'Bordado', 'Montagem Final', 'Embalagem', 'Expedição'];
    return sectors.map(sector => {
        const count = this.products.filter(p => p.sector === sector).length 
                    + this.production.filter(p => p.currentSector === sector && p.status === 'working').length;
        
        let capacity = 100;
        let color = 'bg-blue-500';
        if (sector === 'Expedição') { capacity = 1000; color = 'bg-emerald-500'; }
        if (sector === 'Triagem') { capacity = 500; color = 'bg-indigo-500'; }

        return { name: sector, count, capacity, color };
    });
  }
}

export const systemStore = new SystemStore();
