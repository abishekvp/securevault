import React from 'react';

interface VaultItemIconProps {
    name: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function VaultItemIcon({ name, size = 'md' }: VaultItemIconProps) {
    const initials = name.slice(0, 2).toUpperCase();

    // Generate a consistent color based on name
    const colors = [
        'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500',
        'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
    ];
    // Simple hash
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    // We can't easily use Tailwind classes dynamically without safelisting or mapping.
    // So we'll use inline styles or mapped classes if using a strict utility set.
    // For now, let's stick to the CSS variable approach or just a default styling that looks premium.
    // Proton uses specific brand colors or favicons. Let's use a nice gradient based on the new purple.

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-xl'
    };

    return (
        <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-hover)]`}>
            {initials}
        </div>
    );
}
