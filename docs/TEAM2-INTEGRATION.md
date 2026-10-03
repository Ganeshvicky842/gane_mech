# Team 2 integration contract

Team 3 continues the roadside request created by Team 2. **Do not create another booking/order for C16-C22.**

## Required fields on the common request

The Team 3 service expects the existing Team 2 request to expose these logical fields (names can be mapped in one adapter if Team 2 used different names):

- `customerId`
- `vehicleId` and `vehicleSnapshot.type`
- `service`
- `breakdownLocation.lat`, `breakdownLocation.lng`
- `status`
- `assignedProviderId`
- `etaMinutes`, `distanceKm`
- `providerLocation`
- `timeline`

The implementation's `RoadsideRequest` model is the **reference contract for a fresh/dummy environment**, not a second booking concept. In the shared project, point the Team 3 controllers/services at Team 2's existing model or rename the model registration to the team's canonical model.

## Handoff from Team 2

After C15, Team 2 should navigate to C16 using the existing request id:

`/track/{requestId}`

Example API:

`POST /api/requests/{requestId}/match`

This only starts Team 3's matching read/eligibility process. It does not create a new request.

## Handoff to Team 4

When the provider reaches the customer and service begins:

`POST /api/requests/{requestId}/service-start`

The request becomes `SERVICE_IN_PROGRESS` and `handoffToTeam4At` is written. Team 4 should continue reading the same `requestId` for diagnosis, quotation, approval, work, payment and completion.

## Provider eligibility

The reference matching implementation checks:

1. provider availability
2. verified provider
3. identity + license verification
4. supported vehicle type when configured
5. supported service/skill when configured
6. distance from customer
7. provider location freshness penalty

The actual priority/weighting can be replaced by the team's backend architecture without changing the API contract.
