const API = {
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
    }
};
// Attach to global scope for content script
window.API = API;
