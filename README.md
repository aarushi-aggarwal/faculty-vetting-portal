# Faculty Vetting Portal

## Running on GitHub Codespaces

1. Click the green **Code** button on this repo
2. Click **Codespaces** → **Create codespace on main**
3. In the Codespaces terminal, run the commands below

---

### Terminal 1 — Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Terminal 2 — Seed admin accounts (run once after backend starts)

```bash
cd backend
python seed_admins.py
```

### Terminal 3 — Frontend

```bash
cd frontend/dashboard-stat-cards
npm install -g pnpm
pnpm install
pnpm dev
```

Open **http://localhost:3000**
