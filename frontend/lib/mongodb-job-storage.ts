import { connectToMongoDB } from './mongodb';
import ProcessingJob, { IProcessingJob } from './models/ProcessingJob';

export interface ProcessingJobData {
  // Optional conversionId to allow callers to include it in updates; the method also receives it separately
  conversionId?: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  // Make filename optional to support partial progress updates that don't carry filename
  filename?: string;
  startTime: number;
  result?: any;
  error?: string;
  globalTimer?: {
    startTime: number;
    currentStage: string;
    stageTimestamps: Record<string, number>;
  };
  fileIntake?: {
    originalName: string;
    fileSize: number;
    fileType: string;
    checksum: string;
    dwgVersion?: string;
    validationWarnings: string[];
  };
}

class MongoDBJobStorage {
  
  /**
   * Ensure MongoDB connection before operations
   */
  private async ensureConnection(): Promise<void> {
    try {
      await connectToMongoDB();
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw new Error('Database connection failed');
    }
  }

  /**
   * Set/Update a job in MongoDB
   */
async setJob(conversionId: string, job: Partial<ProcessingJobData>): Promise<void> {
    try {
      await this.ensureConnection();
      
      const existingJob = await ProcessingJob.findOne({ conversionId });
      
      if (existingJob) {
        // Update existing job
        Object.assign(existingJob, job);
        await existingJob.save();
        console.log(`💾 Job updated in MongoDB: ${conversionId}`);
      } else {
        // Create new job
        const newJob = new ProcessingJob({
          conversionId,
          ...job
        });
        await newJob.save();
        console.log(`💾 Job created in MongoDB: ${conversionId}`);
      }
    } catch (error) {
      console.error('❌ Error saving job to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Get a job from MongoDB
   */
  async getJob(conversionId: string): Promise<ProcessingJobData | null> {
    try {
      await this.ensureConnection();
      
      const job = await ProcessingJob.findOne({ conversionId });
      
      if (!job) {
        console.log(`📂 Job not found in MongoDB: ${conversionId}`);
        return null;
      }

      const jobData: ProcessingJobData = {
        status: job.status,
        progress: job.progress,
        message: job.message,
        filename: job.filename,
        startTime: job.startTime,
        result: job.result,
        error: job.error,
        globalTimer: job.globalTimer ? {
          startTime: job.globalTimer.startTime,
          currentStage: job.globalTimer.currentStage,
          stageTimestamps: job.globalTimer.stageTimestamps instanceof Map 
            ? Object.fromEntries(job.globalTimer.stageTimestamps)
            : job.globalTimer.stageTimestamps
        } : undefined,
        fileIntake: job.fileIntake
      };

      console.log(`📖 Job loaded from MongoDB: ${conversionId} - Status: ${job.status}`);
      return jobData;
    } catch (error) {
      console.error('❌ Error loading job from MongoDB:', error);
      return null;
    }
  }

  /**
   * Get all job IDs from MongoDB
   */
  async getAllJobIds(): Promise<string[]> {
    try {
      await this.ensureConnection();
      
      const jobs = await ProcessingJob.find({}, { conversionId: 1 }).sort({ createdAt: -1 });
      const jobIds = jobs.map(job => job.conversionId);
      
      console.log(`📋 Retrieved ${jobIds.length} job IDs from MongoDB`);
      return jobIds;
    } catch (error) {
      console.error('❌ Error getting job IDs from MongoDB:', error);
      return [];
    }
  }

  /**
   * Delete a job from MongoDB
   */
  async deleteJob(conversionId: string): Promise<void> {
    try {
      await this.ensureConnection();
      
      const result = await ProcessingJob.deleteOne({ conversionId });
      
      if (result.deletedCount > 0) {
        console.log(`🗑️ Job deleted from MongoDB: ${conversionId}`);
      } else {
        console.log(`📂 Job not found for deletion: ${conversionId}`);
      }
    } catch (error) {
      console.error('❌ Error deleting job from MongoDB:', error);
      throw error;
    }
  }

  /**
   * Clean up old jobs from MongoDB
   */
  async cleanupOldJobs(maxAgeHours: number = 24): Promise<void> {
    try {
      await this.ensureConnection();
      
      const cutoffTime = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000));
      const result = await ProcessingJob.deleteMany({
        createdAt: { $lt: cutoffTime },
        status: { $in: ['completed', 'failed'] }
      });
      
      console.log(`🧹 Cleaned up ${result.deletedCount} old jobs from MongoDB`);
    } catch (error) {
      console.error('❌ Error cleaning up old jobs from MongoDB:', error);
      throw error;
    }
  }

  /**
   * Get jobs by status
   */
  async getJobsByStatus(status: 'processing' | 'completed' | 'failed'): Promise<ProcessingJobData[]> {
    try {
      await this.ensureConnection();
      
      const jobs = await ProcessingJob.find({ status }).sort({ createdAt: -1 });
      return jobs.map(job => ({
        status: job.status,
        progress: job.progress,
        message: job.message,
        filename: job.filename,
        startTime: job.startTime,
        result: job.result,
        error: job.error,
        globalTimer: job.globalTimer ? {
          startTime: job.globalTimer.startTime,
          currentStage: job.globalTimer.currentStage,
          stageTimestamps: job.globalTimer.stageTimestamps instanceof Map 
            ? Object.fromEntries(job.globalTimer.stageTimestamps)
            : job.globalTimer.stageTimestamps
        } : undefined,
        fileIntake: job.fileIntake
      }));
    } catch (error) {
      console.error('❌ Error getting jobs by status from MongoDB:', error);
      return [];
    }
  }

  /**
   * Get job statistics
   */
  async getJobStats(): Promise<{ status: string; count: number }[]> {
    try {
      await this.ensureConnection();
      
      const stats = await ProcessingJob.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            status: '$_id',
            count: 1,
            _id: 0
          }
        }
      ]);
      
      return stats;
    } catch (error) {
      console.error('❌ Error getting job stats from MongoDB:', error);
      return [];
    }
  }

  /**
   * Check if MongoDB connection is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.ensureConnection();
      // Try to perform a simple operation
      await ProcessingJob.findOne().limit(1);
      return true;
    } catch (error) {
      console.error('❌ MongoDB health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance for backward compatibility with existing code
export const mongoJobStorage = new MongoDBJobStorage();

// Also export the class for direct instantiation if needed
export { MongoDBJobStorage };