import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Visit } from '../types';

interface VisitPreviewModalProps {
    visit: Visit | null;
    isOpen: boolean;
    onClose: () => void;
}

const VisitPreviewModal: React.FC<VisitPreviewModalProps> = ({ visit, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'evidence'>('info');

    if (!isOpen || !visit) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
            case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
            case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
            case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        }
    };

    const getStatusLabel = (status: string) => {
         switch (status) {
            case 'Completed': return 'Completada';
            case 'Pending': return 'Pendiente';
            case 'In Progress': return 'En Progreso';
            case 'Cancelled': return 'Cancelada';
            default: return status;
        }
    };

    const hasEvidence = visit.status === 'Completed' && (visit.photos?.length || visit.observations?.length || visit.interviewSummary);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark rounded-xl w-full max-w-4xl shadow-2xl flex flex-col transform transition-all scale-100 max-h-[90vh] overflow-hidden">
                
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {visit.clientName}
                            </h2>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${getStatusColor(visit.status)}`}>
                                {getStatusLabel(visit.status)}
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
                            <span>{visit.type}</span>
                            <span>•</span>
                            <span className="font-mono text-xs">ID: #{visit.id}</span>
                            <span>•</span>
                            <span>{visit.date}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Tabs (Only if evidence exists) */}
                {hasEvidence && (
                    <div className="flex border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-surface-dark px-6">
                        <button 
                            onClick={() => setActiveTab('info')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            Información General
                        </button>
                        <button 
                            onClick={() => setActiveTab('evidence')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'evidence' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            Resultados y Evidencia
                        </button>
                    </div>
                )}

                {/* Body - Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-surface-dark">
                    
                    {/* INFO TAB */}
                    {(!hasEvidence || activeTab === 'info') && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Alerts */}
                            {visit.status === 'Cancelled' && visit.cancelReason && (
                                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
                                    <h3 className="font-bold text-red-800 dark:text-red-300 text-sm uppercase mb-1 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">cancel</span>
                                        Motivo de Cancelación
                                    </h3>
                                    <p className="text-slate-800 dark:text-slate-200 text-sm">"{visit.cancelReason}"</p>
                                </div>
                            )}

                            {visit.rescheduleReason && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                    <h3 className="font-bold text-blue-800 dark:text-blue-300 text-sm uppercase mb-1 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">update</span>
                                        Reprogramada
                                    </h3>
                                    <p className="text-slate-800 dark:text-slate-200 text-sm mb-1">"{visit.rescheduleReason}"</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">Originalmente: {visit.originalDate}</p>
                                </div>
                            )}

                            {visit.notes && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-4 rounded-r-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">sticky_note_2</span>
                                        <h3 className="font-bold text-amber-800 dark:text-amber-300 text-sm uppercase">Notas / Instrucciones</h3>
                                    </div>
                                    <p className="text-slate-800 dark:text-slate-200 text-sm italic whitespace-pre-line">"{visit.notes}"</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Datos del Cliente</label>
                                    <div className="flex items-start gap-3">
                                        {visit.clientPhotoUrl ? (
                                            <img src={visit.clientPhotoUrl} alt="Logo" className="size-12 rounded-lg object-cover border border-slate-200 dark:border-slate-600" />
                                        ) : (
                                            <div className="size-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
                                                {visit.clientName.substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{visit.clientName}</p>
                                            {visit.clientNit && <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">NIT: {visit.clientNit}</p>}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Personal Asignado</label>
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                            <img src={`https://ui-avatars.com/api/?name=${visit.supervisorName}&background=random`} alt="Sup" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{visit.supervisorName}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Supervisor de Zona</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {visit.status === 'Completed' && (
                                <div className="text-center mt-4">
                                    <button onClick={() => setActiveTab('evidence')} className="text-primary hover:underline text-sm font-medium">
                                        Ver Resultados de la Visita →
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* EVIDENCE TAB */}
                    {activeTab === 'evidence' && hasEvidence && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            
                            {/* Summary */}
                            {visit.interviewSummary && (
                                <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">assignment</span>
                                        Resumen de Actividad
                                    </h3>
                                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                                        {visit.interviewSummary}
                                    </p>
                                </div>
                            )}

                            {/* Observations */}
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-amber-500">warning</span>
                                    Hallazgos ({visit.observations?.length || 0})
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {visit.observations && visit.observations.length > 0 ? (
                                        visit.observations.map((obs, idx) => (
                                            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                                                <div className={`mt-1 size-2 rounded-full shrink-0 ${obs.severity === 'High' ? 'bg-red-500' : obs.severity === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-sm text-slate-900 dark:text-white">{obs.title}</span>
                                                        <span className={`text-[10px] px-1.5 rounded font-bold uppercase ${
                                                            obs.severity === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                                                            obs.severity === 'Medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 
                                                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                        }`}>{obs.severity === 'High' ? 'Alta' : obs.severity === 'Medium' ? 'Media' : 'Baja'}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400">{obs.description}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">No se registraron observaciones.</p>
                                    )}
                                </div>
                            </div>

                            {/* Photos */}
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-500">photo_library</span>
                                    Evidencia Fotográfica ({visit.photos?.length || 0})
                                </h3>
                                {visit.photos && visit.photos.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {visit.photos.map((photo, i) => (
                                            <div key={i} className="aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group relative">
                                                <img src={photo} alt={`Evidence ${i}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No hay fotos adjuntas.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg font-bold transition-colors text-sm">
                        Cerrar
                    </button>
                    {visit.status === 'Completed' ? (
                        <Link 
                            to={`/visit-details/${visit.id}`} 
                            className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 text-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                            Ver Reporte PDF
                        </Link>
                    ) : (
                        <Link 
                            to={`/visit-details/${visit.id}`}
                            className="px-5 py-2 bg-white border border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 rounded-lg font-bold transition-colors text-sm"
                        >
                            Ir a Pantalla Completa
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VisitPreviewModal;