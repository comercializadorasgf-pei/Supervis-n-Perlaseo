import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { StorageService } from '../services/storage';

interface AuthContextType {
    user: User | null;
    login: (email: string, pass: string) => boolean;
    logout: () => void;
    updateProfile: (updatedUser: User) => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('current_session');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (email: string, pass: string) => {
        const foundUser = StorageService.login(email, pass);
        if (foundUser) {
            setUser(foundUser);
            localStorage.setItem('current_session', JSON.stringify(foundUser));
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('current_session');
    };

    const updateProfile = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('current_session', JSON.stringify(updatedUser));
        StorageService.updateUser(updatedUser);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateProfile, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};