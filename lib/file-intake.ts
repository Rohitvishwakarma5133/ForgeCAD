import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface FileIntakeResult {
  conversionId: string;
  filename: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  extension: string;
  checksum: string;
  dwgVersion?: string;
  isValidDWG: boolean;
  validationWarnings: string[];
  uploadTime: number;
  filePath: string;
  globalTimer: {
    startTime: number;
    stage: string;
  };
}

export interface FileValidationOptions {
  allowedExtensions: string[];
  maxFileSize?: number; // in bytes
  requireDWGR2013Plus?: boolean;
}

export class FileIntakeService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async processFileIntake(
    fileBuffer: Buffer,
    originalFilename: string,
    options: FileValidationOptions
  ): Promise<FileIntakeResult> {
    console.log('🔧 Starting file intake layer processing...');
    
    // Start global timer
    const globalStartTime = Date.now();
    const conversionId = `conversion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Extract file information
    const extension = path.extname(originalFilename).toLowerCase();
    const fileSize = fileBuffer.length;
    const uploadTime = Date.now();
    
    console.log(`📥 Processing file: ${originalFilename} (${fileSize} bytes)`);
    
    // Validate file type
    if (!options.allowedExtensions.includes(extension)) {
      throw new Error(`Unsupported file type: ${extension}. Supported types: ${options.allowedExtensions.join(', ')}`);
    }
    
    // Validate file size
    if (options.maxFileSize && fileSize > options.maxFileSize) {
      throw new Error(`File size ${fileSize} bytes exceeds maximum allowed size of ${options.maxFileSize} bytes`);
    }
    
    // Generate checksum for integrity verification
    console.log('🔐 Computing file checksum...');
    const checksum = this.computeChecksum(fileBuffer);
    
    // DWG-specific validation
    let dwgVersion: string | undefined;
    let isValidDWG = true;
    const validationWarnings: string[] = [];
    
    if (extension === '.dwg') {
      console.log('🔍 Performing DWG validation...');
      const dwgValidation = await this.validateDWGFile(fileBuffer);
      dwgVersion = dwgValidation.version;
      isValidDWG = dwgValidation.isValid;
      validationWarnings.push(...dwgValidation.warnings);
      
      if (options.requireDWGR2013Plus && !dwgValidation.isR2013Plus) {
        validationWarnings.push('DWG version is older than R2013 - may have compatibility issues');
      }
    }
    
    // Save file with unique name
    const filename = `${conversionId}_${originalFilename}`;
    const filePath = path.join(this.uploadDir, filename);
    
    console.log(`💾 Saving file to: ${filePath}`);
    fs.writeFileSync(filePath, fileBuffer);
    
    // Store file metadata
    await this.storeFileMetadata(conversionId, {
      originalName: originalFilename,
      filename,
      fileSize,
      extension,
      checksum,
      dwgVersion,
      uploadTime,
      filePath
    });
    
    const result: FileIntakeResult = {
      conversionId,
      filename,
      originalName: originalFilename,
      fileSize,
      fileType: this.determineFileType(extension),
      extension,
      checksum,
      dwgVersion,
      isValidDWG,
      validationWarnings,
      uploadTime,
      filePath,
      globalTimer: {
        startTime: globalStartTime,
        stage: 'File Intake Complete'
      }
    };
    
    console.log(`✅ File intake completed for ${originalFilename}`);
    console.log(`📊 Checksum: ${checksum}`);
    console.log(`🔢 DWG Version: ${dwgVersion || 'N/A'}`);
    console.log(`⚠️  Warnings: ${validationWarnings.length}`);
    
    return result;
  }

  private computeChecksum(buffer: Buffer): string {
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
  }

  private async validateDWGFile(buffer: Buffer): Promise<{
    version: string;
    isValid: boolean;
    isR2013Plus: boolean;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    
    // Check minimum file size (DWG files are typically > 1KB)
    if (buffer.length < 1024) {
      warnings.push('File size is unusually small for a DWG file');
    }
    
    // Check DWG file signature and extract version
    const dwgHeader = buffer.subarray(0, 128);
    const signature = dwgHeader.subarray(0, 6).toString('ascii');
    
    if (signature !== 'AC1027' && signature !== 'AC1024' && signature !== 'AC1021' && 
        signature !== 'AC1018' && signature !== 'AC1015' && signature !== 'AC1014' &&
        signature !== 'AC1012' && signature !== 'AC1009' && signature !== 'AC1006') {
      return {
        version: 'Unknown',
        isValid: false,
        isR2013Plus: false,
        warnings: ['Invalid DWG file - missing or corrupt header signature']
      };
    }
    
    // Map DWG version codes to readable versions
    const versionMap: Record<string, { name: string; isR2013Plus: boolean }> = {
      'AC1027': { name: 'R2013 (AC1027)', isR2013Plus: true },
      'AC1024': { name: 'R2010 (AC1024)', isR2013Plus: false },
      'AC1021': { name: 'R2007 (AC1021)', isR2013Plus: false },
      'AC1018': { name: 'R2004 (AC1018)', isR2013Plus: false },
      'AC1015': { name: 'R2000 (AC1015)', isR2013Plus: false },
      'AC1014': { name: 'R14 (AC1014)', isR2013Plus: false },
      'AC1012': { name: 'R13 (AC1012)', isR2013Plus: false },
      'AC1009': { name: 'R12 (AC1009)', isR2013Plus: false },
      'AC1006': { name: 'R10 (AC1006)', isR2013Plus: false }
    };
    
    const versionInfo = versionMap[signature] || { name: `Unknown (${signature})`, isR2013Plus: false };
    
    if (!versionInfo.isR2013Plus) {
      warnings.push(`DWG version ${versionInfo.name} is older than R2013 - consider upgrading for better compatibility`);
    }
    
    // Additional DWG integrity checks
    try {
      // Check for valid DWG structure markers
      const hasValidStructure = this.validateDWGStructure(dwgHeader);
      if (!hasValidStructure) {
        warnings.push('DWG file structure may be corrupted - some entities might not be readable');
      }
    } catch (error) {
      warnings.push('Could not fully validate DWG file structure');
    }
    
    return {
      version: versionInfo.name,
      isValid: true,
      isR2013Plus: versionInfo.isR2013Plus,
      warnings
    };
  }

  private validateDWGStructure(header: Buffer): boolean {
    // Basic DWG structure validation
    // Check for presence of key DWG sections
    try {
      // Look for common DWG markers in header
      const headerString = header.toString('hex');
      
      // These are common patterns in valid DWG files
      const validPatterns = [
        '1f25', // Common DWG marker
        '0d0a', // Line ending markers
        '1a04'  // Section markers
      ];
      
      return validPatterns.some(pattern => headerString.includes(pattern));
    } catch (error) {
      return false;
    }
  }

  private determineFileType(extension: string): string {
    const typeMap: Record<string, string> = {
      '.dwg': 'AutoCAD Drawing',
      '.dxf': 'Drawing Exchange Format',
      '.pdf': 'Portable Document Format',
      '.dwt': 'AutoCAD Template',
      '.dws': 'AutoCAD Standards'
    };
    
    return typeMap[extension] || 'Unknown';
  }

  private async storeFileMetadata(conversionId: string, metadata: any): Promise<void> {
    const metadataDir = path.join(process.cwd(), 'uploads', 'metadata');
    if (!fs.existsSync(metadataDir)) {
      fs.mkdirSync(metadataDir, { recursive: true });
    }
    
    const metadataPath = path.join(metadataDir, `${conversionId}_metadata.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  }

  async getFileMetadata(conversionId: string): Promise<any | null> {
    try {
      const metadataPath = path.join(process.cwd(), 'uploads', 'metadata', `${conversionId}_metadata.json`);
      if (fs.existsSync(metadataPath)) {
        const content = fs.readFileSync(metadataPath, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Error reading file metadata:', error);
    }
    return null;
  }

  // Global timer utilities
  static calculateElapsedTime(startTime: number): number {
    return Math.round((Date.now() - startTime) / 1000);
  }

  static formatElapsedTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const remainingMinutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${remainingMinutes}m`;
    }
  }

  // Cleanup utilities
  async cleanupTempFiles(conversionId: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadDir, `${conversionId}_*`);
      const metadataPath = path.join(this.uploadDir, 'metadata', `${conversionId}_metadata.json`);
      
      // Note: In a real implementation, you'd use glob or similar for pattern matching
      // For now, we'll clean up known file patterns
      
      if (fs.existsSync(metadataPath)) {
        fs.unlinkSync(metadataPath);
        console.log(`🧹 Cleaned up metadata for ${conversionId}`);
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }

  // File integrity verification
  async verifyFileIntegrity(filePath: string, expectedChecksum: string): Promise<boolean> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const actualChecksum = this.computeChecksum(fileBuffer);
      return actualChecksum === expectedChecksum;
    } catch (error) {
      console.error('Error verifying file integrity:', error);
      return false;
    }
  }
}