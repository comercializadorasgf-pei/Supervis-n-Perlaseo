import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

// IMPORTANT: Replace with your valid Google Maps API Key
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY'; 

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

// Interface for Gemini Maps Grounding Data simulation
interface GroundingData {
    place: string;
    address: string;
    rating: number;
    userRatingsTotal: number;
    uri: string;
    snippet: string;
}

const SupervisorTracking = () => {
    // Initial State - Coordinates centered on CDMX for demo
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
    
    // Maps & AI Grounding State
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<any>(null);
    const [mapError, setMapError] = useState<string | null>(null);
    const markersRef = useRef<{[key: string]: any}>({});
    const polylinesRef = useRef<{[key: string]: any}>({});
    
    const [groundingData, setGroundingData] = useState<GroundingData | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // 1. Load Google Maps Script
    useEffect(() => {
        const loadMapScript = () => {
            if ((window as any).google?.maps) {
                initMap();
                return;
            }

            (window as any).gm_authFailure = () => {
                setMapError("Error de autenticación: API Key inválida.");
                console.error("Google Maps API Key Invalid");
            };

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,marker`;
            script.async = true;
            script.defer = true;
            script.onload = initMap;
            script.onerror = () => setMapError("Error al cargar el script de Google Maps.");
            document.head.appendChild(script);
        };

        const initMap = () => {
            if (!mapRef.current || !(window as any).google) return;
            
            try {
                const map = new (window as any).google.maps.Map(mapRef.current, {
                    center: { lat: 19.4326, lng: -99.1332 }, // CDMX Center
                    zoom: 13,
                    styles: [
                        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
                    ],
                    disableDefaultUI: false,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false
                });
                setMapInstance(map);
            } catch (e) {
                console.error("Map initialization error", e);
                setMapError("Error al inicializar el mapa.");
            }
        };

        if (GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
            setMapError("API Key no configurada.");
        } else {
            loadMapScript();
        }
    }, []);

    // 2. Simular movimiento en tiempo real (GPS Tracking Implementation)
    useEffect(() => {
        const interval = setInterval(() => {
            setSupervisors(prev => prev.map(sup => {
                if (sup.status === 'inactive') return sup;
                
                // Store current pos in history
                // We limit history to 100 points for performance
                const newHistory = [...sup.routeHistory, { lat: sup.lat, lng: sup.lng }].slice(-100);

                // Use predefined direction for smoother "route" simulation
                const dirLat = sup.direction?.lat || 0.0001;
                const dirLng = sup.direction?.lng || 0.0001;

                // Add slight randomness to simulate real road variations
                const jitter = (Math.random() - 0.5) * 0.00005;

                return {
                    ...sup,
                    lat: sup.lat + dirLat + jitter,
                    lng: sup.lng + dirLng + jitter,
                    lastUpdate: 'Ahora mismo',
                    routeHistory: newHistory
                };
            }));
        }, 2000); // Update every 2 seconds

        return () => clearInterval(interval);
    }, []);

    // 3. Update Markers & Polylines on Map
    useEffect(() => {
        if (!mapInstance || !(window as any).google) return;

        supervisors.forEach(sup => {
            const position = { lat: sup.lat, lng: sup.lng };

            // MARKERS
            if (markersRef.current[sup.id]) {
                // Update existing marker
                markersRef.current[sup.id].setPosition(position);
                
                // Update icon based on state
                // Using HTTPS icons to avoid mixed content warnings
                const iconUrl = sup.id === selectedSup 
                    ? "https://maps.google.com/mapfiles/ms/icons/blue-dot.png" 
                    : sup.status === 'active' 
                        ? "https://maps.google.com/mapfiles/ms/icons/green-dot.png" 
                        : "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
                markersRef.current[sup.id].setIcon(iconUrl);
                
                // Z-Index update: selected on top
                markersRef.current[sup.id].setZIndex(sup.id === selectedSup ? 1000 : 1);

            } else {
                // Create new marker
                const marker = new (window as any).google.maps.Marker({
                    position,
                    map: mapInstance,
                    title: sup.name,
                    animation: (window as any).google.maps.Animation.DROP,
                    icon: sup.status === 'active' 
                        ? "https://maps.google.com/mapfiles/ms/icons/green-dot.png" 
                        : "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                });
                
                // Click listener
                marker.addListener('click', () => {
                    setSelectedSup(sup.id);
                    mapInstance.panTo(position);
                    mapInstance.setZoom(15);
                });

                markersRef.current[sup.id] = marker;
            }

            // POLYLINES (Route History)
            if (showRoutes && sup.routeHistory.length > 0) {
                // Connect history + current position to close the gap
                const path = [...sup.routeHistory, position];
                
                if (polylinesRef.current[sup.id]) {
                    polylinesRef.current[sup.id].setPath(path);
                    polylinesRef.current[sup.id].setMap(mapInstance);
                    // Update stroke color if selected
                    polylinesRef.current[sup.id].setOptions({
                        strokeColor: sup.id === selectedSup ? '#137fec' : (sup.status === 'active' ? '#22c55e' : '#94a3b8'),
                        strokeWeight: sup.id === selectedSup ? 5 : 3,
                        zIndex: sup.id === selectedSup ? 100 : 1
                    });
                } else {
                    const polyline = new (window as any).google.maps.Polyline({
                        path,
                        geodesic: true,
                        strokeColor: sup.id === selectedSup ? '#137fec' : '#22c55e',
                        strokeOpacity: 0.7,
                        strokeWeight: 3,
                        map: mapInstance
                    });
                    polylinesRef.current[sup.id] = polyline;
                }
            } else if (!showRoutes && polylinesRef.current[sup.id]) {
                polylinesRef.current[sup.id].setMap(null); // Hide
            }
        });

    }, [supervisors, mapInstance, selectedSup, showRoutes]);

    // 4. Focus Map when selection changes via sidebar
    useEffect(() => {
        if (selectedSup && mapInstance && markersRef.current[selectedSup]) {
            const marker = markersRef.current[selectedSup];
            mapInstance.panTo(marker.getPosition());
            mapInstance.setZoom(16);
            
            // Clear grounding when changing selection
            setGroundingData(null);
            setIsAnalyzing(false);
        }
    }, [selectedSup, mapInstance]);

    const handleAnalyzeLocation = (sup: SupervisorLoc) => {
        setIsAnalyzing(true);
        setGroundingData(null);

        // --- SIMULATION OF GEMINI 2.5 FLASH API CALL ---
        setTimeout(() => {
            const mockPlaces = [
                {
                    place: "Ubicación Detectada",
                    address: `${sup.lat.toFixed(4)}, ${sup.lng.toFixed(4)} (Simulación)`,
                    rating: 4.8,
                    userRatingsTotal: 342,
                    uri: `https://www.google.com/maps/search/?api=1&query=${sup.lat},${sup.lng}`,
                    snippet: "Área comercial de alta densidad. Próxima a zona bancaria y restaurantes."
                }
            ];
            
            setGroundingData(mockPlaces[0]);
            setIsAnalyzing(false);
        }, 1500);
    };

    const handleLinkDevice = () => {
        const id = prompt("Ingrese el ID del dispositivo GPS (Google Maps Integration):");
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
                                <p className="text-xs text-slate-500">Google Maps Data Integration</p>
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
                         {/* Map Container */}
                         <div ref={mapRef} className="absolute inset-0 w-full h-full z-0" />
                         
                         {/* Map Error Overlay */}
                         {mapError && (
                             <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900 z-10 p-8 text-center bg-opacity-90 dark:bg-opacity-90 backdrop-blur-sm">
                                <div className="max-w-md">
                                    <span className="material-symbols-outlined text-5xl text-red-500 mb-4">map_off</span>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Mapa no disponible</h3>
                                    <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-lg mb-6 border border-red-200 dark:border-red-800 text-sm font-medium">
                                        {mapError}
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl text-left text-sm border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <p className="mb-3 font-bold text-slate-700 dark:text-slate-300">Pasos para solucionar:</p>
                                        <ol className="list-decimal pl-5 space-y-2 text-slate-600 dark:text-slate-400">
                                            <li>Abre el archivo <code>pages/SupervisorTracking.tsx</code>.</li>
                                            <li>Busca la constante <code>GOOGLE_MAPS_API_KEY</code>.</li>
                                            <li>Reemplaza el valor <code>'YOUR_GOOGLE_MAPS_API_KEY'</code> con tu clave válida de Google Cloud Console.</li>
                                            <li>Asegúrate de que la API "Maps JavaScript API" esté habilitada en tu proyecto de Google Cloud.</li>
                                        </ol>
                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-center">
                                            <a href="https://developers.google.com/maps/documentation/javascript/get-api-key" target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center justify-center gap-1">
                                                Obtener API Key
                                                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                             </div>
                         )}
                         
                         {/* Google Maps Controls Overlay */}
                         {!mapError && (
                             <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
                                 <button 
                                    onClick={() => mapInstance?.panTo({ lat: 19.4326, lng: -99.1332 })}
                                    className="size-10 bg-white dark:bg-surface-dark shadow-md rounded flex items-center justify-center hover:bg-slate-50 border border-slate-200 dark:border-slate-700"
                                    title="Centrar CDMX"
                                 >
                                     <span className="material-symbols-outlined text-slate-600 dark:text-white">my_location</span>
                                 </button>
                             </div>
                         )}

                         {/* Gemini AI Grounding Panel - Shows when a user is selected */}
                         {selectedSup && !mapError && (
                             <div className="absolute top-4 right-4 md:right-auto md:left-4 z-30 w-72 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-4">
                                 <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between text-white">
                                     <div className="flex items-center gap-2">
                                         <span className="material-symbols-outlined text-sm">psychology</span>
                                         <span className="font-bold text-xs uppercase tracking-wider">Gemini 2.5 Analysis</span>
                                     </div>
                                     <button onClick={() => setSelectedSup(null)} className="hover:bg-white/20 rounded p-0.5">
                                         <span className="material-symbols-outlined text-sm">close</span>
                                     </button>
                                 </div>
                                 
                                 <div className="p-4">
                                     {!groundingData && !isAnalyzing && (
                                         <div className="text-center py-4">
                                             <p className="text-sm text-slate-500 mb-3">Obtén datos contextuales de Google Maps para esta ubicación.</p>
                                             <button 
                                                onClick={() => handleAnalyzeLocation(supervisors.find(s => s.id === selectedSup)!)}
                                                className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                                             >
                                                 <span className="material-symbols-outlined text-[18px]">explore</span>
                                                 Analizar Ubicación
                                             </button>
                                         </div>
                                     )}

                                     {isAnalyzing && (
                                         <div className="py-6 flex flex-col items-center gap-3">
                                             <div className="size-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                             <p className="text-xs text-indigo-600 font-medium animate-pulse">Consultando Google Maps...</p>
                                         </div>
                                     )}

                                     {groundingData && (
                                         <div className="space-y-3">
                                             <div>
                                                 <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight mb-1">{groundingData.place}</h4>
                                                 <p className="text-xs text-slate-500 dark:text-slate-400">{groundingData.address}</p>
                                             </div>
                                             
                                             <div className="flex items-center gap-2">
                                                 <div className="flex text-amber-400 text-[12px]">
                                                     {[1,2,3,4,5].map(i => (
                                                         <span key={i} className="material-symbols-outlined fill text-[14px]">
                                                             {i <= Math.round(groundingData.rating) ? 'star' : 'star_border'}
                                                         </span>
                                                     ))}
                                                 </div>
                                                 <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">{groundingData.rating}</span>
                                                 <span className="text-[10px] text-slate-400">({groundingData.userRatingsTotal} reseñas)</span>
                                             </div>

                                             <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
                                                 <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{groundingData.snippet}"</p>
                                             </div>

                                             <a href={groundingData.uri} target="_blank" rel="noreferrer" className="block w-full py-1.5 text-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-50">
                                                 Abrir en Google Maps
                                             </a>
                                             
                                             <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                                 <span className="text-[10px] text-slate-400">Fuente: Google Maps Grounding</span>
                                                 <span className="material-symbols-outlined text-slate-300 text-sm">google</span>
                                             </div>
                                         </div>
                                     )}
                                 </div>
                             </div>
                         )}
                     </div>
                </div>
            </main>
        </div>
    );
}

export default SupervisorTracking;