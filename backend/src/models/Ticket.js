import mongoose from 'mongoose';
const replySchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: String, body: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });
const noteSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: String, body: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });
const ticketSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', default: null },
  bookTitle: { type: String, default: 'General / Account Level' },
  subject: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, required: true, maxlength: 6000 },
  category: { type: String, enum: ['Royalty & Payments','ISBN & Metadata Issues','Printing & Quality','Distribution & Availability','Book Status & Production Updates','General Inquiry'], default: 'General Inquiry' },
  priority: { type: String, enum: ['Critical','High','Medium','Low'], default: 'Medium' },
  status: { type: String, enum: ['Open','In Progress','Resolved','Closed'], default: 'Open' },
  aiSummary: String, assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  replies: [replySchema], internalNotes: [noteSchema],
  attachmentName: String
}, { timestamps: true });
export default mongoose.model('Ticket', ticketSchema);
