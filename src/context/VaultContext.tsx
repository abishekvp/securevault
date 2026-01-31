'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface VaultContextType {
    masterKey: CryptoKey | null;
    setMasterKey: (key: CryptoKey | null) => void;
    isUnlocked: boolean;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: ReactNode }) {
    const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);

    return (
        <VaultContext.Provider value={{ masterKey, setMasterKey, isUnlocked: !!masterKey }}>
            {children}
        </VaultContext.Provider>
    );
}

export function useVault() {
    const context = useContext(VaultContext);
    if (context === undefined) {
        throw new Error('useVault must be used within a VaultProvider');
    }
    return context;
}
