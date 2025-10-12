import { NextResponse } from 'next/server';
import { checkMongoDBConnection } from '@/lib/mongodb';
import { mongoJobStorage } from '@/lib/mongodb-job-storage';
import { testMongoConnection } from '@/lib/simple-mongodb';

export async function GET() {
  try {
    // Test simple MongoDB connection first
    const simpleTest = await testMongoConnection();
    
    // Check MongoDB connection
    const connectionStatus = await checkMongoDBConnection();
    
    // Check if storage service is healthy
    let storageHealthy = false;
    try {
      storageHealthy = await mongoJobStorage.isHealthy();
    } catch (error) {
      console.error('Storage health check failed:', error);
    }
    
    // Get job statistics
    const jobStats = await mongoJobStorage.getJobStats();
    const totalJobs = await mongoJobStorage.getAllJobIds();
    
    return NextResponse.json({
      status: simpleTest.connected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      database: {
        simpleConnection: simpleTest,
        connection: connectionStatus,
        storage: {
          healthy: storageHealthy,
          jobStats,
          totalJobs: totalJobs.length,
          recentJobIds: totalJobs.slice(0, 5) // Show first 5 job IDs
        }
      },
      migration: {
        status: 'MongoDB storage active',
        fileBasedStorage: 'deprecated'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Health check failed',
        details: (error as Error).message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}