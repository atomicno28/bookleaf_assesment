import { Router } from 'express';
import Book from '../models/Book.js';
import { requireRole } from '../middleware/auth.js';
const router = Router();
router.get('/', async (req,res,next) => {
  try {
    const filter = req.user.role === 'admin' && req.query.authorId ? { author:req.query.authorId } : req.user.role === 'admin' ? {} : { author:req.user._id };
    const books = await Book.find(filter).populate('author','name email').sort({ createdAt: -1 });
    res.json({ books });
  } catch(e) { next(e); }
});
export default router;
