import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { StorageService } from '../services/storage';
import { InventoryItem, InventoryStatus, AssignmentDetails, MaintenanceRecord, StatusLog, Client } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Inventory = () => {
    const { user } = useAuth();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [clients, setClients] = useState<Client[]>([]); // State for clients list
    const fileInputRef = useRef<HTMLInputElement>(null);
    const maintFileInputRef = useRef<HTMLInputElement>(null);
    const csvInputRef = useRef<HTMLInputElement>(null);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    
    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    // Form States
    const [newItem, setNewItem] = useState({ name: '', description: '', serialNumber: '', imageUrl: '' });
    const [assignData, setAssignData] = useState({ clientId: '', post: '', operatorName: '', observations: '' });
    const [maintData, setMaintData] = useState({ 
        date: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:MM
        workshopName: '', 
        receiverName: '', 
        reason: '', 
        observations: '',
        photoUrl: ''
    });

    useEffect(() => {
        setItems(StorageService.getInventory());
        setClients(StorageService.getClients()); // Load clients for dropdown
    }, [isAddModalOpen, isAssignModalOpen, isDetailsModalOpen, isMaintenanceModalOpen]);

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        StorageService.addInventoryItem({
            id: Date.now().toString(),
            status: 'Disponible',
            ...newItem,
            imageUrl: newItem.imageUrl || 'https://via.placeholder.com/300',
            history: [],
            maintenanceLog: [],
            statusLogs: [
                {
                    id: Date.now().toString(),
                    date: new Date().toISOString(),
                    previousStatus: 'Disponible', // Initial
                    newStatus: 'Disponible',
                    changedBy: user?.name || 'Sistema',
                    reason: 'Ingreso inicial al inventario'
                }
            ]
        });
        setIsAddModalOpen(false);
        setNewItem({ name: '', description: '', serialNumber: '', imageUrl: '' });
        setItems(StorageService.getInventory());
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<any>>, fieldName: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setter((prev: any) => ({ ...prev, [fieldName]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleDeleteItem = (itemId: string) => {
        if (confirm('¿Eliminar este equipo del inventario?')) {
            StorageService.deleteInventoryItem(itemId);
            setItems(prev => prev.filter(i => i.id !== itemId));
            setIsDetailsModalOpen(false);
        }
    };

    const handleAssignStart = (item: InventoryItem) => {
        setSelectedItem(item);
        setAssignData({ clientId: '', post: '', operatorName: '', observations: '' }); // Reset form
        setIsAssignModalOpen(true);
    };

    const handleMaintenanceStart = (item: InventoryItem) => {
        setSelectedItem(item);
        setIsMaintenanceModalOpen(true);
    };

    const handleViewDetails = (item: InventoryItem) => {
        setSelectedItem(item);
        setIsDetailsModalOpen(true);
    };

    const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedClientId = e.target.value;
        const selectedClient = clients.find(c => c.id === selectedClientId);
        if (selectedClient) {
            setAssignData({
                ...assignData,
                clientId: selectedClient.id,
                post: selectedClient.name
            });
        } else {
            setAssignData({ ...assignData, clientId: '', post: '' });
        }
    };

    const handleAssignComplete = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem || !user) return;

        // Update end date of previous assignment (if any)
        let updatedHistory = [...(selectedItem.history || [])];
        if (updatedHistory.length > 0) {
            updatedHistory[0] = {
                ...updatedHistory[0],
                endDate: new Date().toLocaleDateString()
            };
        }

        const assignment: AssignmentDetails = {
            clientId: assignData.clientId, // Store ID
            post: assignData.post, // Store Name
            operatorName: assignData.operatorName,
            supervisorName: user.name,
            date: new Date().toLocaleDateString(),
            supervisorSignature: 'SIGNED_BY_' + user.name, 
            operatorSignature: 'SIGNED_BY_' + assignData.operatorName,
            observations: assignData.observations
        };

        // Create Status Log
        const newLog: StatusLog = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            previousStatus: selectedItem.status,
            newStatus: 'Asignado',
            changedBy: user.name,
            reason: `Asignación: ${assignData.operatorName} en ${assignData.post}`
        };

        const updatedItem: InventoryItem = {
            ...selectedItem,
            status: 'Asignado',
            assignment,
            history: [assignment, ...updatedHistory],
            statusLogs: [newLog, ...(selectedItem.statusLogs || [])]
        };

        StorageService.updateInventoryItem(updatedItem);
        setIsAssignModalOpen(false);
        setAssignData({ clientId: '', post: '', operatorName: '', observations: '' });
        setSelectedItem(null);
        setItems(StorageService.getInventory());
    };

    const handleMaintenanceComplete = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem || !user) return;

        const record: MaintenanceRecord = {
            id: Date.now().toString(),
            ...maintData
        };

        // Create Status Log
        const newLog: StatusLog = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            previousStatus: selectedItem.status,
            newStatus: 'En Taller',
            changedBy: user.name,
            reason: `Taller: ${maintData.reason} (${maintData.workshopName})`
        };

        const updatedItem: InventoryItem = {
            ...selectedItem,
            status: 'En Taller',
            assignment: undefined, // Remove current assignment if in shop
            maintenanceLog: [record, ...(selectedItem.maintenanceLog || [])],
            statusLogs: [newLog, ...(selectedItem.statusLogs || [])]
        };

        StorageService.updateInventoryItem(updatedItem);
        setIsMaintenanceModalOpen(false);
        setMaintData({ date: new Date().toISOString().slice(0, 16), workshopName: '', receiverName: '', reason: '', observations: '', photoUrl: '' });
        setSelectedItem(null);
        setItems(StorageService.getInventory());
    };

    const handleChangeStatus = (item: InventoryItem, newStatus: InventoryStatus) => {
        if (newStatus === 'Asignado') return handleAssignStart(item);
        if (newStatus === 'En Taller') return handleMaintenanceStart(item);
        
        // Only developer can set Inactive
        if (newStatus === 'Inactivo' && user?.role !== 'developer') return;

        // Log the change (e.g., returning to Available or Decommissioning)
        const reason = newStatus === 'Disponible' ? 'Liberación de equipo / Retorno a inventario' : 'Baja administrativa';
        
        const newLog: StatusLog = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            previousStatus: item.status,
            newStatus: newStatus,
            changedBy: user?.name || 'Sistema',
            reason: reason
        };

        // If becoming available, end previous assignment date if exists
        let updatedHistory = [...(item.history || [])];
        if (item.status === 'Asignado' && updatedHistory.length > 0) {
             updatedHistory[0] = {
                ...updatedHistory[0],
                endDate: new Date().toLocaleDateString()
            };
        }

        const updatedItem: InventoryItem = { 
            ...item, 
            status: newStatus, 
            assignment: undefined,
            history: updatedHistory,
            statusLogs: [newLog, ...(item.statusLogs || [])]
        };

        StorageService.updateInventoryItem(updatedItem);
        setItems(StorageService.getInventory()); 
    };

    // --- CSV IMPORT LOGIC ---
    const handleDownloadTemplate = () => {
        const headers = ["Nombre del equipo", "Marca", "Descripción", "Serie", "URL Foto"];
        const exampleRow = ["Taladro Inalámbrico", "DeWalt", "Modelo DCD771 con batería extra", "DW-992810", "https://ejemplo.com/foto.jpg"];
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + exampleRow.join(",");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "plantilla_carga_equipos.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const cleanField = (str: string) => {
        if (!str) return '';
        return str.trim().replace(/^["']|["']$/g, '');
    };

    const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            if (!text) return;

            const lines = text.split('\n').map(line => line.trim()).filter(line => line);
            if (lines.length < 2) {
                alert('El archivo CSV está vacío o solo contiene la cabecera.');
                return;
            }

            // Detect separator
            const header = lines[0];
            const commaCount = (header.match(/,/g) || []).length;
            const semiCount = (header.match(/;/g) || []).length;
            const separator = semiCount > commaCount ? ';' : ',';

            const newItems: Partial<InventoryItem>[] = [];
            
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(separator);
                
                // Map columns: 0:Name, 1:Brand, 2:Description, 3:Serial, 4:Photo
                if (cols.length >= 1 && cleanField(cols[0]) !== "") { 
                    const name = cleanField(cols[0]);
                    const brand = cleanField(cols[1]);
                    const desc = cleanField(cols[2]);
                    const fullDesc = brand ? `${brand} - ${desc}` : desc;

                    newItems.push({
                        name: name,
                        description: fullDesc,
                        serialNumber: cleanField(cols[3]) || 'SN-GENERICO',
                        imageUrl: cleanField(cols[4])
                    });
                }
            }

            if (newItems.length > 0) {
                const result = StorageService.addInventoryBulk(newItems);
                setItems(StorageService.getInventory()); // Refresh list
                
                let message = 'Carga Masiva Completada:\n';
                if (result.created > 0) message += `- ${result.created} equipos creados exitosamente.\n`;
                if (result.skipped > 0) message += `- ${result.skipped} equipos omitidos (número de serie duplicado).`;
                if (result.created === 0 && result.skipped === 0) message = 'No se procesaron registros válidos.';
                
                alert(message);
            } else {
                alert('No se encontraron registros válidos. Verifique la plantilla.');
            }
            
            // Reset input
            if (csvInputRef.current) csvInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const getStatusColor = (status: InventoryStatus) => {
        switch (status) {
            case 'Disponible': return 'bg-green-100 text-green-700 border-green-200';
            case 'Asignado': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'En Taller': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Inactivo': return 'bg-slate-200 text-slate-600 border-slate-300';
            default: return 'bg-slate-100';
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-row overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="flex-1 overflow-y-auto h-screen relative">
                {/* Mobile Header */}
                <div className="lg:hidden flex items-center justify-between p-4 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark sticky top-0 z-20 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <Link to="/" className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </Link>
                        <span className="font-bold text-lg text-slate-900 dark:text-white">Inventario</span>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto p-4 md:p-8">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
                        <div className="text-center md:text-left flex items-center gap-4">
                            <Link to="/" className="hidden md:flex p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                                <span className="material-symbols-outlined">arrow_back</span>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Inventario de Equipos</h1>
                                <p className="text-slate-500">{user?.role === 'developer' ? 'Gestiona el catálogo de herramientas.' : 'Administra y asigna herramientas a puestos.'}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                             {user?.role === 'developer' && (
                                <>
                                    <input 
                                        type="file" 
                                        accept=".csv" 
                                        ref={csvInputRef}
                                        onChange={handleCSVUpload}
                                        className="hidden"
                                    />
                                    <button onClick={handleDownloadTemplate} className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-bold text-sm transition-all" title="Descargar plantilla CSV">
                                        <span className="material-symbols-outlined">download</span>
                                        Plantilla
                                    </button>
                                    <button onClick={() => csvInputRef.current?.click()} className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-md shadow-green-600/20">
                                        <span className="material-symbols-outlined">upload_file</span>
                                        Importar CSV
                                    </button>
                                    <button onClick={() => setIsAddModalOpen(true)} className="flex-1 xl:flex-none bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/20">
                                        <span className="material-symbols-outlined">add</span>
                                        Agregar Equipo
                                    </button>
                                </>
                             )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map(item => (
                            <div key={item.id} className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col group/card hover:shadow-md transition-shadow">
                                <div className="h-48 bg-slate-100 overflow-hidden relative group cursor-pointer" onClick={() => handleViewDetails(item)}>
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                    <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold border uppercase ${getStatusColor(item.status)}`}>
                                        {item.status}
                                    </span>
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white font-medium flex items-center gap-2">
                                            <span className="material-symbols-outlined">visibility</span>
                                            Ver Detalles
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-1 hover:text-primary cursor-pointer" onClick={() => handleViewDetails(item)}>{item.name}</h3>
                                        <button onClick={() => handleViewDetails(item)} className="text-slate-400 hover:text-primary">
                                            <span className="material-symbols-outlined text-[20px]">info</span>
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-2 truncate" title={item.description}>{item.description}</p>
                                    <p className="text-xs font-mono text-slate-400 mb-4">SN: {item.serialNumber}</p>
                                    
                                    {item.status === 'Asignado' && item.assignment && (
                                        <div className="mt-auto mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-900/50 text-xs">
                                            <p><span className="font-bold">Puesto:</span> {item.assignment.post}</p>
                                            <p><span className="font-bold">Resp:</span> {item.assignment.operatorName}</p>
                                        </div>
                                    )}

                                    {/* Action Buttons based on Role */}
                                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <p className="text-xs font-bold text-slate-400 mb-2 uppercase">Cambiar Estado:</p>
                                        <div className="flex flex-wrap gap-2">
                                            <button onClick={() => handleChangeStatus(item, 'Disponible')} className="p-1.5 rounded bg-green-50 text-green-600 hover:bg-green-100 text-xs" title="Disponible">
                                                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                            </button>
                                            <button onClick={() => handleChangeStatus(item, 'Asignado')} className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs" title="Asignar">
                                                <span className="material-symbols-outlined text-[18px]">assignment_ind</span>
                                            </button>
                                            <button onClick={() => handleChangeStatus(item, 'En Taller')} className="p-1.5 rounded bg-orange-50 text-orange-600 hover:bg-orange-100 text-xs" title="Enviar a Taller">
                                                <span className="material-symbols-outlined text-[18px]">build</span>
                                            </button>
                                            {user?.role === 'developer' && (
                                                <button onClick={() => handleChangeStatus(item, 'Inactivo')} className="p-1.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs" title="Dar de baja">
                                                    <span className="material-symbols-outlined text-[18px]">block</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ADD MODAL (Developer) with Camera/File Support */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-surface-dark rounded-xl w-full max-w-lg p-6">
                            <h3 className="text-xl font-bold mb-4 dark:text-white">Ingresar Nuevo Equipo</h3>
                            <form onSubmit={handleAddItem} className="space-y-4">
                                <input required placeholder="Nombre del Equipo" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-800 dark:text-white dark:border-slate-600" />
                                <input required placeholder="Descripción / Características" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-800 dark:text-white dark:border-slate-600" />
                                <input required placeholder="Número de Serie" value={newItem.serialNumber} onChange={e => setNewItem({...newItem, serialNumber: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-800 dark:text-white dark:border-slate-600" />
                                
                                {/* Photo Upload Section */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Foto del Equipo</label>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        capture="environment" 
                                        ref={fileInputRef} 
                                        onChange={(e) => handleImageUpload(e, setNewItem, 'imageUrl')} 
                                        className="hidden" 
                                    />
                                    <div 
                                        onClick={triggerFileInput}
                                        className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        {newItem.imageUrl && !newItem.imageUrl.startsWith('http') ? (
                                            <div className="relative w-full h-40">
                                                <img src={newItem.imageUrl} alt="Preview" className="w-full h-full object-contain rounded" />
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded">
                                                    <span className="text-white font-bold">Cambiar Foto</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">add_a_photo</span>
                                                <p className="text-sm text-slate-500 text-center">Toca para tomar foto o subir archivo</p>
                                            </>
                                        )}
                                    </div>
                                    {/* Fallback text input for external URLs */}
                                    <input 
                                        placeholder="O pega una URL externa..." 
                                        value={newItem.imageUrl.startsWith('data:') ? '' : newItem.imageUrl} 
                                        onChange={e => setNewItem({...newItem, imageUrl: e.target.value})} 
                                        className="w-full p-2 border rounded text-xs text-slate-500 dark:bg-slate-800 dark:border-slate-600" 
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark">Guardar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ASSIGN MODAL */}
                {isAssignModalOpen && selectedItem && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-surface-dark rounded-xl w-full max-w-lg p-6">
                            <h3 className="text-xl font-bold mb-2 dark:text-white">Asignar: {selectedItem.name}</h3>
                            <p className="text-sm text-slate-500 mb-4">Complete los datos de entrega y recepción.</p>
                            
                            <form onSubmit={handleAssignComplete} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cliente / Puesto</label>
                                    <select 
                                        required 
                                        value={assignData.clientId} 
                                        onChange={handleClientChange} 
                                        className="w-full p-2 border rounded dark:bg-slate-800 dark:text-white dark:border-slate-600"
                                    >
                                        <option value="">Seleccione un Cliente...</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>{client.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase">Supervisor (Entrega)</label>
                                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded text-sm text-slate-700 dark:text-slate-300">{user?.name}</div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase">Operario (Recibe)</label>
                                        <input required placeholder="Nombre Operario" value={assignData.operatorName} onChange={e => setAssignData({...assignData, operatorName: e.target.value})} className="w-full p-2 border rounded text-sm mb-2 dark:bg-slate-800 dark:text-white dark:border-slate-600" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observaciones / Estado del Equipo</label>
                                    <textarea 
                                        rows={2}
                                        value={assignData.observations}
                                        onChange={e => setAssignData({...assignData, observations: e.target.value})}
                                        className="w-full p-2 border rounded dark:bg-slate-800 dark:text-white dark:border-slate-600 text-sm"
                                        placeholder="Ej. Se entrega con rayones leves..."
                                    ></textarea>
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <button type="button" onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">ink_pen</span>
                                        Firmar y Asignar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MAINTENANCE MODAL ("En Taller") */}
                {isMaintenanceModalOpen && selectedItem && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-surface-dark rounded-xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center gap-3 mb-4 text-orange-600">
                                <span className="material-symbols-outlined text-3xl">build_circle</span>
                                <h3 className="text-xl font-bold dark:text-white">Envío a Taller: {selectedItem.name}</h3>
                            </div>
                            
                            <form onSubmit={handleMaintenanceComplete} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Fecha y Hora</label>
                                    <input 
                                        type="datetime-local" 
                                        required 
                                        value={maintData.date} 
                                        onChange={e => setMaintData({...maintData, date: e.target.value})} 
                                        className="w-full p-2 border rounded dark:bg-slate-800 dark:text-white dark:border-slate-600" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Taller / Proveedor</label>
                                    <input required placeholder="Nombre del Taller" value={maintData.workshopName} onChange={e => setMaintData({...maintData, workshopName: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-800 dark:text-white dark:border-slate-600" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Recibido Por (Nombre)</label>
                                    <input required placeholder="Nombre de quien recibe" value={maintData.receiverName} onChange={e => setMaintData({...maintData, receiverName: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-800 dark:text-white dark:border-slate-600" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Motivo / Falla</label>
                                    <input required placeholder="¿Por qué se envía?" value={maintData.reason} onChange={e => setMaintData({...maintData, reason: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-800 dark:text-white dark:border-slate-600" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Observaciones Adicionales</label>
                                    <textarea rows={2} value={maintData.observations} onChange={e => setMaintData({...maintData, observations: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-800 dark:text-white dark:border-slate-600"></textarea>
                                </div>
                                
                                {/* Maintenance Photo */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Evidencia / Foto del Estado</label>
                                    <div className="flex items-center gap-4">
                                        <div 
                                            onClick={() => maintFileInputRef.current?.click()}
                                            className="size-20 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            {maintData.photoUrl ? (
                                                <img src={maintData.photoUrl} className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                <span className="material-symbols-outlined text-slate-400">add_a_photo</span>
                                            )}
                                        </div>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            capture="environment" 
                                            ref={maintFileInputRef}
                                            onChange={(e) => handleImageUpload(e, setMaintData, 'photoUrl')}
                                            className="hidden"
                                        />
                                        <p className="text-xs text-slate-500">Opcional: Tomar foto del daño.</p>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <button type="button" onClick={() => setIsMaintenanceModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                                    <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">Registrar Salida</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* DETAILS MODAL - IMPROVED HISTORY */}
                {isDetailsModalOpen && selectedItem && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-surface-dark rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start sticky top-0 bg-white dark:bg-surface-dark z-10">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 flex-wrap">
                                        {selectedItem.name}
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold border uppercase ${getStatusColor(selectedItem.status)}`}>
                                            {selectedItem.status}
                                        </span>
                                    </h2>
                                    <p className="text-slate-500 text-sm mt-1">{selectedItem.description}</p>
                                </div>
                                <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Left Column: Image & Basic Info */}
                                <div className="md:col-span-1 flex flex-col gap-4">
                                    <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-auto object-cover aspect-square" />
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3 uppercase">Detalles Técnicos</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Nº Serie:</span>
                                                <span className="font-mono font-medium dark:text-slate-300 break-all pl-2">{selectedItem.serialNumber}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">ID Sistema:</span>
                                                <span className="font-mono font-medium dark:text-slate-300">#{selectedItem.id}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: History & Current Status */}
                                <div className="md:col-span-2 flex flex-col gap-6">
                                    {/* Current Assignment Card */}
                                    {selectedItem.status === 'Asignado' && selectedItem.assignment && (
                                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-5">
                                            <h3 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-4">
                                                <span className="material-symbols-outlined">person_pin_circle</span>
                                                Asignación Actual
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-blue-600/70 dark:text-blue-400/70 text-xs font-bold uppercase mb-1">Ubicación / Puesto</p>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{selectedItem.assignment.post}</p>
                                                </div>
                                                <div>
                                                    <p className="text-blue-600/70 dark:text-blue-400/70 text-xs font-bold uppercase mb-1">Fecha de Asignación</p>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{selectedItem.assignment.date}</p>
                                                </div>
                                                <div>
                                                    <p className="text-blue-600/70 dark:text-blue-400/70 text-xs font-bold uppercase mb-1">Responsable (Operario)</p>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{selectedItem.assignment.operatorName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-blue-600/70 dark:text-blue-400/70 text-xs font-bold uppercase mb-1">Supervisor (Entrega)</p>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{selectedItem.assignment.supervisorName}</p>
                                                </div>
                                                {selectedItem.assignment.observations && (
                                                    <div className="col-span-2 mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                                                         <p className="text-blue-600/70 dark:text-blue-400/70 text-xs font-bold uppercase mb-1">Observaciones</p>
                                                         <p className="italic text-slate-700 dark:text-slate-300">{selectedItem.assignment.observations}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Detailed Status History (Improved) */}
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4 text-lg">
                                            <span className="material-symbols-outlined">manage_history</span>
                                            Historial de Movimientos
                                        </h3>
                                        
                                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-64 overflow-y-auto custom-scrollbar">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm whitespace-nowrap">
                                                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                                                        <tr>
                                                            <th className="px-4 py-3 font-semibold text-slate-500">Fecha</th>
                                                            <th className="px-4 py-3 font-semibold text-slate-500">Estado</th>
                                                            <th className="px-4 py-3 font-semibold text-slate-500">Modificado Por</th>
                                                            <th className="px-4 py-3 font-semibold text-slate-500">Detalles / Motivo</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                        {selectedItem.statusLogs && selectedItem.statusLogs.length > 0 ? (
                                                            selectedItem.statusLogs.map((log) => (
                                                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                                    <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
                                                                        {new Date(log.date).toLocaleDateString()} <span className="text-xs text-slate-400">{new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border uppercase ${getStatusColor(log.newStatus)}`}>
                                                                            {log.newStatus}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{log.changedBy}</td>
                                                                    <td className="px-4 py-3 text-slate-500 italic max-w-[200px] truncate" title={log.reason}>
                                                                        {log.reason}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            // Fallback to legacy history if logs are empty (for backward compatibility)
                                                            selectedItem.history && selectedItem.history.length > 0 ? (
                                                                selectedItem.history.map((record, idx) => (
                                                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                                        <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{record.date}</td>
                                                                        <td className="px-4 py-3"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-200">ASIGNADO</span></td>
                                                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{record.supervisorName}</td>
                                                                        <td className="px-4 py-3 text-slate-500 italic">Asignado a {record.operatorName}</td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">
                                                                        No hay registros de movimientos.
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-surface-dark flex justify-end sticky bottom-0">
                                {user?.role === 'developer' && (
                                    <button onClick={() => handleDeleteItem(selectedItem.id)} className="mr-auto text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                                        <span className="material-symbols-outlined">delete</span>
                                        Eliminar
                                    </button>
                                )}
                                <button onClick={() => setIsDetailsModalOpen(false)} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-bold transition-colors">
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Inventory;