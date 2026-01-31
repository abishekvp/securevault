'use client';

import React, { useState } from 'react';
import { Home, Plus, Folder, LogOut, Settings, User, Trash2, ChevronRight, ChevronDown, Mail, Users, Shield, X } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { FolderUI } from '@/types/vault';

interface VaultSidebarProps {
    currentFilter: string;
    setFilter: (id: string) => void;
    onAdd: () => void;
    userEmail: string;
    folders: FolderUI[];
    onCreateFolder: (name: string) => Promise<void>;
    onDeleteFolder: (id: string) => Promise<void>;
    isAdmin?: boolean;
    onClose?: () => void;
}

export default function VaultSidebar({
    currentFilter,
    setFilter,
    onAdd,
    userEmail,
    folders,
    onCreateFolder,
    onDeleteFolder,
    isAdmin,
    onClose,
}: VaultSidebarProps) {
    const [foldersOpen, setFoldersOpen] = useState(true);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        await onCreateFolder(newFolderName);
        setNewFolderName('');
        setIsCreatingFolder(false);
    }

    return (
        <div className="w-full md:w-64 bg-black/60 backdrop-blur-xl border-r border-white/10 flex flex-col h-full shrink-0">
            {/* Mobile Header with Close */}
            <div className="md:hidden h-14 border-b border-white/10 flex items-center justify-between px-4">
                <span className="font-bold text-white">Menu</span>
                <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="h-4 md:block hidden" />

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto p-3 space-y-6">
                <div>
                    <button
                        onClick={onAdd}
                        className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-black font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[hsl(var(--primary))]/20 mb-6"
                    >
                        <Plus className="w-5 h-5" />
                        New Account
                    </button>

                    <div className="space-y-1">
                        <NavItem
                            active={currentFilter === 'all'}
                            onClick={() => setFilter('all')}
                            icon={Home}
                            label="All Accounts"
                        />
                        <NavItem
                            active={currentFilter === 'favorites'}
                            onClick={() => setFilter('favorites')}
                            icon={User} // Placeholder icon for favorites
                            label="Favorites"
                        />
                        <NavItem
                            active={currentFilter === 'trash'}
                            onClick={() => setFilter('trash')}
                            icon={Trash2}
                            label="Trash"
                        />
                        <div className="h-px bg-white/10 my-2" />
                        <NavItem
                            active={currentFilter === 'connections'}
                            onClick={() => setFilter('connections')}
                            icon={Users}
                            label="Connections"
                        />
                        <NavItem
                            active={currentFilter === 'groups'}
                            onClick={() => setFilter('groups')}
                            icon={Shield}
                            label="Groups"
                        />
                    </div>
                </div>

                {/* Folders */}
                <div>
                    <div className="flex items-center justify-between px-3 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <button onClick={() => setFoldersOpen(!foldersOpen)} className="flex items-center gap-1 hover:text-white">
                            {foldersOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            Folders
                        </button>
                        <button onClick={() => setIsCreatingFolder(true)} className="hover:text-[hsl(var(--primary))]">
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>

                    {foldersOpen && (
                        <div className="space-y-1">
                            {isCreatingFolder && (
                                <form onSubmit={handleCreateFolder} className="px-3 py-1">
                                    <input
                                        autoFocus
                                        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[hsl(var(--primary))]"
                                        placeholder="Folder Name"
                                        value={newFolderName}
                                        onChange={e => setNewFolderName(e.target.value)}
                                        onBlur={() => !newFolderName && setIsCreatingFolder(false)}
                                    />
                                </form>
                            )}
                            {folders.map(folder => (
                                <div key={folder._id} className="group flex items-center justify-between pr-2">
                                    <NavItem
                                        active={currentFilter === folder._id}
                                        onClick={() => setFilter(folder._id)}
                                        icon={Folder}
                                        label={folder.name}
                                        className="flex-1"
                                    />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder._id); }}
                                        className="hidden group-hover:block text-gray-500 hover:text-red-500 p-1"
                                        title="Delete Folder"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Admin section moved to footer */}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 space-y-2">
                {isAdmin && (
                    <button
                        onClick={() => setFilter('admin')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentFilter === 'admin' ? 'bg-[hsl(var(--primary))] text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Shield className="w-4 h-4" />
                        Admin Settings
                    </button>
                )}
                <button
                    onClick={() => setFilter('settings')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentFilter === 'settings' ? 'bg-[hsl(var(--primary))] text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Settings className="w-4 h-4" />
                    Vault Settings
                </button>
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-xs">
                        {userEmail[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{userEmail}</p>
                        <button
                            onClick={() => signOut()}
                            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mt-0.5"
                        >
                            <LogOut className="w-3 h-3" /> Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function NavItem({ active, onClick, icon: Icon, label, className = '' }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                } ${className}`}
        >
            <Icon className={`w-4 h-4 ${active ? 'text-[hsl(var(--primary))]' : ''}`} />
            <span className="truncate">{label}</span>
        </button>
    );
}
