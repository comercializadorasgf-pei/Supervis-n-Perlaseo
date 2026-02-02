import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../services/storage';
import { Visit, Client, User } from '../types';
import VisitPreviewModal from '../components/VisitPreviewModal';
import VisitActionModal from '../components/VisitActionModal';
import Sidebar from '../components/Sidebar';

const MyVisits = () => {
    const { user } = useAuth();
    const [allVisits, setAllVisits] = useState<Visit[]>([]);
    const [visits, setVisits] = useState<Visit[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [supervisors, setSupervisors] = useState<User[]>([]);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    
    // Filters
    const [filterDate, setFilterDate] = useState('');
    const [filterClient, setFilterClient] = useState('');
    const [filterSupervisor, setFilterSupervisor] = useState('');

    // Preview Modal State
    const [selectedPreviewVisit, setSelectedPreviewVisit] = useState<Visit | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Action Modal State
    const [selectedActionVisit, setSelectedActionVisit] = useState<Visit | null>(null);
    const [isActionOpen, setIsActionOpen] = useState(false);

    const loadData = () => {
        if (user) {
            const loadedVisits = StorageService.getVisits();
            // If Developer, show all. If Supervisor, show only assigned.
            const relevantVisits = user.role === 'developer' 
                ? loadedVisits 
                : loadedVisits.filter(v => v.supervisorId === user.id);
            
            setAllVisits(relevantVisits);
            setVisits(relevantVisits);
            
            setClients(StorageService.getClients());
            const users = StorageService.getUsers();
            setSupervisors(users.filter(u => u.role === 'supervisor'));
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    // Apply Filters
    useEffect(() => {
        let filtered = allVisits;

        if (filterDate) {
            filtered = filtered.filter(v => v.date === filterDate);
        }

        if (filterClient) {
            filtered = filtered.filter(v => v.clientId === filterClient);
        }

        if (filterSupervisor) {
            filtered = filtered.filter(v => v.supervisorId === filterSupervisor);
        }

        setVisits(filtered);
    }, [filterDate, filterClient, filterSupervisor, allVisits]);

    const handleOpenPreview = (visit: Visit) => {
        // Hydrate client data for preview
        const clientsData = StorageService.getClients();
        const client = clientsData.find(c => c.id === visit.clientId);
        const hydratedVisit = {
            ...visit,
            clientPhotoUrl: client?.photoUrl,
            clientNit: client?.nit
        };
        setSelectedPreviewVisit(hydratedVisit);
        setIsPreviewOpen(true);
    };

    const handleOpenAction = (visit: Visit) => {
        setSelectedActionVisit(visit);
        setIsActionOpen(true);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
            case 'Pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
            case 'In Progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
            case 'Cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-row overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
                 {/* Mobile Header */}
                 <header className="lg:hidden flex items-center justify-between p-4 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark sticky top-0 z-20 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setSidebarOpen(true)}
                            className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <Link to="/" className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </Link>
                        <span className="font-bold text-lg text-slate-900 dark:text-white">Mis Visitas</span>
                    </div>
                </header>

                <div className="flex-1 max-w-[1400px] mx-auto w-full p-4 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-4">
                            <Link to="/" className="hidden md:flex p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                                <span className="material-symbols-outlined">arrow_back</span>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mis Visitas</h1>
                                <p className="text-slate-500 text-sm">Administra y ejecuta tus visitas programadas.</p>
                            </div>
                        </div>
                        <Link to="/create-visit" className="flex items-center justify-center gap-2 rounded-lg h-10 px-6 bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-md shadow-primary/20 transition-all w-full md:w-auto">
                            <span className="material-symbols-outlined text-[20px]">add_circle</span>
                            <span>Programar Nueva</span>
                        </Link>
                    </div>

                    {/* Filters */}
                    <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 flex flex-wrap gap-4 items-end">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Fecha</label>
                            <input 
                                type="date" 
                                value={filterDate} 
                                onChange={e => setFilterDate(e.target.value)} 
                                className="px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-primary outline-none" 
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Cliente</label>
                            <select 
                                value={filterClient} 
                                onChange={e => setFilterClient(e.target.value)} 
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-primary outline-none"
                            >
                                <option value="">Todos los clientes</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        {user?.role === 'developer' && (
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Supervisor</label>
                                <select 
                                    value={filterSupervisor} 
                                    onChange={e => setFilterSupervisor(e.target.value)} 
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-primary outline-none"
                                >
                                    <option value="">Todos los supervisores</option>
                                    {supervisors.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <button 
                            onClick={() => { setFilterDate(''); setFilterClient(''); setFilterSupervisor(''); }} 
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg text-sm transition-colors"
                        >
                            Limpiar Filtros
                        </button>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Fecha</th>
                                        <th className="px-6 py-4 font-semibold">Cliente</th>
                                        <th className="px-6 py-4 font-semibold">Tipo</th>
                                        <th className="px-6 py-4 font-semibold">Supervisor</th>
                                        <th className="px-6 py-4 font-semibold">Estado</th>
                                        <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {visits.length > 0 ? (
                                        visits.map(visit => (
                                            <tr key={visit.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                    {visit.date}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                    {visit.clientName}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                    {visit.type}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                    {visit.supervisorName}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${getStatusStyle(visit.status)}`}>
                                                        {visit.status === 'Completed' ? 'Completada' : 
                                                         visit.status === 'Pending' ? 'Pendiente' : 
                                                         visit.status === 'In Progress' ? 'En Progreso' : 
                                                         visit.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleOpenPreview(visit)}
                                                            className="p-1.5 text-slate-400 hover:text-primary rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                            title="Vista Rápida"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                        </button>

                                                        {visit.status === 'Pending' ? (
                                                            <button 
                                                                onClick={() => handleOpenAction(visit)}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm shadow-green-600/20"
                                                                title="Validar / Gestionar Visita"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                                                Validar
                                                            </button>
                                                        ) : (
                                                            <Link 
                                                                to={`/visit-details/${visit.id}`} 
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors"
                                                            >
                                                                Ver Detalle
                                                                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                                            </Link>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                                No se encontraron visitas con los filtros seleccionados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Modals */}
                <VisitPreviewModal 
                    visit={selectedPreviewVisit} 
                    isOpen={isPreviewOpen} 
                    onClose={() => setIsPreviewOpen(false)} 
                />
                
                <VisitActionModal
                    visit={selectedActionVisit}
                    isOpen={isActionOpen}
                    onClose={() => setIsActionOpen(false)}
                    onUpdate={loadData}
                />
            </main>
        </div>
    );
};

export default MyVisits;