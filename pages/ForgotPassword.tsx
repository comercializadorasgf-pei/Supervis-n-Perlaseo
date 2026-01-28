import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { StorageService } from '../services/storage';

const ForgotPassword = () => {
    const [sent, setSent] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        // Simulating functional module: Check if email exists in database
        const users = StorageService.getUsers();
        const userExists = users.find(u => u.email === email);

        if (userExists) {
            // Simulate API call delay
            setTimeout(() => setSent(true), 1000);
        } else {
            // For security, usually you don't say "Email not found", but for this requested functionality:
            setError('No encontramos un usuario registrado con este correo.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
            <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-8">
                <div className="flex flex-col items-center mb-6">
                    <img 
                        src="https://crenavzuzjpccsxfnfsp.supabase.co/storage/v1/object/public/Logo%20SGf/Logo-completo-sin-fondo.webp" 
                        alt="Logo" 
                        className="h-20 w-auto object-contain mb-4" 
                    />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recuperar Contraseña</h2>
                </div>

                {!sent ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-4">
                            Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
                        </p>
                        
                        {error && (
                            <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200 text-center">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                placeholder="tu@email.com"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition-colors"
                        >
                            Enviar Instrucciones
                        </button>
                    </form>
                ) : (
                    <div className="text-center">
                        <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 border border-green-100 flex flex-col items-center">
                            <span className="material-symbols-outlined text-3xl mb-2">mark_email_read</span>
                            <p className="font-medium">¡Correo enviado!</p>
                            <p className="text-sm mt-1">Hemos enviado un enlace de recuperación a <b>{email}</b>. Revisa tu bandeja de entrada o spam.</p>
                        </div>
                        <button 
                            onClick={() => { setSent(false); setEmail(''); }}
                            className="text-sm text-slate-500 underline hover:text-primary"
                        >
                            Intentar con otro correo
                        </button>
                    </div>
                )}
                
                <div className="mt-6 text-center">
                    <Link to="/login" className="text-sm text-primary hover:underline font-medium">Volver a Iniciar Sesión</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;