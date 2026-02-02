import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import mapboxgl from 'mapbox-gl'; 
import { CONFIG } from '../config';

// Interface for Visit History
interface VisitHistoryItem {
    id: string;
    date: string;
    type: string;
    status: 'Completed' | 'Pending' | 'In Progress' | 'Cancelled';
    clientName: string;
}

// Simulación de datos GPS dinámicos
interface SupervisorLoc {
    id: string;
    name: string;
    avatar: string;
    status: 'active' | 'inactive';
    currentTask: string;
    lat: number; 
    lng: number; 
    lastUpdate: string;
    routeHistory: {lat: number, lng: number}[]; 
    deviceId?: string;
    visitHistory: VisitHistoryItem[]; 
    // Internal use for simulation direction
    direction?: { lat: number, lng: number };
}

const SupervisorTracking = () => {
    // Initial State - Coordinates centered on CDMX
    const [supervisors, setSupervisors] = useState<SupervisorLoc[]>([
        { 
            id: '1', 
            name: 'Maria Gonzales', 
            avatar: 'https://picsum.photos/id/65/100/100', 
            status: 'active', 
            currentTask: 'Visita: Farmacia Cruz Verde', 
            lat: 19.432608, 
            lng: -99.133209, 
            lastUpdate: 'Hace 1 min',
            routeHistory: [],
            deviceId: 'GPS-8821',
            direction: { lat: 0.0001, lng: 0.0001 }, // Moving North-East
            visitHistory: [
                { id: 'v1', date: '2023-10-25', type: 'Mensual', status: 'Completed', clientName: 'Farmacia Cruz Verde' },
                { id: 'v2', date: '2023-10-24', type: 'Incidente', status: 'Completed', clientName: 'TechSolutions S.A.' }
            ]
        },
        { 
            id: '2', 
            name: 'Carlos Martinez', 
            avatar: 'https://picsum.photos/id/64/100/100', 
            status: 'active', 
            currentTask: 'En traslado', 
            lat: 19.4200, 
            lng: -99.1600, 
            lastUpdate: 'Hace 2 min',
            routeHistory: [],
            deviceId: 'GPS-9910',
            direction: { lat: -0.0001, lng: 0.0002 }, // Moving South-East
            visitHistory: [
                { id: 'v4', date: '2023-10-26', type: 'Entrega', status: 'In Progress', clientName: 'Logística Express' }
            ]
        },
        { 
            id: '3', 
            name: 'Ana Silva', 
            avatar: 'https://picsum.photos/id/60/100/100', 
            status: 'inactive', 
            currentTask: 'Fuera de turno', 
            lat: 19.3900, 
            lng: -99.1400, 
            lastUpdate: 'Hace 4 horas',
            routeHistory: [],
            visitHistory: [
                { id: 'v6', date: '2023-10-15', type: 'Mensual', status: 'Completed', clientName: 'Centro Comercial Norte' }
            ]
        },
    ]);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [showRoutes, setShowRoutes] = useState(true); 
    const [selectedSup, setSelectedSup] = useState<string | null>(null);
    const [mapError, setMapError] = useState<string | null>(null);
    
    // Map State
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<{[key: string]: mapboxgl.Marker}>({});
    
    // 1. Initialize Mapbox
    useEffect(() => {
        if (map.current) return; // initialize map only once
        
        try {
            if (CONFIG && CONFIG.MAPBOX_TOKEN) {
                mapboxgl.accessToken = CONFIG.MAPBOX_TOKEN;
            } else {
                console.warn("Mapbox Token missing in config.");
                setMapError("Configuración de mapa incompleta (Token faltante).");
                return;
            }
            
            if (mapContainer.current) {
                const mapInstance = new mapboxgl.Map({
                    container: mapContainer.current,
                    style: 'mapbox://styles/mapbox/streets-v12',
                    center: [-99.1332, 19.4326], // [lng, lat]
                    zoom: 12
                });

                mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
                
                // Add error listener
                mapInstance.on('error', (e) => {
                    console.error("Mapbox runtime error:", e);
                });

                map.current = mapInstance;
            }
        } catch (e: any) {
            console.error("Error initializing Mapbox:", e);
            setMapError("No se pudo cargar el mapa. Es posible que el entorno de seguridad bloquee el acceso.");
        }
    }, []);

    // 2. Simular movimiento en tiempo real (GPS Tracking Implementation)
    useEffect(() => {
        const interval = setInterval(() => {
            setSupervisors(prev => prev.map(sup => {
                if (sup.status === 'inactive') return sup;
                
                // Store current pos in history
                const newHistory = [...sup.routeHistory, { lat: sup.lat, lng: sup.lng }].slice(-50);

                // Use predefined direction for smoother "route" simulation
                const dirLat = sup.direction?.lat || 0.0001;
                const dirLng = sup.direction?.lng || 0.0001;
                const jitter = (Math.random() - 0.5) * 0.00005;

                return {
                    ...sup,
                    lat: sup.lat + dirLat + jitter,
                    lng: sup.lng + dirLng + jitter,
                    lastUpdate: 'Ahora mismo',
                    routeHistory: newHistory
                };
            }));
        }, 2000); 

        return () => clearInterval(interval);
    }, []);

    // 3. Update Markers & Routes on Mapbox
    useEffect(() => {
        if (!map.current || mapError) return;

        try {
            supervisors.forEach(sup => {
                // MARKERS
                if (!markersRef.current[sup.id]) {
                    // Create custom marker element
                    const el = document.createElement('div');
                    el.className = 'marker';
                    el.style.backgroundImage = `url(${sup.avatar})`;
                    el.style.width = '40px';
                    el.style.height = '40px';
                    el.style.backgroundSize = 'cover';
                    el.style.borderRadius = '50%';
                    el.style.border = `3px solid ${sup.status === 'active' ? '#22c55e' : '#94a3b8'}`;
                    el.style.cursor = 'pointer';

                    // Add popup
                    const popup = new mapboxgl.Popup({ offset: 25 }).setText(sup.name);

                    // Add to map
                    const marker = new mapboxgl.Marker(el)
                        .setLngLat([sup.lng, sup.lat])
                        .setPopup(popup)
                        .addTo(map.current!);

                    el.addEventListener('click', () => {
                        setSelectedSup(sup.id);
                        map.current?.flyTo({
                            center: [sup.lng, sup.lat],
                            zoom: 14
                        });
                    });

                    markersRef.current[sup.id] = marker;
                } else {
                    // Update position
                    markersRef.current[sup.id].setLngLat([sup.lng, sup.lat]);
                    
                    // Update styling based on selection
                    const el = markersRef.current[sup.id].getElement();
                    el.style.border = sup.id === selectedSup 
                        ? '3px solid #137fec' 
                        : `3px solid ${sup.status === 'active' ? '#22c55e' : '#94a3b8'}`;
                    el.style.zIndex = sup.id === selectedSup ? '10' : '1';
                    el.style.transform = sup.id === selectedSup ? `${el.style.transform} scale(1.2)` : el.style.transform;
                }

                // ROUTES (Polylines)
                if (showRoutes && sup.routeHistory.length > 1) {
                    const sourceId = `route-${sup.id}`;
                    const coordinates = [...sup.routeHistory.map(h => [h.lng, h.lat]), [sup.lng, sup.lat]];

                    const geoJson: any = {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: coordinates
                        }
                    };

                    // Check if map source exists securely
                    if (map.current?.getSource(sourceId)) {
                        (map.current.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(geoJson);
                    } else {
                        map.current?.addSource(sourceId, {
                            type: 'geojson',
                            data: geoJson
                        });
                        map.current?.addLayer({
                            id: sourceId,
                            type: 'line',
                            source: sourceId,
                            layout: {
                                'line-join': 'round',
                                'line-cap': 'round'
                            },
                            paint: {
                                'line-color': sup.id === selectedSup ? '#137fec' : '#22c55e',
                                'line-width': 4,
                                'line-opacity': 0.7
                            }
                        });
                    }
                } else {
                    // Clean up layer if hidden
                    const sourceId = `route-${sup.id}`;
                    if (map.current?.getLayer(sourceId)) map.current.removeLayer(sourceId);
                    if (map.current?.getSource(sourceId)) map.current.removeSource(sourceId);
                }
            });
        } catch (err) {
            console.error("Error updating map markers:", err);
        }
    }, [supervisors, selectedSup, showRoutes, mapError]);

    const handleLinkDevice = () => {
        const id = prompt("Ingrese el ID del dispositivo GPS (Integration):");
        if (id) {
            alert(`Dispositivo ${id} vinculado exitosamente a la red de monitoreo.`);
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch(status) {
            case 'Completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'Pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'In Progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'Cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            <main className="flex-1 flex flex-col h-full relative">
                {/* Header Overlay on Mobile */}
                <div className="absolute top-0 left-0 right-0 z-20 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md p-3 border-b border-slate-200 dark:border-slate-800 md:hidden flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setSidebarOpen(true)} className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <Link to="/" className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </Link>
                        <span className="font-bold text-slate-900 dark:text-white">Monitoreo GPS</span>
                    </div>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                        <span className="block size-2 bg-green-500 rounded-full animate-pulse"></span>
                        EN VIVO
                    </span>
                </div>

                {/* Desktop Header Overlay */}
                <div className="absolute top-4 left-4 z-20 hidden md:flex items-center gap-3">
                     <Link to="/" className="bg-white dark:bg-surface-dark p-2 rounded-full shadow-lg text-slate-500 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                     </Link>
                </div>

                <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden pt-12 md:pt-0">
                     {/* Sidebar List (Left Panel) */}
                     <aside className="w-full md:w-[350px] flex flex-col bg-surface-light dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800 z-10 shadow-lg md:shadow-none h-1/3 md:h-full">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-white">Supervisores</h2>
                                <p className="text-xs text-slate-500">Mapbox Integration</p>
                            </div>
                            <button onClick={handleLinkDevice} className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors" title="Vincular GPS">
                                <span className="material-symbols-outlined">add_link</span>
                            </button>
                        </div>
                        
                        {/* Filters / Toggles */}
                        <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={showRoutes}
                                    onChange={(e) => setShowRoutes(e.target.checked)}
                                    className="rounded border-slate-300 text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mostrar Historial de Ruta</span>
                            </label>
                        </div>

                        <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                            {supervisors.map(sup => (
                                <div 
                                    key={sup.id}
                                    onClick={() => setSelectedSup(selectedSup === sup.id ? null : sup.id)}
                                    className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-3 transition-all ${selectedSup === sup.id ? 'bg-primary/5 border-primary ring-1 ring-primary' : 'bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="relative shrink-0">
                                            <img src={sup.avatar} alt={sup.name} className="size-10 rounded-full object-cover" />
                                            <div className={`absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-white dark:border-slate-800 ${sup.status === 'active' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{sup.name}</h3>
                                                <span className="text-[10px] text-slate-400">{sup.lastUpdate}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{sup.currentTask}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {sup.status === 'active' && (
                                                    <div className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded font-bold">
                                                        <span className="material-symbols-outlined text-[10px] animate-pulse">satellite_alt</span>
                                                        GPS ON
                                                    </div>
                                                )}
                                                {sup.deviceId && (
                                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1 rounded text-slate-500">{sup.deviceId}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Visit History */}
                                    {selectedSup === sup.id && (
                                        <div className="mt-1 pt-3 border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 fade-in duration-200 cursor-default" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Historial Reciente</h4>
                                                <span className="material-symbols-outlined text-slate-400 text-sm">history</span>
                                            </div>
                                            <div className="space-y-2">
                                                {sup.visitHistory && sup.visitHistory.length > 0 ? (
                                                    sup.visitHistory.map(visit => (
                                                        <div key={visit.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 border border-slate-100 dark:border-slate-700">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]" title={visit.clientName}>{visit.clientName}</span>
                                                                <span className="text-[10px] text-slate-400 font-mono">{visit.date}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[10px] text-slate-500 dark:text-slate-400">{visit.type}</span>
                                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getStatusBadgeColor(visit.status)}`}>
                                                                    {visit.status === 'Completed' ? 'COMPLETADA' : visit.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-slate-400 italic text-center py-2">Sin visitas recientes.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                     </aside>
                     
                     {/* Map Area */}
                     <div className="flex-1 relative bg-[#e5e7eb] dark:bg-[#101922] overflow-hidden">
                         {mapError ? (
                             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-8 text-center z-30 bg-slate-100 dark:bg-surface-dark">
                                 <span className="material-symbols-outlined text-5xl mb-3 text-slate-400">map_off</span>
                                 <p className="font-bold text-lg text-slate-700 dark:text-white">El mapa no está disponible</p>
                                 <p className="text-sm opacity-70 mt-1 max-w-md">{mapError}</p>
                                 <p className="text-xs mt-4 text-slate-400">Esto suele ocurrir en entornos de desarrollo restringidos (sandboxes) debido a políticas de seguridad.</p>
                             </div>
                         ) : (
                             <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
                         )}
                         
                         {/* Map Controls Overlay */}
                         {!mapError && (
                             <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
                                 <button 
                                    onClick={() => map.current?.flyTo({ center: [-99.1332, 19.4326], zoom: 12 })}
                                    className="size-10 bg-white dark:bg-surface-dark shadow-md rounded flex items-center justify-center hover:bg-slate-50 border border-slate-200 dark:border-slate-700"
                                    title="Centrar CDMX"
                                 >
                                     <span className="material-symbols-outlined text-slate-600 dark:text-white">my_location</span>
                                 </button>
                             </div>
                         )}
                     </div>
                </div>
            </main>
        </div>
    );
}

export default SupervisorTracking;