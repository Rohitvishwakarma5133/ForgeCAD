import mongoose from 'mongoose';

// User Model
const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Conversion Model
const conversionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  clerkId: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  originalFileSize: {
    type: Number,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing',
  },
  processingTime: {
    type: Number, // in seconds
  },
  results: {
    extractedText: String,
    validationResults: {
      totalTags: Number,
      validTags: Number,
      invalidTags: Number,
      missingTags: [String],
      suggestions: [String],
    },
    downloadUrl: String,
    previewUrl: String,
  },
  forgeData: {
    bucketKey: String,
    objectName: String,
    urn: String,
    derivative: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Add indexes for better performance
userSchema.index({ clerkId: 1 });
conversionSchema.index({ clerkId: 1, createdAt: -1 });
conversionSchema.index({ status: 1 });

// Export models
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Conversion = mongoose.models.Conversion || mongoose.model('Conversion', conversionSchema);

// Types for TypeScript
export interface IUser {
  _id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversion {
  _id: string;
  userId: string;
  clerkId: string;
  fileName: string;
  originalFileSize: number;
  fileType: string;
  status: 'processing' | 'completed' | 'failed';
  processingTime?: number;
  results?: {
    extractedText?: string;
    validationResults?: {
      totalTags: number;
      validTags: number;
      invalidTags: number;
      missingTags: string[];
      suggestions: string[];
    };
    downloadUrl?: string;
    previewUrl?: string;
  };
  forgeData?: {
    bucketKey?: string;
    objectName?: string;
    urn?: string;
    derivative?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}