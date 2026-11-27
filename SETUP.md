# Running PrepTrack for real (EEE 2024 pilot)

PrepTrack is run by students, for students. This guide is for the student team that hosts and moderates it.

## How the community works

| Who | What they can do |
| --- | --- |
| **Students** | Sign up with a college email and an EEE 2024 roll number (`AM.EN.U4EEE24###`). Upload materials, upvote what helped them, report bad uploads, use the forum, track progress. |
| **Trusted uploaders** | Students with **150+ XP**. Their uploads go live instantly. |
| **Moderators** (admin role) | A small student team (3–5 people). Review uploads, handle reports, post announcements, flag cheaters, add or remove other moderators. |

- **Nobody can make themselves a moderator.** Everyone signs up as a student. The first moderator is created with a setup command; after that, moderators promote others from **Admin → Students**.
- **Uploads go live** when a moderator approves them, **5 classmates mark them Helpful**, or the uploader is trusted.
- **Bad uploads disappear** after **5 reports** and wait in **Admin → Content Review → Reported**.
- **Points are only given once an upload is approved** (PYQs +15, notes +10, slides +8), so spamming junk earns nothing.

All the numbers above can be changed in `Backend/.env` — see `Backend/.env.example`.

## First-time setup

1. **Requirements:** Node.js 20+ and a MongoDB Atlas database (free tier is enough). Firebase is optional.
2. **Backend config:** put your own values in `Backend/.env.local` (git-ignored; it overrides `Backend/.env`). Use `Backend/.env.example` as the template. Set `ALLOWED_EMAIL_DOMAIN` to your college's email domain (e.g. `college.edu`).
3. **File storage:** without Firebase, uploads are saved in `Backend/storage/` and served by the backend at `/files/...`. To use Firebase Storage instead (needs the Blaze plan), save a service-account key as `Backend/config/serviceAccountKey.json` and set `FIREBASE_STORAGE_BUCKET` in `.env.local`.
4. **Install:**
   ```bash
   npm --prefix Backend install
   npm --prefix Frontend install
   ```
5. **Start** (two terminals):
   ```bash
   npm --prefix Backend run dev
   npm --prefix Frontend run dev
   ```
   Open http://localhost:3000.
6. **Create the first moderator:** sign up on the website like any student, then run:
   ```bash
   npm --prefix Backend run make-admin -- your.email@college.edu
   ```
   Log out and back in to see the admin portal. Promote the rest of the team from **Admin → Students → Make moderator**.

## Demo mode

`npm --prefix Frontend run demo` runs the whole UI with sample data — no backend, database or internet needed. Good for presentations. Any email works; one containing "admin" opens the admin portal.

## Before launch checklist

- [ ] Change the MongoDB password and JWT secret if they were ever committed to Git.
- [ ] Set `ALLOWED_EMAIL_DOMAIN` so only college emails can join.
- [ ] Pre-load 3–5 good materials per subject of the current semester.
- [ ] Add the exam timetable as an announcement.
- [ ] Launch 2–3 weeks before exams.

## Opening more branches later

Add roll-number formats to `ALLOWED_ROLL_FORMATS` in `Backend/.env.local` (and in Vercel → Settings → Environment Variables), comma-separated, where `#` is any digit — e.g. `AM.EN.U4EEE24###,AM.EN.U4EEE25###`. Each class (branch + joining year, read from the roll number) only sees its own materials, forum, announcements and leaderboard, and has up to 2 CRs.

## Exam schedule

- CRs post every exam in **CR portal → Exams**: subject, type (Quiz, Mid-term, End-semester, Lab exam, Assignment, Other), date and start time, and optionally marks, duration, venue and syllabus.
- Posting an exam sends the class an announcement; moving its date sends a priority one.
- Students see a **live countdown** on their dashboard (they can switch it to any upcoming exam) and the full list of upcoming exams. On **Progress** they tap how confident they feel per subject — they never type exam dates themselves.

## Accounts and passwords

- Students **sign in with their roll number** (any letter case). One account per roll number and per email.
- **Forgot password:** a CR opens **CR portal → Students → (student) → Reset password** and gets a one-time temporary password to pass on. The student signs in with it and must choose a new one straight away. Students can change their own password from **Profile → Account**.
- **5 wrong passwords lock an account for 15 minutes** (roll numbers are easy to guess). A CR reset also unlocks it.
- **Leaderboard privacy:** under **Profile → Account** a student can hide their name; classmates then see "Hidden classmate" (CRs still see real names when moderating).
- **CRs are students too:** the account menu (tap the avatar) switches between the student view and the CR portal, and has Log out.

## How readiness and confidence work

- **Readiness** comes from marks. Each subject is the average of its logged results, with newer results weighted more (latest ×1, then ×0.7, ×0.49 …). Overall readiness is the average of the subjects. Bands: Strong 75%+, On track 60–74%, Needs work below 60%. The formula lives in `Backend/utils/readiness.js`.
- **Confidence** is what the student feels about a subject (High / Medium / Low), set by them in their exam plan — nothing is calculated.
- The app flags the mismatch: High confidence with marks below 60% (overconfident), or Low confidence with 75%+ (underconfident). Students see the same explanation behind the “How is this calculated?” link.

## Handing over each year

Before graduating, promote 2–3 juniors to moderator, give them access to the Atlas and Firebase projects, and walk them through this file.
