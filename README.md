# 🎓 AlumniConnect AI

A full-stack alumni networking platform powered by AI — connecting students with alumni mentors, job opportunities, and personalized career guidance.

---

## 🚀 Quick Setup

### Prerequisites
- **Node.js** v18+ — [Download](https://nodejs.org)
- **MongoDB** — choose one option below:
  - ☁️ **MongoDB Atlas** (free, recommended) — [cloud.mongodb.com](https://cloud.mongodb.com)
  - 💻 **Local MongoDB** — [Download Community Edition](https://www.mongodb.com/try/download/community)

---

## ⚡ Step 1 — Set Up MongoDB

### Option A: MongoDB Atlas (Cloud, Free)
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → Create free account
2. Create a **free M0 cluster** (takes ~3 min)
3. Add a database user: **Database Access** → Add New User
4. Allow all IPs: **Network Access** → Add IP Address → `0.0.0.0/0`
5. Click **Connect** → **Drivers** → copy the connection string
6. Update `backend/.env`:
   ```
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/alumniconnect
   ```

### Option B: Local MongoDB
1. Download & install from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Start MongoDB service:
   ```powershell
   net start MongoDB
   # or manually:
   mongod --dbpath "C:\data\db"
   ```
3. The default `MONGO_URI` in `.env` will work as-is.

---

## ⚡ Step 2 — Configure Environment

**`backend/.env`** is already created. Verify/update:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/alumniconnect   # or Atlas URI
JWT_SECRET=alumniconnect_jwt_secret_2024_secure_key
JWT_EXPIRE=7d
OPENAI_API_KEY=                                     # optional — leave empty for mock AI
CLIENT_URL=http://localhost:5173
```

---

## ⚡ Step 3 — Install & Run

### Backend
```bash
cd backend
npm install
npm run dev         # starts on http://localhost:5000
```

### Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev         # starts on http://localhost:5173
```

### Seed Demo Data (optional but recommended)
```bash
cd backend
npm run seed
```
This creates demo users you can log in with immediately.

---

## 🔑 Demo Accounts (after seeding)

| Role    | Email                        | Password      |
|---------|------------------------------|---------------|
| 👨‍🎓 Student | `arjun@student.com`         | `password123` |
| 🎓 Alumni  | `priya@alumni.com`          | `password123` |
| 🛡️ Admin   | `admin@alumniconnect.com`   | `admin123`    |

---

## 🤖 AI Features

The platform works in **two modes**:

| Mode | How to activate | What works |
|------|----------------|------------|
| **Mock AI** (default) | Leave `OPENAI_API_KEY` empty | All features with pre-built responses |
| **Live AI** | Add real OpenAI key to `.env` | GPT-4o-mini powered career paths & chatbot |

---

## 📁 Project Structure

```
int219/
├── backend/
│   ├── server.js               # Express + Socket.IO entry point
│   ├── .env                    # Environment variables
│   └── src/
│       ├── config/db.js        # MongoDB connection
│       ├── controllers/        # Route handlers (8 controllers)
│       ├── middleware/         # Auth (JWT) + error handler
│       ├── models/             # Mongoose schemas (6 models)
│       ├── routes/             # Express routers (10 routes)
│       ├── services/aiService.js # OpenAI integration
│       └── utils/
│           ├── matchingAlgorithm.js  # Jaccard similarity matching
│           └── seedData.js           # Demo data seeder
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx             # Routes + layout
        ├── index.css           # Design system (dark glassmorphism)
        ├── api/axios.js        # Axios + JWT interceptor
        ├── context/
        │   ├── AuthContext.jsx # Global auth state
        │   └── SocketContext.jsx # Socket.IO real-time
        ├── components/
        │   ├── Sidebar.jsx     # Navigation sidebar
        │   └── Navbar.jsx      # Top bar + notifications
        └── pages/
            ├── LoginPage.jsx
            ├── RegisterPage.jsx (2-step)
            ├── DashboardPage.jsx
            ├── AlumniPage.jsx  (browse + AI matches)
            ├── MentorshipPage.jsx (request lifecycle)
            ├── MessagesPage.jsx (real-time chat)
            ├── JobsPage.jsx    (jobs + referrals)
            ├── EventsPage.jsx  (RSVP)
            ├── CareerAIPage.jsx (generator + chatbot)
            └── ProfilePage.jsx
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/alumni` | Browse alumni |
| GET | `/api/alumni/matches` | AI-matched mentors |
| POST | `/api/mentorship/request` | Request mentor |
| GET | `/api/messages/conversations` | Inbox |
| POST | `/api/messages/send` | Send message |
| GET | `/api/jobs` | List jobs |
| POST | `/api/jobs` | Post job (alumni) |
| GET | `/api/events` | List events |
| POST | `/api/ai/career-path` | Generate career path |
| POST | `/api/ai/chat` | CareerBot chat |
| POST | `/api/ai/cv-review` | Analyze uploaded CV (PDF/DOCX/TXT up to 10MB) |
| POST | `/api/ai/video-cv-review` | Analyze Video CV link + transcript/summary |
| GET | `/api/admin/stats` | Dashboard stats |

---

## ✨ Feature Highlights

- 🔐 **JWT Authentication** with role-based access (student / alumni / admin)
- 🤖 **AI Career Path Generator** — personalized roadmaps (OpenAI or mock)
- 🤝 **Smart Mentorship Matching** — Jaccard similarity algorithm
- 💬 **Real-time Messaging** — Socket.IO with typing indicators & online presence
- 📅 **Events** — RSVP system with capacity tracking
- 💼 **Jobs & Referrals** — alumni post exclusive opportunities
- 🏆 **Gamification** — engagement scores, badges
- 🔔 **Live Notifications** — real-time push via Socket.IO
- 🛡️ **Admin Dashboard** — verify alumni, manage users

---

## ✅ CV/Video Analyzer Demo Checklist (V1)

- [ ] Open `Career AI` and switch to `CV / Video Analyzer`
- [ ] Upload a sample `.pdf`, `.docx`, or `.txt` CV under **10MB** with target role
- [ ] Confirm response shows overall score, category scores, strengths, weaknesses, and checklist
- [ ] Submit a valid video link with transcript/summary (combined min 80 chars)
- [ ] Confirm Video CV result includes practical next actions + rewritten bullets/opening script
- [ ] Try invalid input (bad URL/unsupported file) and verify graceful validation without server crash
