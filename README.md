# Faculty Vetting Portal

1. Click the green **Code** button on this repo
2. Click **Codespaces** → **Create codespace on main**
3. In the Codespaces terminal run these commands:

### Terminal 1 — Database setup
```bash
sudo service postgresql start
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE faculty_vetting;"

cat > backend/.env << 'EOF'
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/faculty_vetting
SECRET_KEY=changethisinproduction123456789abcdef
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
EOF
```

### Terminal 1 — Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Terminal 2 — Seed admin accounts (run once)
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

Open "http://localhost:3000"
