import mongoose from 'mongoose';
const bookSchema = new mongoose.Schema({
  externalBookId: { type: String, required: true, unique: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  isbn: String, genre: String, publicationDate: Date, status: String,
  mrp: Number, authorRoyaltyPerCopy: Number, totalCopiesSold: { type: Number, default: 0 },
  totalRoyaltyEarned: { type: Number, default: 0 }, royaltyPaid: { type: Number, default: 0 },
  royaltyPending: { type: Number, default: 0 }, lastRoyaltyPayoutDate: Date,
  printPartner: String, availableOn: [String]
}, { timestamps: true });
export default mongoose.model('Book', bookSchema);
