import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { StorageService } from '../services/storage';
import { User } from '../types';

const SupervisorsManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    
    // Forms
    const [formData, setFormData] = useState({ 
        name: '', 
        email: '', 
        phone: '', 
        position: '', 
        password: '',
        role: 'supervisor' as 'supervisor' | 'developer' 
    });
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        // Show all users for management
        setUsers(StorageService.getUsers());
    }, [isCreateModalOpen, isResetModalOpen]);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const newUser: User = {
            id: Date.now().toString(),
            role: formData.role,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            position: formData.position,
            avatarUrl: `https://ui-avatars.com/api/?name=${formData.name}&background=random`,
            verified: false // User starts as unverified
        };
        StorageService.addUser(newUser, formData.password);
        setIsCreateModalOpen(false);
        setFormData({ name: '', email: '', phone: '', position: '', password: '', role: 'supervisor' });
        alert(`Usuario creado exitosamente.\nSe ha enviado un correo de verificación a ${newUser.email}.`);
    };

    const handleDelete = (userId: string) => {
        if (confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
            StorageService.deleteUser(userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
        }
    };

    const handleResetPassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedUser && newPassword) {
            StorageService.updatePassword(selectedUser.email, newPassword);
            alert(`Contraseña actualizada correctamente para ${selectedUser.name}`);
            setIsResetModalOpen(false);
            setNewPassword('');
            setSelectedUser(null);
        }
    };

    const openResetModal = (user: User) => {
        setSelectedUser(user);
        setIsResetModalOpen(true);
    };

    const handleResendVerification = (user: User) => {
        alert(`Se ha reenviado el correo de verificación a ${user.email}.`);
    };

    const handleForceVerify = (user: User) => {
        if(confirm('¿Marcar este usuario como verificado manualmente? (Solo para pruebas)')) {
            const updatedUser = { ...user, verified: true };
            StorageService.updateUser(updatedUser);
            setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
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
                        <span className="font-bold text-lg text-slate-900 dark:text-white">Gestión de Usuarios</span>
                    </div>
                </header>

                <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div className="flex items-center gap-4">
                            <Link to="/" className="hidden md:flex p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                                <span className="material-symbols-outlined">arrow_back</span>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gestión de Usuarios</h1>
                                <p className="text-slate-500">Administra desarrolladores y supervisores de la plataforma.</p>
                            </div>
                        </div>
                        <button onClick={() => setIsCreateModalOpen(true)} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-primary/20 w-full md:w-auto justify-center">
                            <span className="material-symbols-outlined">person_add</span>
                            Nuevo Usuario
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {users.map(userItem => (
                            <div key={userItem.id} className="bg-white dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center relative group">
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openResetModal(userItem)} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500" title="Restablecer Contraseña">
                                        <span className="material-symbols-outlined text-[20px]">key</span>
                                    </button>
                                    <button onClick={() => handleDelete(userItem.id)} className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500" title="Eliminar Usuario">
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                </div>

                                <div className="relative">
                                    <img src={userItem.avatarUrl} alt={userItem.name} className="size-20 rounded-full mb-4 object-cover border-4 border-slate-50 dark:border-slate-700" />
                                    <div className={`absolute bottom-4 right-0 size-5 rounded-full border-2 border-white dark:border-surface-dark flex items-center justify-center ${userItem.role === 'developer' ? 'bg-purple-500' : 'bg-blue-500'}`} title={userItem.role === 'developer' ? 'Desarrollador (Admin)' : 'Supervisor (Usuario)'}>
                                        <span className="material-symbols-outlined text-white text-[12px]">
                                            {userItem.role === 'developer' ? 'admin_panel_settings' : 'person'}
                                        </span>
                                    </div>
                                </div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{userItem.name}</h3>
                                <p className="text-primary text-sm font-medium mb-2">{userItem.position}</p>
                                
                                {userItem.verified === false ? (
                                    <div className="mb-4">
                                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs font-bold px-2 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                                            <span className="material-symbols-outlined text-[14px]">mark_email_unread</span>
                                            Pendiente Verificación
                                        </span>
                                        <div className="flex gap-2 justify-center mt-2">
                                            <button 
                                                onClick={() => handleResendVerification(userItem)}
                                                className="text-xs text-blue-600 hover:underline"
                                            >
                                                Reenviar Correo
                                            </button>
                                            <span className="text-slate-300">|</span>
                                            <button 
                                                onClick={() => handleForceVerify(userItem)}
                                                className="text-xs text-green-600 hover:underline"
                                                title="Simular validación"
                                            >
                                                Validar (Demo)
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-4 h-6">
                                         <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-bold">
                                            <span className="material-symbols-outlined text-[16px]">verified</span>
                                            Verificado
                                        </span>
                                    </div>
                                )}
                                
                                <div className="w-full space-y-2 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-4">
                                    <div className="flex justify-between">
                                        <span>Rol:</span>
                                        <span className={`font-bold capitalize ${userItem.role === 'developer' ? 'text-purple-600' : 'text-blue-600'}`}>
                                            {userItem.role === 'developer' ? 'Desarrollador' : 'Supervisor'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Email:</span>
                                        <span className="text-slate-900 dark:text-white font-medium">{userItem.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Teléfono:</span>
                                        <span className="text-slate-900 dark:text-white font-medium">{userItem.phone}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Create Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-surface-dark rounded-xl w-full max-w-md p-6 shadow-2xl">
                            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Crear Nuevo Usuario</h3>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Tipo de Usuario</label>
                                    <select 
                                        value={formData.role} 
                                        onChange={e => setFormData({...formData, role: e.target.value as any})}
                                        className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    >
                                        <option value="supervisor">Supervisor (Usuario)</option>
                                        <option value="developer">Desarrollador (Admin)</option>
                                    </select>
                                </div>

                                <input required placeholder="Nombre Completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                                <input required type="email" placeholder="Correo Electrónico" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                                <input required placeholder="Teléfono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                                <input required placeholder="Cargo / Puesto" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                                
                                <div className="border-t border-slate-100 dark:border-slate-700 pt-2 mt-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Contraseña Inicial</label>
                                    <input required type="password" placeholder="Asignar contraseña" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                                </div>
                                
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                                    <p><strong>Nota:</strong> Se enviará un correo de verificación. El usuario no podrá acceder hasta validar su cuenta.</p>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-white dark:border-slate-600">Cancelar</button>
                                    <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">Guardar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Reset Password Modal */}
                {isResetModalOpen && selectedUser && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                         <div className="bg-white dark:bg-surface-dark rounded-xl w-full max-w-sm p-6 shadow-2xl">
                            <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Cambiar Contraseña</h3>
                            <p className="text-sm text-slate-500 mb-4">Ingresa la nueva contraseña para <b>{selectedUser.name}</b>.</p>
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <input required type="password" placeholder="Nueva contraseña" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setIsResetModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-white dark:border-slate-600">Cancelar</button>
                                    <button type="submit" className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900">Actualizar</button>
                                </div>
                            </form>
                         </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default SupervisorsManagement;