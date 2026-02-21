# 💰 Budget Tracker AI

A full-stack personal finance web app with an AI-powered financial health advisor. Built from scratch in one week as part of my self-taught web development journey.

🔗 **Live Demo:** https://jojoisstudying.github.io/Budget-Tracker/

---

## ✨ Features

- 🔐 **User Authentication** — Sign up, login, JWT tokens, Remember Me
- 📁 **Multiple Budget Projects** — Create, rename, delete separate budget trackers
- 💸 **Transaction Management** — Add and delete income & expense transactions
- 📊 **Spending Overview Chart** — Doughnut chart breakdown by category
- 🤖 **AI Financial Advisor** — Analyzes your transactions, detects language, and assesses your financial health
- 💬 **AI Chatbot** — Ask personalized finance questions based on your actual data
- 📱 **Responsive Design** — Works on desktop and mobile (bottom nav on mobile)

---

## 🤖 How the AI Works

1. **Auto-analyzes** your transactions when you open a budget
2. **Detects language** (Indonesian/English) from your transaction descriptions
3. **Identifies income** from your data and asks for confirmation
4. **Shows a health dashboard** with income, expenses, savings rate, and a status (✅ Healthy / ⚠️ Warning / 🔴 Deficit)
5. **Opens a chatbot** that knows your full transaction history and gives personalized advice

---

## 🛠️ Tech Stack

### Frontend
- HTML, CSS, JavaScript (vanilla)
- Chart.js
- Hosted on **GitHub Pages**

### Backend
- Node.js + Express.js
- JWT Authentication
- bcryptjs for password hashing
- Hosted on **Railway**

### Database
- MongoDB with Mongoose ODM
- Hosted on **MongoDB Atlas**

### AI
- GitHub Models API (GPT-4o mini)
- Token stored securely as Railway environment variable

---

## 🏗️ Architecture

```
User → GitHub Pages (Frontend)
     → API calls → Railway (Backend/Node.js)
                → MongoDB Atlas (Database)
                → GitHub Models API (AI)
```

---

## 🚀 Getting Started (Local)

### Prerequisites
- Node.js installed
- MongoDB Atlas account
- GitHub Models API token

### Backend Setup
```bash
cd budget-tracker-backend
npm install
```

Create a `.env` file:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GITHUB_TOKEN=your_github_token
```

```bash
node server.js
```

### Frontend Setup
Just open `index.html` with Live Server — no build step needed.

---

## 📁 Project Structure

```
Frontend (Budget-Tracker/)
├── index.html        # Budget tracker + AI dashboard
├── dashboard.html    # Main dashboard with project cards
├── login.html        # Login / Register
├── script.js         # All frontend logic + AI integration
└── style.css         # Styles

Backend (budget-tracker-backend/)
├── server.js         # Express server, all API routes
└── package.json
```

---

## 🔒 Security

- Passwords hashed with bcryptjs
- JWT tokens for session management
- AI API token stored as server environment variable (never exposed to frontend)
- GitHub push protection enabled

---

## 📈 What I Learned Building This

- HTML, CSS, JavaScript DOM manipulation
- CSS Grid, Flexbox, responsive design, media queries
- REST API design with Node.js + Express
- MongoDB database with Mongoose ODM
- JWT authentication flow
- Environment variables and security best practices
- Git workflow and GitHub Pages deployment
- Cloud deployment with Railway + MongoDB Atlas
- AI API integration (GitHub Models / GPT-4o mini)
- Debugging across frontend, backend, and cloud logs
- CORS configuration
- Full-stack architecture thinking

---

## 👨‍💻 Author

**Jojo** — First year IT student, building real things one project at a time.

> *"I didn't just build a budget tracker. I built a full-stack AI-powered SaaS application — in one week."*

i use ai to write ts gng

---

## 📄 License

MIT
