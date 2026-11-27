# PrepTrack — Complete Viva Study Guide

Read this top to bottom once, then use the section headings to revise. Every file in the project is covered.

---

## PART 1 — The big picture (learn this first)

### 1.1 What PrepTrack is, in one breath
PrepTrack is a full-stack web application for CSE students to **share study materials, track exam preparation, discuss doubts, and compete on a leaderboard**. It is **run by students** — a small team of student moderators (admins) keeps content quality high with help from the community (upvotes and reports).

### 1.2 The three tiers (Three-Tier Architecture)

```
┌──────────────────────┐   HTTP requests (JSON)   ┌──────────────────────┐   Mongoose queries   ┌──────────────────────┐
│  1. PRESENTATION     │ ───────────────────────▶ │  2. APPLICATION      │ ───────────────────▶ │  3. DATA             │
│  React frontend      │                          │  Express backend     │                      │  MongoDB Atlas       │
│  (runs in browser)   │ ◀─────────────────────── │  (Node.js server)    │ ◀─────────────────── │  + Firebase Storage  │
│  port 3000           │   JSON responses         │  port 5000           │   documents          │  (files: PDF, PPT)   │
└──────────────────────┘                          └──────────────────────┘                      └──────────────────────┘
```

- **Frontend (React + Vite)** — what the user sees and clicks. It never touches the database directly.
- **Backend (Node.js + Express)** — the "brain". Receives requests, checks who you are (JWT), applies rules, reads/writes the database.
- **Database (MongoDB Atlas)** — stores users, materials, results, etc. as JSON-like *documents*.
- **Firebase Storage** — stores the actual uploaded files (PDFs, PPTs). MongoDB only stores the file's *link* (URL).

**Why separate them?** Security (the database password lives only on the server), each layer can change independently, and many clients (web, a future mobile app) can share one backend.

### 1.3 Software engineering model
**Iterative (Incremental) model** — built in increments: (1) auth + materials, (2) progress & results, (3) discussions & leaderboard, (4) admin portal & security logs, (5) UI redesign + community moderation. Each increment was built, tested and shown, then improved.

### 1.4 Tech stack — what each piece is

| Piece | What it is | Why we used it |
|---|---|---|
| **React** | JavaScript library for building UIs out of reusable *components* | Fast, component-based, huge ecosystem |
| **Vite** | Dev server + build tool for the frontend | Instant reload while coding, builds optimized files |
| **Tailwind CSS** | Styling by writing small class names (`p-4`, `rounded-xl`) | No separate CSS files per component, consistent design |
| **Framer Motion** | Animation library for React | Smooth page/card/modal animations |
| **Recharts** | Chart library for React | Performance trend, bar, pie charts |
| **Lucide React** | Icon set | Clean icons |
| **React Router** | Maps URLs (`/progress`) to pages | Multi-page feel in a single-page app |
| **Axios** | Library for making HTTP requests | Talks to the backend; lets us auto-attach the login token |
| **canvas-confetti** | Confetti effect | Celebrations (level-up, uploads) |
| **Node.js** | Runs JavaScript on a server (outside the browser) | Same language front and back |
| **Express** | Web framework for Node | Defines API routes (`GET /api/upload`) easily |
| **MongoDB Atlas** | Cloud NoSQL database | Flexible JSON documents, free tier, no server to manage |
| **Mongoose** | Library to talk to MongoDB using *schemas/models* | Validation, structure, easy queries |
| **JWT (jsonwebtoken)** | Signed login token | Stateless login — server doesn't store sessions |
| **bcryptjs** | Password hashing | Passwords are never stored in plain text |
| **Multer** | Handles file uploads in Express | Reads the uploaded file into memory |
| **firebase-admin** | Server SDK for Firebase | Saves uploaded files to Firebase Storage |
| **dotenv** | Loads secrets from `.env` | Keeps passwords out of the code |
| **cors** | Allows the frontend (port 3000) to call the backend (port 5000) | Browsers block cross-origin calls by default |
| **nodemon** | Restarts server on code change | Developer convenience |

---

## PART 2 — Core concepts you must be able to explain

### 2.1 What is React (in plain words)?
A web page built with React is made of **components** — JavaScript functions that return what should appear on screen (written in **JSX**, which looks like HTML inside JavaScript).

```jsx
function Welcome({ name }) {          // a component; "name" is a prop (input)
  return <h1>Hey {name}!</h1>;         // JSX: HTML-like syntax
}
```

Key ideas:
- **Props** — inputs passed into a component (like function arguments). `<Avatar name="Aditi" />`.
- **State (`useState`)** — data a component remembers that can change. When state changes, React re-draws that part of the screen automatically.
  ```js
  const [materials, setMaterials] = useState([]);   // starts as empty list
  setMaterials(newList);                             // screen updates
  ```
- **Effects (`useEffect`)** — code that runs *after* the component appears, e.g. fetching data from the backend once when the page opens.
  ```js
  useEffect(() => { API.get("/upload").then(res => setMaterials(res.data)); }, []);
  //  [] = run only once, when the page first loads
  ```
- **Context** — a way to share data (like "who is logged in") with every component without passing props through every level. We have `AuthContext`, `UserContext`, `GameContext`, `FocusContext`, `ToastProvider`.
- **SPA (Single-Page Application)** — the browser loads one HTML page (`index.html`) once; React Router swaps components when the URL changes, so navigation is instant without full page reloads.

### 2.2 What is a backend / an API?
The backend is a program running on a server that **listens for HTTP requests** and replies with data. An **API (Application Programming Interface)** is the list of URLs (endpoints) it understands.

**REST** style: each URL is a *resource*, and the HTTP **method** says what to do:

| Method | Meaning | Example in PrepTrack |
|---|---|---|
| `GET` | read | `GET /api/upload` → list materials |
| `POST` | create / action | `POST /api/auth/login` → log in |
| `PUT` | replace/update | `PUT /api/auth/profile` → update profile |
| `PATCH` | partial update | `PATCH /api/progress/prep/update/:id` |
| `DELETE` | delete | `DELETE /api/branch/:id` |

**Status codes** you'll see: `200` OK, `201` Created, `400` bad input, `401` not logged in, `403` logged in but not allowed, `404` not found, `409` conflict (duplicate), `500` server error.

### 2.3 Request flow inside the backend (memorize this chain)

```
Request ─▶ server.js ─▶ Route file ─▶ Middleware(s) ─▶ Controller ─▶ Model (Mongoose) ─▶ MongoDB
                                                                   ◀── JSON response ◀──
```

- **server.js** — starts Express, connects to MongoDB, mounts route files under `/api/...`.
- **Routes** (`routes/*.js`) — map URL + method to a controller function, and list which middleware runs first.
- **Middleware** (`middleware/*.js`) — "security guards" that run before the controller: `authMiddleware` (are you logged in?), `adminOnly` (are you an admin?).
- **Controllers** (`controllers/*.js`) — the actual logic: validate input, query DB, send response.
- **Models** (`models/*.js`) — Mongoose schemas: the shape of each collection in MongoDB.

### 2.4 How the frontend talks to the backend (THE most asked viva question)

1. A page (e.g. `Resources.jsx`) calls `API.get("/upload")`.
2. `API` is our **Axios instance** in `Frontend/src/api.js`, created with `baseURL: "http://localhost:5000/api"`, so the real request goes to `http://localhost:5000/api/upload`.
3. An **interceptor** in `api.js` automatically adds the header `Authorization: Bearer <token>` (token saved in the browser's `localStorage` at login).
4. The backend's `authMiddleware` reads that header, verifies the JWT, and puts the user's id/role/branch into `req.user`.
5. The controller uses `req.user.branch` to fetch only that branch's materials from MongoDB and replies with JSON.
6. Axios gives the JSON to the page as `res.data`; the page calls `setMaterials(res.data)`; React re-renders and the cards appear.

**CORS**: the frontend runs on port 3000 and the backend on 5000 — different "origins". Browsers block that unless the server allows it. `server.js` has `app.use(cors({ origin: "http://localhost:3000" }))`.

### 2.5 Authentication with JWT + bcrypt
- **Signup**: password → `bcrypt.hash(password, 10)` → stored hash looks like `$2b$10$...`. Even admins can't read the real password.
- **Login**: `bcrypt.compare(typedPassword, storedHash)`. If correct, server creates a **JWT**: `jwt.sign({ id, role, branch, name }, JWT_SECRET, { expiresIn: "7d" })`.
- A JWT has 3 parts `header.payload.signature`. The payload is readable, but the **signature** proves the server issued it — if anyone edits the payload (e.g. changes role to admin), the signature check fails.
- The frontend stores the token in `localStorage` and sends it with every request.
- **Why JWT?** Stateless: the server doesn't need to remember sessions; any server instance can verify the token with the secret.
- **Extra safety we added**: `adminOnly` re-checks the role **in the database**, so removing someone's admin role works instantly even if their old token still says "admin".

### 2.6 MongoDB in plain words
- **NoSQL, document database.** Data is stored as **documents** (JSON-like objects) inside **collections** (like tables).
- SQL comparison: table → collection, row → document, column → field. Every document gets a unique `_id`.
- **Mongoose** adds **schemas** (rules for fields, types, defaults, allowed values) and gives us methods like `find`, `findById`, `create`, `findOneAndUpdate`, `countDocuments`, `aggregate`.
- **Relationships** are stored as ObjectId references (e.g. `Leaderboard.studentId` → a `User._id`), and `.populate()` swaps the id for the real user data when reading.
- **Atlas** = MongoDB hosted in the cloud by MongoDB Inc.

### 2.7 Firebase Storage
Uploaded files are binary (PDF/PPT) — not good to store in MongoDB. Flow: browser sends file → **Multer** keeps it in memory → `bucket.file(name).save(buffer)` uploads to Firebase → we store the public URL `https://storage.googleapis.com/<bucket>/<file>` in MongoDB's `Material.fileUrl`.

---

## PART 3 — Folder structure (what's where)

```
PrepTrack/
├── README.md, Meta_File.txt, SETUP.md, VIVA_GUIDE.md
├── Backend/                      ← Node + Express server
│   ├── server.js                 ← entry point
│   ├── .env / .env.example       ← secrets & settings
│   ├── package.json              ← dependencies + scripts (start, dev, make-admin)
│   ├── config/   db.js, firebase.js, community.js
│   ├── middleware/ authMiddleware.js, roleMiddleware.js
│   ├── models/   User, Material, Progress, Result, Leaderboard, Notification, Discussion, Branch, SecurityLog
│   ├── controllers/ auth, upload, progress, result, leaderboard, notification, discussion, admin, user, branch, securityLog
│   ├── routes/   one file per controller
│   ├── utils/points.js           ← awards leaderboard points
│   ├── scripts/makeAdmin.js      ← creates the first admin
│   └── data.js                   ← sample/mock dataset (reference only)
└── Frontend/                     ← React + Vite app
    ├── index.html                ← the single HTML page
    ├── vite.config.js            ← dev server on port 3000
    ├── tailwind.config.js        ← design tokens (colors, fonts, animations)
    ├── .env.demo                 ← turns on demo mode
    └── src/
        ├── main.jsx              ← starts React
        ├── App.jsx               ← all routes (URLs → pages)
        ├── api.js                ← Axios instance (connection to backend)
        ├── index.css             ← global styles + reusable classes
        ├── context/              ← shared state (Auth, User, Game, Focus)
        ├── layouts/              ← page frames (StudentLayout, AdminLayout)
        ├── components/           ← reusable pieces (Sidebar, Topbar, ui/…)
        ├── pages/                ← one file per screen (+ pages/admin/)
        ├── utils/                ← helpers (gamification, rules, ui, confetti, guards)
        └── demo/mockApi.js       ← fake backend for demo mode
```

---

## PART 4 — BACKEND, file by file

### 4.1 `server.js` (entry point)
1. Imports Express, dotenv, cors, the DB connector and all route files.
2. `dotenv.config()` — loads `.env` into `process.env`.
3. `connectDB()` — connects Mongoose to MongoDB Atlas.
4. `app.use(cors(...))` — allow the React app at localhost:3000.
5. `app.use(express.json())` — lets Express read JSON request bodies into `req.body`.
6. Mounts routes:

| Prefix | Route file |
|---|---|
| `/api/auth` | authRoutes |
| `/api/upload` | uploadRoutes (materials) |
| `/api/progress` | progressRoutes |
| `/api/result` | resultRoutes |
| `/api/leaderboard` | leaderboardRoutes |
| `/api/notification` | notificationRoutes (announcements) |
| `/api/discussions` | discussionRoutes |
| `/api/admin` | adminRoutes |
| `/api/users` | userRoutes |
| `/api/branch` | branchRoutes |
| `/api/security-logs` | securityLogRoutes |

7. `app.listen(PORT)` — server waits for requests on port 5000.

### 4.2 `.env` (secrets) and `.env.example`
```
MONGO_URI=...            # database connection string (contains DB username+password)
JWT_SECRET=...           # key used to sign login tokens
PORT=5000
BACKEND_URL=http://localhost:5000
ALLOWED_EMAIL_DOMAIN=college.edu   # only these emails can sign up
ALLOWED_BRANCHES=CSE               # branches allowed (from roll number)
TRUSTED_XP=150                     # XP to become a trusted uploader
AUTO_APPROVE_UPVOTES=3             # upvotes that approve a pending upload
AUTO_HIDE_REPORTS=3                # reports that hide an upload
```
`.env` must **never** be committed to GitHub; `.env.example` is the safe template.

### 4.3 `config/`
- **db.js** — `mongoose.connect(process.env.MONGO_URI)`; prints "✅ MongoDB Connected" or exits on failure.
- **firebase.js** — reads `serviceAccountKey.json` (Firebase credentials, not in Git), initializes `firebase-admin`, exports the storage `bucket`.
- **community.js** — the community rules:
  - `getRules()` reads the settings above from `.env` (with defaults).
  - `POINTS = { pyq: 15, note: 10, ppt: 8 }`.
  - `branchFromRoll("AM.SC.U4CSE23140")` → `"CSE"` using a regex that takes the letters right before the last 5 digits.

### 4.4 `middleware/`
- **authMiddleware.js** — reads `Authorization: Bearer <token>`. No token → `401 Access Denied`. Verifies with `jwt.verify(token, JWT_SECRET)`. Success → sets `req.user = { id, name, role, branch }` and calls `next()`. Bad token → 400.
- **roleMiddleware.js → `adminOnly`** — looks up the user in the DB; if `role !== "admin"` → `403 Admins only`. Otherwise `next()`.

Example route using both: `router.get("/all", authMiddleware, adminOnly, getAllMaterials)` — runs left to right.

### 4.5 `models/` — the database collections

| Model (file) | MongoDB collection | Important fields |
|---|---|---|
| **User** | `users` | name, email (unique), rollNumber, branch, password (bcrypt hash), role (`student`/`admin`) |
| **Material** | `materials` | title, branch, type (`note`/`ppt`/`pyq`), uploadedBy (name), uploaderId (→User), releaseDate, fileUrl, status (`pending`/`approved`/`rejected`/`revision`/`reported`), approvedBy (`moderator`/`community`/`trusted`), reviewNotes, upvotes [UserIds], reports [{userId, reason, createdAt}], pointsAwarded, timestamps |
| **Progress** | `progresses` | userId, branch, progressPercent, confidence (High/Medium/Low), lastUpdated, prepSubjects [{subject, examDate, confidence}] |
| **Result** | `results` | studentId, subject, marks, totalMarks, percentage, uploadedAt |
| **Leaderboard** | `leaderboards` | studentId (→User), score (XP), contributions (approved uploads), rank, flagged |
| **Notification** | `notifications` | message, audience (`All Users` or branch code), priority, createdBy, createdAt, readBy [UserIds] |
| **Discussion** | `discussions` | title, body, author, branch, tags [], comments [{author, text, createdAt}], commentsCount, createdAt |
| **Branch** | `branches` | branchName, branchCode, timestamps |
| **SecurityLog** | `securitylogs` | userId (→User), eventType (Login Success / Login Failure / Password Reset / Account Lock / Admin Action), ipAddress, details, timestamps |

(Mongoose automatically makes collection names lowercase + plural: `Progress` → `progresses`.)

### 4.6 `controllers/` + `routes/` — every endpoint

#### Auth — `authController.js`, `/api/auth`
| Endpoint | Who | What happens |
|---|---|---|
| `GET /rules` | public | returns community rules (email domain, branches, thresholds) for the signup/upload screens |
| `POST /register` | public | checks all fields → email must end with allowed domain → branch read from roll number, must be allowed (CSE) → email not already used → bcrypt hash → creates user with role **always "student"** → security log |
| `POST /login` | public | find user by email (log "Login Failure" if not found) → bcrypt compare (log failure if wrong) → log "Login Success" → sign JWT (7 days) → return token, role, name, branch |
| `GET /me` | logged in | returns your profile (without password) |
| `PUT /profile` | logged in | updates only name, phone, year, and email (must stay college domain). Role/branch/roll can't be changed → prevents self-promotion |

#### Materials — `uploadController.js`, `/api/upload`
| Endpoint | Who | What happens |
|---|---|---|
| `POST /` | student | Multer reads file → reject duplicate title (409) → upload file to Firebase → compute **release date** (if exam date given: notes/slides 7 days before, PYQs 2 days before) → if uploader's XP ≥ 150 (trusted) status = `approved` + points awarded, else `pending` → save to MongoDB |
| `GET /` | student | only **your branch**, only `approved/pending/revision`, only if release date has passed; returns `upvoteCount`, `upvoted`, `reported` (not raw voter lists — privacy) |
| `POST /:id/upvote` | student | can't upvote own upload; toggles your vote; if pending and votes reach 3 → `approved` by `community` + points to uploader |
| `POST /:id/report` | student | reason required, one report per student; at 3 reports → status `reported` (hidden from students) |
| `GET /all` | admin | every material with upvote count and report reasons |
| `PUT /:id/status` | admin | approve / reject / revision with notes; approving clears reports and awards points (only once) |

`utils/points.js` → `awardApprovalPoints(material)`: if not already awarded, `$inc` the uploader's leaderboard score by `POINTS[type]` and contributions by 1, then mark `pointsAwarded = true` (prevents double points).

#### Progress — `progressController.js`, `/api/progress`
| Endpoint | Who | What |
|---|---|---|
| `GET /` | student | your progress; auto-creates a blank record the first time |
| `POST /update` | student | set progress %; confidence auto = High ≥80, Medium ≥60, else Low |
| `GET /all` | admin | everyone's progress (Students page) |
| `POST /prep/add` | student | add exam subject {subject, examDate, confidence} to `prepSubjects` |
| `PATCH /prep/update/:id` | student | change date/confidence of a subject (sub-document by id) |
| `DELETE /prep/delete/:id` | student | remove subject |

#### Results — `resultController.js`, `/api/result`
- `POST /upload` — student logs marks → `percentage = round(marks/totalMarks*100)` → saves Result → **automatically updates Progress** (progressPercent = latest %, confidence from thresholds).
- `GET /` — your results sorted by date (used for the trend chart).
- `GET /:studentId` — admin views a student's results.

#### Leaderboard — `leaderboardController.js`, `/api/leaderboard`
- `GET /` — all entries sorted by score, joined with user names (`populate`), formatted as {name, branch, contributions, score, rank}.
- `POST /update` — **admin only** now (before, any student could give themselves points).
- `GET /admin` — full entries with email; `PUT /flag` — admin flags/unflags a suspicious student.

#### Announcements — `notificationController.js`, `/api/notification`
- `POST /create` (admin) — {message, audience, priority}.
- `GET /` — returns announcements where audience = "All Users" OR your branch, newest first, with `read: true/false` for you.
- `POST /:id/read` — adds you to `readBy` (`$addToSet` = no duplicates). Powers the bell's unread count.

#### Discussions — `discussionController.js`, `/api/discussions`
- `GET /` list, `GET /:id` one thread, `POST /` create (author/branch taken from the token, not from the request — can't fake identity), `POST /:id/comment` uses `$push` to add a comment and `$inc` commentsCount.

#### Admin stats — `adminController.js`, `/api/admin/stats`
Counts with `countDocuments` (approved, pending, rejected), distinct uploaders, and an **aggregation pipeline**: `$group` by branch → `$sum` → `$sort` — this feeds the dashboard bar chart and donut chart.

#### Users — `userController.js`, `/api/users` (admin)
- `GET /all` — all users without passwords.
- `PUT /:id/role` — promote to admin / demote to student. Rules: can't change your own role, must keep at least one admin, writes an "Admin Action" security log.

#### Branches, Security logs
- `branchController` — list / add / delete branches.
- `securityLogController` — `getAllSecurityLogs` (admin) and `addSecurityLog(...)` helper used by login/register/profile/role changes.

### 4.7 `scripts/makeAdmin.js`
Solves "who is the first admin?". After you sign up normally:
`npm --prefix Backend run make-admin -- you@college.edu` → connects to MongoDB → sets that user's role to admin. From then on, admins promote others inside the app.

---

## PART 5 — FRONTEND, file by file

### 5.1 Startup chain
1. **`index.html`** — the only HTML page. Has `<div id="root">` and loads `src/main.jsx`. Also loads Google Fonts (Inter, Space Grotesk).
2. **`main.jsx`** — `createRoot(...).render(<BrowserRouter><App/></BrowserRouter>)` — starts React inside `#root` with routing enabled.
3. **`App.jsx`** — wraps everything in providers (Auth → User → Toast) and defines all routes:

| URL | Page | Protected by |
|---|---|---|
| `/login`, `/signup` | Login, Signup | public |
| `/` | Dashboard | RequireStudent + StudentLayout |
| `/resources` | Study Materials | ″ |
| `/discussions`, `/discussions/:id` | Forum list / thread | ″ |
| `/progress` | Progress | ″ |
| `/leaderboard` | Leaderboard | ″ |
| `/profile` | Profile | ″ |
| `/admin` … `/admin/branches` | 7 admin pages | RequireAdmin + AdminLayout |
| anything else | redirect to `/login` | |

### 5.2 `api.js` — the bridge to the backend
- Creates Axios with `baseURL: "http://localhost:5000/api"`.
- **Request interceptor** adds `Authorization: Bearer <token>` from `localStorage` to every call.
- `DEMO_MODE` — if started with `npm run demo`, Axios uses `demo/mockApi.js` instead of the real network (see 5.9).

### 5.3 `utils/guards.jsx` — route protection
- `RequireStudent` — no user → redirect `/login`; admin → redirect `/admin`.
- `RequireAdmin` — no user → `/login`; student → `/`.
Note: this is only for user experience; **real security is on the backend** (middleware), because anyone can edit frontend code in their browser.

### 5.4 Contexts (shared state)
- **AuthContext** — `login()` (POST /auth/login, saves token to localStorage + user to sessionStorage, redirects by role), `register()` (POST /auth/register), `logout()` (clears storage → /login). Exposes `user`.
- **UserContext** — fetches the full profile from `GET /auth/me` on load and after login.
- **GameContext** — gamification for students: fetches `/leaderboard`, finds you, computes **XP = your score**, **level** (from `utils/gamification.js`), **rank**, the person just **ahead** of you, **streak**; `refresh()` re-fetches after uploads and fires confetti on level-up.
- **FocusContext** — Pomodoro timer (25-min focus, 5/15-min breaks). Stores end time in localStorage so it survives page changes/refresh; on completion adds focus minutes, shows a toast, confetti. Shows the countdown in the browser tab title.
- **ToastProvider** (`components/ui/Toast.jsx`) — `toast({title, description, type})` pop-up notifications (replaced old `alert()`s).

### 5.5 Layouts
- **StudentLayout** — Sidebar + Topbar + page area (`<Outlet/>` = the current page) + MobileNav + CommandPalette + animated background. Wraps pages in `GameProvider` and `FocusProvider`. Each route change fades the page in.
- **AdminLayout** — same idea with AdminSidebar/AdminTopbar; title comes from the current URL.

### 5.6 Components
- **NavSidebar** — shared sidebar (logo, sections, animated active highlight, logout). **Sidebar** (student) adds the Level/XP card; **AdminSidebar** adds a tip card.
- **Topbar** — search button (Ctrl+K), demo badge, streak 🔥, Focus timer chip, NotificationBell, avatar.
- **NotificationBell** — GET /notification, unread badge, dropdown, mark as read (POST /notification/:id/read).
- **FocusTimer** — `FocusChip` (topbar) and `FocusFace` (dashboard) using FocusContext.
- **CommandPalette** — Ctrl+K search over pages, actions and materials (GET /upload), keyboard navigation.
- **Countdown** — live days/hours/mins/secs to next exam.
- **MobileNav** — bottom tab bar on phones.
- **AuthShell** — split-screen layout for login/signup with floating feature cards.
- **AuroraBackground** — animated gradient blobs + grid.
- **ui/** (design system): `Card` (glass card with cursor glow), `PageHeader`, `AnimatedNumber` (count-up), `ProgressRing` (SVG circular progress), `Avatar` (initials + colour from name), `Modal` (dialog, Esc to close), `Segmented` (pill tabs), `Skeleton` (loading shimmer), `EmptyState`, `motion.js` (shared animation presets).

### 5.7 Utils
- **gamification.js** — `LEVELS` (Fresher → Legend), `levelFor(xp)`, daily activity + streak (stored in browser localStorage), `computeBadges(...)` (8 achievements), tip of the day, greeting.
- **rules.js** — `useRules()` fetches `/auth/rules` once; `branchFromRoll()` (same logic as backend, for instant feedback on signup).
- **ui.js** — colours/icons for material types, confidence, statuses, security events; date helpers (`timeAgo`, `daysUntil`).
- **confetti.js** — `celebrate()` / `bigCelebrate()` (skipped if user prefers reduced motion).

### 5.8 Pages — what each does and which APIs it calls

**Student**
| Page | What the user does | Backend calls |
|---|---|---|
| **Login** | choose Student/Admin tab, email + password; shake animation on error | `POST /auth/login` |
| **Signup** | name, college email, roll number (branch auto-detected, must be CSE), password strength meter | `GET /auth/rules`, `POST /auth/register` |
| **Dashboard** | greeting hero with level ring & XP gap to next rank, stat tiles, next-exam live countdown, quick actions, fresh materials, announcements, focus timer, readiness ring, mini leaderboard, tip of the day | `GET /upload`, `/notification`, `/progress`, `/result`, `/leaderboard` |
| **Resources** (Study Materials) | search, filter by type, sort; upload with drag-and-drop (shows XP reward and release rule); upvote "Helpful"; report with reason | `GET /upload`, `POST /upload`, `POST /upload/:id/upvote`, `POST /upload/:id/report` |
| **Discussions** | search, Latest/Popular/Unanswered, tag filters, trending; create post with tags | `GET /discussions`, `POST /discussions` |
| **DiscussionDetail** | chat-style thread, quick replies, send comment | `GET /discussions/:id`, `POST /discussions/:id/comment` |
| **Progress** | summary tiles, performance trend chart, readiness ring, per-subject bar chart, insight message, exam prep tracker (change confidence, edit date, delete), log result modal | `GET /progress`, `GET /result`, `POST /result/upload`, `POST/PATCH/DELETE /progress/prep/...` |
| **Leaderboard** | your standing + XP needed to pass the next person, animated podium, full ranking, branch filter, how to earn XP | `GET /leaderboard`, `GET /auth/rules` |
| **Profile** | banner, stats, achievements (badges), study heatmap, edit personal details (roll/branch locked) | `GET /auth/me`, `PUT /auth/profile`, `GET /result`, `/discussions`, `/progress` |

**Admin (student moderators)**
| Page | What | Backend calls |
|---|---|---|
| **AdminDashboard** | stat tiles, uploads-by-branch bar chart, approval donut, quick actions, recent activity | `GET /admin/stats`, `GET /security-logs` |
| **AdminContent** (Content Review) | queues: Pending / Reported / Revision / Approved / Rejected; preview, see upvotes & report reasons, approve / revise / reject with notes, auto-jump to next item | `GET /upload/all`, `PUT /upload/:id/status` |
| **AdminStudents** | list with progress bars, confidence split, student details + results chart, **Make / Remove moderator** | `GET /users/all`, `/progress/all`, `/result/:id`, `PUT /users/:id/role` |
| **AdminLeaderboard** | ranking with flag switch | `GET /leaderboard/admin`, `PUT /leaderboard/flag` |
| **AdminAnnouncements** | compose with live student preview, audience by branch, high priority, save draft | `GET/POST /notification`, `GET /branch` |
| **AdminSecurityLogs** | filter by time range/event, search, stats | `GET /security-logs` |
| **AdminBranches** | add/delete branches | `GET /branch`, `POST /branch/add`, `DELETE /branch/:id` |

### 5.9 Demo mode (`npm run demo`) — be honest about this
- `Frontend/.env.demo` sets `VITE_DEMO=true`; `api.js` then swaps Axios's network adapter for `demo/mockApi.js`.
- `mockApi.js` is a **fake backend inside the browser**: same endpoints, same rules, sample CSE students/materials, data kept in memory (resets on refresh). A "Demo data" badge shows in the top bar.
- Purpose: present the UI without internet/database. **It does not touch MongoDB.** To show the real database, run the real backend (Part 7).

---

## PART 6 — End-to-end walkthroughs (practice saying these)

### A. Login
1. User types email/password → `Login.jsx` calls `login()` from AuthContext.
2. Axios `POST http://localhost:5000/api/auth/login`.
3. `authController.login` finds user, bcrypt-compares password, writes a SecurityLog, signs JWT.
4. Frontend saves token in localStorage, user in sessionStorage, redirects to `/` (student) or `/admin`.
5. Every later request carries `Authorization: Bearer <token>`.

### B. Uploading a material
1. Resources page → Upload modal → file + title + type (+ optional exam date) → `FormData` → `POST /api/upload`.
2. `authMiddleware` → Multer reads file → controller checks duplicates → uploads to Firebase → calculates release date → decides `approved` (trusted, 150+ XP) or `pending` → saves Material → returns JSON.
3. Frontend: confetti + toast ("Published +10 XP" or "pending approval"), card appears.
4. Later: 3 upvotes **or** a moderator approval → status `approved` → `awardApprovalPoints` adds XP → leaderboard updates → student may level up (confetti).

### C. Logging an exam result
`POST /api/result/upload` {subject, marks, totalMarks} → percentage calculated → Result saved → Progress updated (readiness + confidence) → Progress page re-fetches → trend chart and readiness ring move.

### D. Admin announcement reaching a student
Admin publishes {message, audience:"CSE", priority} → saved in `notifications` → student's bell calls `GET /notification` → backend returns items with audience "All Users" or "CSE" → unread count badge → clicking marks as read (`readBy`).

### E. Community moderation
Student reports → `reports` array grows → at 3 → status `reported` → disappears from `GET /upload` → appears in Admin → Content Review → Reported, with reasons → moderator approves (reports cleared) or rejects.

---

## PART 7 — Running it and SHOWING THE DATABASE to your lecturer

### 7.1 Prerequisites (one time)
- `Backend/.env.local` filled in with YOUR MongoDB Atlas connection string (it overrides `Backend/.env`).
- Firebase is optional: without `Backend/config/serviceAccountKey.json`, uploaded files are saved in `Backend/storage/` and served at `http://localhost:5000/files/...` — the startup log says "💾 File uploads: local disk".
- Install packages once:
```bash
npm --prefix Backend install
```
```bash
npm --prefix Frontend install
```

### 7.2 Start the real system (two terminals, from the PrepTrack folder)
Terminal 1 — backend:
```bash
npm --prefix Backend run dev
```
You should see **"✅ MongoDB Connected"** and **"Server running on port 5000"**. ← show this to the lecturer: it proves the server connected to the cloud database.

Terminal 2 — frontend:
```bash
npm --prefix Frontend run dev
```
Open http://localhost:3000.

First admin (once): sign up normally, then
```bash
npm --prefix Backend run make-admin -- your.email@college.edu
```

### 7.3 Show the database — Option 1: MongoDB Atlas website (easiest)
1. Go to **https://cloud.mongodb.com** and log in with the account that created the cluster.
2. Left menu → **Database** (or **Clusters**) → click **Browse Collections** on your cluster.
3. Pick the database (the name at the end of MONGO_URI, often `test` if none was given) → you'll see collections: `users`, `materials`, `progresses`, `results`, `leaderboards`, `notifications`, `discussions`, `branches`, `securitylogs`.
4. Click `users` → open a document → point out **the password is a bcrypt hash, not plain text**.
5. Live demo: sign up / upload / log a result in the app → click **Refresh** in Atlas → the new document appears. This proves the app writes to the real DB.
6. Use the **Filter** box, e.g. `{ "status": "pending" }` on `materials`, or `{ "eventType": "Login Failure" }` on `securitylogs`.

### 7.4 Option 2: MongoDB Compass (desktop app)
1. Install **MongoDB Compass** (free, from mongodb.com).
2. Click **New Connection** → paste your `MONGO_URI` from `Backend/.env` → Connect.
3. Same collections; you can filter, sort, and view schema.
(If Atlas refuses the connection: Atlas → **Network Access** → add your current IP address.)

### 7.5 Show the API directly (impresses examiners)
- In the browser: http://localhost:5000/api/auth/rules → raw JSON (public endpoint).
- Open the app → press **F12** → **Network** tab → click around → you'll see each request (`upload`, `leaderboard`...), its method, status code, request headers (the `Authorization: Bearer …` token) and JSON response. Great way to *show* frontend↔backend communication.
- Paste the token at **jwt.io** to show what's inside a JWT (id, role, branch, expiry).

---

## PART 8 — Security features (list these confidently)
1. Passwords hashed with **bcrypt** (salt rounds 10).
2. **JWT** login tokens, expire after 7 days; secret kept in `.env`.
3. **authMiddleware** on every private route; **adminOnly** checks role in the database.
4. Signup restricted to **college email domain** and **CSE roll numbers**; role always "student".
5. Profile update **whitelists** fields (can't change role/branch).
6. Points can't be self-awarded; only given on approval, only once.
7. Upvote/report rules: one per student, can't upvote own upload.
8. **Security logs** for logins (success/failure), registrations, profile updates, role changes, with IP.
9. Students only see their **own branch's** materials/announcements.
10. Secrets in `.env` (not in code); passwords never sent back in responses (`.select("-password")`).

**Be ready to admit (shows maturity):** the old `.env` was once committed to GitHub, so credentials should be rotated; JWT stored in localStorage could be read by malicious scripts (httpOnly cookies are a stronger option); no rate limiting on login yet.

---

## PART 9 — Likely viva questions with short answers

1. **What is your project?** A student-run exam-prep platform: materials, progress tracking, forum, leaderboard, with community moderation — piloted for CSE.
2. **Architecture?** Three-tier: React frontend, Express REST API, MongoDB Atlas + Firebase Storage.
3. **Why MongoDB over SQL?** Flexible JSON documents, nested data (comments, prepSubjects) fits naturally, free cloud hosting, works natively with JavaScript.
4. **What is Mongoose?** ODM (Object Data Modeling) library — schemas, validation, and query methods for MongoDB.
5. **How does the frontend talk to the backend?** HTTP requests via Axios to `localhost:5000/api/...`, JSON in/out, token in the Authorization header.
6. **What is JWT and why?** Signed token proving identity; stateless, scalable; tamper-proof via signature.
7. **How are passwords stored?** bcrypt hash with salt; compared with `bcrypt.compare`.
8. **What is middleware?** Functions that run between the request and the controller — e.g. authentication and admin checks.
9. **What is CORS?** Browser rule blocking cross-origin requests; we allow localhost:3000 on the server.
10. **What is React state/useEffect?** State = data that re-renders the UI when changed; useEffect = run code (like fetching) after rendering.
11. **What is a component? props?** Reusable UI function; props are its inputs.
12. **What is Context API?** Global shared state (logged-in user, XP, timer) without prop-drilling.
13. **How are files stored?** Multer receives → Firebase Storage saves → URL stored in MongoDB.
14. **What is the release-date logic?** With an exam date: notes/slides unlock 7 days before, PYQs 2 days before — prevents last-minute dumping and spreads revision.
15. **How is readiness calculated?** From the latest result percentage; confidence High ≥80, Medium ≥60, Low below.
16. **How does the leaderboard work?** Approved uploads give points (PYQ 15, notes 10, slides 8); sorted by score; admins can flag cheaters.
17. **Who is admin? Why no faculty?** Student moderators. First one created by a setup script; others promoted in-app; trusted uploaders and community votes reduce moderator workload.
18. **How do you stop abuse?** Approval-before-points, one vote/report per student, auto-hide after 3 reports, flagging, security logs, DB role checks.
19. **What is the aggregation pipeline used for?** Admin stats: grouping materials by branch and counting them.
20. **What is `populate()`?** Replaces an ObjectId reference with the referenced document (e.g. leaderboard entry → user's name).
21. **Difference between PUT and PATCH?** PUT replaces/updates a resource; PATCH changes part of it (we use PATCH to change one prep subject).
22. **What's an SPA?** Single-page app — one HTML page, React swaps views on URL change.
23. **What is Vite?** Build tool/dev server; hot reload in development, optimized bundle for production.
24. **What is Tailwind?** Utility-first CSS framework.
25. **How would you deploy it?** Frontend on Vercel/Netlify, backend on Render/Railway, DB on Atlas, files on Firebase; set env variables on the host.
26. **How would you scale to more branches?** Add codes to `ALLOWED_BRANCHES`; data is already separated by branch.
27. **What is demo mode?** A fake in-browser backend for presentations; doesn't touch the DB.
28. **Testing?** Production build checks; backend tested end-to-end against a temporary in-memory MongoDB (27 checks: signup rules, admin roles, upvotes, reports, points); manual UI testing on desktop and mobile.
29. **Future work?** Real-time chat (WebSockets), mobile app, rate limiting, AI-based recommendations of materials, plagiarism/duplicate file detection, email notifications.
30. **Which SE model and why?** Iterative/incremental — features delivered in usable increments with feedback after each.

---

## PART 10 — 2-minute demo script for tomorrow
1. **Architecture slide** (Part 1.2 diagram) — 30 s.
2. Terminal: start backend → point at "MongoDB Connected" — 15 s.
3. Browser: sign up with a non-college email → blocked; with CSE roll → works — 20 s.
4. Login → Dashboard (level, streak, countdown, focus timer) — 20 s.
5. Upload a material → confetti → show it in **Atlas `materials` collection** — 30 s.
6. Log an exam result → Progress chart updates → show **`results` + `progresses`** in Atlas — 20 s.
7. Log in as admin → Content Review approve → Leaderboard points go up → **Security Logs** — 30 s.
8. F12 Network tab → show one request with the Bearer token and JSON response — 15 s.

Good luck! 🎯
