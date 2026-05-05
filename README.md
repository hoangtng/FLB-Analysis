# FLB-Analysis

A full-stack flight delay analytics platform built for Hawaiian Airlines as a Computer Science capstone project at the University of Hawaiʻi at Mānoa.

The system ingests raw Excel flight data, stores it in MongoDB, and provides two purpose-built dashboards — an Ops View for daily monitoring and a Leadership View for trend analysis — powered by GPT-4o AI analysis.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State | Zustand, React Query (TanStack) |
| Charts | Recharts |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB 7 |
| AI | OpenAI GPT-4o |
| Infrastructure | Docker, nginx |

---

## Prerequisites

- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- An [OpenAI API key](https://platform.openai.com/api-keys)

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/hoangtng/FLB-Analysis.git
cd FLB-Analysis
```

### 2. Create environment file

Create a `.env` file in the `backend/` folder:

```bash
# backend/.env
OPENAI_API_KEY=sk-your-key-here
MONGO_URI=mongodb://localhost:27017/flbops
PORT=4000
```

> **Never commit this file.** It is listed in `.gitignore`.

### 3. Start MongoDB with Docker

```bash
docker run -d -p 27017:27017 --name flb-mongo mongo:7
```

### 4. Start the backend

```bash
cd backend
npm install
npm run dev
```

You should see:

```
✅ OpenAI API key loaded
✅ MongoDB connected
🚀 Backend running on http://localhost:4000
```

### 5. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 6. Upload your data

Drop your FLB Excel file (`.xlsx`) onto the upload screen. The app will parse it and populate the dashboard.

---