'use client';

import { SessionProvider } from 'next-auth/react';
import { VaultProvider } from '@/context/VaultContext';
import React from 'react';
import { ToastProvider } from '@/context/ToastContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ToastProvider>
                <VaultProvider>
                    {children}
                </VaultProvider>
            </ToastProvider>
        </SessionProvider>
    );
}
