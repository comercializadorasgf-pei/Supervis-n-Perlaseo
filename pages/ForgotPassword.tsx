import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: Code, 3: New Password
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Step 1: Send Recovery Code
    const handleSendCode = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const users = StorageService.getUsers();
        const userExists = users.find(u => u.email === email);

        if (userExists) {
            // Generate Code
            const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
            StorageService.setOTP(email, generatedCode);

            setTimeout(() => {
                setLoading(false);
                alert(`[SIMULACIÓN] Tu código de recuperación es: ${generatedCode}`);
                setStep(2);
            }, 1000);
        } else {
            setLoading(false);
            setError('No encontramos un usuario registrado con este correo.');
        }
    };

    // Step 2: Verify Code
    const handleVerifyCode = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const storedCode = StorageService.getOTP(email);
        
        if (code === storedCode) {
            setStep(3);
        } else {
            setError('Código incorrecto. Intenta nuevamente.');
        }
    };

    // Step 3: Set New Password
    const handleResetPassword = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (newPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);
        setTimeout(() => {
            StorageService.updatePassword(email, newPassword);
            StorageService.clearOTP(email);
            setLoading(false);
            alert('¡Contraseña restablecida exitosamente!');
            navigate('/login');
        }, 1000);
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

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-200 text-center">
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <form onSubmit={handleSendCode} className="space-y-4">
                        <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-4">
                            Ingresa tu correo electrónico y te enviaremos un código para restablecer tu contraseña.
                        </p>
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
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition-colors flex justify-center"
                        >
                            {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : 'Enviar Código'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyCode} className="space-y-4">
                        <div className="text-center mb-4">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Código enviado a <b>{email}</b></p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Código de 6 dígitos</label>
                            <input
                                type="text"
                                required
                                maxLength={6}
                                value={code}
                                onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-primary outline-none"
                                placeholder="000000"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition-colors"
                        >
                            Verificar Código
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setStep(1)} 
                            className="w-full text-sm text-primary hover:underline mt-2"
                        >
                            Reenviar Código
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                         <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-4">
                            Crea una nueva contraseña segura para tu cuenta.
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nueva Contraseña</label>
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirmar Contraseña</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors flex justify-center"
                        >
                             {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : 'Restablecer Contraseña'}
                        </button>
                    </form>
                )}
                
                <div className="mt-6 text-center">
                    <Link to="/login" className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium">Cancelar y volver</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;