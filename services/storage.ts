
export interface Product {
  id: number;
  name: string;
  code: string;
  client: string;
  sector: string;
  deliveryDeadline?: string;
  completedAt?: number;
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
  sectorStartTime: number; // timestamp do inicio no setor atual
  sectorTimes: Record<string, number>; // segundos por setor
  sectorHistory?: Array<{
    sector: string;
    employeeName: string;
    startedAt: number;
    endedAt: number;
    durationSeconds: number;
  }>;
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

export interface DeliveryAlert {
  id: string;
  processId: string;
  partCode: string;
  partName: string;
  clientName: string;
  clientContact: string;
  clientEmail: string;
  createdAt: number;
  delivered: boolean;
}

export interface PartMediaAsset {
  id: string;
  partCode: string;
  processId?: string;
  sector?: string;
  uploadedBy?: string;
  fileName: string;
  fileType: string;
  dataUrl: string;
  contentFormat?: 'dataUrl' | 'text';
  textContent?: string;
  uploadedAt: number;
}

const DEFAULT_SECTORS: Sector[] = [
  { id: 1, name: 'Triagem', manager: 'João Paulo', description: 'Recebimento e separação inicial de materiais.' },
  { id: 2, name: 'CAD', manager: 'Ana Maria', description: 'Modelagem e detalhamento técnico das peças.' },
  { id: 3, name: 'CAM', manager: 'Pedro Santos', description: 'Programação e preparação para fabricação assistida.' },
  { id: 4, name: 'Freezagem', manager: 'Carlos Oliveira', description: 'Estabilização e preparação intermediária de produção.' },
  { id: 5, name: 'Acabamento', manager: 'Fernanda Lima', description: 'Finalização, revisão visual e controle de qualidade.' },
];

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

export interface PersistedSystemState {
  employees: Employee[];
  products: Product[];
  clients: Client[];
  production: ProductionEntry[];
  deliveryAlerts: DeliveryAlert[];
  partMedia: PartMediaAsset[];
  sectors: Sector[];
  currentUser: Employee | null;
  updatedAt: number;
}

class SystemStore {
  // Initial Data Defaults (Clean State - Only Admin)
  employees: Employee[] = [
    { id: 1, name: 'Administrador', sector: 'Triagem', avatar: null, status: 'Online', cpf: '000.000.000-00', dailyProductionBase: 0, username: 'admin', password: 'admin' }
  ];

  products: Product[] = [];
  clients: Client[] = [];
  production: ProductionEntry[] = [];
  deliveryAlerts: DeliveryAlert[] = [];
  partMedia: PartMediaAsset[] = [];
  
  sectors: Sector[] = DEFAULT_SECTORS.map(s => ({ ...s }));

  // Persistence State
  currentSession: ProductionSession | null = null;
  currentUser: Employee | null = null; 
  
  // Storage Key - Changed to force a fresh start and clean data
  private STORAGE_KEY = 'recout_system_v5_reset';
  private updatedAt = Date.now();

  constructor() {
    this.loadFromStorage();
  }

  // --- STORAGE PERSISTENCE ---
  private loadFromStorage() {
    try {
      let shouldPersistMigration = false;
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (parsed.employees && Array.isArray(parsed.employees)) this.employees = parsed.employees;
        if (parsed.products && Array.isArray(parsed.products)) this.products = parsed.products;
        if (parsed.clients && Array.isArray(parsed.clients)) this.clients = parsed.clients;
        if (parsed.production && Array.isArray(parsed.production)) {
          this.production = parsed.production.map((entry: ProductionEntry) => ({
            ...entry,
            sectorStartTime: entry.sectorStartTime || entry.startTime,
            sectorTimes: entry.sectorTimes || {},
            sectorHistory: entry.sectorHistory || []
          }));
        }
        if (parsed.deliveryAlerts && Array.isArray(parsed.deliveryAlerts)) {
          this.deliveryAlerts = parsed.deliveryAlerts.map((alert: DeliveryAlert) => ({
            ...alert,
            clientContact: alert.clientContact || '',
            clientEmail: alert.clientEmail || ''
          }));
        }
        if (parsed.partMedia && Array.isArray(parsed.partMedia)) this.partMedia = parsed.partMedia;
        if (parsed.sectors && Array.isArray(parsed.sectors)) this.sectors = parsed.sectors;
        if (typeof parsed.updatedAt === 'number') this.updatedAt = parsed.updatedAt;
        
        // Restore logged in user from storage if available
        if (parsed.currentUser) {
            this.currentUser = parsed.currentUser;
        }

        // Migration: enforce default admin credentials as admin/admin.
        const adminIndex = this.employees.findIndex(e => e.username?.trim().toLowerCase() === 'admin');
        if (adminIndex >= 0 && this.employees[adminIndex].password !== 'admin') {
          this.employees[adminIndex] = { ...this.employees[adminIndex], password: 'admin' };
          shouldPersistMigration = true;
        }
      }

      if (!this.employees.some(e => e.username?.trim().toLowerCase() === 'admin')) {
        this.employees.unshift({
          id: 1,
          name: 'Administrador',
          sector: 'Triagem',
          avatar: null,
          status: 'Online',
          cpf: '000.000.000-00',
          dailyProductionBase: 0,
          username: 'admin',
          password: 'admin'
        });
        shouldPersistMigration = true;
      }

      const normalizedCurrentSectors = this.sectors
        .map(s => s.name.trim().toLowerCase())
        .sort()
        .join('|');
      const normalizedDefaultSectors = DEFAULT_SECTORS
        .map(s => s.name.trim().toLowerCase())
        .sort()
        .join('|');

      if (normalizedCurrentSectors !== normalizedDefaultSectors || this.sectors.length !== DEFAULT_SECTORS.length) {
        this.sectors = DEFAULT_SECTORS.map(s => ({ ...s }));
        shouldPersistMigration = true;
      }

      // Migration: products linked to finished processes should be flagged as completed.
      const finishedByCode = new Map<string, { completedAt: number; sector: string }>();
      this.production
        .filter(entry => entry.status === 'finished')
        .forEach(entry => {
          const fromHistory = entry.sectorHistory && entry.sectorHistory.length > 0
            ? entry.sectorHistory[entry.sectorHistory.length - 1].endedAt
            : Date.now();
          finishedByCode.set(entry.partCode, {
            completedAt: fromHistory,
            sector: entry.currentSector,
          });
        });

      if (finishedByCode.size > 0) {
        let changed = false;
        this.products = this.products.map(product => {
          const finished = finishedByCode.get(product.code);
          if (!finished) return product;
          if (product.completedAt) return product;
          changed = true;
          return {
            ...product,
            completedAt: finished.completedAt,
            sector: finished.sector,
          };
        });
        if (changed) {
          shouldPersistMigration = true;
        }
      }

      // Seed data for quick manual testing when records are below target volume.
      const targetCount = 10;
      if (this.clients.length < targetCount || this.products.length < targetCount) {
        const sampleClients: Client[] = [
          { id: Date.now() + 1, name: 'Cliente Alpha', doc: '11.111.111/0001-11', contact: '(11) 98888-1001', email: 'alpha@cliente.com', address: 'Rua A, 100' },
          { id: Date.now() + 2, name: 'Cliente Beta', doc: '22.222.222/0001-22', contact: '(11) 98888-1002', email: 'beta@cliente.com', address: 'Rua B, 200' },
          { id: Date.now() + 3, name: 'Cliente Gama', doc: '33.333.333/0001-33', contact: '(11) 98888-1003', email: 'gama@cliente.com', address: 'Rua C, 300' },
          { id: Date.now() + 4, name: 'Cliente Delta', doc: '44.444.444/0001-44', contact: '(11) 98888-1004', email: 'delta@cliente.com', address: 'Rua D, 400' },
          { id: Date.now() + 5, name: 'Cliente Epsilon', doc: '55.555.555/0001-55', contact: '(11) 98888-1005', email: 'epsilon@cliente.com', address: 'Rua E, 500' },
          { id: Date.now() + 6, name: 'Cliente Zeta', doc: '66.666.666/0001-66', contact: '(11) 98888-1006', email: 'zeta@cliente.com', address: 'Rua F, 600' },
          { id: Date.now() + 7, name: 'Cliente Eta', doc: '77.777.777/0001-77', contact: '(11) 98888-1007', email: 'eta@cliente.com', address: 'Rua G, 700' },
          { id: Date.now() + 8, name: 'Cliente Theta', doc: '88.888.888/0001-88', contact: '(11) 98888-1008', email: 'theta@cliente.com', address: 'Rua H, 800' },
          { id: Date.now() + 9, name: 'Cliente Iota', doc: '99.999.999/0001-99', contact: '(11) 98888-1009', email: 'iota@cliente.com', address: 'Rua I, 900' },
          { id: Date.now() + 10, name: 'Cliente Kappa', doc: '10.101.010/0001-10', contact: '(11) 98888-1010', email: 'kappa@cliente.com', address: 'Rua J, 1000' },
        ];

        sampleClients.forEach(sample => {
          if (this.clients.length >= targetCount) return;
          const exists = this.clients.some(c => c.name === sample.name || c.doc === sample.doc);
          if (!exists) {
            this.clients.push(sample);
            shouldPersistMigration = true;
          }
        });

        const baseCode = 2001;
        const triagem = this.sectors.find(s => s.name.toLowerCase() === 'triagem')?.name || 'Triagem';
        for (let i = 0; i < targetCount && this.products.length < targetCount; i++) {
          const code = String(baseCode + i);
          const name = `Peca Teste ${i + 1}`;
          const client = this.clients[i % this.clients.length]?.name || 'Cliente Alpha';
          const deadline = new Date();
          deadline.setDate(deadline.getDate() + 7 + i);
          const exists = this.products.some(p => p.code === code || p.name === name);
          if (!exists) {
            this.products.push({
              id: Date.now() + 100 + i,
              name,
              code,
              client,
              sector: triagem,
              deliveryDeadline: deadline.toISOString().slice(0, 10)
            });
            shouldPersistMigration = true;
          }
        }
      }

      if (shouldPersistMigration) {
        this.saveToStorage();
      }
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    }
  }

  private saveToStorage() {
    try {
      this.updatedAt = Date.now();
      const data: PersistedSystemState = {
        employees: this.employees,
        products: this.products,
        clients: this.clients,
        production: this.production,
        deliveryAlerts: this.deliveryAlerts,
        partMedia: this.partMedia,
        sectors: this.sectors,
        currentUser: this.currentUser,
        updatedAt: this.updatedAt,
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      // Sync imediato com o banco no Vercel (fire-and-forget)
      void fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: data }),
      }).catch(() => { /* offline — localStorage já salvo */ });
    } catch (e) {
      console.error("Erro ao salvar dados:", e);
    }
  }

  getPersistedState(): PersistedSystemState {
    this.loadFromStorage();
    return {
      employees: this.employees,
      products: this.products,
      clients: this.clients,
      production: this.production,
      deliveryAlerts: this.deliveryAlerts,
      partMedia: this.partMedia,
      sectors: this.sectors,
      currentUser: this.currentUser,
      updatedAt: this.updatedAt,
    };
  }

  replacePersistedState(state: PersistedSystemState) {
    if (!state) return;

    this.employees = Array.isArray(state.employees) ? state.employees : this.employees;
    this.products = Array.isArray(state.products) ? state.products : this.products;
    this.clients = Array.isArray(state.clients) ? state.clients : this.clients;
    this.production = Array.isArray(state.production) ? state.production : this.production;
    this.deliveryAlerts = Array.isArray(state.deliveryAlerts) ? state.deliveryAlerts : this.deliveryAlerts;
    this.partMedia = Array.isArray(state.partMedia) ? state.partMedia : this.partMedia;
    this.sectors = Array.isArray(state.sectors) && state.sectors.length > 0 ? state.sectors : DEFAULT_SECTORS.map(s => ({ ...s }));
    this.currentUser = state.currentUser || null;
    this.updatedAt = typeof state.updatedAt === 'number' ? state.updatedAt : Date.now();

    const snapshot: PersistedSystemState = {
      employees: this.employees,
      products: this.products,
      clients: this.clients,
      production: this.production,
      deliveryAlerts: this.deliveryAlerts,
      partMedia: this.partMedia,
      sectors: this.sectors,
      currentUser: this.currentUser,
      updatedAt: this.updatedAt,
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(snapshot));
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
  updateProduct(updated: Product) {
    this.loadFromStorage();
    this.products = this.products.map(p => p.id === updated.id ? updated : p);
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
  updateEmployee(updated: Employee) {
    this.loadFromStorage();
    this.employees = this.employees.map(e => e.id === updated.id ? updated : e);
    if (this.currentUser?.id === updated.id) {
      this.currentUser = updated;
    }
    this.saveToStorage();
  }
  removeEmployee(id: number) { 
    this.loadFromStorage();
    this.employees = this.employees.filter(e => e.id !== id); 
    if (this.currentUser?.id === id) {
      this.currentUser = null;
    }
    this.saveToStorage();
  }

  // --- CLIENTS ---
  getClients() { return this.clients; }
  addClient(c: Client) { 
    this.loadFromStorage();
    this.clients.push(c); 
    this.saveToStorage();
  }
  updateClient(updated: Client) {
    this.loadFromStorage();
    this.clients = this.clients.map(c => c.id === updated.id ? updated : c);
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

  getPendingDeliveryAlerts() {
    this.loadFromStorage();
    return this.deliveryAlerts.filter(a => !a.delivered);
  }

  addDeliveryAlert(alert: Omit<DeliveryAlert, 'id' | 'createdAt' | 'delivered'>) {
    this.loadFromStorage();
    const alreadyExists = this.deliveryAlerts.some(a => a.processId === alert.processId && !a.delivered);
    if (alreadyExists) return;

    this.deliveryAlerts.push({
      id: `delivery-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      processId: alert.processId,
      partCode: alert.partCode,
      partName: alert.partName,
      clientName: alert.clientName,
      clientContact: alert.clientContact,
      clientEmail: alert.clientEmail,
      createdAt: Date.now(),
      delivered: false,
    });
    this.saveToStorage();
  }

  markDeliveryAlertAsDelivered(alertId: string) {
    this.loadFromStorage();
    this.deliveryAlerts = this.deliveryAlerts.filter(alert => alert.id !== alertId);
    this.saveToStorage();
  }

  deleteProcessCompletely(processId: string) {
    this.loadFromStorage();

    const processEntries = this.production.filter(p => p.id === processId);
    const relatedPartCodes = new Set(processEntries.map(p => p.partCode));

    // Remove all historical entries of this process.
    this.production = this.production.filter(p => p.id !== processId);

    // Remove linked product records (piece) from catalog.
    if (relatedPartCodes.size > 0) {
      this.products = this.products.filter(p => !relatedPartCodes.has(p.code));
      this.partMedia = this.partMedia.filter(m => !relatedPartCodes.has(m.partCode));
    }

    // Remove pending delivery alerts related to this process.
    this.deliveryAlerts = this.deliveryAlerts.filter(a => a.processId !== processId);

    // Clear active session if it's the same process.
    if (this.currentSession?.processId === processId) {
      this.currentSession = null;
    }

    this.saveToStorage();
  }

  getPartMedia(partCode: string) {
    this.loadFromStorage();
    return this.partMedia
      .filter(m => m.partCode === partCode)
      .sort((a, b) => b.uploadedAt - a.uploadedAt);
  }

  addPartMedia(asset: Omit<PartMediaAsset, 'id' | 'uploadedAt'>) {
    this.loadFromStorage();
    this.partMedia.push({
      id: `media-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      uploadedAt: Date.now(),
      ...asset,
    });
    this.saveToStorage();
  }

  removePartMedia(mediaId: string) {
    this.loadFromStorage();
    this.partMedia = this.partMedia.filter(m => m.id !== mediaId);
    this.saveToStorage();
  }

  getActiveProductions(employeeName?: string) {
    return this.production.filter(p => {
      const isActive = p.status === 'working' || p.status === 'paused';
      if (!isActive) return false;
      if (!employeeName) return true;
      return p.employeeName === employeeName;
    });
  }

  getNextProcessId() {
    this.loadFromStorage();
    let maxId = 0;

    this.production.forEach(p => {
      const numeric = parseInt(String(p.id).replace(/\D/g, ''), 10);
      if (!isNaN(numeric) && numeric > maxId) {
        maxId = numeric;
      }
    });

    const next = maxId > 0 ? maxId + 1 : 1;
    return next.toString().padStart(6, '0');
  }

  private getLastWorkingProductionIndex(id: string, employeeName?: string) {
    const reversedIndex = this.production
      .slice()
      .reverse()
      .findIndex(p => (p.id === id || p.partCode === id) && p.status === 'working' && (!employeeName || p.employeeName === employeeName));

    if (reversedIndex === -1) return -1;
    return this.production.length - 1 - reversedIndex;
  }
  
  startProduction(entry: ProductionEntry) {
    this.loadFromStorage();
    this.production.push(entry);
    this.products = this.products.map(product => {
      if (product.code !== entry.partCode) return product;
      return {
        ...product,
        sector: entry.currentSector,
        completedAt: undefined,
      };
    });
    this.saveToStorage();
  }

  updateProductionSector(id: string, sector: string, actorName?: string) {
    this.loadFromStorage();
    const index = this.getLastWorkingProductionIndex(id);
    if (index !== -1) {
      const p = this.production[index];
      const now = Date.now();
      const spentSeconds = Math.max(0, Math.floor((now - (p.sectorStartTime || p.startTime)) / 1000));
      const current = p.currentSector;
      const handler = actorName || p.employeeName;

      p.sectorTimes = p.sectorTimes || {};
      p.sectorTimes[current] = (p.sectorTimes[current] || 0) + spentSeconds;
      p.sectorHistory = p.sectorHistory || [];
      p.sectorHistory.push({
        sector: current,
        employeeName: handler,
        startedAt: p.sectorStartTime || p.startTime,
        endedAt: now,
        durationSeconds: spentSeconds
      });
      p.employeeName = handler;
      p.currentSector = sector;
      p.sectorStartTime = now;
      this.products = this.products.map(product => {
        if (product.code !== p.partCode) return product;
        return {
          ...product,
          sector,
        };
      });
      this.saveToStorage();
    }
  }

  finishProduction(id: string, actorName?: string) {
    this.loadFromStorage();
    const index = this.getLastWorkingProductionIndex(id);
    if (index !== -1) {
      const now = Date.now();
      const p = this.production[index];
      const spentSeconds = Math.max(0, Math.floor((now - (p.sectorStartTime || p.startTime)) / 1000));
      const current = p.currentSector;
      const handler = actorName || p.employeeName;

      p.sectorTimes = p.sectorTimes || {};
      p.sectorTimes[current] = (p.sectorTimes[current] || 0) + spentSeconds;
      p.sectorHistory = p.sectorHistory || [];
      p.sectorHistory.push({
        sector: current,
        employeeName: handler,
        startedAt: p.sectorStartTime || p.startTime,
        endedAt: now,
        durationSeconds: spentSeconds
      });
      p.employeeName = handler;
      p.status = 'finished';
      this.products = this.products.map(product => {
        if (product.code !== p.partCode) return product;
        return {
          ...product,
          sector: p.currentSector,
          completedAt: now,
        };
      });
      this.saveToStorage();
    }
  }

  getDailyProductionCount(employeeName: string): number {
    // No loadFromStorage here to avoid perf hit in loops, assume sync is handled by modifiers or initial load
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);

    const processIds = new Set<string>();
    this.production.forEach(p => {
      (p.sectorHistory || []).forEach(h => {
        if (h.employeeName === employeeName && h.endedAt >= startOfDay.getTime()) {
          processIds.add(p.id);
        }
      });
    });

    return processIds.size;
  }

  getMonthlyProductionCount(employeeName: string): number {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const processIds = new Set<string>();
    this.production.forEach(p => {
      (p.sectorHistory || []).forEach(h => {
        if (h.employeeName === employeeName && h.endedAt >= startOfMonth) {
          processIds.add(p.id);
        }
      });
    });

    return processIds.size;
  }

  getEmployeeProcessHistory(employeeName: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const rows: Array<{
      processId: string;
      partCode: string;
      partName: string;
      sector: string;
      durationSeconds: number;
      endedAt: number;
    }> = [];

    this.production.forEach(p => {
      (p.sectorHistory || []).forEach(h => {
        if (h.employeeName === employeeName && h.endedAt >= startOfMonth) {
          rows.push({
            processId: p.id,
            partCode: p.partCode,
            partName: p.partName,
            sector: h.sector,
            durationSeconds: h.durationSeconds,
            endedAt: h.endedAt
          });
        }
      });
    });

    rows.sort((a, b) => b.endedAt - a.endedAt);
    return rows;
  }

  // --- SESSION ---
  getCurrentSession() { return this.currentSession; }
  saveCurrentSession(session: ProductionSession) { 
      this.currentSession = session; 
  }
  clearCurrentSession() { this.currentSession = null; }

  // --- STATS ---
  getSectorStats() {
    return this.sectors.map(sectorEntry => {
        const sector = sectorEntry.name;
        const stockCodes = this.products
          .filter(p => p.sector === sector && !p.completedAt)
          .map(p => p.code);
        const activeCodes = this.production
          .filter(p => p.currentSector === sector && (p.status === 'working' || p.status === 'paused'))
          .map(p => p.partCode);
        const count = new Set([...stockCodes, ...activeCodes]).size;
        
        let capacity = 100;
        let color = 'bg-blue-500';
        if (sector === 'Acabamento') { capacity = 1000; color = 'bg-emerald-500'; }
        if (sector === 'Triagem') { capacity = 500; color = 'bg-indigo-500'; }
        if (sector === 'CAD') { color = 'bg-cyan-500'; }
        if (sector === 'CAM') { color = 'bg-violet-500'; }
        if (sector === 'Freezagem') { color = 'bg-amber-500'; }

        return { name: sector, count, capacity, color };
    });
  }
}

export const systemStore = new SystemStore();
