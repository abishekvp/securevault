# Secure Password Vault

A minimalist, zero-knowledge password vault application built with Next.js 14, MongoDB, and Web Crypto API.

## Features

*   **Zero-Knowledge Encryption**: Your data is encrypted on your device before it reaches the server. We cannot see your passwords.
*   **Minimalist Design**: Clean, distraction-free interface inspired by modern design principles.
*   **Secure Authentication**: Support for Google, Microsoft, and Email/Password login.
*   **Client-Side Cryptography**: AES-256-GCM encryption and PBKDF2 key derivation.
*   **Password Generator**: Built-in tool to generate strong, unique passwords.
*   **Custom Fields**: Add flexible data like PINs or security questions to your accounts.

## Tech Stack

*   **Frontend**: Next.js 14 (App Router), TypeScript, Vanilla CSS/CSS Modules.
*   **Backend**: Next.js API Routes.
*   **Database**: MongoDB (via Mongoose).
*   **Auth**: NextAuth.js v5.

## Getting Started

1.  **Clone the repository**.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Setup**:
    Create a `.env.local` file with the following:
    ```env
    MONGODB_URI=your_mongodb_connection_string
    NEXTAUTH_SECRET=your_random_secret
    NEXTAUTH_URL=http://localhost:3000
    
    # Optional: OAuth Providers
    GOOGLE_CLIENT_ID=...
    GOOGLE_CLIENT_SECRET=...
    MICROSOFT_CLIENT_ID=...
    MICROSOFT_CLIENT_SECRET=...
    ```
4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
5.  **Open Browser**:
    Navigate to `http://localhost:3000`.

## Security Architecture

1.  **Master Password**: Your master password is never sent to the server. It is hashed locally to derive your unique Encryption Key.
2.  **Vault Key**: A random AES key is generated for your vault. This key is encrypted with your Master Key.
3.  **Data Encryption**: Your vault data is encrypted with the Vault Key.
4.  **Sync**: Only the *encrypted* Vault Key and *encrypted* Vault Data are stored on the server.

## License

MIT
