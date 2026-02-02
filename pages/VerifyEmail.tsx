import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { StorageService } from '../services/storage';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Step 1: Send Code
    const handleSendCode = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const users = StorageService.getUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            setLoading(false);
            setError('No encontramos ninguna cuenta asociada a este correo.');
            return;
        }

        if (user.verified) {
            setLoading(false);
            setError('Esta cuenta ya está verificada. Puedes iniciar sesión.');
            return;
        }

        // Generate 6 digit code
        const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        StorageService.setOTP(email, generatedCode);

        // Simulation delay
        setTimeout(() => {
            setLoading(false);
            // Simulate Email Sending via Alert
            alert(`[SIMULACIÓN] Tu código de verificación es: ${generatedCode}`);
            setStep(2);
        }, 1500);
    };

    // Step 2: Verify Code
    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const storedCode = StorageService.getOTP(email);

        setTimeout(() => {
            if (code === storedCode) {
                const success = StorageService.verifyUserEmail(email);
                if (success) {
                    StorageService.clearOTP(email);
                    alert('¡Cuenta verificada exitosamente! Ahora puedes iniciar sesión.');
                    navigate('/login');
                } else {
                    setError('Ocurrió un error al actualizar el usuario.');
                }
            } else {
                setError('El código ingresado es incorrecto. Inténtalo de nuevo.');
            }
            setLoading(false);
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
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verificar Cuenta</h2>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-200 text-center">
                        {error}
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleSendCode} className="space-y-4">
                        <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-2">
                            Ingresa tu correo electrónico para recibir tu código de activación.
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
                            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-70 flex justify-center"
                        >
                            {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : 'Enviar Código'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerify} className="space-y-4">
                        <div className="text-center mb-4">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Hemos enviado un código a <b>{email}</b></p>
                            <button type="button" onClick={() => setStep(1)} className="text-xs text-primary underline mt-1">¿Correo incorrecto?</button>
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
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-70 flex justify-center"
                        >
                            {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : 'Verificar Cuenta'}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium">Volver a Iniciar Sesión</Link>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;