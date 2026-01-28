import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { StorageService } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';
import { Client, User, Visit } from '../types';

const CreateVisit = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const [clients, setClients] = useState<Client[]>([]);
    const [supervisors, setSupervisors] = useState<User[]>([]);
    
    const [formData, setFormData] = useState({
        clientInput: '', // Can be name or ID
        supervisorId: '', 
        date: new Date().toISOString().split('T')[0],
        type: 'Visita Mensual',
        notes: ''
    });

    useEffect(() => {
        const loadedClients = StorageService.getClients();
        setClients(loadedClients);
        
        const allUsers = StorageService.getUsers();
        setSupervisors(allUsers.filter(u => u.role === 'supervisor'));
        
        // Auto-select self if supervisor
        let initialSupId = '';
        if (user?.role === 'supervisor') {
            initialSupId = user.id;
        }

        // Check for URL params to pre-fill client
        const preSelectedClientId = searchParams.get('clientId');
        let initialClientInput = '';
        
        if (preSelectedClientId) {
            const foundClient = loadedClients.find(c => c.id === preSelectedClientId);
            if (foundClient) {
                initialClientInput = `${foundClient.name} (ID: ${foundClient.id})`;
            }
        }

        setFormData(prev => ({ 
            ...prev, 
            supervisorId: initialSupId || prev.supervisorId,
            clientInput: initialClientInput || prev.clientInput
        }));

    }, [user, searchParams]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Logic to determine if client exists or is new/manual
        let clientName = formData.clientInput;
        let clientId = `MANUAL-${Date.now()}`; // Default ID for manual entry

        // Try to find existing client by name or ID pattern
        const existingClient = clients.find(c => 
            c.name.toLowerCase() === formData.clientInput.toLowerCase() || 
            `${c.name} (ID: ${c.id})` === formData.clientInput
        );

        if (existingClient) {
            clientId = existingClient.id;
            clientName = existingClient.name;
        }

        const supervisorIdToUse = user?.role === 'developer' ? formData.supervisorId : user?.id;
        const selectedSupervisor = StorageService.getUsers().find(u => u.id === supervisorIdToUse);

        if (!selectedSupervisor || !user) return;

        const newVisit: Visit = {
            id: Date.now().toString(),
            clientId: clientId,
            clientName: clientName,
            supervisorId: selectedSupervisor.id,
            supervisorName: selectedSupervisor.name,
            status: 'Pending',
            date: formData.date,
            type: formData.type,
            notes: formData.notes,
            createdBy: user.id,
            creatorName: user.name,
            hasReport: false
        };

        StorageService.addVisit(newVisit);
        
        if (user?.role === 'developer') {
            navigate('/');
        } else {
            navigate('/my-visits');
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-row overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-3xl mx-auto">
                    <header className="flex items-center gap-4 mb-8">
                        <Link to={user?.role === 'developer' ? '/' : '/my-visits'} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Programar Nueva Visita</h1>
                            <p className="text-slate-500 text-sm">
                                {user?.role === 'developer' 
                                    ? 'Asigne una visita operativa a un supervisor.' 
                                    : 'Registre una nueva visita en su calendario.'}
                            </p>
                        </div>
                    </header>

                    <form onSubmit={handleSubmit} className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Client Selection - Combobox Style */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Cliente</label>
                                <input 
                                    list="clients-list" 
                                    required
                                    value={formData.clientInput}
                                    onChange={e => setFormData({...formData, clientInput: e.target.value})}
                                    placeholder="Seleccione de la lista o escriba el nombre..."
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                />
                                <datalist id="clients-list">
                                    {clients.map(client => (
                                        <option key={client.id} value={`${client.name} (ID: ${client.id})`} />
                                    ))}
                                </datalist>
                                <p className="text-xs text-slate-400 mt-1">Puede seleccionar un cliente existente o escribir uno nuevo manualmente.</p>
                            </div>

                            {/* Supervisor Selection (Admin Only) */}
                            {user?.role === 'developer' && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Asignar Supervisor</label>
                                    <select 
                                        required 
                                        value={formData.supervisorId} 
                                        onChange={e => setFormData({...formData, supervisorId: e.target.value})} 
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                    >
                                        <option value="">Seleccione un Supervisor...</option>
                                        {supervisors.map(sup => (
                                            <option key={sup.id} value={sup.id}>{sup.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Fecha Programada</label>
                                <input 
                                    type="date" 
                                    required 
                                    value={formData.date} 
                                    onChange={e => setFormData({...formData, date: e.target.value})} 
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                                />
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Visita</label>
                                <select 
                                    required 
                                    value={formData.type} 
                                    onChange={e => setFormData({...formData, type: e.target.value})} 
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                >
                                    <option value="Visita Mensual">Visita Operativa Mensual</option>
                                    <option value="Auditoría">Auditoría Sorpresa</option>
                                    <option value="Incidente">Reporte de Incidente</option>
                                    <option value="Capacitación">Capacitación de Personal</option>
                                    <option value="Entrega">Entrega de Insumos/Equipo</option>
                                </select>
                            </div>

                            {/* Notes */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Notas / Instrucciones (Opcional)</label>
                                <textarea 
                                    rows={3} 
                                    value={formData.notes} 
                                    onChange={e => setFormData({...formData, notes: e.target.value})} 
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                                    placeholder="Instrucciones específicas para esta visita..." 
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                            <Link to={user?.role === 'developer' ? '/' : '/my-visits'} className="px-6 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
                                Cancelar
                            </Link>
                            <button type="submit" className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg shadow-primary/20 flex items-center gap-2">
                                <span className="material-symbols-outlined">calendar_add_on</span>
                                Programar Visita
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default CreateVisit;