import { API } from './../lib/api.js';
import { CryptoUtils } from './../lib/crypto.js';

let vaultItems = [];
let masterKey = null; // CryptoKey object

chrome.runtime.onInstalled.addListener(() => {
    console.log('Secure Vault Extension Installed');
});

async function refreshState() {
    try {
        const user = await API.checkSession();
        if (user) {
            await chrome.storage.local.set({ user });

            // Try to get keys
            try {
                const vaultKeyB64 = await API.getVaultKey();
                masterKey = await CryptoUtils.importKey(vaultKeyB64);
                await chrome.storage.local.set({ vaultKey: vaultKeyB64 });
            } catch (kErr) {
                console.warn('Could not fetch vault key', kErr);
                masterKey = null;
            }

            vaultItems = await API.getVaultItems().catch(() => []);
            return true;
        } else {
            await chrome.storage.local.remove(['user', 'vaultKey']);
            vaultItems = [];
            masterKey = null;
            return false;
        }
    } catch (e) {
        console.error('Session check failed', e);
        return false;
    }
}

// Restore key from storage on load if available
chrome.storage.local.get(['vaultKey'], async (res) => {
    if (res.vaultKey) {
        try {
            masterKey = await CryptoUtils.importKey(res.vaultKey);
        } catch (e) {
            console.error("Failed to import stored key", e);
        }
    }
});

setInterval(refreshState, 5 * 60 * 1000);
refreshState();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkSession') {
        refreshState().then(sendResponse);
        return true;
    }

    if (request.action === 'getVaultItems') {
        // Return raw items. Decryption happens in Popup if needed.
        API.getVaultItems()
            .then(items => {
                vaultItems = items;
                sendResponse(items);
            })
            .catch(err => sendResponse({ error: err.message }));
        return true;
    }

    if (request.action === 'saveCredentials') {
        (async () => {
            if (!masterKey) {
                // Try to refresh one last time
                await refreshState();
                if (!masterKey) {
                    sendResponse({ error: "Vault is locked or key unavailable. Please open the extension or login." });
                    return;
                }
            }

            try {
                const { username, password, url, title } = request.data;
                const itemData = {
                    username,
                    password,
                    url,
                    name: title || 'New Account',
                    fields: [],
                    createdAt: Date.now()
                };

                // Generate Item Key
                const itemKey = await CryptoUtils.generateVaultKey();

                // Encrypt payload with Item Key
                const encData = await CryptoUtils.encryptData(itemKey, JSON.stringify(itemData));

                // Encrypt Item Key with Master Key
                const itemKeyRaw = await CryptoUtils.exportKey(itemKey);
                const encItemKey = await CryptoUtils.encryptData(masterKey, itemKeyRaw);

                await API.createVaultItem({
                    type: 'login',
                    title: title || 'New Account',
                    username: username,
                    url: url,
                    encryptedData: encData,
                    encryptedItemKey: encItemKey
                });

                sendResponse({ success: true });
            } catch (err) {
                console.error("Save failed", err);
                sendResponse({ error: err.message });
            }
        })();
        return true;
    }

    if (request.action === 'findCredentials') {
        const { url } = request;
        const matches = vaultItems.filter(item => {
            if (item.type !== 'login') return false;
            try {
                // Use metadata if available
                const itemUrl = item.url || item.listDisplay?.url;
                if (!itemUrl) return false;

                const host1 = new URL(itemUrl).hostname.replace('www.', '');
                const host2 = new URL(url).hostname.replace('www.', '');
                return host1 === host2;
            } catch (e) {
                return false;
            }
        });
        sendResponse(matches);
    }
});
