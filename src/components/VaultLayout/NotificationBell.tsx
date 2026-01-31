import React, { useState, useEffect } from 'react';
import { Bell, X, Info, AlertTriangle, AlertCircle } from 'lucide-react';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hasNew, setHasNew] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            if (data.notifications && data.notifications.length > 0) {
                setNotifications(data.notifications);
                setHasNew(true);
            } else {
                setNotifications([]);
                setHasNew(false);
            }
        } catch (e) {
            console.error("Failed to fetch notifications");
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll occasionally or use SSE (simple poll for now)
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markAsSeen = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await fetch(`/api/notifications?id=${id}`, {
                method: 'DELETE',
            });
            setNotifications(prev => prev.filter(n => n._id !== id));
            if (notifications.length <= 1) setHasNew(false);
        } catch (e) { console.error("Failed to dismiss"); }
    };

    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    const containerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative z-[100]" ref={containerRef}>
            <button
                onClick={toggleOpen}
                className="p-2 rounded-full hover:bg-white/10 transition-colors relative flex items-center justify-center shrink-0"
            >
                <Bell className={`w-5 h-5 ${hasNew ? 'text-white' : 'text-gray-400'}`} />
                {hasNew && (
                    <span className="absolute top-1 right-2 w-2 h-2 bg-[hsl(var(--primary))] rounded-full animate-pulse" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-12 w-80 bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                        <h4 className="font-bold text-sm">Notifications</h4>
                        {notifications.length === 0 && <span className="text-xs text-gray-500">All caught up</span>}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-xs">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                No new notifications
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {notifications.map(n => (
                                    <div key={n._id} className="p-4 hover:bg-white/5 transition-colors relative group">
                                        <div className="flex gap-3">
                                            <div className="mt-0.5">
                                                {n.type === 'alert' ? <AlertCircle className="w-4 h-4 text-red-500" /> :
                                                    n.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-yellow-500" /> :
                                                        <Info className="w-4 h-4 text-blue-500" />}
                                            </div>
                                            <div className="flex-1">
                                                <h5 className="text-sm font-bold text-gray-200">{n.title}</h5>
                                                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{n.message}</p>
                                                <span className="text-[10px] text-gray-600 mt-2 block">{new Date(n.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <button
                                                onClick={(e) => markAsSeen(n._id, e)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded absolute top-2 right-2"
                                                title="Mark as Seen"
                                            >
                                                <X className="w-3 h-3 text-gray-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
