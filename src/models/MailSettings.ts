import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMailSettings extends Document {
    host: string;
    port: number;
    user: string;
    pass: string;
    secure: boolean;
    from: string;
    updatedAt: Date;
}

const MailSettingsSchema: Schema = new Schema(
    {
        host: { type: String, required: true },
        port: { type: Number, required: true },
        user: { type: String, required: true },
        pass: { type: String, required: true },
        secure: { type: Boolean, default: false },
        from: { type: String, default: '' },
    },
    { timestamps: true }
);

const MailSettings: Model<IMailSettings> = mongoose.models.MailSettings || mongoose.model<IMailSettings>('MailSettings', MailSettingsSchema);

export default MailSettings;
