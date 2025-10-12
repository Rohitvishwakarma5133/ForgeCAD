import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

let client: MongoClient | null = null;

export async function testMongoConnection(): Promise<{ connected: boolean; error?: string }> {
  if (!uri) {
    return { connected: false, error: 'MongoDB URI not set' };
  }

  try {
    // Simple connection without complex SSL options
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    
    await client.connect();
    await client.db().admin().ping();
    
    return { connected: true };
  } catch (error) {
    console.error('MongoDB connection test failed:', error);
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  } finally {
    if (client) {
      await client.close();
    }
  }
}