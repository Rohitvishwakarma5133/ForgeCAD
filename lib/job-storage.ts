import * as fs from 'fs';
import * as path from 'path';

export interface ProcessingJob {
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  filename: string;
  startTime: number;
  result?: any;
  error?: string;
}

class JobStorage {
  private jobsDir: string;

  constructor() {
    this.jobsDir = path.join(process.cwd(), 'job-storage');
    this.ensureJobsDirectory();
  }

  private ensureJobsDirectory() {
    if (!fs.existsSync(this.jobsDir)) {
      fs.mkdirSync(this.jobsDir, { recursive: true });
    }
  }

  private getJobFilePath(conversionId: string): string {
    return path.join(this.jobsDir, `${conversionId}.json`);
  }

  setJob(conversionId: string, job: ProcessingJob): void {
    try {
      const jobFilePath = this.getJobFilePath(conversionId);
      fs.writeFileSync(jobFilePath, JSON.stringify(job, null, 2));
      console.log(`💾 Job saved to file: ${conversionId}`);
    } catch (error) {
      console.error('Error saving job:', error);
    }
  }

  getJob(conversionId: string): ProcessingJob | null {
    try {
      const jobFilePath = this.getJobFilePath(conversionId);
      if (!fs.existsSync(jobFilePath)) {
        console.log(`📂 Job file not found: ${conversionId}`);
        return null;
      }
      const jobData = fs.readFileSync(jobFilePath, 'utf-8');
      const job = JSON.parse(jobData) as ProcessingJob;
      console.log(`📖 Job loaded from file: ${conversionId} - Status: ${job.status}`);
      return job;
    } catch (error) {
      console.error('Error loading job:', error);
      return null;
    }
  }

  getAllJobIds(): string[] {
    try {
      if (!fs.existsSync(this.jobsDir)) {
        return [];
      }
      const files = fs.readdirSync(this.jobsDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      console.error('Error getting job IDs:', error);
      return [];
    }
  }

  deleteJob(conversionId: string): void {
    try {
      const jobFilePath = this.getJobFilePath(conversionId);
      if (fs.existsSync(jobFilePath)) {
        fs.unlinkSync(jobFilePath);
        console.log(`🗑️ Job deleted: ${conversionId}`);
      }
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  }

  cleanupOldJobs(maxAgeHours: number = 24): void {
    try {
      const files = fs.readdirSync(this.jobsDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert hours to milliseconds

      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const filePath = path.join(this.jobsDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtime.getTime();
        
        if (age > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`🧹 Cleaned up old job: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old jobs:', error);
    }
  }
}

// Export singleton instance
export const jobStorage = new JobStorage();