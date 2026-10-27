import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  externalAuthorId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['author', 'admin'], default: 'author' },
  phone: String,
  city: String,
  joinedDate: Date
}, { timestamps: true });
export default mongoose.model('User', userSchema);
