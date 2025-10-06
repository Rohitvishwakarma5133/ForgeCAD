import { MongoClient, MongoClientOptions } from 'mongodb';
import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Mongoose connection utility
let isConnected = false;

export const connectToMongoDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(uri, {
      bufferCommands: false,
    });
    isConnected = true;
    console.log('✅ Connected to MongoDB via Mongoose');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

export const disconnectFromMongoDB = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ MongoDB disconnection error:', error);
    throw error;
  }
};

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

// MongoDB database name
export const DB_NAME = 'cadly';

// Collection names
export const COLLECTIONS = {
  JOBS: 'processing_jobs',
  USERS: 'users',
  SESSIONS: 'sessions',
} as const;

// Utility function to get database instance
export const getDatabase = async () => {
  const client = await clientPromise;
  return client.db(DB_NAME);
};

// Health check function
export const checkMongoDBConnection = async () => {
  try {
    const client = await clientPromise;
    await client.db(DB_NAME).admin().ping();
    return { status: 'connected', timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: 'error', 
      error: (error as Error).message, 
      timestamp: new Date().toISOString() 
    };
  }
};