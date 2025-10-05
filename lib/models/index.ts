import mongoose from 'mongoose';

// User Model with session tracking
const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true,
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
  profileImageUrl: {
    type: String,
  },
  // Login tracking
  lastLoginAt: {
    type: Date,
  },
  loginCount: {
    type: Number,
    default: 0,
  },
  // Subscription info
  subscriptionTier: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free',
  },
  // Usage tracking
  totalConversions: {
    type: Number,
    default: 0,
  },
  monthlyConversions: {
    type: Number,
    default: 0,
  },
  lastResetDate: {
    type: Date,
    default: Date.now,
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

// Session Model for login tracking
const sessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  clerkId: {
    type: String,
    required: true,
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  device: {
    type: String,
  },
  browser: {
    type: String,
  },
  location: {
    country: String,
    city: String,
  },
  loginAt: {
    type: Date,
    default: Date.now,
  },
  logoutAt: {
    type: Date,
  },
  duration: {
    type: Number, // in minutes
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastActivity: {
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
// clerkId indexes are handled by schema definition with index: true
userSchema.index({ email: 1 });
userSchema.index({ lastLoginAt: -1 });
conversionSchema.index({ clerkId: 1, createdAt: -1 });
conversionSchema.index({ status: 1 });
sessionSchema.index({ clerkId: 1, loginAt: -1 });
// sessionId index is handled by schema definition with index: true
sessionSchema.index({ isActive: 1, lastActivity: -1 });

// Export models
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Conversion = mongoose.models.Conversion || mongoose.model('Conversion', conversionSchema);
export const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);

// Types for TypeScript
export interface IUser {
  _id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  lastLoginAt?: Date;
  loginCount: number;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  totalConversions: number;
  monthlyConversions: number;
  lastResetDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISession {
  _id: string;
  userId: string;
  clerkId: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  browser?: string;
  location?: {
    country?: string;
    city?: string;
  };
  loginAt: Date;
  logoutAt?: Date;
  duration?: number;
  isActive: boolean;
  lastActivity: Date;
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