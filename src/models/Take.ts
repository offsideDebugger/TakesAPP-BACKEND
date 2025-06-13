import mongoose, { Document, Schema } from 'mongoose';

export interface ITake extends Document {
  userId: mongoose.Types.ObjectId;
  content: string;
  likesCount: number;
  dislikesCount: number;
  netScore: number;
  createdAt: Date;
}

const takeSchema = new Schema<ITake>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 280
  },
  likesCount: {
    type: Number,
    default: 0
  },
  dislikesCount: {
    type: Number,
    default: 0
  },
  netScore: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
takeSchema.index({ createdAt: -1 });
takeSchema.index({ netScore: -1 });

export const Take = mongoose.model<ITake>('Take', takeSchema); 