import express from 'express';
import { auth } from '../middleware/auth';
import {
  createTake,
  getTakes,
  getTake,
  deleteTake,
  voteTake,
  getWeeklyLeaderboard
} from '../controllers/takeController';

const router = express.Router();

// Public routes
router.get('/', getTakes);
router.get('/leaderboard/weekly', getWeeklyLeaderboard);
router.get('/:id', getTake);

// Protected routes
router.post('/', auth, createTake);
router.delete('/:id', auth, deleteTake);
router.post('/:id/vote', auth, voteTake);

export default router; 