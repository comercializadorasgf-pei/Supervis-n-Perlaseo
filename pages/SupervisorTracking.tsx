import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import mapboxgl from 'mapbox-gl'; 
import { CONFIG } from '../config';
import { StorageService } from '../services/storage';
import { User, Visit } from '../types';

const SupervisorTracking = () => {
    const [supervisors, setSupervisors] = useState<User[]>([]);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [showRoutes, setShowRoutes] = useState(true); 
    const [selectedSupId, setSelectedSupId] = useState<string | null>(null);
    const [mapError, setMapError] = useState<string | null>(null);
    
    // Track previous positions to draw lines
    const routeHistoryRef = useRef<{[key: string]: number[][]}>({});

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

    // 2. Poll Data from Storage (Realtime Sync)
    useEffect(() => {
        const fetchRealtimeData = () => {
            const allUsers = StorageService.getUsers();
            // Filter only supervisors or developers who have location data
            const activeStaff = allUsers.filter(u => (u.role === 'supervisor' || u.role === 'developer') && u.lat && u.lng);
            setSupervisors(activeStaff);
        };

        fetchRealtimeData(); // Initial call
        const interval = setInterval(fetchRealtimeData, 2000); // Polling every 2s

        return () => clearInterval(interval);
    }, []);

    // 3. Update Markers & Routes on Mapbox
    useEffect(() => {
        if (!map.current || mapError) return;

        try {
            supervisors.forEach(sup => {
                if (!sup.lat || !sup.lng) return;

                // Update Route History locally for drawing
                if (!routeHistoryRef.current[sup.id]) {
                    routeHistoryRef.current[sup.id] = [];
                }
                const currentHistory = routeHistoryRef.current[sup.id];
                const lastPos = currentHistory[currentHistory.length - 1];
                
                // Only push if position changed significantly to avoid jitter clutter
                if (!lastPos || (lastPos[0] !== sup.lng || lastPos[1] !== sup.lat)) {
                    currentHistory.push([sup.lng, sup.lat]);
                    if (currentHistory.length > 50) currentHistory.shift(); // Keep last 50 points
                }

                // MARKERS
                const isOnline = sup.isOnline; // Calculated by StorageService based on lastSeen
                const markerColor = isOnline ? '#22c55e' : '#94a3b8'; // Green vs Gray

                if (!markersRef.current[sup.id]) {
                    // Create custom marker element
                    const el = document.createElement('div');
                    el.className = 'marker';
                    el.style.backgroundImage = `url(${sup.avatarUrl || 'https://ui-avatars.com/api/?name=' + sup.name})`;
                    el.style.width = '40px';
                    el.style.height = '40px';
                    el.style.backgroundSize = 'cover';
                    el.style.borderRadius = '50%';
                    el.style.border = `3px solid ${markerColor}`;
                    el.style.cursor = 'pointer';
                    el.style.transition = 'all 0.3s ease';

                    // Add popup
                    const popup = new mapboxgl.Popup({ offset: 25 }).setText(sup.name);

                    // Add to map
                    const marker = new mapboxgl.Marker(el)
                        .setLngLat([sup.lng, sup.lat])
                        .setPopup(popup)
                        .addTo(map.current!);

                    el.addEventListener('click', () => {
                        setSelectedSupId(sup.id);
                        map.current?.flyTo({
                            center: [sup.lng!, sup.lat!],
                            zoom: 15
                        });
                    });

                    markersRef.current[sup.id] = marker;
                } else {
                    // Update position
                    markersRef.current[sup.id].setLngLat([sup.lng, sup.lat]);
                    
                    // Update styling
                    const el = markersRef.current[sup.id].getElement();
                    el.style.border = sup.id === selectedSupId 
                        ? '3px solid #137fec' // Blue if selected
                        : `3px solid ${markerColor}`; // Status color
                    el.style.zIndex = sup.id === selectedSupId ? '10' : '1';
                    
                    if (sup.id === selectedSupId) {
                        el.style.transform += ' scale(1.2)';
                    } else {
                        // Reset scale if needed (tricky with mapbox transforms, simplistic approach here)
                        // Ideally strictly manage classNames
                    }
                }

                // ROUTES (Polylines)
                const sourceId = `route-${sup.id}`;
                if (showRoutes && currentHistory.length > 1) {
                    const geoJson: any = {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: currentHistory
                        }
                    };

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
                                'line-color': sup.id === selectedSupId ? '#137fec' : markerColor,
                                'line-width': 4,
                                'line-opacity': 0.6
                            }
                        });
                    }
                } else {
                    // Clean up layer if hidden
                    if (map.current?.getLayer(sourceId)) map.current.removeLayer(sourceId);
                    if (map.current?.getSource(sourceId)) map.current.removeSource(sourceId);
                }
            });
        } catch (err) {
            console.error("Error updating map markers:", err);
        }
    }, [supervisors, selectedSupId, showRoutes, mapError]);

    const formatLastSeen = (isoString?: string) => {
        if (!isoString) return 'Desconocido';
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Hace un momento';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
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
                                <h2 className="font-bold text-slate-900 dark:text-white">Personal en Campo</h2>
                                <p className="text-xs text-slate-500">Actualización en tiempo real</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="flex h-3 w-3 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                            </div>
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
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mostrar Rutas</span>
                            </label>
                        </div>

                        <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                            {supervisors.map(sup => (
                                <div 
                                    key={sup.id}
                                    onClick={() => setSelectedSupId(selectedSupId === sup.id ? null : sup.id)}
                                    className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-3 transition-all ${selectedSupId === sup.id ? 'bg-primary/5 border-primary ring-1 ring-primary' : 'bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="relative shrink-0">
                                            <img src={sup.avatarUrl || `https://ui-avatars.com/api/?name=${sup.name}`} alt={sup.name} className="size-10 rounded-full object-cover" />
                                            <div className={`absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-white dark:border-slate-800 ${sup.isOnline ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{sup.name}</h3>
                                                <span className={`text-[10px] ${sup.isOnline ? 'text-green-600 font-bold' : 'text-slate-400'}`}>
                                                    {sup.isOnline ? 'EN LÍNEA' : 'OFFLINE'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{sup.position}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                                                    {formatLastSeen(sup.lastSeen)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Additional Info when Selected */}
                                    {selectedSupId === sup.id && (
                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700 mt-1 animate-in fade-in slide-in-from-top-1">
                                            <p className="text-[10px] text-slate-500 font-mono">
                                                Lat: {sup.lat?.toFixed(5)}, Lng: {sup.lng?.toFixed(5)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {supervisors.length === 0 && (
                                <p className="text-center text-slate-400 text-sm mt-10">Esperando conexión de dispositivos...</p>
                            )}
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