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
    
    // Mode: 'multiple' (pick specific dates), 'recurring' (frequency range)
    const [mode, setMode] = useState<'multiple' | 'recurring'>('multiple');

    // General Form Data
    const [formData, setFormData] = useState({
        clientInput: '', 
        supervisorId: '', 
        type: 'Visita Mensual',
        notes: ''
    });

    // Date States for Manual Mode
    const [selectedDates, setSelectedDates] = useState<string[]>([new Date().toISOString().split('T')[0]]); // Default today
    
    // Recurrence State
    const [recurrence, setRecurrence] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0], // Default +30 days
        frequency: 'Weekly' as 'Daily' | 'Weekly' | 'BiWeekly' | 'Monthly',
        selectedDays: [] as number[] // 0=Sun, 1=Mon, etc.
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

    // --- Helper Logic for Dates ---

    const handleAddManualDate = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = e.target.value;
        if (date && !selectedDates.includes(date)) {
            // Sort dates chronologically
            const newDates = [...selectedDates, date].sort();
            setSelectedDates(newDates);
        }
    };

    const removeManualDate = (dateToRemove: string) => {
        setSelectedDates(selectedDates.filter(d => d !== dateToRemove));
    };

    const toggleDayOfWeek = (dayIndex: number) => {
        setRecurrence(prev => {
            const days = prev.selectedDays.includes(dayIndex)
                ? prev.selectedDays.filter(d => d !== dayIndex)
                : [...prev.selectedDays, dayIndex];
            return { ...prev, selectedDays: days };
        });
    };

    // Calculate dates based on Recurrence settings
    const calculateRecurrenceDates = (): string[] => {
        const dates: string[] = [];
        const start = new Date(recurrence.startDate + 'T00:00:00');
        const end = new Date(recurrence.endDate + 'T00:00:00');
        
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

        const current = new Date(start);

        while (current <= end) {
            const currentDayIndex = current.getDay(); // 0-6
            const currentDateStr = current.toISOString().split('T')[0];

            if (recurrence.frequency === 'Daily') {
                dates.push(currentDateStr);
                current.setDate(current.getDate() + 1);
            } 
            else if (recurrence.frequency === 'Weekly') {
                // If specific days selected, check if current matches
                if (recurrence.selectedDays.length > 0) {
                    if (recurrence.selectedDays.includes(currentDayIndex)) {
                        dates.push(currentDateStr);
                    }
                    current.setDate(current.getDate() + 1); // Move day by day to check match if filtering by days
                } else {
                    // Simple weekly (every 7 days from start if no days selected)
                    dates.push(currentDateStr);
                    current.setDate(current.getDate() + 7);
                }
            }
            else if (recurrence.frequency === 'BiWeekly') {
                 dates.push(currentDateStr);
                 current.setDate(current.getDate() + 14);
            }
            else if (recurrence.frequency === 'Monthly') {
                 dates.push(currentDateStr);
                 current.setMonth(current.getMonth() + 1);
            }
        }
        return dates;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Resolve Client
        let clientName = formData.clientInput;
        let clientId = `MANUAL-${Date.now()}`;
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

        // Determine Final Dates
        let datesToCreate: string[] = [];
        if (mode === 'multiple') {
            datesToCreate = selectedDates;
        } else {
            datesToCreate = calculateRecurrenceDates();
        }

        if (datesToCreate.length === 0) {
            alert("Debe seleccionar al menos una fecha válida.");
            return;
        }

        if(!confirm(`Se generarán ${datesToCreate.length} visitas para ${clientName}. ¿Continuar?`)) return;

        // Batch Creation
        datesToCreate.forEach((dateStr, index) => {
            const newVisit: Visit = {
                id: (Date.now() + index).toString(), // Ensure unique IDs
                clientId: clientId,
                clientName: clientName,
                supervisorId: selectedSupervisor.id,
                supervisorName: selectedSupervisor.name,
                status: 'Pending',
                date: dateStr,
                type: formData.type,
                notes: formData.notes,
                createdBy: user.id,
                creatorName: user.name,
                hasReport: false
            };
            StorageService.addVisit(newVisit);
        });
        
        if (user?.role === 'developer') {
            navigate('/');
        } else {
            navigate('/my-visits');
        }
    };

    const daysMap = [
        { label: 'Dom', val: 0 },
        { label: 'Lun', val: 1 },
        { label: 'Mar', val: 2 },
        { label: 'Mié', val: 3 },
        { label: 'Jue', val: 4 },
        { label: 'Vie', val: 5 },
        { label: 'Sáb', val: 6 },
    ];

    const calculatedDatesPreview = calculateRecurrenceDates();

    return (
        <div className="flex min-h-screen w-full flex-row overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <header className="flex items-center gap-4 mb-8">
                        <Link to={user?.role === 'developer' ? '/' : '/my-visits'} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Programar Visitas</h1>
                            <p className="text-slate-500 text-sm">
                                Configure visitas individuales, múltiples o recurrentes.
                            </p>
                        </div>
                    </header>

                    <form onSubmit={handleSubmit} className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Client Selection */}
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

                            {/* Type */}
                            <div className="md:col-span-2">
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

                            {/* --- DATE SELECTION SECTION --- */}
                            <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-700 pt-6">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Configuración de Fechas</label>
                                
                                {/* Mode Switcher */}
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-4 w-full md:w-fit">
                                    <button 
                                        type="button"
                                        onClick={() => setMode('multiple')}
                                        className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'multiple' ? 'bg-white dark:bg-surface-dark shadow text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        Fechas Específicas
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setMode('recurring')}
                                        className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'recurring' ? 'bg-white dark:bg-surface-dark shadow text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        Frecuencia / Recurrencia
                                    </button>
                                </div>

                                {/* Mode: Multiple Selection */}
                                {mode === 'multiple' && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                        <div className="flex items-end gap-3">
                                            <div className="flex-1 max-w-xs">
                                                <label className="block text-xs text-slate-500 mb-1">Agregar Fecha</label>
                                                <input 
                                                    type="date" 
                                                    onChange={handleAddManualDate}
                                                    // Reset value after select isn't easy with simple onChange, relying on user interaction
                                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none" 
                                                />
                                            </div>
                                            <div className="pb-2 text-sm text-slate-500 italic">
                                                Seleccione días en el calendario para añadirlos a la lista.
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 min-h-[60px]">
                                            {selectedDates.length === 0 && <span className="text-slate-400 text-sm self-center">Ninguna fecha seleccionada.</span>}
                                            {selectedDates.map(date => (
                                                <div key={date} className="flex items-center gap-2 bg-white dark:bg-surface-dark px-3 py-1.5 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{date}</span>
                                                    <button type="button" onClick={() => removeManualDate(date)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-right text-xs text-slate-500 font-bold">Total Visitas: {selectedDates.length}</p>
                                    </div>
                                )}

                                {/* Mode: Recurring */}
                                {mode === 'recurring' && (
                                    <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 animate-in fade-in slide-in-from-right-2 duration-300">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">Desde</label>
                                                <input 
                                                    type="date" 
                                                    required 
                                                    value={recurrence.startDate} 
                                                    onChange={e => setRecurrence({...recurrence, startDate: e.target.value})}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">Hasta</label>
                                                <input 
                                                    type="date" 
                                                    required 
                                                    value={recurrence.endDate} 
                                                    onChange={e => setRecurrence({...recurrence, endDate: e.target.value})}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white" 
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">Frecuencia / Patrón</label>
                                            <select 
                                                value={recurrence.frequency}
                                                onChange={e => setRecurrence({...recurrence, frequency: e.target.value as any})}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                                            >
                                                <option value="Daily">Diario (Todos los días)</option>
                                                <option value="Weekly">Semanal (Días específicos)</option>
                                                <option value="BiWeekly">Quincenal (Cada 2 semanas)</option>
                                                <option value="Monthly">Mensual (Mismo día del mes)</option>
                                            </select>
                                        </div>

                                        {/* Days Selector for Weekly */}
                                        {recurrence.frequency === 'Weekly' && (
                                            <div className="bg-white dark:bg-slate-800/50 p-3 rounded-lg border border-blue-100 dark:border-blue-800/20">
                                                <label className="block text-xs font-bold text-blue-800 dark:text-blue-300 mb-2">Seleccionar Días de la Semana</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {daysMap.map((d) => {
                                                        const isSelected = recurrence.selectedDays.includes(d.val);
                                                        return (
                                                            <button
                                                                type="button"
                                                                key={d.val}
                                                                onClick={() => toggleDayOfWeek(d.val)}
                                                                className={`size-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                                                    isSelected 
                                                                    ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                                                                    : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500'
                                                                }`}
                                                            >
                                                                {d.label[0]}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {recurrence.selectedDays.length === 0 && (
                                                    <p className="text-xs text-orange-500 mt-2 font-medium">* Si no selecciona días, se agendará cada 7 días desde la fecha de inicio.</p>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Live Preview of Calculated Dates */}
                                        <div className="pt-2 border-t border-blue-200 dark:border-blue-800/30">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-blue-800 dark:text-blue-300">Vista Previa de Fechas</span>
                                                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                    Total: {calculatedDatesPreview.length}
                                                </span>
                                            </div>
                                            <div className="max-h-24 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex flex-wrap gap-2">
                                                {calculatedDatesPreview.length > 0 ? (
                                                    calculatedDatesPreview.map(d => (
                                                        <span key={d} className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{d}</span>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-400 italic">No hay fechas en el rango seleccionado.</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Notas / Instrucciones (Opcional)</label>
                                <textarea 
                                    rows={3} 
                                    value={formData.notes} 
                                    onChange={e => setFormData({...formData, notes: e.target.value})} 
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                                    placeholder="Instrucciones aplicables a todas las visitas generadas..." 
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                            <Link to={user?.role === 'developer' ? '/' : '/my-visits'} className="px-6 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
                                Cancelar
                            </Link>
                            <button type="submit" className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg shadow-primary/20 flex items-center gap-2">
                                <span className="material-symbols-outlined">calendar_add_on</span>
                                Generar {mode === 'multiple' ? selectedDates.length : calculatedDatesPreview.length} Visitas
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default CreateVisit;