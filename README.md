# LearnX

A marketplace connecting verified tutors and skill instructors with parents, students and adult learners across Nigeria, for home or online lessons. It is not an e-learning platform and does not host courses.

**Stack:** React (Vite) + Node.js/Express + Firebase (Authentication and Firestore).

## Architecture

```
React client  --->  Express API  --->  Firebase (Auth + Firestore)
 (Vercel)           (Render)            (Admin SDK)
```

The browser uses Firebase only to sign in. Every read and write goes through the Express API, which verifies the Firebase ID token, checks the user's role, validates input, and talks to Firestore with the Admin SDK. Firestore rules deny all direct client access (`firestore.rules`).

```
LearnX/
├── client/                 React app
│   └── src/
│       ├── components/     Navbar, Footer, TutorCard, Modal, ProtectedRoute, ...
│       ├── context/        AuthContext (session + profile), ToastContext
│       ├── hooks/          useRipple
│       ├── lib/            firebase.js, api.js (fetch wrapper), format.js
│       ├── pages/          Home, Search, TutorDetails, dashboards, auth pages, ...
│       ├── services/       One file per API area (tutors, requests, admin, ...)
│       └── styles/         Shared design system CSS
├── server/                 Express API
│   ├── src/
│   │   ├── config/         Firebase Admin setup
│   │   ├── middleware/     verifyToken, requireRole, error handling
│   │   ├── routes/         auth, tutors, requests, bookmarks, admin, contact
│   │   ├── services/       tutorSearch.js (search filtering)
│   │   └── utils/          validation helpers, HttpError
│   └── scripts/seed.js     Creates demo accounts and data
└── firestore.rules         Deny all client access
```

## Setup

### I. Create the Firebase project

1. Go to the Firebase console and create a project.
2. Build > Authentication > Get started > enable **Email/Password**.
3. Build > Firestore Database > Create database (production mode, any region).
4. Firestore > Rules tab > paste the contents of `firestore.rules` > Publish.
5. Project settings > Service accounts > **Generate new private key**. Save the file as `server/serviceAccountKey.json` (it is git-ignored, never commit it).
6. Project settings > General > Your apps > add a **Web app**. Copy its config values for the client.

### II. Run the server

```bash
cd server
cp .env.example .env        # defaults work for local development
npm install
npm run seed                # creates demo users, tutors and requests
npm run dev                 # http://localhost:5000
```

### III. Run the client

```bash
cd client
cp .env.example .env        # fill in the four VITE_FIREBASE_* values from step I.6
npm install
npm run dev                 # http://localhost:5173
```

## Demo accounts (created by `npm run seed`)

| Role    | Email                | Password   |
|---------|----------------------|------------|
| Admin   | admin@learnx.ng      | admin123   |
| Learner | learner@learnx.ng    | learner123 |
| Tutor   | chidinma@learnx.ng   | tutor123   |

Other seeded tutors (abdullahi, funmilayo, david, zainab, emeka @learnx.ng) use `tutor123`. Zainab is seeded as pending so the admin approval flow has something to show.

## Deployment

### Server on Render

1. New > Web Service > connect the GitHub repo.
2. Root directory: `server`. Build command: `npm install`. Start command: `npm start`.
3. Environment variables:
   - `CLIENT_URL` = your Vercel URL (no trailing slash). Separate several origins with commas, for example to include a preview domain.
   - `FIREBASE_SERVICE_ACCOUNT` = the entire contents of the service account JSON file.
4. Note the service URL, for example `https://learnx-api.onrender.com`.

### Client on Vercel

1. Import the same repo. Root directory: `client`. Framework preset: Vite.
2. Environment variables: `VITE_API_URL` = `https://<your-render-url>/api`, plus the four `VITE_FIREBASE_*` values.
3. Deploy. `client/vercel.json` already rewrites all routes to `index.html` so page refreshes work.

Render's free tier sleeps after inactivity, so the first request after a quiet period takes around 30 seconds. Open the site once before a demo to wake it.

## Data model (Firestore)

The Firebase `uid` is the document ID everywhere, so a tutor's `users` and `tutors` documents share the same ID.

| Collection        | Fields |
|-------------------|--------|
| `users/{uid}`     | name, email, role (`learner` / `tutor` / `admin`), bookmarks (array of tutor uids), createdAt |
| `tutors/{uid}`    | name, bio, subjects[], skills[], lessonTypes[] (`home` / `online`), state, city, hourlyRate, availability[], status (`pending` / `approved` / `rejected`), rating, reviewsCount, createdAt |
| `requests/{id}`   | learnerId, learnerName, tutorId, tutorName, subject, message, status (`pending` / `accepted` / `declined`), createdAt |
| `contactMessages/{id}` | name, email, message, createdAt |

"Verified" means `status == approved`. Only approved tutors are listed or searchable.

## API

| Method | Route | Access | Purpose |
|--------|-------|--------|---------|
| POST | `/api/auth/register` | public | Create account (learner or tutor only) |
| GET / PATCH | `/api/auth/me` | signed in | Get or update own profile |
| GET | `/api/tutors` | public | Search approved tutors (query: keyword, subject, skill, state, city, online, home, maxRate, minRating) |
| GET | `/api/tutors/:id` | public | One approved tutor |
| GET / PUT | `/api/tutors/me` | tutor | Own profile, any status |
| POST | `/api/requests` | learner | Send a lesson request |
| GET | `/api/requests/mine` | learner, tutor | Sent (learner) or received (tutor) requests |
| PATCH | `/api/requests/:id` | tutor | Accept or decline a pending request |
| GET | `/api/bookmarks` | learner | Bookmarked tutors |
| POST | `/api/bookmarks/:tutorId` | learner | Toggle a bookmark |
| GET | `/api/admin/stats`, `/users`, `/tutors` | admin | Dashboard data |
| PATCH | `/api/admin/tutors/:id/status` | admin | Approve or reject a tutor |
| DELETE | `/api/admin/users/:uid` | admin | Delete an account and its data |
| POST | `/api/contact` | public | Store a contact message |

## Design decisions and known limitations

1. **Search is filtered in memory.** Firestore cannot combine several array filters or do partial text matching in one query, so the API fetches approved tutors (one auto-indexed query) and filters in code. This is instant at hundreds of tutors. The scale-up path is a search service such as Algolia or Typesense.
2. **Ratings are static.** `rating` and `reviewsCount` come from seed data. A reviews flow (learner rates after an accepted request) is the natural next feature.
3. **No notifications or messaging.** Tutors and learners see request activity on their dashboards instead.
4. **Admins are created by the seed script only.** Registration refuses any role except learner and tutor.
5. **Email changes are not supported.** Firebase requires re-authentication for that. Users can change their name.
6. **Landing page figures are placeholders.** The statistics and testimonials on the home page are illustrative and should be replaced with real data before launch.
7. **Contact messages** are stored in the `contactMessages` collection. Read them in the Firebase console.
8. `client/src/constants.js` and `server/src/constants.js` hold matching subject, skill and day lists. The server copy is the one used for validation.
