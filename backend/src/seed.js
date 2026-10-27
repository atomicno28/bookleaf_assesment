import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import User from './models/User.js';
import Book from './models/Book.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bookleaf_support');
const data = JSON.parse(fs.readFileSync(path.join(__dirname,'../data/bookleaf_sample_data.json'),'utf8'));
const demoHash = await bcrypt.hash('AuthorDemo!2026', 10);
const adminHash = await bcrypt.hash('BookLeafAdmin!2026', 10);
await User.deleteMany({});
await Book.deleteMany({});
const admin = await User.create({ name:'BookLeaf Operations', email:'admin@bookleaf.local', passwordHash:adminHash, role:'admin' });
for (const a of data.authors) {
  const user = await User.create({ externalAuthorId:a.author_id, name:a.name, email:a.email, phone:a.phone, city:a.city, joinedDate:a.joined_date ? new Date(a.joined_date) : undefined, passwordHash:demoHash, role:'author' });
  for (const b of a.books) {
    await Book.create({
      externalBookId:b.book_id, author:user._id, title:b.title, isbn:b.isbn, genre:b.genre,
      publicationDate:b.publication_date ? new Date(b.publication_date) : undefined, status:b.status,
      mrp:b.mrp ?? undefined, authorRoyaltyPerCopy:b.author_royalty_per_copy ?? undefined,
      totalCopiesSold:b.total_copies_sold ?? 0, totalRoyaltyEarned:b.total_royalty_earned ?? 0,
      royaltyPaid:b.royalty_paid ?? 0, royaltyPending:b.royalty_pending ?? 0,
      lastRoyaltyPayoutDate:b.last_royalty_payout_date ? new Date(b.last_royalty_payout_date) : undefined,
      printPartner:b.print_partner ?? undefined, availableOn:b.available_on || []
    });
  }
}
console.log(`Seed complete: ${data.authors.length} authors, ${data.authors.reduce((n,a)=>n+a.books.length,0)} books, 1 admin.`);
console.log('Admin: admin@bookleaf.local / BookLeafAdmin!2026');
console.log('Author: priya.sharma@email.com / AuthorDemo!2026 (same demo password for all seeded authors)');
await mongoose.disconnect();
