import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../services/storage';
import { User, Message } from '../types';

const Messages = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [viewImage, setViewImage] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const allUsers = StorageService.getUsers();
        if (user) {
            setUsers(allUsers.filter(u => u.id !== user.id)); // Exclude self
        }
        // Load messages
        setMessages(StorageService.getMessages());
        
        // Polling for demo purposes
        const interval = setInterval(() => {
             setMessages(StorageService.getMessages());
        }, 2000);

        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, selectedUser]);

    const handleSendMessage = (e?: React.FormEvent, attachmentUrl?: string, attachmentType?: 'image' | 'file') => {
        if (e) e.preventDefault();
        if ((!inputText.trim() && !attachmentUrl) || !user || !selectedUser) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            senderId: user.id,
            receiverId: selectedUser.id,
            text: inputText,
            attachmentUrl,
            attachmentType,
            timestamp: new Date().toISOString(),
            read: false
        };

        StorageService.sendMessage(newMessage);
        setMessages(prev => [...prev, newMessage]);
        setInputText('');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Simulate sending immediately
                handleSendMessage(undefined, reader.result as string, file.type.startsWith('image') ? 'image' : 'file');
            };
            reader.readAsDataURL(file);
        }
    };

    const getConversation = () => {
        if (!selectedUser || !user) return [];
        return messages.filter(m => 
            (m.senderId === user.id && m.receiverId === selectedUser.id) ||
            (m.senderId === selectedUser.id && m.receiverId === user.id)
        ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    };

    const getLastMessage = (otherUserId: string) => {
        if (!user) return '';
        const userMessages = messages.filter(m => 
            (m.senderId === user.id && m.receiverId === otherUserId) ||
            (m.senderId === otherUserId && m.receiverId === user.id)
        );
        if (userMessages.length === 0) return 'Iniciar conversación';
        const last = userMessages[userMessages.length - 1];
        return last.text || (last.attachmentType === 'image' ? '📷 Foto' : '📎 Archivo');
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            <main className="flex-1 flex flex-col h-full relative">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between p-4 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <span className="font-bold text-lg dark:text-white">Mensajes</span>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    {/* Users List */}
                    <div className={`w-full md:w-80 border-r border-border-light dark:border-border-dark bg-white dark:bg-surface-dark flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
                        <div className="p-4 border-b border-border-light dark:border-border-dark">
                            <h2 className="font-bold text-xl text-slate-900 dark:text-white">Chats</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {users.map(u => (
                                <div 
                                    key={u.id} 
                                    onClick={() => setSelectedUser(u)}
                                    className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 ${selectedUser?.id === u.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                >
                                    <div className="relative">
                                        <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.name}`} className="size-12 rounded-full object-cover" />
                                        <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-900 dark:text-white truncate">{u.name}</h3>
                                        <p className="text-sm text-slate-500 truncate">{getLastMessage(u.id)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Window */}
                    <div className={`flex-1 flex flex-col bg-slate-100 dark:bg-[#0d141b] ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
                        {selectedUser ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 bg-white dark:bg-surface-dark border-b border-border-light dark:border-border-dark flex items-center gap-3 shadow-sm z-10">
                                    <button onClick={() => setSelectedUser(null)} className="md:hidden p-1 text-slate-500">
                                        <span className="material-symbols-outlined">arrow_back</span>
                                    </button>
                                    <img src={selectedUser.avatarUrl || `https://ui-avatars.com/api/?name=${selectedUser.name}`} className="size-10 rounded-full object-cover" />
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">{selectedUser.name}</h3>
                                        <p className="text-xs text-green-600 font-medium">En línea</p>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {getConversation().map((msg, idx) => {
                                        const isMine = msg.senderId === user?.id;
                                        return (
                                            <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${isMine ? 'bg-primary text-white rounded-br-none' : 'bg-white dark:bg-surface-dark dark:text-white rounded-bl-none'}`}>
                                                    {msg.attachmentUrl && msg.attachmentType === 'image' && (
                                                        <div className="relative group cursor-pointer" onClick={() => setViewImage(msg.attachmentUrl!)}>
                                                            <img 
                                                                src={msg.attachmentUrl} 
                                                                className="max-w-full rounded-lg mb-2 hover:brightness-90 transition-all" 
                                                                alt="Adjunto"
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                                                                <span className="material-symbols-outlined text-white drop-shadow-md">zoom_in</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {msg.attachmentUrl && msg.attachmentType === 'file' && (
                                                        <div className="flex items-center gap-2 bg-black/10 p-2 rounded mb-2">
                                                            <span className="material-symbols-outlined">description</span>
                                                            <span className="text-xs underline truncate">Documento adjunto</span>
                                                        </div>
                                                    )}
                                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                                    <span className={`text-[10px] block text-right mt-1 opacity-70`}>
                                                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-white dark:bg-surface-dark border-t border-border-light dark:border-border-dark">
                                    <form onSubmit={(e) => handleSendMessage(e)} className="flex items-center gap-2">
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            onChange={handleFileUpload}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                        >
                                            <span className="material-symbols-outlined">attach_file</span>
                                        </button>
                                        <input 
                                            value={inputText}
                                            onChange={e => setInputText(e.target.value)}
                                            placeholder="Escribe un mensaje..."
                                            className="flex-1 p-2 rounded-full border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={!inputText.trim()}
                                            className="p-2 bg-primary text-white rounded-full hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <span className="material-symbols-outlined">send</span>
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                <span className="material-symbols-outlined text-6xl mb-4">chat_bubble</span>
                                <p>Selecciona un usuario para comenzar a chatear.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Lightbox / Image Viewer */}
                {viewImage && (
                    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <button 
                            onClick={() => setViewImage(null)}
                            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-50"
                        >
                            <span className="material-symbols-outlined text-3xl">close</span>
                        </button>
                        
                        <div className="relative max-w-full max-h-full flex flex-col items-center gap-4">
                            <img 
                                src={viewImage} 
                                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                                alt="Vista previa"
                            />
                            
                            <a 
                                href={viewImage} 
                                download={`imagen-chat-${Date.now()}.png`}
                                className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full font-bold hover:bg-slate-200 transition-colors shadow-lg"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <span className="material-symbols-outlined">download</span>
                                Descargar Imagen
                            </a>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Messages;