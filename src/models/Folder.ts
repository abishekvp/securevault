import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFolder extends Document {
    owner: mongoose.Types.ObjectId;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

const FolderSchema: Schema = new Schema(
    {
        owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true, trim: true },
    },
    {
        timestamps: true,
        collection: 'folders'
    }
);

// Ensure unique folder names per user
FolderSchema.index({ owner: 1, name: 1 }, { unique: true });

const Folder: Model<IFolder> = mongoose.models.Folder || mongoose.model<IFolder>('Folder', FolderSchema);

export default Folder;
