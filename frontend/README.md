# Admin Dashboard Frontend

Next.js app for the role-based admin dashboard. The API must be running first.

## Run locally

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Backend:

```bash
cd backend
cp .env.example .env
npm install
npm run seed:admin
npm run dev
```

API: [http://localhost:5050](http://localhost:5050) (port 5000 is reserved by macOS Control Center / AirPlay)

Seed login (from backend `.env`):

- Email: `superadmin@example.com`
- Password: `change_this_password`
