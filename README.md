# PrepTrack

A study platform for one college class: notes, slides, previous year question papers and exam dates in one place, shared by the students themselves.

**Live:** https://preptrack-app.vercel.app

It is currently open to the EEE 2024 batch at Amrita (roll numbers `AM.EN.U4EEE24###`). Each class only ever sees its own material, forum and leaderboard.

---

## What it does

**For students**

- **Study materials by semester and subject.** Notes, slides, PYQs and other files, sorted S1 to S7 and then by subject, with search across all semesters.
- **Uploading.** Pick the semester and subject, then share a Google Drive or OneDrive link. S7 also accepts files (PDF, PPT, Word or images, up to 5 MB); S1 to S6 take links only, to save storage.
- **Community review.** New uploads go live when a CR approves them or 5 classmates mark them Helpful. Students with 150+ XP are trusted and their uploads go live instantly. 5 reports hide an upload until a CR looks at it.
- **Exam countdown.** CRs post the exam schedule, and the dashboard counts down to the next exam (students can switch which one).
- **Class forum** for doubts and discussion.
- **Leaderboard.** XP for approved uploads (PYQ +15, notes +10, slides +8, other +5). Anyone can hide their name from it.
- **Display names.** After signing up, everyone sees a short welcome and picks the name classmates will see.
- **Feedback.** Issues, ideas and comments go straight to the site owner.

**For CRs** (up to 2 per class)

- Add, rename and remove the subjects of every semester.
- Review, approve and remove uploads; handle reports.
- Post exams and announcements.
- See the class list, reset forgotten passwords, and remove students (their uploads stay, shown as "Removed student").
- The class's CR roll numbers are set in `CR_ROLL_NUMBERS`; those students land in the CR portal as soon as they sign up.

**For the owner**

- A separate owner dashboard with site-wide totals and trends, a "needs attention" list, and the feedback inbox. Only the owner account can open it.

**Installable app.** PrepTrack is a PWA: on a laptop (Chrome or Edge) or Android, use the install icon or *account menu → Install app*; on an iPhone, Safari → Share → *Add to Home Screen*. The app always loads the live site, so updates reach everyone straight away.

---

## Tech stack

| Part | Built with |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, React Router, Framer Motion, Recharts, Lucide icons |
| Backend | Node.js, Express 5, Mongoose |
| Database | MongoDB Atlas |
| File storage | Vercel Blob (files go straight from the browser to Blob) |
| Auth | Roll-number sign-in, JWT, bcrypt; 5 wrong passwords lock an account for 15 minutes |
| Hosting | Vercel, one project with two services (`/` the frontend, `/api` the backend), see `vercel.json` |

```
PrepTrack/
├── Backend/      Express API: controllers, models, routes, middleware, scripts
├── Frontend/     React app (public/ holds the logo, PWA manifest and icons)
├── vercel.json   Routes /api to the backend and everything else to the frontend
└── SETUP.md      Running and moderating it for real
```

---

## Running it locally

Requirements: Node.js 20+ and a MongoDB Atlas database (the free tier is enough).

1. Copy `Backend/.env.example` to `Backend/.env.local` and fill in at least `MONGO_URI`, `JWT_SECRET` and `ALLOWED_EMAIL_DOMAIN`.
2. Install and start (two terminals):
   ```bash
   npm --prefix Backend install
   npm --prefix Frontend install
   npm --prefix Backend run dev
   npm --prefix Frontend run dev
   ```
3. Open http://localhost:3000. Without Vercel Blob configured, uploads are saved in `Backend/storage/`.

`npm --prefix Frontend run demo` runs the interface on sample data, with no backend or database.

### Backend commands

Run from the `PrepTrack` folder:

| Command | What it does |
| --- | --- |
| `npm --prefix Backend run make-admin -- <email>` | Make an account a CR |
| `npm --prefix Backend run make-owner -- <email>` | Mark the owner account (opens the owner dashboard) |
| `npm --prefix Backend run reset-password -- <email>` | Print a one-time temporary password for an account |
| `npm --prefix Backend run fresh-start -- <email> [--yes]` | Delete everything except the named accounts (dry run without `--yes`) |
| `npm --prefix Backend run seed` | Load demo data for local testing |

### Settings

Set in `Backend/.env.local` locally, and in Vercel → Settings → Environment Variables when hosted.

| Variable | Meaning | Default |
| --- | --- | --- |
| `MONGO_URI` | MongoDB connection string | required |
| `JWT_SECRET` | Secret for sign-in tokens | required |
| `ALLOWED_EMAIL_DOMAIN` | Only emails on this domain can sign up | any |
| `ALLOWED_ROLL_FORMATS` | Roll numbers that can sign up, `#` = any digit (quote it in `.env`) | `AM.EN.U4EEE24###` |
| `CR_ROLL_NUMBERS` | Roll numbers that join as CRs | the two current CRs |
| `MAX_CRS_PER_BATCH` | CRs allowed per class | `2` |
| `MAX_UPLOAD_MB` | Biggest file upload, in MB | `5` |
| `FILE_UPLOAD_SEMESTERS` | Semesters that accept files; the others take links only | `7` |
| `TRUSTED_XP` | XP needed for instant publishing | `150` |
| `AUTO_APPROVE_UPVOTES` | Helpful votes that publish an upload | `5` |
| `AUTO_HIDE_REPORTS` | Reports that hide an upload | `5` |

---

## Deploying

Every push to `main` deploys to Vercel automatically. The Blob store and MongoDB connection are configured in the Vercel project. See [SETUP.md](SETUP.md) for the launch checklist, how moderation works, and handing the site over each year.
