/**
 * Seeds Firebase with demo data: one admin, one learner, six tutors, two requests.
 * Safe to run more than once. Run with: npm run seed
 */
import 'dotenv/config';
const { auth, db } = await import('../src/config/firebase.js');

const now = new Date().toISOString();

const PEOPLE = [
  { email: 'admin@learnx.ng', password: 'admin123', name: 'LearnX Admin', role: 'admin' },
  { email: 'learner@learnx.ng', password: 'learner123', name: 'Amaka Johnson', role: 'learner' }
];

const TUTORS = [
  { email: 'chidinma@learnx.ng', name: 'Chidinma Nwosu', bio: 'Mathematics teacher with 6 years of secondary school experience. I specialise in WAEC and JAMB preparation, breaking down tough topics into simple steps.', subjects: ['Mathematics', 'Further Mathematics'], skills: [], lessonTypes: ['home', 'online'], state: 'Lagos', city: 'Ikeja', hourlyRate: 4000, availability: ['Mon', 'Wed', 'Fri', 'Sat'], rating: 4.9, reviewsCount: 32, status: 'approved' },
  { email: 'abdullahi@learnx.ng', name: 'Abdullahi Bello', bio: 'Physics graduate teaching online since 2022. I love using real-world examples to make mechanics and electromagnetism click.', subjects: ['Physics', 'Mathematics'], skills: [], lessonTypes: ['online'], state: 'Kano', city: 'Kano', hourlyRate: 3500, availability: ['Tue', 'Thu', 'Sat', 'Sun'], rating: 4.8, reviewsCount: 21, status: 'approved' },
  { email: 'funmilayo@learnx.ng', name: 'Funmilayo Ogundele', bio: 'Product designer teaching UI/UX and Graphic Design fundamentals. Perfect for beginners who want a real portfolio, not just theory.', subjects: [], skills: ['UI/UX', 'Graphic Design'], lessonTypes: ['home', 'online'], state: 'Oyo', city: 'Ibadan', hourlyRate: 5000, availability: ['Mon', 'Tue', 'Wed'], rating: 5.0, reviewsCount: 14, status: 'approved' },
  { email: 'david@learnx.ng', name: 'David Okafor', bio: 'Chemistry and Biology tutor for secondary school students. Former WAEC marker with a track record of turning around failing grades.', subjects: ['Chemistry', 'Biology'], skills: [], lessonTypes: ['home'], state: 'Oyo', city: 'Ibadan', hourlyRate: 3800, availability: ['Sat', 'Sun'], rating: 4.7, reviewsCount: 18, status: 'approved' },
  { email: 'zainab@learnx.ng', name: 'Zainab Suleiman', bio: 'Self-taught programmer turned instructor. I teach JavaScript and web development basics to complete beginners, at a relaxed pace.', subjects: [], skills: ['Programming'], lessonTypes: ['online'], state: 'Borno', city: 'Maiduguri', hourlyRate: 3000, availability: ['Mon', 'Wed', 'Fri'], rating: 4.6, reviewsCount: 9, status: 'pending' },
  { email: 'emeka@learnx.ng', name: 'Emeka Uche', bio: 'English Language and Literature tutor helping students build confident essay writing and comprehension skills for WAEC and IELTS.', subjects: ['English', 'Literature'], skills: ['Public Speaking'], lessonTypes: ['home', 'online'], state: 'Lagos', city: 'Yaba', hourlyRate: 4200, availability: ['Tue', 'Thu', 'Sat'], rating: 4.9, reviewsCount: 27, status: 'approved' }
];

/** Create the Auth account if it doesn't exist, otherwise reset its password and name. */
async function ensureAuthUser({ email, password, name }) {
  try {
    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, { password, displayName: name });
    return existing.uid;
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
    return (await auth.createUser({ email, password, displayName: name })).uid;
  }
}

const uids = {};

for (const p of PEOPLE) {
  const uid = await ensureAuthUser(p);
  uids[p.email] = uid;
  await db.collection('users').doc(uid).set({ name: p.name, email: p.email, role: p.role, bookmarks: [], createdAt: now });
  console.log(`user   ${p.role.padEnd(8)} ${p.email}`);
}

for (const { email, ...profile } of TUTORS) {
  const uid = await ensureAuthUser({ email, password: 'tutor123', name: profile.name });
  uids[email] = uid;
  await db.collection('users').doc(uid).set({ name: profile.name, email, role: 'tutor', bookmarks: [], createdAt: now });
  await db.collection('tutors').doc(uid).set({ ...profile, createdAt: now });
  console.log(`user   tutor    ${email} (${profile.status})`);
}

const learnerId = uids['learner@learnx.ng'];
const seedRequests = [
  { id: 'seed-request-1', tutor: 'chidinma@learnx.ng', tutorName: 'Chidinma Nwosu', subject: 'Mathematics', status: 'pending', message: 'Hi, I need help preparing my daughter for WAEC Mathematics. Are you available on weekends?' },
  { id: 'seed-request-2', tutor: 'funmilayo@learnx.ng', tutorName: 'Funmilayo Ogundele', subject: 'UI/UX', status: 'accepted', message: "I'd like to start learning UI/UX design from scratch. Do you have beginner-friendly sessions?" }
];
for (const r of seedRequests) {
  await db.collection('requests').doc(r.id).set({
    learnerId, learnerName: 'Amaka Johnson', tutorId: uids[r.tutor], tutorName: r.tutorName,
    subject: r.subject, message: r.message, status: r.status, createdAt: now
  });
}

console.log('\nSeed complete.');
console.log('Logins: admin@learnx.ng / admin123, learner@learnx.ng / learner123, chidinma@learnx.ng / tutor123');
