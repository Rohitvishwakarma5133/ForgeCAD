import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for File Intake data
interface IFileIntake {
  originalName: string;
  fileSize: number;
  fileType: string;
  checksum: string;
  dwgVersion?: string;
  validationWarnings: string[];
}

// Interface for Global Timer
interface IGlobalTimer {
  startTime: number;
  currentStage: string;
  stageTimestamps: Map<string, number>;
}

// Interface for the ProcessingJob document
export interface IProcessingJob extends Document {
  conversionId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  filename: string;
  startTime: number;
  result?: any;
  error?: string;
  globalTimer?: IGlobalTimer;
  fileIntake?: IFileIntake;
  createdAt: Date;
  updatedAt: Date;
}

// File Intake Schema
const FileIntakeSchema = new Schema<IFileIntake>({
  originalName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileType: { type: String, required: true },
  checksum: { type: String, required: true },
  dwgVersion: { type: String },
  validationWarnings: [{ type: String }]
}, { _id: false });

// Global Timer Schema
const GlobalTimerSchema = new Schema<IGlobalTimer>({
  startTime: { type: Number, required: true },
  currentStage: { type: String, required: true },
  stageTimestamps: { 
    type: Map, 
    of: Number,
    default: new Map()
  }
}, { _id: false });

// Processing Job Schema
const ProcessingJobSchema = new Schema<IProcessingJob>({
  conversionId: { 
    type: String, 
    required: true, 
    unique: true
  },
  status: { 
    type: String, 
    enum: ['processing', 'completed', 'failed'], 
    required: true
  },
  progress: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  },
  message: { type: String, required: true },
  filename: { type: String, required: true },
  startTime: { type: Number, required: true },
  result: { type: Schema.Types.Mixed },
  error: { type: String },
  globalTimer: { type: GlobalTimerSchema },
  fileIntake: { type: FileIntakeSchema },
}, {
  timestamps: true,
  collection: 'processing_jobs'
});

// Indexes for performance
ProcessingJobSchema.index({ conversionId: 1 });
ProcessingJobSchema.index({ status: 1 });
ProcessingJobSchema.index({ createdAt: -1 });
ProcessingJobSchema.index({ startTime: -1 });

// Instance methods
ProcessingJobSchema.methods.toJSON = function() {
  const job = this.toObject();
  
  // Convert Map to regular object for JSON serialization
  if (job.globalTimer && job.globalTimer.stageTimestamps) {
    job.globalTimer.stageTimestamps = Object.fromEntries(job.globalTimer.stageTimestamps);
  }
  
  return job;
};

// Static methods
ProcessingJobSchema.statics.findByConversionId = function(conversionId: string) {
  return this.findOne({ conversionId });
};

ProcessingJobSchema.statics.findByStatus = function(status: 'processing' | 'completed' | 'failed') {
  return this.find({ status }).sort({ createdAt: -1 });
};

ProcessingJobSchema.statics.cleanupOldJobs = function(maxAgeHours: number = 24) {
  const cutoffTime = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000));
  return this.deleteMany({ 
    createdAt: { $lt: cutoffTime },
    status: { $in: ['completed', 'failed'] }
  });
};

ProcessingJobSchema.statics.getJobStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Pre-save middleware
ProcessingJobSchema.pre('save', function() {
  // Ensure stageTimestamps is a Map
  if (this.globalTimer && this.globalTimer.stageTimestamps && !(this.globalTimer.stageTimestamps instanceof Map)) {
    this.globalTimer.stageTimestamps = new Map(Object.entries(this.globalTimer.stageTimestamps));
  }
});

// Create and export the model
let ProcessingJob: Model<IProcessingJob>;

try {
  // Try to get existing model to avoid OverwriteModelError
  ProcessingJob = mongoose.model<IProcessingJob>('ProcessingJob');
} catch {
  // Create new model if it doesn't exist
  ProcessingJob = mongoose.model<IProcessingJob>('ProcessingJob', ProcessingJobSchema);
}

export { ProcessingJob };
export default ProcessingJob;