// src/services/vault.ts

export interface VaultItem {
    _id: string;
    type: 'login' | 'note' | 'card';
    title?: string;
    encryptedData: string;
    encryptedItemKey: string;
    folderId?: string;
    listDisplay?: any; // Decrypted minimal display info
    favorite: boolean;
    createdAt: string;
    // ...
}

export const VaultService = {
    async getItems(folderId?: string, trash: boolean = false) {
        let url = '/api/vault/items?';
        if (folderId) url += `folderId=${folderId}&`;
        if (trash) url += `trash=true`;

        const res = await fetch(url);
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch items');
        }
        return res.json();
    },

    async getItem(id: string) {
        const res = await fetch(`/api/vault/items/${id}`);
        if (!res.ok) return null;
        return res.json();
    },

    async createItem(data: any) {
        const res = await fetch('/api/vault/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create item');
        return res.json();
    },

    async updateItem(id: string, data: any) {
        const res = await fetch(`/api/vault/items/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to update item');
        }
        return res.json();
    },

    async deleteItem(id: string, permanent: boolean = false) {
        const res = await fetch(`/api/vault/items/${id}?permanent=${permanent}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete item');
        return res.json();
    },

    async restoreItem(id: string) {
        return this.updateItem(id, { restore: true });
    },

    // Folders
    async getFolders() {
        const res = await fetch('/api/vault/folders');
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch folders');
        }
        return res.json();
    },

    async createFolder(name: string) {
        const res = await fetch('/api/vault/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });
        if (!res.ok) throw new Error('Failed to create folder');
        return res.json();
    },

    async deleteFolder(id: string) {
        const res = await fetch(`/api/vault/folders/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete folder');
        return res.json();
    },

    async updateFolder(id: string, name: string) {
        const res = await fetch(`/api/vault/folders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });
        if (!res.ok) throw new Error('Failed to update folder');
        return res.json();
    },

    // Re-Encryption Support
    async getAllItems() {
        // Currently getItems returns all, but we make it explicit for this purpose
        return this.getItems(undefined, false);
    },

    async reEncryptVault(payload: {
        otp: string;
        newPassword?: string;
        newEmail?: string;
        newVaultKey: string; // Base64 export of new Vault Key
        encryptedPrivateKey: string; // Re-encrypted private key
        items: Array<{ id: string; encryptedItemKey: string }>;
    }) {
        const res = await fetch('/api/user/security/re-encrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to re-encrypt vault');
        }
        return res.json();
    }
};
