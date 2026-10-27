import { Router } from 'express';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import Book from '../models/Book.js';
const router = Router();
router.get('/summary', async (_req,res,next) => {
  try {
    const [total, open, progress, critical, authors, books] = await Promise.all([
      Ticket.countDocuments(), Ticket.countDocuments({status:'Open'}), Ticket.countDocuments({status:'In Progress'}),
      Ticket.countDocuments({priority:'Critical',status:{$nin:['Resolved','Closed']}}), User.countDocuments({role:'author'}), Book.countDocuments()
    ]);
    res.json({ summary:{ total, open, progress, critical, authors, books } });
  } catch(e) { next(e); }
});
export default router;
