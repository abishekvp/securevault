'use client';

import React, { useState, useRef, useEffect } from 'react';
import VaultItemIcon from './VaultItemIcon';
import { Search, ChevronRight, Menu, Plus, ChevronDown, Folder } from 'lucide-react';

import { AccountUI, FolderUI } from '@/types/vault';

interface VaultListProps {
    accounts: AccountUI[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onMenuClick?: () => void;
    onAdd?: () => void;
    folders: FolderUI[];
    activeFilter: string;
    onFilterChange: (filter: string) => void;
}

export default function VaultList({ accounts, selectedId, onSelect, searchQuery, onSearchChange, onMenuClick, onAdd, folders, activeFilter, onFilterChange }: VaultListProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getActiveLabel = () => {
        if (activeFilter === 'all') return 'All Items';
        if (activeFilter === 'favorites') return 'Favorites';
        const folder = folders.find(f => f._id === activeFilter);
        return folder ? folder.name : 'Select Folder';
    };

    return (
        <div className="flex flex-col h-full w-full md:w-80 border-r border-white/10 bg-black/20 backdrop-blur-md shrink-0 relative z-10">
            {/* List Header & Search */}
            <div className="p-4 border-b border-white/10 flex gap-3 items-center">
                {/* Mobile Menu Button */}
                <button onClick={onMenuClick} className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white">
                    <Menu className="w-5 h-5" />
                </button>
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search logins..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all text-white placeholder:text-gray-500"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3 pointer-events-none" />
                </div>
                {/* Mobile Add Button */}
                <button onClick={onAdd} className="md:hidden p-2 -mr-2 text-gray-400 hover:text-[hsl(var(--primary))]">
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* Folder Selection Custom Dropdown */}
            <div className="px-4 pb-2 relative z-20" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border ${isDropdownOpen ? 'border-[hsl(var(--primary))]' : 'border-white/10'} rounded-xl px-3 py-2 text-sm text-gray-200 transition-all`}
                >
                    <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{getActiveLabel()}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute top-full left-4 right-4 mt-2 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => { onFilterChange('all'); setIsDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${activeFilter === 'all' ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]' : 'text-gray-300 hover:bg-white/5'}`}
                        >
                            <span>All Items</span>
                            {activeFilter === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))]" />}
                        </button>
                        <button
                            onClick={() => { onFilterChange('favorites'); setIsDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${activeFilter === 'favorites' ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]' : 'text-gray-300 hover:bg-white/5'}`}
                        >
                            <span>Favorites</span>
                            {activeFilter === 'favorites' && <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))]" />}
                        </button>

                        {folders.length > 0 && <div className="h-px bg-white/10 my-1 mx-2" />}

                        {folders.map(folder => (
                            <button
                                key={folder._id}
                                onClick={() => { onFilterChange(folder._id); setIsDropdownOpen(false); }}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${activeFilter === folder._id ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]' : 'text-gray-300 hover:bg-white/5'}`}
                            >
                                <span>{folder.name}</span>
                                {activeFilter === folder._id && <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))]" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {accounts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        No accounts found.
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {accounts.map(account => (
                            <button
                                key={account.id}
                                onClick={() => onSelect(account.id)}
                                className={`w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-all text-left group relative
                                    ${selectedId === account.id ? 'bg-white/5' : ''}
                                `}
                            >
                                {selectedId === account.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[hsl(var(--primary))] shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]" />
                                )}

                                <VaultItemIcon name={account.name} size="md" />
                                <div className="flex-1 min-w-0">
                                    <div className={`font-semibold text-sm truncate ${selectedId === account.id ? 'text-white' : 'text-gray-200'}`}>
                                        {account.name}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate group-hover:text-gray-400 transition-colors">
                                        {account.username}
                                    </div>
                                    {account.sharedBy && (
                                        <div className="mt-1 text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md w-fit font-medium">Shared by {account.sharedBy}</div>
                                    )}
                                </div>
                                {/* Chevron indicator on active/hover */}
                                <ChevronRight className={`w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-all ${selectedId === account.id ? 'opacity-100 text-[hsl(var(--primary))]' : ''}`} />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* List Footer - Count */}
            <div className="p-2 text-center text-[10px] text-gray-600 border-t border-white/10 uppercase tracking-widest font-mono">
                {accounts.length} accounts
            </div>
        </div>
    );
}
