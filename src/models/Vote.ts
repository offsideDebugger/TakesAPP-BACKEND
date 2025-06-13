import mongoose, { Document, Schema } from 'mongoose';

export interface IVote extends Document {
  userId: mongoose.Types.ObjectId;
  takeId: mongoose.Types.ObjectId;
  voteType: 'like' | 'dislike';
  createdAt: Date;
}

const voteSchema = new Schema<IVote>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  takeId: {
    type: Schema.Types.ObjectId,
    ref: 'Take',
    required: true
  },
  voteType: {
    type: String,
    enum: ['like', 'dislike'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one vote per user per take
voteSchema.index({ userId: 1, takeId: 1 }, { unique: true });

export const Vote = mongoose.model<IVote>('Vote', voteSchema); 