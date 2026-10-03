# OmegaNexora — Team 3 Backend (C16–C22)

This backend covers the post-request roadside assistance flow shown in the supplied OmegaNexora design deck: **C16 Live Mechanic Matching → C17 Mechanic Assigned → C18 Mechanic Profile → C19 Live Tracking → C20 Customer ↔ Mechanic Chat → C21 Mechanic Arrived → C22 Current Job / Service Status**. The deck labels these screens as Team 3. fileciteturn2file0

## What is included

- Express 5 REST API
- MongoDB/Mongoose persistence
- JWT authentication + role authorization
- Socket.IO real-time request/tracking/chat events
- Provider eligibility and distance-based matching
- Server-side status state machine
- Provider location updates with ETA recalculation
- Mechanic arrival and service-start handoff
- Customer/mechanic chat
- Privacy-aware response shaping
- Helmet, CORS, rate limiting, body-size limits and validation
- Postman collection
- Seed data for a complete demo flow
- Unit tests for state and geo logic
- Docker Compose for API + MongoDB
- Team 2 integration contract and Team 4 handoff contract

## Important integration decision

**Do not create a new unrelated booking.** Team 3 continues the existing Team 2 roadside request by `requestId`. The reference `RoadsideRequest` schema in this package is a runnable dummy/common contract. In the shared application, map it to the canonical Team 2 model if Team 2 already has a differently named Mongoose model.

## C16-C22 state machine

```text
SEARCHING
   ↓
ASSIGNED
   ↓
EN_ROUTE
   ↓
ARRIVED
   ↓
SERVICE_IN_PROGRESS  → Team 4
```

Cancellation is allowed from `SEARCHING`, `ASSIGNED`, and `EN_ROUTE` in this implementation. Completed service is owned by the later workflow.

## Run locally

### 1. Start MongoDB

```bash
docker compose up -d mongo
```

### 2. Install

```bash
npm install
cp .env.example .env
```

### 3. Seed demo users/provider/request

```bash
npm run seed
```

Demo credentials:

- Customer: `customer@omeganexora.test` / `Password123!`
- Mechanic: `mechanic@omeganexora.test` / `Password123!`
- Admin/matcher: `admin@omeganexora.test` / `Password123!`

### 4. Start API

```bash
npm run dev
```

API: `http://localhost:5000`

## Run everything with Docker

```bash
docker compose up --build
```

Then run the seed script from a local Node shell or add a one-off seed container command:

```bash
docker compose exec api node scripts/seed.js
```

## Frontend integration

### REST fallback

After Team 2 submits the request, pass the same `requestId` into the Team 3 tracking page. Poll:

`GET /api/requests/:requestId/status`

A 3–5 second polling interval is suitable as a fallback, not as the primary real-time channel.

### Socket.IO primary channel

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: accessToken }
});

socket.emit('request:join', requestId, console.log);
socket.on('request:assigned', renderAssigned);
socket.on('tracking:update', renderTracking);
socket.on('request:arrived', renderArrived);
socket.on('request:service_started', handoffToTeam4);
socket.on('chat:message', appendMessage);
socket.on('request:cancelled', renderCancelled);
```

## Security model

- Exact customer location is not broadcast to all available mechanics.
- Candidate responses contain provider summary, distance and ETA, not customer coordinates.
- The exact customer location is available to the assigned provider through the assigned request context only.
- Customer phone number is not exposed to candidates; assigned customer/provider communication can use the contact channel configured by the product.
- Server rechecks provider eligibility and distance at assignment time.
- Provider location writes are accepted only for the provider assigned to that request.
- Status changes are server-controlled and must follow the state machine.
- Chat access is restricted to the customer and assigned provider.
- JWTs are short-lived access tokens.
- Request bodies are validated with Zod.
- Helmet/CORS/rate limiting are enabled.

## Real production notes

1. Replace demo JWT fallback secrets with secret-manager values.
2. Use HTTPS/WSS.
3. Store refresh tokens in a secure rotation store if long sessions are required.
4. Use Redis adapter for Socket.IO when running multiple API instances.
5. Move matching to a queue/worker when provider volume grows.
6. Use a routing/ETA provider for road-aware ETA instead of the demo straight-line speed estimate.
7. Store chat photos in object storage with signed URLs rather than accepting arbitrary public media URLs.
8. Add audit logs for assignment, location access and status changes.
9. Add TTL/retention rules for precise location data.
10. Integrate Team 2's exact request/vehicle model rather than duplicating those domain records.

## API + Postman

See `docs/API.md`, `docs/TEAM2-INTEGRATION.md`, and `postman/Team3-C16-C22.postman_collection.json`.

## Tests

```bash
npm test
```
