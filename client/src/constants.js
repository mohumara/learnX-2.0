// Dropdown and chip options. The server keeps a matching copy for validation
// (server/src/constants.js); keep the subject, skill and day lists in sync.

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

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara'
];

export const DASHBOARD_PATH = {
  admin: '/admin',
  tutor: '/tutor/dashboard',
  learner: '/learner/dashboard'
};
