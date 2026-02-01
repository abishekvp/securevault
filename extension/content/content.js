// extension/content/content.js

console.log('Secure Vault: Content script loaded');

// Helper to find login forms
function findLoginFields() {
    const passwordFields = document.querySelectorAll('input[type="password"]');
    const fields = [];

    passwordFields.forEach(pass => {
        const form = pass.closest('form');
        let user = null;

        if (form) {
            user = form.querySelector('input[type="text"], input[type="email"], input:not([type])');
        } else {
            // Find nearest text input before the password field
            const inputs = Array.from(document.querySelectorAll('input'));
            const passIndex = inputs.indexOf(pass);
            for (let i = passIndex - 1; i >= 0; i--) {
                if (['text', 'email'].includes(inputs[i].type) || !inputs[i].type) {
                    user = inputs[i];
                    break;
                }
            }
        }

        if (user && pass) {
            fields.push({ user, pass });
        }
    });

    return fields;
}

// Inject auto-fill button
function injectAutofillButtons(fields) {
    fields.forEach(({ user, pass }) => {
        if (user.dataset.svInjected) return;
        user.dataset.svInjected = 'true';

        const icon = document.createElement('div');
        icon.className = 'sv-autofill-icon';
        icon.innerHTML = 'SV'; // Use initials instead of missing image
        icon.title = 'Fill with Secure Vault (Double-click field also works)';

        // Position icon inside the input field
        const rect = user.getBoundingClientRect();
        icon.style.left = (rect.right - 28) + 'px';
        icon.style.top = (rect.top + (rect.height - 20) / 2) + 'px';

        document.body.appendChild(icon);

        icon.onclick = (e) => {
            e.stopPropagation();
            requestCredentials(user, pass);
        };

        user.ondblclick = () => requestCredentials(user, pass);
    });
}

function requestCredentials(userField, passField) {
    chrome.runtime.sendMessage({ action: 'findCredentials', url: window.location.href }, (accounts) => {
        if (!accounts || accounts.length === 0) {
            alert('No accounts found for this site.');
            return;
        }

        if (accounts.length === 1) {
            fillAccount(accounts[0], userField, passField);
        } else {
            showAccountPicker(accounts, userField, passField);
        }
    });
}

function fillAccount(account, userField, passField) {
    userField.value = account.listDisplay?.username || '';
    // Passwords would need to be decrypted here or in background
    passField.value = 'DECRYPTED_PASSWORD'; // Demo placeholder

    // Trigger change events
    userField.dispatchEvent(new Event('input', { bubbles: true }));
    passField.dispatchEvent(new Event('input', { bubbles: true }));
}

function showAccountPicker(accounts, userField, passField) {
    // Basic picker implementation
    const picker = document.createElement('div');
    picker.className = 'sv-account-picker';

    accounts.forEach(acc => {
        const item = document.createElement('div');
        item.className = 'sv-picker-item';
        item.textContent = acc.listDisplay?.username || acc.listDisplay?.title;
        item.onclick = () => {
            fillAccount(acc, userField, passField);
            picker.remove();
        };
        picker.appendChild(item);
    });

    document.body.appendChild(picker);

    // Close picker when clicking outside
    const outsideClick = (e) => {
        if (!picker.contains(e.target)) {
            picker.remove();
            document.removeEventListener('click', outsideClick);
        }
    };
    setTimeout(() => document.addEventListener('click', outsideClick), 10);
}

// Detect form submission for auto-save
window.addEventListener('submit', (e) => {
    const form = e.target;
    const pass = form.querySelector('input[type="password"]');
    const user = form.querySelector('input[type="text"], input[type="email"]');

    if (pass && user && pass.value) {
        chrome.runtime.sendMessage({
            action: 'saveCredentials',
            data: {
                username: user.value,
                password: pass.value,
                url: window.location.href,
                title: document.title
            }
        });
    }
}, true);

// Run initial check
setTimeout(() => {
    const fields = findLoginFields();
    injectAutofillButtons(fields);
}, 2000);
