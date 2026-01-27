import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate API call
        setTimeout(() => setSent(true), 1000);
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
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
                            <input
                                type="email"
                                required
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
                        <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 border border-green-100">
                            <p className="font-medium">¡Correo enviado!</p>
                            <p className="text-sm mt-1">Revisa tu bandeja de entrada.</p>
                        </div>
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