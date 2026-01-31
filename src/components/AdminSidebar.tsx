import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Settings, LogOut, ShieldAlert } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function AdminSidebar() {
    const pathname = usePathname();

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
        { id: 'settings', label: 'Settings', icon: Settings, href: '/admin/settings' },
    ];

    return (
        <aside className="w-64 bg-black/20 backdrop-blur-md border-r border-white/10 flex flex-col h-full shrink-0 relative z-20">
            {/* Header */}
            <div className="p-6 flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    <ShieldAlert className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg tracking-tight text-white">Admin Panel</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                ? 'bg-red-500/10 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left text-gray-400 hover:text-red-400"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Exit Admin</span>
                </button>
            </div>
        </aside>
    );
}
