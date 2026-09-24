# ChatX - Real Time Chat App

Full-stack production-oriented chat application using **Socket.io** for real-time
communication.

**Tech Stack:** React JS (frontend) | Node.js + Express + Socket.io (backend) | MongoDB | Chakra UI

---

## Features

### Authentication & Security
- **Google OAuth** (Google Identity Services - sign in with a single click)
- Email + password signup with **email verification (6-digit OTP)**
- **Forgot password / reset password** via email OTP
- Password strength enforcement (8+ chars, one letter + one number)
- **bcrypt** password hashing (auto-migrates legacy SHA-256 users on login)
- **Account lockout** after 5 failed login attempts (15 min)
- **Rate limiting** on auth, OTP and API endpoints
- Security headers (**helmet**), httpOnly auth cookie, permissive CORS locked to configured origins
- Server-side validation + admin authorization on all group operations

### Chat
- 1-on-1 and group chats with real-time delivery (Socket.io)
- **Typing indicator**
- **Read receipts** (✓ sent / ✓✓ seen)
- **Unread message badges** per chat
- **Message reactions** (emoji)
- **Edit & delete** your own messages (propagates live to all clients)
- **Image attachments** directly in chat (Cloudinary)
- **Message search** within a chat
- **Pagination** / "load older messages"
- **Online / last-seen presence** everywhere (chat list, header, profile)

### Groups
- Create, rename, add/remove members
- **Group picture**
- **Admin-only controls** enforced server-side
- **Transfer admin**, **delete group**, leave group

### Profile & Account
- Edit name / profile picture
- **Change password**
- **Block / unblock users** (blocked users cannot message you or be searched)
- **Delete account** (wipes chats and messages)

---

## Local Development

```bash
# 1. Install backend deps (repo root)
npm install

# 2. Install frontend deps
cd frontend && npm install && cd ..

# 3. Copy .env.example to .env and fill in the values
cp .env.example .env
```

Minimal `.env` for local dev (email/Google are optional — OTPs print to console):

```
PORT=8001
MONGO_URI=mongodb+srv://<user>:<pass>@cluster...
JWT_SEC=<any_long_random_string>
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

```bash
# 4. Start backend on http://localhost:8001
npm start

# 5. Start frontend on http://localhost:3000
cd frontend && npm start
```

Frontend proxies API + socket calls to `http://localhost:8001` in dev via
`frontend/package.json` `proxy`.

---

## Enabling extra features

### Email (OTP)
Set SMTP variables (any provider — Gmail app password, Zoho, Mailgun, SendGrid...):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="ChatX <you@gmail.com>"
```

If these are unset, OTP codes are logged to the server console (dev only).

### Google OAuth
1. Create an OAuth client at
   https://console.cloud.google.com/apis/credentials → **OAuth client ID** → Web application.
   Add your frontend URL (e.g. `http://localhost:3000`) as an Authorized JavaScript origin.
2. Set on the **backend**: `GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com`
3. Set on the **frontend**: `REACT_APP_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com`

### Cloudinary (profile pictures & chat image attachments)
1. Create an **unsigned upload preset** in your Cloudinary console.
2. Set on the **frontend**:
   ```
   REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud
   REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_preset
   ```
   (Defaults to the app's existing cloud/preset if unset.)

---

## Deployment

Frontend → **Vercel**, Backend → **Render**.

### A. Backend on Render

1. Push the repo to GitHub.
2. Render → **New** → **Web Service** → connect your repo.
3. Set:
   - **Root Directory:** (repo root)
   - **Runtime:** Node
   - **Build Command:** `npm install --legacy-peer-deps`
   - **Start Command:** `npm start`
4. Add **Environment Variables**: `PORT` (`8001`), `MONGO_URI`, `JWT_SEC`,
   `NODE_ENV=production`, `FRONTEND_URL` (your Vercel URL),
   plus `SMTP_*`, `GOOGLE_CLIENT_ID` if enabled.
5. Deploy and copy your Render URL.

### B. Frontend on Vercel

1. Vercel → **Add New Project** → import the same repo.
2. **Root Directory:** `frontend`.
3. Environment Variables:
   - `REACT_APP_API_URL` = Render URL
   - `REACT_APP_SOCKET_URL` = Render URL
   - `REACT_APP_GOOGLE_CLIENT_ID` and `REACT_APP_CLOUDINARY_*` (if enabled)
4. Deploy.

### C. Connect them

- `REACT_APP_API_URL` / `REACT_APP_SOCKET_URL` on Vercel and `FRONTEND_URL` on Render
  must match your deployed URLs **exactly** (no trailing slash).

---

## API Overview (protected with `Authorization: Bearer <token>`)

| Method | Route                          | Description                          |
| ------ | ------------------------------ | ------------------------------------ |
| POST   | `/user/signup`                 | Register + send verification OTP     |
| POST   | `/user/login`                  | Log in (rate limited, lockout)       |
| POST   | `/user/google`                 | Google OAuth (verify ID token)       |
| POST   | `/user/verify-otp`             | Verify email / reset OTP             |
| POST   | `/user/resend-otp`             | Resend OTP                           |
| POST   | `/user/forgot-password`        | Send reset OTP                       |
| POST   | `/user/reset-password`         | Set new password                     |
| GET    | `/user/me`                     | Current user                         |
| PUT    | `/user/profile`                | Update name/pic                      |
| PUT    | `/user/password`               | Change password                      |
| PUT    | `/user/block/:userId`          | Block user                           |
| PUT    | `/user/unblock/:userId`        | Unblock user                         |
| DELETE | `/user/account`                | Delete account + data                |
| GET    | `/api/users?search=`           | Search users                         |
| GET    | `/api/users/unread`            | Unread counts per chat               |
| GET    | `/chat` / `POST /chat`         | Fetch chats / access a chat          |
| POST   | `/chat/group`                  | Create group                         |
| PUT    | `/chat/rename`                 | Rename group (admin)                 |
| PUT    | `/chat/grouppic`               | Set group picture (admin)            |
| PUT    | `/chat/addtogroup`             | Add member (admin)                   |
| PUT    | `/chat/removefromgroup`        | Remove member / leave                |
| PUT    | `/chat/transfer`               | Transfer admin                       |
| DELETE | `/chat/group/:chatId`          | Delete group (admin)                 |
| POST   | `/message`                     | Send message (text / attachment)     |
| GET    | `/message/:chatId?limit&skip`  | Messages (paginated)                 |
| GET    | `/message/:chatId/search?q=`   | Search messages                      |
| PUT    | `/message/:chatId/read`        | Mark chat read                       |
| PUT    | `/message/:messageId`          | Edit message (sender)                |
| DELETE | `/message/:messageId`          | Delete message (sender)              |
| POST   | `/message/reaction/:messageId` | Toggle emoji reaction                |

---

## Screenshots

Registration / Login / Google OAuth / Email verification / Search / Group chat /
Admin controls / Typing indicator / Read receipts / Reactions / Attachments.