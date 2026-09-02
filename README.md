# Smart Logistics & Real-Time Delivery Platform

A full-stack, real-time delivery tracking platform designed to mimic large-scale logistics operations (like Delhivery). It features real-time WebSocket map tracking, advanced delivery workflows (OTPs, failure reporting), and is currently being upgraded with an **Agentic AI & RAG system** for smart dispatching and automated customer support.

## Tech Stack

| Layer      | Choice                                  |
|------------|------------------------------------------|
| Frontend   | React (Vite), React Router               |
| Backend    | Node.js, Express                          |
| Database   | MongoDB (Mongoose)                        |
| Real-time  | Socket.IO (WebSockets)                    |
| Maps       | Google Maps JavaScript API                |
| AI (LLM)   | Google Gemini API (`@google/genai`)       |
| Vector DB  | Qdrant Cloud                              |
| Auth       | JWT (Stateless)                           |

## Key Features & Functional Requirements

### Customer Features
- **Live Order Tracking**: Watch the delivery agent's car move on a live map via WebSockets.
- **Secure Handoffs**: Customers receive an auto-generated 4-digit OTP to prove identity to the driver upon delivery.
- **AI Support (WIP)**: A chatbot that uses RAG over company policies to answer shipping questions and uses Tool Calling to fetch live order statuses.

### Delivery Agent Features
- **Advanced Workflow UI**: Active vs. History dashboards for workload tracking.
- **Flexible Status Management**: Ability to report failures with specific reasons (e.g., "Customer Unavailable", "Address Incomplete") or revert accidental status updates.
- **Action Links**: One-click buttons to call the customer or open Google Maps navigation to the drop-off coordinates.
- **Delivery Proof**: Enforced OTP verification before marking a package as 'Delivered'.
- **Live GPS Sharing**: Streams location to the backend via `navigator.geolocation` and WebSockets.

### Admin Features
- **Fleet Monitoring**: Manage orders, users, and assign deliveries to agents.
- **Smart Dispatch AI (WIP)**: A command-center AI where the Admin can type prompts (e.g., "Assign Order #123 to the closest agent with zero active workloads") and the LLM will physically execute the database update.

## Project Structure

```
delivery-tracking-system/
├── server/            Express + MongoDB + Socket.IO API
│   ├── src/
│   │   ├── config/         DB connection
│   │   ├── models/         User, Order schemas
│   │   ├── middleware/     auth + role guards
│   │   ├── controllers/    route handlers (including AI RAG/Tool logic)
│   │   ├── routes/         Express routers
│   │   ├── sockets/        Socket.IO event handlers
│   │   └── utils/          helpers (JWT signing, etc.)
│   └── package.json
└── client/            React app
    ├── src/
    │   ├── api/             axios instance
    │   ├── context/         Auth + Socket providers
    │   ├── components/      shared UI (including AIChatBot widget)
    │   ├── pages/           customer / agent / admin views
    │   └── styles/
    └── package.json
```

## Getting Started

### 1. Backend

```bash
cd server
cp .env.example .env      # Fill in MONGO_URI and JWT_SECRET
npm install
npm run dev                # Starts on http://localhost:5000
```

### 2. Frontend

```bash
cd client
cp .env.example .env      # Fill in VITE_API_URL and VITE_GOOGLE_MAPS_API_KEY
npm install
npm run dev                # Starts on http://localhost:5173
```

## Deployment Notes

- **Backend:** Hosted on Render (Ensure `CLIENT_URL` is set to the frontend URL to avoid CORS blocks). Node.js is required for persistent Socket.IO connections.
- **Frontend:** Hosted on Vercel. (Ensure environment variables prefixed with `VITE_` are injected at build time).
- **Database:** MongoDB Atlas. Ensure the backend's IP is whitelisted (`0.0.0.0/0` for dynamic IPs).
