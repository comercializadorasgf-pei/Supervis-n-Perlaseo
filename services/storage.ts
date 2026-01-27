import { User, InventoryItem, Report, Client, Visit, Message, StatusLog } from '../types';

// Initial Data Seeding
const SEED_USERS: User[] = [
    { id: '1', name: 'Admin Master', email: 'admin@demo.com', role: 'developer', phone: '+52 555 123 4567', position: 'Desarrollador Senior', avatarUrl: 'https://picsum.photos/id/64/200/200' },
    { id: '2', name: 'Maria Supervisor', email: 'supervisor@demo.com', role: 'supervisor', phone: '+52 555 987 6543', position: 'Supervisor de Zona', avatarUrl: 'https://picsum.photos/id/65/200/200' },
    { id: '3', name: 'Carlos Técnico', email: 'carlos@demo.com', role: 'supervisor', phone: '+52 555 111 2222', position: 'Soporte Técnico', avatarUrl: 'https://picsum.photos/id/91/200/200' }
];

const SEED_CLIENTS: Client[] = [
    {
        id: 'CL-001',
        initials: 'TS',
        name: 'TechSolutions S.A.',
        nit: '900.123.456-1',
        photoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=200',
        contactName: 'Juan Pérez',
        email: 'juan@tech.com',
        status: 'Active',
        totalVisits: 12,
        lastVisitDate: '2023-10-15',
        colorClass: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50'
    },
    {
        id: 'CL-002',
        initials: 'FC',
        name: 'Farmacia Central',
        nit: '800.987.654-2',
        contactName: 'Maria Gonzales',
        email: 'mgonzales@farma.com',
        status: 'Active',
        totalVisits: 8,
        lastVisitDate: '2023-09-20',
        colorClass: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50'
    }
];

const SEED_VISITS: Visit[] = [
    { 
        id: '4092', 
        clientId: 'CL-002', 
        clientName: 'Farmacia Central',
        clientNit: '800.987.654-2',
        supervisorId: '2', 
        supervisorName: 'Maria Supervisor', 
        status: 'Completed', 
        date: '2023-10-12', 
        type: 'Mensual', 
        hasReport: true,
        createdBy: '1',
        creatorName: 'Admin Master',
        completedAt: '2023-10-12T14:30:45',
        completedDate: '2023-10-12',
        interviewSummary: 'Todo en orden con el gerente. Se revisaron protocolos.',
        observations: [
            { id: '1', title: 'Extintor Vencido', severity: 'High', description: 'El extintor del pasillo principal caducó.' }
        ],
        photos: ['https://picsum.photos/id/1/300/300']
    },
    { 
        id: '4093', 
        clientId: 'CL-001', 
        clientName: 'TechSolutions S.A.',
        clientNit: '900.123.456-1', 
        supervisorId: '2', 
        supervisorName: 'Maria Supervisor', 
        status: 'Pending', 
        date: '2023-10-15', 
        type: 'Incidente', 
        createdBy: '1',
        creatorName: 'Admin Master',
        hasReport: false 
    }
];

const SEED_INVENTORY: InventoryItem[] = [
    { 
        id: '1', 
        name: 'Taladro Percutor', 
        description: 'Bosch Professional GSB 13 RE', 
        serialNumber: 'BS-29291', 
        imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=300', 
        status: 'Disponible',
        history: [
            {
                post: 'Obra Central - Zona A',
                date: '01/01/2023',
                endDate: '15/01/2023',
                supervisorName: 'Maria Supervisor',
                operatorName: 'Juan Obrero',
                supervisorSignature: 'sig_sup_1',
                operatorSignature: 'sig_op_1',
                observations: 'Entregado con broca de 1/4'
            }
        ],
        maintenanceLog: [],
        statusLogs: [
            {
                id: 'log-1',
                date: '2023-01-01T08:00:00',
                previousStatus: 'Disponible',
                newStatus: 'Asignado',
                changedBy: 'Maria Supervisor',
                reason: 'Asignación a Juan Obrero'
            },
            {
                id: 'log-2',
                date: '2023-01-15T18:00:00',
                previousStatus: 'Asignado',
                newStatus: 'Disponible',
                changedBy: 'Maria Supervisor',
                reason: 'Devolución fin de obra'
            }
        ]
    },
    { 
        id: '2', 
        name: 'Multímetro Digital', 
        description: 'Fluke 117 Electricians', 
        serialNumber: 'FL-9921', 
        imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=300', 
        status: 'En Taller',
        history: [],
        maintenanceLog: [],
        statusLogs: [
             {
                id: 'log-3',
                date: '2023-10-10T09:30:00',
                previousStatus: 'Disponible',
                newStatus: 'En Taller',
                changedBy: 'Carlos Técnico',
                reason: 'Falla en pantalla'
            }
        ]
    }
];

const SEED_REPORTS: Report[] = [];
const SEED_MESSAGES: Message[] = [];

// Helper to initialize storage
const initStorage = () => {
    if (!localStorage.getItem('app_users')) localStorage.setItem('app_users', JSON.stringify(SEED_USERS));
    if (!localStorage.getItem('app_inventory')) localStorage.setItem('app_inventory', JSON.stringify(SEED_INVENTORY));
    if (!localStorage.getItem('app_reports')) localStorage.setItem('app_reports', JSON.stringify(SEED_REPORTS));
    if (!localStorage.getItem('app_clients')) localStorage.setItem('app_clients', JSON.stringify(SEED_CLIENTS));
    if (!localStorage.getItem('app_visits')) localStorage.setItem('app_visits', JSON.stringify(SEED_VISITS));
    if (!localStorage.getItem('app_messages')) localStorage.setItem('app_messages', JSON.stringify(SEED_MESSAGES));
    
    // Init default passwords
    if (!localStorage.getItem('pwd_admin@demo.com')) localStorage.setItem('pwd_admin@demo.com', '123456');
    if (!localStorage.getItem('pwd_supervisor@demo.com')) localStorage.setItem('pwd_supervisor@demo.com', '123456');
    if (!localStorage.getItem('pwd_carlos@demo.com')) localStorage.setItem('pwd_carlos@demo.com', '123456');
};

initStorage();

export const StorageService = {
    // Users
    getUsers: (): User[] => JSON.parse(localStorage.getItem('app_users') || '[]'),
    
    addUser: (user: User, initialPassword?: string) => {
        const users = StorageService.getUsers();
        users.push(user);
        localStorage.setItem('app_users', JSON.stringify(users));
        if (initialPassword) {
            localStorage.setItem(`pwd_${user.email}`, initialPassword);
        } else {
            localStorage.setItem(`pwd_${user.email}`, '123456');
        }
    },

    updateUser: (updatedUser: User) => {
        const users = StorageService.getUsers();
        const index = users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
            users[index] = updatedUser;
            localStorage.setItem('app_users', JSON.stringify(users));
        }
    },

    deleteUser: (userId: string) => {
        const users = StorageService.getUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
            localStorage.removeItem(`pwd_${user.email}`); 
        }
        const filtered = users.filter(u => u.id !== userId);
        localStorage.setItem('app_users', JSON.stringify(filtered));
    },

    login: (email: string, password: string): User | null => {
        const storedPassword = localStorage.getItem(`pwd_${email}`);
        if (storedPassword && storedPassword === password) {
            const users = StorageService.getUsers();
            return users.find(u => u.email === email) || null;
        }
        return null;
    },

    updatePassword: (email: string, newPassword: string) => {
        localStorage.setItem(`pwd_${email}`, newPassword);
    },

    // Clients
    getClients: (): Client[] => JSON.parse(localStorage.getItem('app_clients') || '[]'),
    
    addClient: (client: Client) => {
        const clients = StorageService.getClients();
        // Ensure ID is generated if not provided or collision (basic check)
        if (!client.id || clients.some(c => c.id === client.id)) {
             const count = clients.length + 1;
             client.id = `CL-${String(count).padStart(3, '0')}`;
        }
        clients.push(client);
        localStorage.setItem('app_clients', JSON.stringify(clients));
    },

    // Bulk upload with Upsert logic
    addClientsBulk: (newClients: Partial<Client>[]) => {
        const clients = StorageService.getClients();
        let createdCount = 0;
        let updatedCount = 0;

        const colors = [
            'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50',
            'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50',
            'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50',
            'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/50'
        ];

        // Determine next ID sequence to avoid collisions
        let maxId = 0;
        clients.forEach(c => {
             const num = parseInt(c.id.replace('CL-', ''));
             if (!isNaN(num) && num > maxId) maxId = num;
        });

        newClients.forEach(c => {
            // Identifier strategy: Prefer NIT, fallback to Email
            const existingIndex = clients.findIndex(existing => 
                (c.nit && existing.nit === c.nit) || 
                (c.email && existing.email === c.email)
            );

            if (existingIndex !== -1) {
                // UPDATE EXISTING
                const existing = clients[existingIndex];
                clients[existingIndex] = {
                    ...existing,
                    ...c, // Overwrite with new data from CSV
                    id: existing.id, // Preserve system ID
                    // Preserve stats and dynamic fields
                    totalVisits: existing.totalVisits,
                    lastVisitDate: existing.lastVisitDate,
                    colorClass: existing.colorClass || colors[0],
                    // Recalculate initials if name provided
                    initials: c.name 
                        ? c.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                        : existing.initials
                };
                updatedCount++;
            } else {
                // CREATE NEW
                maxId++;
                const newId = `CL-${String(maxId).padStart(3, '0')}`;
                const initials = c.name ? c.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'XX';
                const colorClass = colors[Math.floor(Math.random() * colors.length)];

                clients.push({
                    id: newId,
                    name: c.name || 'Sin Nombre',
                    nit: c.nit || '',
                    contactName: c.contactName || '',
                    email: c.email || '',
                    phone: c.phone || '',
                    address: c.address || '',
                    photoUrl: c.photoUrl || '',
                    initials: initials,
                    status: 'Active',
                    totalVisits: 0,
                    lastVisitDate: '-',
                    colorClass: colorClass
                } as Client);
                createdCount++;
            }
        });

        localStorage.setItem('app_clients', JSON.stringify(clients));
        return { created: createdCount, updated: updatedCount };
    },

    updateClient: (updatedClient: Client) => {
        const clients = StorageService.getClients();
        const index = clients.findIndex(c => c.id === updatedClient.id);
        if (index !== -1) {
            clients[index] = updatedClient;
            localStorage.setItem('app_clients', JSON.stringify(clients));
        }
    },

    deleteClient: (clientId: string) => {
        const clients = StorageService.getClients();
        const filtered = clients.filter(c => c.id !== clientId);
        localStorage.setItem('app_clients', JSON.stringify(filtered));
    },

    // Visits
    getVisits: (): Visit[] => JSON.parse(localStorage.getItem('app_visits') || '[]'),
    
    getVisitById: (id: string): Visit | undefined => {
        const visits = StorageService.getVisits();
        return visits.find(v => v.id === id);
    },

    addVisit: (visit: Visit) => {
        const visits = StorageService.getVisits();
        visits.unshift(visit); 
        localStorage.setItem('app_visits', JSON.stringify(visits));
    },

    updateVisit: (updatedVisit: Visit) => {
        const visits = StorageService.getVisits();
        const index = visits.findIndex(v => v.id === updatedVisit.id);
        if (index !== -1) {
            visits[index] = updatedVisit;
            localStorage.setItem('app_visits', JSON.stringify(visits));
        }
    },

    deleteVisit: (visitId: string) => {
        const visits = StorageService.getVisits();
        const filtered = visits.filter(v => v.id !== visitId);
        localStorage.setItem('app_visits', JSON.stringify(visits));
    },

    // Inventory
    getInventory: (): InventoryItem[] => JSON.parse(localStorage.getItem('app_inventory') || '[]'),
    
    addInventoryItem: (item: InventoryItem) => {
        const inv = StorageService.getInventory();
        inv.push(item);
        localStorage.setItem('app_inventory', JSON.stringify(inv));
    },

    addInventoryBulk: (newItems: Partial<InventoryItem>[]) => {
        const inventory = StorageService.getInventory();
        let createdCount = 0;
        let skippedCount = 0;

        newItems.forEach((item, index) => {
            // Check for duplicate by Serial Number
            const exists = item.serialNumber && inventory.some(existing => 
                existing.serialNumber.toLowerCase() === item.serialNumber?.toLowerCase()
            );

            if (!exists && item.name) {
                const newItem: InventoryItem = {
                    id: `${Date.now()}-${index}`, // Unique ID
                    name: item.name,
                    description: item.description || '',
                    serialNumber: item.serialNumber || 'SN-UNKNOWN',
                    imageUrl: item.imageUrl || 'https://via.placeholder.com/300?text=No+Image',
                    status: 'Disponible',
                    history: [],
                    maintenanceLog: [],
                    statusLogs: [
                        {
                            id: `log-${Date.now()}-${index}`,
                            date: new Date().toISOString(),
                            previousStatus: 'Disponible',
                            newStatus: 'Disponible',
                            changedBy: 'Importación CSV',
                            reason: 'Carga masiva inicial'
                        }
                    ]
                };
                inventory.push(newItem);
                createdCount++;
            } else {
                skippedCount++;
            }
        });

        localStorage.setItem('app_inventory', JSON.stringify(inventory));
        return { created: createdCount, skipped: skippedCount };
    },

    updateInventoryItem: (updatedItem: InventoryItem) => {
        const inv = StorageService.getInventory();
        const index = inv.findIndex(i => i.id === updatedItem.id);
        if (index !== -1) {
            inv[index] = updatedItem;
            localStorage.setItem('app_inventory', JSON.stringify(inv));
        }
    },

    deleteInventoryItem: (itemId: string) => {
        const inv = StorageService.getInventory();
        const filtered = inv.filter(i => i.id !== itemId);
        localStorage.setItem('app_inventory', JSON.stringify(filtered));
    },

    // Reports 
    getReports: (clientId: string): Report[] => {
        const legacyReports = JSON.parse(localStorage.getItem('app_reports') || '[]').filter((r: Report) => r.clientId === clientId);
        const visits = StorageService.getVisits();
        const visitReports: Report[] = visits
            .filter(v => v.clientId === clientId && v.status === 'Completed')
            .map(v => ({
                id: v.id,
                clientId: v.clientId,
                title: `Reporte: ${v.type}`,
                date: v.completedDate || v.date,
                type: v.type,
                url: `/visit-details/${v.id}`
            }));

        return [...visitReports, ...legacyReports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    // Messages
    getMessages: (): Message[] => JSON.parse(localStorage.getItem('app_messages') || '[]'),
    
    sendMessage: (msg: Message) => {
        const msgs = StorageService.getMessages();
        msgs.push(msg);
        localStorage.setItem('app_messages', JSON.stringify(msgs));
    }
};