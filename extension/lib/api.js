export const API = {
    async getBaseUrl() {
        const result = await chrome.storage.local.get(['productUrl']);
        return result.productUrl || 'http://localhost:3000';
    },

    async request(path, options = {}) {
        const baseUrl = await this.getBaseUrl();
        const url = `${baseUrl}${path}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'API Request failed');
        }

        return response.json();
    },

    async checkSession() {
        try {
            const session = await this.request('/api/auth/session');
            return session && session.user;
        } catch (e) {
            return false;
        }
    },

    async getVaultItems() {
        return this.request('/api/vault/items');
    },

    async getVaultKey() {
        const res = await this.request('/api/user/key');
        return res.vaultKey;
    },

    async createVaultItem(data) {
        return this.request('/api/vault/items', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateVaultItem(id, data) {
        return this.request('/api/vault/items/' + id, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteVaultItem(id) {
        return this.request('/api/vault/items/' + id, {
            method: 'DELETE',
        });
    }
};

window.API = API;
