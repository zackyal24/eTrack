eTrack - Backend (Node.js)
=========================

Quick start (development)

1. Open a terminal and go to `backend`:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and set DB credentials (XAMPP MySQL default root user).

4. Start server:

```bash
npm start
# or for auto-reload (if you have nodemon): npm run dev
```

Endpoints

- `GET /` - health check
- `GET /transactions?limit=20&user_id=1` - recent transactions
- `GET /reports/donut?type=expense&month=2025-11&user_id=1` - returns categories + totals for the month
- `GET /reports/summary?start=2025-01-01&end=2025-12-31&user_id=1` - monthly totals

Notes

- The code uses `mysql2/promise` connection pool. Ensure your MySQL server is running (XAMPP) and the `etrack` database exists and tables were created.
- This is a minimal starting point. Add authentication, validation, and proper error handling before production.
