# Delivery Tracking System

A full-stack, real-time delivery tracking platform. Customers place and track
orders on a live map, delivery agents update status and share their location,
and admins manage orders, users, and monitor the whole fleet from one console.

## Tech stack

| Layer      | Choice                                  |
|------------|------------------------------------------|
| Frontend   | React (Vite), React Router               |
| Backend    | Node.js, Express                          |
| Database   | MongoDB (Mongoose)                        |
| Real-time  | Socket.IO (WebSockets)                    |
| Maps       | Google Maps JavaScript API                |
| Auth       | JWT                                       |

## Project structure

```
delivery-tracking-system/
├── server/            Express + MongoDB + Socket.IO API
│   ├── src/
│   │   ├── config/         DB connection
│   │   ├── models/         User, Order schemas
│   │   ├── middleware/     auth + role guards
│   │   ├── controllers/    route handlers
│   │   ├── routes/         Express routers
│   │   ├── sockets/        Socket.IO event handlers
│   │   └── utils/          helpers (JWT signing, etc.)
│   └── package.json
└── client/            React app
    ├── src/
    │   ├── api/             axios instance
    │   ├── context/         Auth + Socket providers
    │   ├── components/      shared UI
    │   ├── pages/            customer / agent / admin views
    │   └── styles/
    └── package.json
```

## Getting started

### 1. Backend

```bash
cd server
cp .env.example .env      # fill in MONGO_URI and JWT_SECRET
npm install
npm run dev                # starts on http://localhost:5000
```

### 2. Frontend

```bash
cd client
cp .env.example .env      # fill in VITE_API_URL and VITE_GOOGLE_MAPS_API_KEY
npm install
npm run dev                # starts on http://localhost:5173
```

You'll need:
- A MongoDB connection string (local `mongod` or a free MongoDB Atlas cluster).
- A Google Maps JavaScript API key with the **Maps JavaScript API** enabled
  (billing must be turned on in Google Cloud, though usage stays within the
  free tier for development).

### 3. Try it out

1. Register three users (via the `/register` page or `POST /api/auth/register`):
   one with role `customer`, one `agent`, one `admin`.
   (Role can be set directly in the request body for now — see the
   "Hardening before production" note below.)
2. Log in as the customer and place an order.
3. Log in as the admin, open **Manage orders**, and assign the order to the agent.
4. Log in as the agent, open **Assigned deliveries**, advance the order's
   status and turn on **Share live location**.
5. Log back in as the customer and open **Track order** — the map marker and
   status badge update live as the agent's browser reports its position.

## Functional requirements covered

**Customer:** place and view orders, real-time location tracking, live status
updates, order history.
**Agent:** view assigned deliveries, update delivery status, share live location.
**Admin:** manage orders and users, assign deliveries to agents, monitor live
deliveries on a map, view basic performance reports.

## Hardening before production

This is a working scaffold, not a production-ready deployment. Before you ship it:

- Move the JWT out of `localStorage` into an `httpOnly` cookie to reduce XSS risk.
- Don't accept `role` from the registration request body — set new signups to
  `customer` by default and create agents/admins through an authenticated
  admin-only endpoint instead.
- Add request validation (e.g. `zod` or `express-validator`) on every route.
- Add rate limiting (`express-rate-limit`) on `/api/auth/*`.
- Serve over HTTPS and set proper CORS origins for production.
- Add indexes on frequently-queried Order fields (`customer`, `assignedAgent`, `status`).

## Deploying

- **Backend:** Render, Railway, or Fly.io all support long-running Node
  processes with WebSockets. Vercel/Netlify serverless functions do **not**
  support persistent Socket.IO connections — use them for the frontend only.
- **Frontend:** Vercel or Netlify (`npm run build` → deploy the `dist/` folder).
- **Database:** MongoDB Atlas free tier is enough to start.
