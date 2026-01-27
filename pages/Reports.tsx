import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { StorageService } from '../services/storage';
import { Client } from '../types';

interface ClientWithCount extends Client {
    reportsCount: number;
}

const Reports = () => {
    const [clients, setClients] = useState<ClientWithCount[]>([]);
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const loadedClients = StorageService.getClients();
        // Calculate report count for each client dynamically
        const clientsWithData = loadedClients.map(client => {
            const reports = StorageService.getReports(client.id);
            return {
                ...client,
                reportsCount: reports.length
            };
        });
        setClients(clientsWithData);
    }, []);

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
                        <span className="font-bold text-lg text-slate-900 dark:text-white">Reportes</span>
                    </div>
                </header>

                <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Link to="/" className="hidden md:flex p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Centro de Reportes</h1>
                            <p className="text-slate-500">Seleccione un cliente para ver sus informes operativos detallados.</p>
                        </div>
                    </div>
                    
                    <div className="mt-8">
                        {clients.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-surface-dark rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">folder_off</span>
                                <p className="text-slate-500">No hay clientes registrados.</p>
                                <Link to="/create-client" className="text-primary hover:underline mt-2 inline-block">Crear Cliente</Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {clients.map(client => (
                                    <Link to={`/reports/${client.id}`} key={client.id} className="group bg-white dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all flex flex-col justify-between h-48 relative overflow-hidden">
                                        <div className={`absolute top-0 right-0 w-2 h-full ${client.status === 'Active' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                        <div className="flex justify-between items-start">
                                            {/* Profile Sync Logic */}
                                            {client.photoUrl ? (
                                                <img src={client.photoUrl} alt={client.name} className="size-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                                            ) : (
                                                <div className={`size-12 rounded-lg ${client.colorClass || 'bg-primary/10 text-primary'} flex items-center justify-center border-0`}>
                                                    <span className="font-bold text-xl">{client.initials}</span>
                                                </div>
                                            )}
                                            
                                            <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold mr-2">
                                                {client.id}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate">{client.name}</h3>
                                            <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                                                <span className="material-symbols-outlined text-[16px]">folder_open</span>
                                                {client.reportsCount} informes disponibles
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Reports;