# Real Time Chat App

Full Stack Chatting App using **Socket.io** for real time communication.

**Tech Stack:** React JS (frontend) | Node.js + Express + Socket.io (backend) | MongoDB | Chakra UI

---

## Local Development

```bash
# 1. Install backend deps (repo root)
npm install

# 2. Install frontend deps
cd frontend && npm install && cd ..

# 3. Create a .env file at repo root
#    PORT=8001
#    MONGO_URI=mongodb+srv://<user>:<pass>@cluster...
#    JWT_SEC=<any_secret_string>

# 4. Start backend on http://localhost:8001
npm start

# 5. Start frontend on http://localhost:3000
cd frontend && npm start
```

Frontend proxies API + socket calls to `http://localhost:8001` in dev via `package.json` `proxy`.

---

## Deployment

Frontend → **Vercel**, Backend → **Render**. They connect via env vars (no code changes needed).

### A. Backend on Render

1. Push the repo to GitHub.
2. In Render (dashboard.render.com) → **New** → **Web Service** → connect your repo.
3. Set:
   - **Root Directory:** (leave empty / repo root)
   - **Runtime:** Node
   - **Build Command:** `npm install --legacy-peer-deps`
   - **Start Command:** `npm start`
4. Add **Environment Variables**:
   - `PORT` = `8001`
   - `MONGO_URI` = your MongoDB connection string
   - `JWT_SEC` = any secret string
   - `FRONTEND_URL` = your Vercel app URL, e.g. `https://your-app.vercel.app`
5. Click **Create Web Service**, wait for deploy. Copy your Render URL, e.g. `https://your-app.onrender.com`.

### B. Frontend on Vercel

1. In Vercel → **Add New Project** → import the same repo.
2. Set **Root Directory** to `frontend`.
3. Vercel auto-detects Create React App (build: `npm run build`, output: `build`).
4. Add **Environment Variables**:
   - `REACT_APP_API_URL` = your Render URL, e.g. `https://your-app.onrender.com`
   - `REACT_APP_SOCKET_URL` = your Render URL, e.g. `https://your-app.onrender.com`
5. Click **Deploy**. Your app is now live.

### C. Connect them

- Open the deployed Vercel app, sign up and chat — done.
- If API calls fail, double-check `REACT_APP_API_URL` on Vercel and `FRONTEND_URL` on Render match the deployed URLs exactly (no trailing slash).

---

## Screenshots

Registration / Login / Dashboard / User Search / Real Time Notifications / Typing Indicator / Group Chat / Group Admin controls.