# Running PrepTrack for real (CSE pilot)

PrepTrack is run by students, for students. This guide is for the student team that hosts and moderates it.

## How the community works

| Who | What they can do |
| --- | --- |
| **Students** | Sign up with a college email and a CSE roll number. Upload materials, upvote what helped them, report bad uploads, use the forum, track progress. |
| **Trusted uploaders** | Students with **150+ XP**. Their uploads go live instantly. |
| **Moderators** (admin role) | A small student team (3–5 people). Review uploads, handle reports, post announcements, flag cheaters, add or remove other moderators. |

- **Nobody can make themselves a moderator.** Everyone signs up as a student. The first moderator is created with a setup command; after that, moderators promote others from **Admin → Students**.
- **Uploads go live** when a moderator approves them, **3 classmates upvote** them, or the uploader is trusted.
- **Bad uploads disappear** after **3 reports** and wait in **Admin → Content Review → Reported**.
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

Add the branch codes to `ALLOWED_BRANCHES` in `Backend/.env` (e.g. `CSE,ECE`). The branch is read from the roll number (`AM.SC.U4ECE23101` → `ECE`), and each branch only sees its own materials, forum and announcements.

## Handing over each year

Before graduating, promote 2–3 juniors to moderator, give them access to the Atlas and Firebase projects, and walk them through this file.
