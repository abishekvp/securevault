# Secure Vault - Design Document

## 1. Product Overview
Secure Vault is a minimalist, privacy-first password manager designed for individual users. It prioritizes zero-knowledge security, meaning the server never sees the plain text data. The UI is inspired by Proton and Apple's Human Interface Guidelines, adhering to a "Modern + Classic Minimalism" aesthetic.

## 2. Technical Architecture & Stack
### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules (Vanilla CSS) for granular control and minimal bloat, following the "Modern Minimalist" aesthetic.
- **State Management**: React Context + Hooks (for Vault state).

### Backend
- **Framework**: Next.js API Routes (Serverless functions).
- **Database**: MongoDB (Atlas) - Document structure fits the nested "Account -> Custom Fields" model perfectly.
- **Authentication**: NextAuth.js (Auth.js) v5.
    - Providers: Google, Microsoft, Email (Magic Link/OTP), Email/Password.
    - **Crucial Distinction**: The *Authentication* confirms identity. The *Decryption* requires a separate Master Password (since we cannot get a Master Password from a Google Login).

### Security & Encryption (Zero-Knowledge)
The core principle is that the server stores encrypted blobs. The keys to decrypt them exist **only** in the user's volatile memory (RAM) on the client.

#### Encryption Workflow
1.  **Identity vs. Encryption**:
    *   **Login**: Proves "Who I am" (Google/Email). Grants access to fetch the *Encrypted Blob*.
    *   **Master Password**: User inputs this local-only string.
2.  **Key Derivation**:
    *   Algorithm: `Argon2id` (via WebAssembly client-side library) or `PBKDF2` (Web Crypto API) if WASM is too heavy, but Argon2 is requested/preferred for strength.
    *   Input: `Master Password` + `Salt` (randomly generated per user, stored publicly on server).
    *   Output: `Master Key` (256-bit).
3.  **Data Encryption**:
    *   Algorithm: `AES-256-GCM`.
    *   The `Master Key` encrypts the `Vault Key` (randomly generated).
    *   The `Vault Key` encrypts the actual Vault Data.
    *   *Why two keys?* Allows changing Master Password without re-encrypting the entire DB.
4.  **Storage**:
    *   Server stores: `EncryptedVaultKey`, `EncryptedVaultData`, `Salt`, `AuthData`.

## 3. Data Models

### User (MongoDB Collection)
```typescript
interface UserSchema {
  _id: ObjectId;
  email: string; // Unique, Indexed
  authProvider: 'google' | 'microsoft' | 'email';
  
  // Auth (if email/password login is used, handled by NextAuth)
  passwordHash?: string; 
  
  // security settings
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;

  // Encryption Metadata (Public to client, useless without Master Password)
  encryptionSalt: string; // Used to derive Key from MasterPassword
  clientKeySalt: string; // Used for "Client Hash" if we want to verify MP without sending it (optional)
  
  // The Data
  encryptedVaultKey: string; // Encrypted with Derived(MasterPassword)
  encryptedVaultData: string; // The big blob of accounts, Encrypted with VaultKey
  
  createdAt: Date;
  lastLogin: Date;
}
```

### Vault Data (Client-Side Decrypted Structure)
```typescript
interface Vault {
  accounts: Account[];
  tags: string[];
}

interface Account {
  id: string; // UUID
  name: string; // e.g. "Github"
  username: string;
  password: string;
  url?: string;
  notes?: string;
  isFavorite: boolean;
  category?: string;
  fields: CustomField[];
  updatedAt: number;
}

interface CustomField {
  id: string;
  label: string; // e.g. "API Key"
  value: string;
  type: 'text' | 'password' | 'note';
}
```

## 4. API Endpoints (Next.js App Router)

### `/api/auth/[...nextauth]`
- Handles standard login flows.

### `/api/vault`
- `GET`: Returns `{ encryptedVaultKey, encryptedVaultData, encryptionSalt }`. Requires Auth.
- `POST / PUT`: Accepts `{ encryptedVaultKey, encryptedVaultData }`. Overwrites/Updates storage.
    - *Note*: To prevent conflict, we might want optimistic locking (versioning), but for Phase 1 Single User, overwrite is acceptable.

### `/api/user/settings`
- `PATCH`: Update 2FA, Email, etc.

## 5. UI/UX Flow
1.  **Landing / Login**:
    *   Clean, centered card.
    *   "Continue with Google" / "Continue with Microsoft".
    *   Email field.
2.  **Setup (First Time)**:
    *   "Create your Master Password".
    *   Warning: "We cannot recover this."
    *   Client generates Keys, encrypts empty vault, pushes to server.
3.  **App Unlock (Subsequent)**:
    *   User logs in (or session persists).
    *   Screen shows "Unlock your Vault".
    *   Input Master Password -> Decrypts -> Enters Dashboard.
4.  **Dashboard**:
    *   Sidebar: All Items, Favorites, Recent, Tags.
    *   Main List: Search bar (Client side filtering of decrypted data), List of accounts.
    *   Detail View: Slide-over or modal. Click-to-copy (with toast feedback).
5.  **Add/Edit**:
    *   Dynamic form. "Add Field" button.

## 6. Future Roadmap
- Browser Extension.
- Password Sharing (RSA Public/Private key exchange).
- Enterprise Teams (ACLs).
- Biometric Unlock (WebAuthn) to store Master Key in Secure Enclave.
