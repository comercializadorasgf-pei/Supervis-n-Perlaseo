import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import ClientsList from './pages/ClientsList';
import ClientDetails from './pages/ClientDetails';
import CreateClient from './pages/CreateClient';
import CreateVisit from './pages/CreateVisit';
import SupervisorTracking from './pages/SupervisorTracking';
import MyVisits from './pages/MyVisits';
import PerformVisit from './pages/PerformVisit';
import VisitDetails from './pages/VisitDetails';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmail from './pages/VerifyEmail';
import Profile from './pages/Profile';
import SupervisorsManagement from './pages/SupervisorsManagement';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import ClientReports from './pages/ClientReports';
import Messages from './pages/Messages';

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App = () => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate app initialization / splash screen duration
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2200);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#f6f7f8] dark:bg-[#101922] transition-all duration-500">
                <div className="flex flex-col items-center animate-pulse">
                    <img 
                        src="https://crenavzuzjpccsxfnfsp.supabase.co/storage/v1/object/public/Logo%20SGf/Logo-completo-sin-fondo.webp" 
                        alt="Logo" 
                        className="w-48 md:w-64 h-auto object-contain mb-8 drop-shadow-xl" 
                    />
                    <div className="flex gap-3">
                        <div className="w-3 h-3 bg-[#137fec] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-3 h-3 bg-[#137fec] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-3 h-3 bg-[#137fec] rounded-full animate-bounce"></div>
                    </div>
                    <p className="mt-6 text-slate-400 text-xs font-bold tracking-[0.2em] uppercase">Cargando Sistema</p>
                </div>
            </div>
        );
    }

    return (
        <AuthProvider>
            <HashRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    
                    {/* Protected Routes */}
                    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                    
                    {/* Feature Modules */}
                    <Route path="/clients" element={<ProtectedRoute><ClientsList /></ProtectedRoute>} />
                    <Route path="/client-details/:clientId" element={<ProtectedRoute><ClientDetails /></ProtectedRoute>} />
                    <Route path="/create-client" element={<ProtectedRoute><CreateClient /></ProtectedRoute>} />
                    
                    <Route path="/create-visit" element={<ProtectedRoute><CreateVisit /></ProtectedRoute>} />
                    <Route path="/perform-visit/:visitId" element={<ProtectedRoute><PerformVisit /></ProtectedRoute>} />
                    <Route path="/supervisor-tracking" element={<ProtectedRoute><SupervisorTracking /></ProtectedRoute>} />
                    <Route path="/my-visits" element={<ProtectedRoute><MyVisits /></ProtectedRoute>} />
                    
                    {/* Make details dynamic */}
                    <Route path="/visit-details" element={<ProtectedRoute><VisitDetails /></ProtectedRoute>} />
                    <Route path="/visit-details/:visitId" element={<ProtectedRoute><VisitDetails /></ProtectedRoute>} />
                    
                    {/* New Functional Modules */}
                    <Route path="/supervisors-manage" element={<ProtectedRoute><SupervisorsManagement /></ProtectedRoute>} />
                    <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                    <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                    <Route path="/reports/:clientId" element={<ProtectedRoute><ClientReports /></ProtectedRoute>} />
                </Routes>
            </HashRouter>
        </AuthProvider>
    );
};

export default App;