import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { StorageService } from '../services/storage';
import { Report, Visit } from '../types';

const ClientReports = () => {
    const { clientId } = useParams();
    const [reports, setReports] = useState<Report[]>([]);
    const [filteredReports, setFilteredReports] = useState<Report[]>([]);
    const [dates, setDates] = useState({ start: '', end: '' });
    const [clientName, setClientName] = useState('');

    useEffect(() => {
        if (clientId) {
            // Get reports (now synced with visits)
            const data = StorageService.getReports(clientId);
            setReports(data);
            setFilteredReports(data);

            // Get Client Info for Header
            const clients = StorageService.getClients();
            const client = clients.find(c => c.id === clientId);
            if (client) setClientName(client.name);
        }
    }, [clientId]);

    const handleFilter = () => {
        if (!dates.start && !dates.end) {
            setFilteredReports(reports);
            return;
        }
        
        const start = dates.start ? new Date(dates.start) : new Date('2000-01-01');
        const end = dates.end ? new Date(dates.end) : new Date();

        const filtered = reports.filter(r => {
            const rDate = new Date(r.date);
            return rDate >= start && rDate <= end;
        });
        setFilteredReports(filtered);
    };

    const handleDownload = (report: Report) => {
        alert(`Descargando PDF: ${report.title}`);
    };

    const handleShare = async (report: Report) => {
        // Construct a safe absolute URL including the hash
        const shareUrl = `${window.location.origin}${window.location.pathname}#${report.url}`;

        const doCopy = async () => {
             try {
                await navigator.clipboard.writeText(shareUrl);
                alert(`Link copiado: ${shareUrl}`);
            } catch (err) {
                console.error('Could not copy text: ', err);
                alert(`Link: ${shareUrl}`);
            }
        };

        if (navigator.share && shareUrl && shareUrl.startsWith('http')) {
            try {
                await navigator.share({
                    title: report.title,
                    text: `Informe Operativo - ${report.date}`,
                    url: shareUrl
                });
            } catch (error) {
                console.log('Share cancelled or failed', error);
                await doCopy();
            }
        } else {
            await doCopy();
        }
    };

    const handleExportCSV = () => {
        if (filteredReports.length === 0) {
            alert('No hay reportes para exportar en el rango seleccionado.');
            return;
        }

        // 1. Hydrate reports back to full Visits to get details
        const visitsToExport: Visit[] = filteredReports
            .map(report => StorageService.getVisitById(report.id))
            .filter((v): v is Visit => v !== undefined);

        if (visitsToExport.length === 0) {
            alert('Error al recuperar los detalles de las visitas.');
            return;
        }

        // 2. Define Headers
        const headers = [
            "ID Visita",
            "Fecha Programada",
            "Fecha Ejecución",
            "Tipo",
            "Supervisor",
            "Estado",
            "Notas Iniciales",
            "Resumen Entrevista",
            "Observaciones / Hallazgos",
            "Enlace Reporte"
        ];

        // 3. Helper to escape CSV fields (handle commas and quotes)
        const escape = (text: string | undefined) => {
            if (!text) return '""';
            return `"${text.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        };

        // 4. Map Data to Rows
        const rows = visitsToExport.map(v => {
            const obsString = v.observations 
                ? v.observations.map(o => `[${o.severity}] ${o.title}: ${o.description}`).join('; ')
                : 'Sin observaciones';

            const reportUrl = `${window.location.origin}${window.location.pathname}#/visit-details/${v.id}`;

            return [
                v.id,
                v.date,
                v.completedDate || '-',
                v.type,
                v.supervisorName,
                v.status,
                escape(v.notes),
                escape(v.interviewSummary),
                escape(obsString),
                reportUrl
            ].join(',');
        });

        // 5. Build CSV Content with BOM for Excel UTF-8 support
        const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");

        // 6. Trigger Download
        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        
        const dateStr = new Date().toISOString().slice(0, 10);
        const safeClientName = clientName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.setAttribute("download", `${safeClientName}_reportes_${dateStr}.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex min-h-screen w-full flex-row overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <Link to="/reports" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Informes: {clientName || clientId}</h1>
                            <p className="text-slate-500 text-sm">Historial de visitas completadas y reportes generados.</p>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 flex flex-wrap gap-4 items-end">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Inicio</label>
                            <input type="date" value={dates.start} onChange={e => setDates({...dates, start: e.target.value})} className="px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Fin</label>
                            <input type="date" value={dates.end} onChange={e => setDates({...dates, end: e.target.value})} className="px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm" />
                        </div>
                        <button onClick={handleFilter} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600">
                            Filtrar
                        </button>
                        <button onClick={() => { setDates({start:'', end:''}); setFilteredReports(reports); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg text-sm">
                            Limpiar
                        </button>
                        <div className="flex-1"></div>
                        <button 
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-md shadow-green-600/20"
                        >
                            <span className="material-symbols-outlined text-[18px]">table_chart</span>
                            Exportar CSV
                        </button>
                    </div>

                    {/* List */}
                    <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700 text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Documento / Visita</th>
                                    <th className="px-6 py-4 font-semibold">Tipo</th>
                                    <th className="px-6 py-4 font-semibold">Fecha Cierre</th>
                                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredReports.length > 0 ? filteredReports.map(report => (
                                    <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                                            <span className="material-symbols-outlined text-red-500">picture_as_pdf</span>
                                            {report.title}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">{report.type}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{report.date}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleDownload(report)} className="p-1 text-slate-500 hover:text-primary transition-colors" title="Descargar">
                                                    <span className="material-symbols-outlined text-[18px]">download</span>
                                                </button>
                                                <button onClick={() => handleShare(report)} className="p-1 text-slate-500 hover:text-primary transition-colors" title="Compartir">
                                                    <span className="material-symbols-outlined text-[18px]">share</span>
                                                </button>
                                                <Link to={report.url} className="text-primary font-medium hover:underline text-xs flex items-center gap-1 ml-2">
                                                    Ver
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                            No se encontraron reportes o visitas completadas en este rango.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ClientReports;