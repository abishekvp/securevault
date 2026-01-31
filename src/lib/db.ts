import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error(
        'Please define the MONGODB_URI environment variable inside .env.local'
    );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
    seeded?: boolean; // Track if we've seeded defaults
}

declare global {
    var mongoose: MongooseCache;
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null, seeded: false };
}

async function connectDB() {
    // If connected AND seeded, return immediately
    if (cached.conn && cached.seeded) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
        if (cached.conn && !cached.seeded) {
            console.log("Connected to MongoDB:", cached.conn.connection.name, "on", cached.conn.connection.host);
            // Ensure default configurations are seeded
            try {
                const { ensureDefaults } = await import('@/lib/settings');
                await ensureDefaults();
                cached.seeded = true;
                console.log("Seeding verified.");
            } catch (err) {
                console.error("Seeding failed:", err);
            }
        }
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default connectDB;
