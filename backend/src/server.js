import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import bookRoutes from './routes/books.js';
import ticketRoutes from './routes/tickets.js';
import adminRoutes from './routes/admin.js';
import { authenticate, requireRole } from './middleware/auth.js';
const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit:'1mb' }));
app.use('/api/auth/login', rateLimit({ windowMs:15*60*1000, limit:30, standardHeaders:true, legacyHeaders:false }));
app.get('/api/health', (_req,res)=>res.json({ status:'ok', database:mongoose.connection.readyState === 1 ? 'connected':'disconnected' }));
app.use('/api/auth', authRoutes);
app.use('/api/books', authenticate, bookRoutes);
app.use('/api/tickets', authenticate, ticketRoutes);
app.use('/api/admin', authenticate, requireRole('admin'), adminRoutes);
app.use((req,res)=>res.status(404).json({ error:`Route not found: ${req.method} ${req.path}` }));
app.use((err,_req,res,_next)=>{
  console.error(err);
  if (err.name === 'CastError') return res.status(400).json({ error:'Invalid resource identifier.' });
  if (err.code === 11000) return res.status(409).json({ error:'A record with this value already exists.' });
  res.status(500).json({ error:'An unexpected server error occurred. Please try again.' });
});
const port = Number(process.env.PORT || 4000);
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bookleaf_support')
  .then(()=>app.listen(port,()=>console.log(`BookLeaf API listening on http://localhost:${port}`)))
  .catch(err=>{ console.error('MongoDB connection failed:',err.message); process.exit(1); });
