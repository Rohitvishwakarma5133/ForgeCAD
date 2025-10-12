import mongoose from 'mongoose';

const OcrChunkSchema = new mongoose.Schema(
  {
    engine: String, // vision|tesseract|trocr|mathpix|yolo
    text: String,
    meta: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const ReportSchema = new mongoose.Schema(
  {
    jobId: { type: String, index: true },
    filename: String,
    status: { type: String, enum: ['pending', 'processing', 'done', 'error'], default: 'pending' },
    error: String,
    ocr: [OcrChunkSchema],
    aiModel: String,
    aiJson: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);
