# Team 3 API contract — C16-C22

Base URL: `http://localhost:5000/api`

All protected requests use `Authorization: Bearer <accessToken>`.

## Customer

### Get current request
`GET /requests/:requestId`

Returns status, ETA, distance, timeline, vehicle snapshot and assigned mechanic when present. Customer receives mechanic contact details only after assignment.

### Start/recheck matching
`POST /requests/:requestId/match`

Returns eligible candidates. In production, assignment should normally be performed by the matching worker/backend service, not by a browser-controlled customer.

### Get candidate preview
`GET /requests/:requestId/candidates`

Returns provider summary, distance and ETA. It does not return the customer's exact coordinates.

### Status
`GET /requests/:requestId/status`

Used by C16/C17/C19/C21/C22 fallback polling.

### Chat
`GET /requests/:requestId/chat/messages`
`POST /requests/:requestId/chat/messages`

### Cancel
`POST /requests/:requestId/cancel`

## Admin/matching service

### Auto-assign best eligible provider
`POST /requests/:requestId/auto-assign`

The server finds eligible providers and atomically claims the best candidate. This is the endpoint that can drive the C16 → C17 transition in a demo/shared backend.

### Assign provider
`POST /requests/:requestId/assign`

Body: `{ "providerId": "..." }`

The endpoint rechecks provider eligibility and distance server-side before assignment.

## Provider

### Send live location
`POST /requests/:requestId/location`

Body: `{ "lat": 17.44, "lng": 78.38, "accuracyMeters": 15 }`

Once the first valid location is sent after assignment, the request transitions `ASSIGNED -> EN_ROUTE`.

### Mark arrived
`POST /requests/:requestId/arrived`

Transitions `EN_ROUTE -> ARRIVED`.

### Start service / Team 4 handoff
`POST /requests/:requestId/service-start`

Transitions `ARRIVED -> SERVICE_IN_PROGRESS` and records `handoffToTeam4At`.

## WebSocket / Socket.IO

Connect with:

```js
const socket = io(API_URL, { auth: { token: accessToken } });
```

Join a request:

```js
socket.emit('request:join', requestId, console.log);
```

Listen for:

- `request:assigned`
- `tracking:update`
- `request:arrived`
- `request:service_started`
- `request:cancelled`
- `chat:message`

Always keep `GET /status` polling as a fallback when WebSocket disconnects.
