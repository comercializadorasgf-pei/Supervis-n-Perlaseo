import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../services/storage';

const Profile = () => {
    const { user, updateProfile } = useAuth();
    const [pwdData, setPwdData] = useState({ current: '', new: '', confirm: '' });
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!user) return null;

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        setMsg({ text: '', type: '' });

        if (pwdData.new !== pwdData.confirm) {
            setMsg({ text: 'Las nuevas contraseñas no coinciden.', type: 'error' });
            return;
        }

        if (pwdData.new.length < 6) {
            setMsg({ text: 'La contraseña debe tener al menos 6 caracteres.', type: 'error' });
            return;
        }

        // Verify current (mock check)
        const isValid = StorageService.login(user.email, pwdData.current);
        if (!isValid) {
            setMsg({ text: 'La contraseña actual es incorrecta.', type: 'error' });
            return;
        }

        StorageService.updatePassword(user.email, pwdData.new);
        setMsg({ text: 'Contraseña actualizada correctamente.', type: 'success' });
        setPwdData({ current: '', new: '', confirm: '' });
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newAvatarUrl = reader.result as string;
                const updatedUser = { ...user, avatarUrl: newAvatarUrl };
                updateProfile(updatedUser);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-row overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between p-4 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark sticky top-0 z-20 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setSidebarOpen(true)}
                            className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <Link to="/" className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </Link>
                        <span className="font-bold text-lg text-slate-900 dark:text-white">Mi Perfil</span>
                    </div>
                </header>

                <div className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <Link to="/" className="hidden md:flex p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mi Perfil</h1>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Profile Card */}
                        <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="h-32 bg-gradient-to-r from-blue-500 to-primary"></div>
                            <div className="px-8 pb-8">
                                <div className="relative flex justify-between items-end -mt-12 mb-6">
                                    <div className="relative group">
                                        <div className="size-24 rounded-full border-4 border-white dark:border-surface-dark bg-white shadow-md overflow-hidden cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                            <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}`} alt="Profile" className="w-full h-full object-cover"/>
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="material-symbols-outlined text-white">photo_camera</span>
                                            </div>
                                        </div>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            ref={fileInputRef} 
                                            onChange={handlePhotoUpload} 
                                            className="hidden" 
                                        />
                                    </div>
                                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold border border-primary/20 capitalize">
                                        {user.role}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre Completo</label>
                                        <p className="text-lg font-medium text-slate-900 dark:text-white">{user.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cargo / Puesto</label>
                                        <p className="text-lg font-medium text-slate-900 dark:text-white">{user.position}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Correo Electrónico</label>
                                        <p className="text-lg font-medium text-slate-900 dark:text-white">{user.email}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Teléfono Móvil</label>
                                        <p className="text-lg font-medium text-slate-900 dark:text-white">{user.phone}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Security Card */}
                        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-slate-400">lock</span>
                                Seguridad
                            </h3>
                            
                            {msg.text && (
                                <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {msg.text}
                                </div>
                            )}

                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Contraseña Actual</label>
                                    <input type="password" required value={pwdData.current} onChange={e => setPwdData({...pwdData, current: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Nueva Contraseña</label>
                                    <input type="password" required value={pwdData.new} onChange={e => setPwdData({...pwdData, new: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Confirmar Nueva Contraseña</label>
                                    <input type="password" required value={pwdData.confirm} onChange={e => setPwdData({...pwdData, confirm: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white text-sm" />
                                </div>
                                <button type="submit" className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-bold transition-colors dark:bg-slate-700 dark:hover:bg-slate-600">
                                    Actualizar Contraseña
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;