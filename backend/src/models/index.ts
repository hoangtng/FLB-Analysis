import mongoose, { Document, Schema } from 'mongoose';

// Shape of data that will store to database
// A structure of an delay event
export interface IDelay extends Document {
    uploadId: mongoose.Types.ObjectId;
    date: string;
    month: string;
    flight: string;
    origin: string;
    hour: number | null;
    code: string;
    minutes: number;
    reasonText: string;
    shortDesc: string;
    longDesc: string;
    cat: string;
    chargeable: string;
}

const DelaySchema = new Schema<IDelay> ({
    // Every upload has unique ID like a foreign key
    uploadId:   { type: Schema.Types.ObjectId, ref: 'Upload', require: true },
    date:       { type: String, index: true },
    month:      { type: String, index: true },
    flight:     String,
    origin:     String,
    hour:       Number,
    code:       { type: String, index: true},
    minutes:    Number,
    reasonText: String,
    shortDesc:  String,
    longDesc:   String,
    cat:        { type: String, index: true},
    chargeable: String,
});

export const Delay = mongoose.model<IDelay>('Delay', DelaySchema);

// Upload information
// A structure of data of an upload event

export interface IUpload extends Document {
    filename: string;
    originalName: string;
    uploadedAt: Date;
    recordCount: number;
    dateRange: {from: string; to: string };
    status: 'processing' | 'complete' | 'error';
    errorMessage?: string;

}

const UploadSchema = new Schema<IUpload> ({
    filename:       String,
    originalName:   {type: String, required: true},
    uploadedAt:     {type: Date, default: Date.now},
    recordCount:    {type: Number, default: 0},
    dateRange:      {from: String, to: String},
    status:         {type: String, enum: ['processing','complete','error'], default: 'processing'},
    errorMessage:   String,
});

export const Upload = mongoose.model<IUpload>('Upload', UploadSchema);


// Alert information
// A structure of data of an alert event
export interface IAlert extends Document {
  team: string;
  message: string;
  codes: string[];
  sentAt: Date;
}

const AlertSchema = new Schema<IAlert>({
  team:    { type: String, required: true },
  message: { type: String, required: true },
  codes:   [String],
  sentAt:  { type: Date, default: Date.now },
});

export const Alert = mongoose.model<IAlert>('Alert', AlertSchema);

// AI Summary information

export interface IAISummary extends Document {
    uploadId: mongoose.Types.ObjectId;
    type: 'trend' | 'code' | 'anomaly' | 'daily';
    scope: string;
    content: string;
    generatedAt: Date;
    tokensUsed: number;
}

const AISummarySchema = new Schema<IAISummary>({
    uploadId: { type: Schema.Types.ObjectId, ref: 'Upload', require: true },
    type: { type: String, enum: ['trend', 'code', 'anomaly', 'daily'], default: 'trend', required: true},
    scope: { type: String, required: true },
    content: { type: String, required: true },
    generatedAt: { type: Date, default: Date.now },
    tokensUsed: { type: Number, default: 0},
});

AISummarySchema.index({ type: 1, scope: 1 });

export const AISummary = mongoose.model<IAISummary>('AISummary', AISummarySchema);
