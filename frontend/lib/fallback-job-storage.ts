/**
 * Fallback job storage using in-memory Map
 * This is used when MongoDB is unavailable
 * NOTE: Data will be lost on server restart
 */

export interface ProcessingJobData {
  conversionId?: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
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

class FallbackJobStorage {
  private storage = new Map<string, ProcessingJobData>();

  /**
   * Set/Update a job in memory storage
   */
setJob(conversionId: string, job: Partial<ProcessingJobData>): Promise<void> {
    // Merge with existing job to support partial updates while preserving required fields
    const existing = this.storage.get(conversionId) ?? ({} as ProcessingJobData);
    const merged = { ...existing, ...job } as ProcessingJobData;
    this.storage.set(conversionId, merged);
    console.log(`💾 Job saved to memory storage: ${conversionId}`);
    return Promise.resolve();
  }

  /**
   * Get a job from memory storage
   */
  getJob(conversionId: string): Promise<ProcessingJobData | null> {
    const job = this.storage.get(conversionId);
    if (job) {
      console.log(`📖 Job loaded from memory storage: ${conversionId} - Status: ${job.status}`);
      return Promise.resolve(job);
    } else {
      console.log(`📂 Job not found in memory storage: ${conversionId}`);
      return Promise.resolve(null);
    }
  }

  /**
   * Get all job IDs from memory storage
   */
  getAllJobIds(): Promise<string[]> {
    const jobIds = Array.from(this.storage.keys());
    console.log(`📋 Retrieved ${jobIds.length} job IDs from memory storage`);
    return Promise.resolve(jobIds);
  }

  /**
   * Delete a job from memory storage
   */
  deleteJob(conversionId: string): Promise<void> {
    const deleted = this.storage.delete(conversionId);
    if (deleted) {
      console.log(`🗑️ Job deleted from memory storage: ${conversionId}`);
    } else {
      console.log(`📂 Job not found for deletion in memory storage: ${conversionId}`);
    }
    return Promise.resolve();
  }

  /**
   * Clean up old jobs from memory storage
   */
  cleanupOldJobs(maxAgeHours: number = 24): Promise<void> {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    let deletedCount = 0;
    
    for (const [conversionId, job] of this.storage.entries()) {
      if (job.startTime < cutoffTime && (job.status === 'completed' || job.status === 'failed')) {
        this.storage.delete(conversionId);
        deletedCount++;
      }
    }
    
    console.log(`🧹 Cleaned up ${deletedCount} old jobs from memory storage`);
    return Promise.resolve();
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: 'processing' | 'completed' | 'failed'): Promise<ProcessingJobData[]> {
    const jobs = Array.from(this.storage.values())
      .filter(job => job.status === status)
      .sort((a, b) => b.startTime - a.startTime);
    return Promise.resolve(jobs);
  }

  /**
   * Get job statistics
   */
  getJobStats(): Promise<{ status: string; count: number }[]> {
    const stats = new Map<string, number>();
    
    for (const job of this.storage.values()) {
      stats.set(job.status, (stats.get(job.status) || 0) + 1);
    }
    
    const result = Array.from(stats.entries()).map(([status, count]) => ({ status, count }));
    return Promise.resolve(result);
  }

  /**
   * Check if memory storage is healthy (always true for memory)
   */
  isHealthy(): Promise<boolean> {
    return Promise.resolve(true);
  }
}

// Export singleton instance
export const fallbackJobStorage = new FallbackJobStorage();

// Also export the class
export { FallbackJobStorage };