import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { StorageService } from '../services/storage';
import { Visit, Observation } from '../types';

const PerformVisit = () => {
    const { visitId } = useParams();
    const navigate = useNavigate();
    const [visit, setVisit] = useState<Visit | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form States
    const [summary, setSummary] = useState('');
    const [observations, setObservations] = useState<Observation[]>([]);
    const [photos, setPhotos] = useState<string[]>([]);
    
    // New Observation State
    const [newObs, setNewObs] = useState({ title: '', severity: 'Low' as const, description: '' });

    useEffect(() => {
        if (visitId) {
            const data = StorageService.getVisitById(visitId);
            if (data) {
                setVisit(data);
                // Pre-fill if editing (though usually empty for new start)
                if (data.interviewSummary) setSummary(data.interviewSummary);
                if (data.observations) setObservations(data.observations);
                if (data.photos) setPhotos(data.photos);
            }
        }
    }, [visitId]);

    const handleAddObservation = () => {
        if (!newObs.title || !newObs.description) return;
        const obs: Observation = {
            id: Date.now().toString(),
            ...newObs
        };
        setObservations([...observations, obs]);
        setNewObs({ title: '', severity: 'Low', description: '' });
    };

    const handleRemoveObservation = (id: string) => {
        setObservations(prev => prev.filter(o => o.id !== id));
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            Array.from(files).forEach((file) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPhotos(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file as Blob);
            });
        }
    };

    const handleSubmit = () => {
        if (!visit) return;

        const now = new Date();
        const updatedVisit: Visit = {
            ...visit,
            status: 'Completed',
            hasReport: true,
            interviewSummary: summary,
            observations: observations,
            photos: photos,
            completedDate: now.toISOString().split('T')[0],
            completedAt: now.toISOString() // Stores date and time with seconds
        };

        StorageService.updateVisit(updatedVisit);
        navigate('/visit-details/' + visit.id); // Go to details to see result
    };

    if (!visit) return <div>Cargando...</div>;

    return (
        <div className="flex min-h-screen w-full flex-row overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <header className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Link to="/my-visits" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                                <span className="material-symbols-outlined">arrow_back</span>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Realizar Visita</h1>
                                <p className="text-slate-500 text-sm">Cliente: {visit.clientName}</p>
                            </div>
                        </div>
                        <button onClick={handleSubmit} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg flex items-center gap-2">
                            <span className="material-symbols-outlined">check_circle</span>
                            Finalizar Visita
                        </button>
                    </header>

                    <div className="space-y-6">
                        {/* Section 1: Summary */}
                        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">assignment</span>
                                Resumen de la Entrevista / Visita
                            </h3>
                            <textarea 
                                value={summary}
                                onChange={e => setSummary(e.target.value)}
                                className="w-full h-32 p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none resize-none"
                                placeholder="Describa los puntos principales tratados durante la visita..."
                            ></textarea>
                        </div>

                        {/* Section 2: Observations */}
                        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-500">warning</span>
                                Observaciones Críticas
                            </h3>
                            
                            {/* Add Form */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mb-6 border border-slate-200 dark:border-slate-700">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                    <div className="md:col-span-2">
                                        <input 
                                            placeholder="Título de la observación (ej. Extintor Vencido)" 
                                            value={newObs.title}
                                            onChange={e => setNewObs({...newObs, title: e.target.value})}
                                            className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white text-sm"
                                        />
                                    </div>
                                    <div>
                                        <select 
                                            value={newObs.severity}
                                            onChange={e => setNewObs({...newObs, severity: e.target.value as any})}
                                            className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white text-sm"
                                        >
                                            <option value="Low">Baja Prioridad</option>
                                            <option value="Medium">Media Prioridad</option>
                                            <option value="High">Alta Prioridad</option>
                                        </select>
                                    </div>
                                </div>
                                <textarea 
                                    placeholder="Descripción detallada del hallazgo..."
                                    value={newObs.description}
                                    onChange={e => setNewObs({...newObs, description: e.target.value})}
                                    className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white text-sm mb-3 h-20"
                                ></textarea>
                                <div className="flex justify-end">
                                    <button onClick={handleAddObservation} className="px-4 py-1.5 bg-slate-800 dark:bg-slate-700 text-white rounded text-sm font-medium hover:bg-slate-700 dark:hover:bg-slate-600">
                                        Agregar Observación
                                    </button>
                                </div>
                            </div>

                            {/* List */}
                            <div className="space-y-3">
                                {observations.length === 0 && <p className="text-center text-slate-400 text-sm italic">No hay observaciones registradas.</p>}
                                {observations.map(obs => (
                                    <div key={obs.id} className="flex items-start gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 relative group">
                                        <button onClick={() => handleRemoveObservation(obs.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                        </button>
                                        <div className={`p-2 rounded-lg shrink-0 ${
                                            obs.severity === 'High' ? 'bg-red-100 text-red-600' : 
                                            obs.severity === 'Medium' ? 'bg-orange-100 text-orange-600' : 
                                            'bg-blue-100 text-blue-600'
                                        }`}>
                                            <span className="material-symbols-outlined">
                                                {obs.severity === 'High' ? 'error' : obs.severity === 'Medium' ? 'warning' : 'info'}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{obs.title}</h4>
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold mb-1 ${
                                                obs.severity === 'High' ? 'bg-red-50 text-red-700' : 
                                                obs.severity === 'Medium' ? 'bg-orange-50 text-orange-700' : 
                                                'bg-blue-50 text-blue-700'
                                            }`}>
                                                {obs.severity === 'High' ? 'Alta' : obs.severity === 'Medium' ? 'Media' : 'Baja'}
                                            </span>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{obs.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section 3: Photos */}
                        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">photo_camera</span>
                                Evidencia Fotográfica
                            </h3>
                            
                            <input 
                                type="file" 
                                accept="image/*" 
                                multiple 
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handlePhotoUpload}
                            />
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {photos.map((photo, idx) => (
                                    <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 relative group">
                                        <img src={photo} className="w-full h-full object-cover" />
                                        <button onClick={() => setPhotos(photos.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="material-symbols-outlined text-[16px]">close</span>
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-3xl mb-1">add_a_photo</span>
                                    <span className="text-xs font-medium">Agregar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PerformVisit;