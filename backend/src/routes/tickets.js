import { Router } from 'express';
import { z } from 'zod';
import Ticket from '../models/Ticket.js';
import Book from '../models/Book.js';
import { requireRole } from '../middleware/auth.js';
import { draftTicket } from '../services/ai.js';
const router = Router();
const categories = ['Royalty & Payments','ISBN & Metadata Issues','Printing & Quality','Distribution & Availability','Book Status & Production Updates','General Inquiry'];
const priorities = ['Critical','High','Medium','Low'];
const statuses = ['Open','In Progress','Resolved','Closed'];
router.get('/', async (req,res,next) => {
  try {
    const filter = {};
    if (req.user.role !== 'admin') filter.author = req.user._id;
    else {
      if (req.query.status && statuses.includes(req.query.status)) filter.status = req.query.status;
      if (req.query.category && categories.includes(req.query.category)) filter.category = req.query.category;
      if (req.query.priority && priorities.includes(req.query.priority)) filter.priority = req.query.priority;
      if (req.query.q) filter.$or = [{ subject: { $regex: req.query.q, $options:'i' } }, { description: { $regex: req.query.q, $options:'i' } }, { bookTitle: { $regex: req.query.q, $options:'i' } }];
    }
    const tickets = await Ticket.find(filter).populate('author','name email').populate('assignedTo','name email').sort({ createdAt: -1 });
    res.json({ tickets });
  } catch(e) { next(e); }
});
router.post('/', async (req,res,next) => {
  try {
    const schema = z.object({ bookId:z.string().optional().nullable(), subject:z.string().trim().min(4).max(160), description:z.string().trim().min(10).max(6000), attachmentName:z.string().max(255).optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error:'Please provide a subject (4–160 characters) and a description (10–6000 characters).' });
    let book = null;
    if (parsed.data.bookId) {
      book = await Book.findById(parsed.data.bookId);
      if (!book || (req.user.role !== 'admin' && String(book.author) !== String(req.user._id))) return res.status(404).json({ error:'Selected book was not found in your account.' });
    }
    const ticket = await Ticket.create({ author:req.user._id, book:book?._id || null, bookTitle:book?.title || 'General / Account Level', subject:parsed.data.subject, description:parsed.data.description, attachmentName:parsed.data.attachmentName || undefined });
    res.status(201).json({ ticket });
  } catch(e) { next(e); }
});
router.get('/:id', async (req,res,next) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate('author','name email').populate('assignedTo','name email');
    if (!ticket) return res.status(404).json({ error:'Ticket not found.' });
    if (req.user.role !== 'admin' && String(ticket.author._id) !== String(req.user._id)) return res.status(403).json({ error:'You cannot access this ticket.' });
    const result = ticket.toObject();
    if (req.user.role !== 'admin') delete result.internalNotes;
    res.json({ ticket:result });
  } catch(e) { next(e); }
});
router.post('/:id/ai-draft', requireRole('admin'), async (req,res,next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error:'Ticket not found.' });
    const result = await draftTicket({ subject:ticket.subject, description:ticket.description, bookTitle:ticket.bookTitle });
    ticket.category = result.category; ticket.priority = result.priority; ticket.aiSummary = `Generated via ${result.provider}`;
    await ticket.save();
    res.json({ ...result, ticket });
  } catch(e) { next(e); }
});
router.patch('/:id', requireRole('admin'), async (req,res,next) => {
  try {
    const schema = z.object({
      status:z.enum(['Open','In Progress','Resolved','Closed']).optional(),
      category:z.enum(['Royalty & Payments','ISBN & Metadata Issues','Printing & Quality','Distribution & Availability','Book Status & Production Updates','General Inquiry']).optional(),
      priority:z.enum(['Critical','High','Medium','Low']).optional(),
      assignToMe:z.boolean().optional()
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error:'Invalid ticket update.' });
    const update = { ...parsed.data }; delete update.assignToMe;
    if (parsed.data.assignToMe) update.assignedTo = req.user._id;
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, update, { new:true, runValidators:true }).populate('author','name email').populate('assignedTo','name email');
    if (!ticket) return res.status(404).json({ error:'Ticket not found.' });
    res.json({ ticket });
  } catch(e) { next(e); }
});
router.post('/:id/notes', requireRole('admin'), async (req,res,next) => {
  try {
    const body = z.string().trim().min(2).max(3000).safeParse(req.body.body);
    if (!body.success) return res.status(400).json({ error:'Internal note must be 2–3000 characters.' });
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error:'Ticket not found.' });
    ticket.internalNotes.push({ author:req.user._id, authorName:req.user.name, body:body.data });
    await ticket.save();
    res.status(201).json({ ticket });
  } catch(e) { next(e); }
});
router.post('/:id/replies', async (req,res,next) => {
  try {
    const body = z.string().trim().min(2).max(5000).safeParse(req.body.body);
    if (!body.success) return res.status(400).json({ error:'Reply must be 2–5000 characters.' });
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error:'Ticket not found.' });
    if (req.user.role !== 'admin' && String(ticket.author) !== String(req.user._id)) return res.status(403).json({ error:'You cannot reply to this ticket.' });
    ticket.replies.push({ author:req.user._id, authorName:req.user.name, body:body.data });
    if (req.user.role === 'admin' && ticket.status === 'Open') ticket.status = 'In Progress';
    await ticket.save();
    res.status(201).json({ ticket });
  } catch(e) { next(e); }
});
export default router;
