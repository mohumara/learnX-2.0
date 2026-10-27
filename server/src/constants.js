// Single source of truth for validation on the server.
// The client keeps a matching copy in client/src/constants.js for its dropdowns.

export const SUBJECTS = [
  'Mathematics', 'English', 'Physics', 'Chemistry', 'Biology',
  'Further Mathematics', 'Economics', 'Government', 'Literature',
  'French', 'Hausa', 'Arabic'
];

export const SKILLS = [
  'Programming', 'Graphic Design', 'UI/UX', 'Photography', 'Video Editing',
  'Animation', 'Digital Marketing', 'Public Speaking', 'Music',
  'Tailoring', 'Hair Dressing', 'Fashion Design'
];

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const LESSON_TYPES = ['home', 'online'];

// Roles a person may pick for themselves. Admin accounts are only created by the seed script.
export const SELF_REGISTER_ROLES = ['learner', 'tutor'];
