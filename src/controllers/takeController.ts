import { Request, Response } from 'express';
import { Take } from '../models/Take';
import { Vote } from '../models/Vote';
import { z } from 'zod';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
  user?: any;
}

// Validation schemas
const createTakeSchema = z.object({
  content: z.string().min(1).max(280)
});

const voteSchema = z.object({
  voteType: z.enum(['like', 'dislike'])
});

// Create a new take
export const createTake = async (req: AuthRequest, res: Response) => {
  try {
    const { content } = createTakeSchema.parse(req.body);
    const take = new Take({
      userId: req.user._id,
      content
    });
    await take.save();
    res.status(201).json(take);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    res.status(500).json({ message: 'Error creating take' });
  }
};

// Get all takes with pagination
export const getTakes = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sort = (req.query.sort as string) || 'createdAt';

    const takes = await Take.find()
      .sort({ [sort]: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'username');

    const total = await Take.countDocuments();

    res.json({
      takes,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTakes: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching takes' });
  }
};

// Get a single take
export const getTake = async (req: Request, res: Response) => {
  try {
    const take = await Take.findById(req.params.id).populate('userId', 'username');
    if (!take) {
      return res.status(404).json({ message: 'Take not found' });
    }
    res.json(take);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching take' });
  }
};

// Delete a take
export const deleteTake = async (req: AuthRequest, res: Response) => {
  try {
    const take = await Take.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!take) {
      return res.status(404).json({ message: 'Take not found or unauthorized' });
    }

    await take.deleteOne();
    res.json({ message: 'Take deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting take' });
  }
};

// Vote on a take
export const voteTake = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { voteType } = voteSchema.parse(req.body);
    const takeId = req.params.id;

    // Check if take exists
    const take = await Take.findById(takeId);
    if (!take) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Take not found' });
    }

    // Check if user has already voted
    const existingVote = await Vote.findOne({
      userId: req.user._id,
      takeId
    });

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Remove vote if same type
        await Vote.deleteOne({ _id: existingVote._id });
        if (voteType === 'like') {
          take.likesCount--;
        } else {
          take.dislikesCount--;
        }
      } else {
        // Change vote type
        existingVote.voteType = voteType;
        await existingVote.save();
        if (voteType === 'like') {
          take.likesCount++;
          take.dislikesCount--;
        } else {
          take.likesCount--;
          take.dislikesCount++;
        }
      }
    } else {
      // Create new vote
      await Vote.create([{
        userId: req.user._id,
        takeId,
        voteType
      }], { session });

      if (voteType === 'like') {
        take.likesCount++;
      } else {
        take.dislikesCount++;
      }
    }

    take.netScore = take.likesCount - take.dislikesCount;
    await take.save({ session });

    await session.commitTransaction();
    res.json(take);
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    res.status(500).json({ message: 'Error voting on take' });
  } finally {
    session.endSession();
  }
};

// Get weekly leaderboard
export const getWeeklyLeaderboard = async (req: Request, res: Response) => {
  try {
    const lastMonday = new Date();
    lastMonday.setDate(lastMonday.getDate() - (lastMonday.getDay() + 6) % 7);
    lastMonday.setHours(0, 0, 0, 0);

    const takes = await Take.find({
      createdAt: { $gte: lastMonday }
    })
      .sort({ netScore: -1 })
      .limit(10)
      .populate('userId', 'username');

    res.json(takes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
}; 