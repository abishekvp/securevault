export interface CustomField {
    id: string;
    label: string;
    value: string;
    type: 'text' | 'password' | 'note';
}

export interface AccountUI {
    id: string;
    name: string; // Decrypted Title
    username: string;
    password?: string;
    url?: string;
    notes?: string;
    fields: CustomField[];
    createdAt: number;
    folderId?: string;
    favorite?: boolean;
    type?: 'login' | 'note' | 'card';
    trashDate?: number; // Timestamp
    totpSecret?: string;
    sharedBy?: string;
}

export interface FolderUI {
    _id: string;
    name: string;
    owner: string;
}
