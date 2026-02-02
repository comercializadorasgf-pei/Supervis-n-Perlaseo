import React, { useEffect, useState } from 'react';
import { Visit } from '../types';
import { StorageService } from '../services/storage';

interface WelcomeActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
    userId: string;
    role: string;
}

const WelcomeActivityModal: React.FC<WelcomeActivityModalProps> = ({ isOpen, onClose, userName, userId, role }) => {
    const [todayVisits, setTodayVisits] = useState<Visit[]>([]);
    const [upcomingVisits, setUpcomingVisits] = useState<Visit[]>([]);

    useEffect(() => {
        if (isOpen) {
            const allVisits = StorageService.getVisits();
            // Filter visits relevant to the user (assigned to them)
            // If developer, maybe show all? Defaulting to assigned for now as per "user profiles" request
            const myVisits = role === 'developer' 
                ? allVisits 
                : allVisits.filter(v => v.supervisorId === userId);

            const today = new Date().toISOString().split('T')[0];
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);

            const todayStr = today;
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            const nextWeekStr = nextWeek.toISOString().split('T')[0];

            const todayList = myVisits.filter(v => v.date === todayStr && v.status !== 'Completed');
            
            const upcomingList = myVisits.filter(v => 
                v.date >= tomorrowStr && 
                v.date <= nextWeekStr && 
                v.status !== 'Completed'
            ).sort((a, b) => a.date.localeCompare(b.date));

            setTodayVisits(todayList);
            setUpcomingVisits(upcomingList);
        }
    }, [isOpen, userId, role]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-primary p-6 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-4 -mb-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                    
                    <h2 className="text-2xl font-bold relative z-10">¡Hola, {userName}!</h2>
                    <p className="text-blue-100 text-sm relative z-10">Aquí tienes tu resumen de actividades.</p>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    
                    {/* Today's Activities */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-green-600 bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full text-sm">today</span>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Actividades para Hoy</h3>
                        </div>
                        
                        {todayVisits.length > 0 ? (
                            <div className="space-y-3">
                                {todayVisits.map(visit => (
                                    <div key={visit.id} className="flex items-center p-3 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10 rounded-xl hover:shadow-md transition-shadow">
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-900 dark:text-white text-sm">{visit.clientName}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{visit.type}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-block px-2 py-1 bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 text-xs font-bold rounded shadow-sm">
                                                PENDIENTE
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center border border-slate-100 dark:border-slate-800">
                                <p className="text-slate-500 text-sm italic">¡Todo despejado! No tienes visitas pendientes para hoy.</p>
                            </div>
                        )}
                    </div>

                    {/* Upcoming Week */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-blue-600 bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full text-sm">calendar_month</span>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Próxima Semana</h3>
                        </div>

                        {upcomingVisits.length > 0 ? (
                            <div className="space-y-2">
                                {upcomingVisits.map(visit => (
                                    <div key={visit.id} className="flex items-center p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="w-16 text-center border-r border-slate-200 dark:border-slate-700 pr-3 mr-3">
                                            <p className="text-xs text-slate-400 font-bold uppercase">{new Date(visit.date).toLocaleDateString('es-ES', { weekday: 'short' })}</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{new Date(visit.date).getDate()}</p>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900 dark:text-white text-sm">{visit.clientName}</p>
                                            <p className="text-xs text-slate-500">{visit.type}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center border border-slate-100 dark:border-slate-800">
                                <p className="text-slate-500 text-sm italic">No hay actividades programadas para los próximos 7 días.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-center">
                    <button 
                        onClick={onClose}
                        className="w-full md:w-auto px-8 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold hover:opacity-90 transition-opacity"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WelcomeActivityModal;