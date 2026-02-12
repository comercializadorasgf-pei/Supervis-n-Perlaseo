import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
    const intervalRef = useRef<number | null>(null);

    // Initial Load
    useEffect(() => {
        const storedUser = localStorage.getItem('current_session');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse session", e);
                localStorage.removeItem('current_session');
            }
        }
    }, []);

    // Heartbeat & Movement Engine
    useEffect(() => {
        if (user) {
            // Start heartbeat when user is logged in
            if (intervalRef.current) clearInterval(intervalRef.current);

            intervalRef.current = window.setInterval(() => {
                // Get current latest data for this user to respect movement
                const allUsers = StorageService.getUsers();
                const freshUser = allUsers.find(u => u.id === user.id);
                
                if (freshUser) {
                    // Simulate GPS movement (Random Walk)
                    // CDMX Area base: 19.4326, -99.1332
                    const currentLat = freshUser.lat || 19.4326;
                    const currentLng = freshUser.lng || -99.1332;
                    
                    // Small random drift (approx 10-20 meters)
                    const driftLat = (Math.random() - 0.5) * 0.0002;
                    const driftLng = (Math.random() - 0.5) * 0.0002;

                    const newLat = currentLat + driftLat;
                    const newLng = currentLng + driftLng;

                    // Update storage (This triggers changes in SupervisorTracking)
                    StorageService.updateUserHeartbeat(user.id, newLat, newLng);
                }
            }, 3000); // Update every 3 seconds
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [user]);

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
        if (user) {
            // Optionally set them to offline immediately in storage by updating lastSeen to old date, 
            // but simply stopping the heartbeat works naturally as they will "timeout"
        }
        setUser(null);
        localStorage.removeItem('current_session');
        if (intervalRef.current) clearInterval(intervalRef.current);
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