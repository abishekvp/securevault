import mongoose from 'mongoose';

const SystemNotificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'warning', 'alert'], default: 'info' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.SystemNotification || mongoose.model('SystemNotification', SystemNotificationSchema);
