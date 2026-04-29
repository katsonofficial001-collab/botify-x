# Botify X

A production-ready WhatsApp bot built with **Baileys**, **Express**, and **OpenAI**.
Includes group guard, view-once unlocker, status saver, AI chat, and a simple
subscription dashboard. Designed to deploy on **Railway** without modification.

---

## Features

### WhatsApp bot
- **Pairing-code** connection (no QR scan)
- Auto-reconnect on disconnect
- Sessions stored in local `auth/` folder
- Modular command/event architecture

### Group guard
- Antilink (deletes link messages, ignores admins)
- Anti-status-mention in groups
- Welcome message for new members
- Goodbye message for leaving members
- `*tagall [message]` — mention every member of the group
- `*poststatus` — reply to media/text and repost it as the bot's status

### View-once unlocker
- Reply to a view-once image/video/voice with **any emoji or text**
- Bot extracts and resends the media in chat
- Also forwards a copy to the **owner** ("message yourself")

### Status saver
- Reply to a contact's status with **any emoji or text**
- Bot saves and resends it in chat
- Also forwards a copy to the **owner**

### AI
- `*gpt <question>` — chat with OpenAI

### Misc
- `*menu` — show all commands
- `*version` — print version

### Subscription dashboard
- Single Express dashboard at `/dashboard`
- Username + password login
- Users stored in `data/users.json` (with salted scrypt hashes)
- Each user has a 30-day expiry (configurable)
- Owner adds/removes users via CLI scripts
- Active / Expired status displayed

---

## Project structure

```
botify-x/
├── index.js              # Express server + bot bootstrap
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── auth/                 # WhatsApp session (auto-created, gitignored)
├── commands/
│   ├── index.js          # Auto-loads all commands
│   ├── menu.js
│   ├── version.js
│   ├── gpt.js
│   ├── tagall.js
│   └── poststatus.js
├── events/
│   ├── connection.js     # Baileys socket + reconnect
│   ├── messages.js       # Message dispatcher
│   ├── group.js          # Antilink, anti-status, welcome/goodbye
│   ├── viewonce.js       # View-once unlock
│   └── statussaver.js    # Status save
├── utils/
│   ├── config.js
│   ├── logger.js
│   └── access.js         # User accounts
├── dashboard/
│   ├── routes.js
│   └── views/
│       ├── login.html
│       └── dashboard.html
├── data/
│   └── users.json        # Created on first run (gitignored)
└── scripts/
    ├── add-user.js
    ├── remove-user.js
    └── list-users.js
```

---

## Run locally

### 1. Requirements
- **Node.js 18+**

### 2. Clone & install
```bash
git clone https://github.com/<your-username>/botify-x.git
cd botify-x
npm install
```

### 3. Environment variables
Copy `.env.example` to `.env` and fill in the values:
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
SESSION_SECRET=replace-with-a-long-random-string

BOT_PHONE_NUMBER=15551234567   # the number the bot will use, no plus sign
OWNER_NUMBER=15551234567       # who receives forwarded media

PREFIX=*

OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

### 4. Start
```bash
npm start
```

The first run prints a **pairing code** in the console:
```
========================================
  Botify X — pairing code
  Phone:  15551234567
  Code:   ABCD-1234
  In WhatsApp: Settings → Linked Devices → Link with phone number
========================================
```
Open WhatsApp on your phone → **Settings → Linked Devices → Link with phone number** → enter the code.

After pairing, the session is stored in `auth/` and the bot reconnects automatically next time.

### 5. Add a dashboard user
```bash
npm run add-user -- alice s3cret 30
npm run list-users
npm run remove-user -- alice
```
Visit `http://localhost:3000/login` and sign in.

---

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — Botify X"
git branch -M main
git remote add origin https://github.com/<your-username>/botify-x.git
git push -u origin main
```

`.env`, `auth/*`, and `data/users.json` are gitignored — your credentials and session files stay private.

---

## Deploy on Railway

1. Go to [railway.app](https://railway.app/) and sign in.
2. **New Project → Deploy from GitHub repo** → select your `botify-x` repo.
3. Railway detects Node.js automatically and runs `npm install` then `npm start`.
4. Open the project → **Variables** tab → add the environment variables:

| Variable           | Example value                          |
|--------------------|----------------------------------------|
| `PORT`             | *(Railway sets this automatically — leave blank)* |
| `SESSION_SECRET`   | a long random string                   |
| `BOT_PHONE_NUMBER` | `15551234567`                          |
| `OWNER_NUMBER`     | `15551234567`                          |
| `PREFIX`           | `*`                                    |
| `OPENAI_API_KEY`   | `sk-...`                               |
| `OPENAI_MODEL`     | `gpt-4o-mini`                          |
| `NODE_ENV`         | `production`                           |

5. **Settings → Networking → Generate Domain** to get a public URL (e.g.
   `botify-x-production.up.railway.app`). Visit it — you should see
   `Botify X is running`.

### Persist the WhatsApp session (important)

Railway containers are ephemeral — without a volume, the `auth/` folder is wiped
on every redeploy and you'll have to re-pair the bot.

1. In the Railway service → **Settings → Volumes → New Volume**.
2. **Mount path:** `/app/auth`
3. **Size:** 1 GB is plenty.
4. Redeploy. The session now persists.

(Optional) Add a second volume for `/app/data` if you want dashboard users to survive redeploys.

### Read the pairing code

Open the **Deployments** tab → latest deployment → **View Logs**. The pairing
code is printed shortly after the service starts. Enter it in WhatsApp →
Linked Devices → Link with phone number.

If you ever need to re-pair (e.g. logged out from WhatsApp), delete the contents
of the `auth/` volume and redeploy.

---

## Available commands

| Command                | Description                                       |
|------------------------|---------------------------------------------------|
| `*menu`                | Show all commands                                 |
| `*version`             | `Botify X v1.0.0`                                 |
| `*gpt <question>`      | Ask OpenAI                                        |
| `*tagall [message]`    | Mention every member (groups only)                |
| `*poststatus`          | Reply to a media/text msg → repost as bot status  |

Auto features (no command needed):
- Antilink in groups
- Anti-status-mention in groups
- Welcome / Goodbye messages
- View-once unlocker (reply to view-once with any emoji/text)
- Status saver (reply to a status with any emoji/text)

---

## License

MIT
