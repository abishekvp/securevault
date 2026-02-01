import { API } from './../lib/api.js';
import { CryptoUtils } from './../lib/crypto.js';

document.addEventListener('DOMContentLoaded', async () => {
    const loginScreen = document.getElementById('login-screen');
    const vaultScreen = document.getElementById('vault-screen');
    const editScreen = document.getElementById('edit-screen');
    const vaultList = document.getElementById('vault-list');
    const userEmail = document.getElementById('user-email');

    const btnOpenLogin = document.getElementById('btn-open-login');
    const btnAdd = document.getElementById('btn-add');
    const btnBackToVault = document.getElementById('btn-back-to-vault');
    const btnSaveAccount = document.getElementById('btn-save-account');
    const btnDeleteAccount = document.getElementById('btn-delete-account');

    let currentItems = [];
    let masterKey = null;

    async function init() {
        const user = await API.checkSession();
        if (user) {
            // Try load key
            const res = await chrome.storage.local.get(['vaultKey']);
            if (res.vaultKey) {
                try {
                    masterKey = await CryptoUtils.importKey(res.vaultKey);
                } catch (e) {
                    console.error("Key load failed", e);
                }
            } else {
                // Try fetch if not in storage
                try {
                    const vk = await API.getVaultKey();
                    await chrome.storage.local.set({ vaultKey: vk });
                    masterKey = await CryptoUtils.importKey(vk);
                } catch (e) {
                    console.error("Key fetch failed", e);
                }
            }

            showScreen('vault');
            userEmail.textContent = user.email;
            loadVaultItems();
        } else {
            showScreen('login');
        }
    }

    function showScreen(screen) {
        loginScreen.classList.add('hidden');
        vaultScreen.classList.add('hidden');
        editScreen.classList.add('hidden');

        if (screen === 'login') loginScreen.classList.remove('hidden');
        if (screen === 'vault') vaultScreen.classList.remove('hidden');
        if (screen === 'edit') editScreen.classList.remove('hidden');
    }

    async function loadVaultItems() {
        vaultList.innerHTML = '<div class="loading">Loading items...</div>';
        try {
            const items = await API.getVaultItems();
            currentItems = items;
            renderItems(items);
        } catch (e) {
            vaultList.innerHTML = `<div class="loading">Error: ${e.message}</div>`;
        }
    }

    function renderItems(items) {
        if (!items || items.length === 0) {
            vaultList.innerHTML = '<div class="loading">No items found.</div>';
            return;
        }

        vaultList.innerHTML = '';
        items.forEach(async (item) => {
            // Initial render with available metadata or placeholders
            let title = item.title || item.listDisplay?.title || 'Untitled Account';
            let username = item.username || item.listDisplay?.username || 'No username';
            const isMissingMetadata = !item.title && !item.listDisplay?.title;

            const div = document.createElement('div');
            div.className = 'vault-item';
            div.innerHTML = `
                <div class="item-icon">${(title)[0].toUpperCase()}</div>
                <div class="item-info">
                    <div class="item-title">${title}</div>
                    <div class="item-subtitle">${username}</div>
                </div>
            `;
            div.onclick = () => openEditScreen(item);
            vaultList.appendChild(div);

            // If metadata is missing and we have the key, decrypt on the fly to show real data
            if (isMissingMetadata && masterKey) {
                try {
                    const decrypted = await decryptItemData(item);
                    title = decrypted.name || decrypted.title || 'Untitled Account';
                    username = decrypted.username || 'No username';

                    // Update UI elements
                    const iconEl = div.querySelector('.item-icon');
                    const titleEl = div.querySelector('.item-title');
                    const subEl = div.querySelector('.item-subtitle');

                    if (iconEl) iconEl.textContent = (title)[0].toUpperCase();
                    if (titleEl) titleEl.textContent = title;
                    if (subEl) subEl.textContent = username;
                } catch (e) {
                    console.log('Could not decrypt list item', e);
                }
            }
        });
    }

    async function decryptItemData(item) {
        if (!masterKey) throw new Error("Vault Locked");
        try {
            const itemKeyRaw = await CryptoUtils.decryptData(masterKey, item.encryptedItemKey);
            const itemKey = await CryptoUtils.importKey(itemKeyRaw);
            const json = await CryptoUtils.decryptData(itemKey, item.encryptedData);
            return JSON.parse(json);
        } catch (e) {
            console.error("Decryption failed", e);
            throw new Error("Failed to decrypt");
        }
    }

    function openEditScreen(item = null) {
        showScreen('edit');
        const titleField = document.getElementById('field-title');
        const usernameField = document.getElementById('field-username');
        const passwordField = document.getElementById('field-password');
        const urlField = document.getElementById('field-url');
        const editTitle = document.getElementById('edit-title');

        // New Buttons
        document.querySelectorAll('#edit-screen .extra-actions').forEach(e => e.remove());

        const copyPassBtn = document.createElement('button');
        const viewPassBtn = document.createElement('button');

        const actionContainer = document.createElement('div');
        actionContainer.className = 'extra-actions';
        actionContainer.style.display = 'flex';
        actionContainer.style.gap = '10px';
        actionContainer.style.marginTop = '10px';

        if (item) {
            delete btnSaveAccount.dataset.editingId;
            btnSaveAccount.dataset.editingId = item._id;

            editTitle.textContent = 'Edit Account';
            titleField.value = item.title || '';
            usernameField.value = item.username || '';
            urlField.value = item.url || '';

            passwordField.value = '********'; // Placeholder
            passwordField.type = 'password';

            btnDeleteAccount.classList.remove('hidden');
            btnDeleteAccount.onclick = () => deleteItem(item._id);

            // Add Actions
            copyPassBtn.className = 'btn-secondary';
            copyPassBtn.textContent = 'Copy Password';
            viewPassBtn.className = 'btn-secondary';
            viewPassBtn.textContent = 'View Password';

            actionContainer.appendChild(copyPassBtn);
            actionContainer.appendChild(viewPassBtn);

            document.querySelector('#edit-screen .content').insertBefore(actionContainer, document.getElementById('btn-save-account'));

            // Decryption Actions
            let decryptedCache = null;

            const ensureDecrypted = async () => {
                if (decryptedCache) return decryptedCache;
                decryptedCache = await decryptItemData(item);
                return decryptedCache;
            };

            copyPassBtn.onclick = async (e) => {
                e.preventDefault();
                try {
                    const data = await ensureDecrypted();
                    navigator.clipboard.writeText(data.password || '');
                    copyPassBtn.textContent = 'Copied!';
                    setTimeout(() => copyPassBtn.textContent = 'Copy Password', 1500);
                } catch (err) {
                    alert(err.message);
                }
            };

            viewPassBtn.onclick = async (e) => {
                e.preventDefault();
                try {
                    if (passwordField.type === 'password') {
                        const data = await ensureDecrypted();
                        passwordField.value = data.password || '';
                        passwordField.type = 'text';
                        viewPassBtn.textContent = 'Hide Password';
                    } else {
                        passwordField.type = 'password';
                        passwordField.value = '********';
                        viewPassBtn.textContent = 'View Password';
                    }
                } catch (err) {
                    alert(err.message);
                }
            };

        } else {
            editTitle.textContent = 'Add Account';
            titleField.value = '';
            usernameField.value = '';
            passwordField.value = '';
            urlField.value = '';
            passwordField.type = 'text';

            btnDeleteAccount.classList.add('hidden');
            delete btnSaveAccount.dataset.editingId;
        }
    }

    async function deleteItem(id) {
        if (confirm('Are you sure you want to delete this account?')) {
            await API.deleteVaultItem(id);
            showScreen('vault');
            loadVaultItems();
        }
    }

    // Save Account Handler
    btnSaveAccount.onclick = async () => {
        const title = document.getElementById('field-title').value;
        const username = document.getElementById('field-username').value;
        const password = document.getElementById('field-password').value;
        const url = document.getElementById('field-url').value;

        if (!title) {
            alert('Title is required');
            return;
        }

        try {
            if (!masterKey) throw new Error("Vault is locked");

            const itemData = {
                username,
                password,
                url,
                name: title,
                fields: [],
                createdAt: Date.now()
            };

            // Encrypt
            const itemKey = await CryptoUtils.generateVaultKey();
            const encData = await CryptoUtils.encryptData(itemKey, JSON.stringify(itemData));
            const itemKeyRaw = await CryptoUtils.exportKey(itemKey);
            const encItemKey = await CryptoUtils.encryptData(masterKey, itemKeyRaw);

            const payload = {
                type: 'login',
                title,
                username,
                url,
                encryptedData: encData,
                encryptedItemKey: encItemKey
            };

            const editingId = btnSaveAccount.dataset.editingId;

            if (editingId) {
                // For editing, if password field was untouched (********), we need to fetch original data first?
                // The current UI simplifies: if you edit, you overwrite. 
                // But wait, if fields are hidden/decrypted on demand, saving might overwrite with '********' if we aren't careful.
                // Simple fix: if password value is '********', don't include it in update or fetch original?
                // Better: force decrypt before allowing save if editing?
                // For now, let's assume if the user hits save, they see the values.
                // Actually, if I open edit, password is '********'. If I hit save immediately, I save '********' as password.
                // WE MUST DECRYPT FIRST if we want to preserve partial edits.
                // OR: only encrypt what changed.
                // EASIEST: If password is '********', fetch the original encrypted data and only update metadata?
                // NO, we want full overwrite capability.
                // Solution: check if password === '********'. If so, we need to decrypt the OLD item to get the REAL password, then re-encrypt everything.

                if (password === '********') {
                    const item = currentItems.find(i => i._id === editingId);
                    const decrypted = await decryptItemData(item);
                    itemData.password = decrypted.password;
                }

                // Re-encrypt with new data
                const newItemKey = await CryptoUtils.generateVaultKey();
                const newEncData = await CryptoUtils.encryptData(newItemKey, JSON.stringify(itemData));
                const newItemKeyRaw = await CryptoUtils.exportKey(newItemKey);
                const newEncItemKey = await CryptoUtils.encryptData(masterKey, newItemKeyRaw);

                payload.encryptedData = newEncData;
                payload.encryptedItemKey = newEncItemKey;

                await API.updateVaultItem(editingId, payload);
            } else {
                await API.createVaultItem(payload);
            }

            showScreen('vault');
            loadVaultItems();
        } catch (e) {
            alert('Error saving: ' + e.message);
            console.error(e);
        }
    };

    btnOpenLogin.onclick = async () => {
        const baseUrl = await API.getBaseUrl();
        chrome.tabs.create({ url: `${baseUrl}/login` });
    };

    btnAdd.onclick = () => openEditScreen();
    btnBackToVault.onclick = () => showScreen('vault');

    const btnSaveConfig = document.getElementById('btn-save-config');
    const configError = document.getElementById('config-error');

    if (btnSaveConfig) {
        btnSaveConfig.onclick = async () => {
            let url = document.getElementById('product-url').value.trim();
            if (!url) {
                configError.textContent = 'Please enter a URL';
                configError.classList.remove('hidden');
                return;
            }

            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'http://' + url;
            }

            try {
                url = url.replace(/\/$/, "");
                configError.textContent = 'Verifying...';
                configError.classList.remove('hidden');

                const response = await fetch(`${url}/api/auth/session`).catch(e => {
                    throw new Error('Could not connect. Ensure the URL is correct and the server is running.');
                });

                if (response) {
                    await chrome.storage.local.set({ productUrl: url });
                    configError.classList.add('hidden');
                    init();
                }
            } catch (e) {
                configError.textContent = e.message;
                configError.classList.remove('hidden');
            }
        };
    }

    init();
});
