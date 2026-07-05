# Worker Job + Payment Flow

Backend is the source of truth for job, payment, wallet, earnings, commission, and payout state. The worker app should call transition APIs, then refresh job detail/list and finance screens from backend.

## Invite Flow

- `NEW_JOB_REQUEST` or `VIEWED`: show Accept / Reject.
- `ACCEPTED`: booking becomes `CONFIRMED`; show OTP input.
- `REJECTED`, `CANCELLED`, or `EXPIRED`: remove from active/new job UI. If detail returns 404, show unavailable state, not logout.

APIs:

- Accept: `PATCH /booking/invite/:inviteId?inviteStatus=ACCEPTED`
- Reject: `PATCH /booking/invite/:inviteId?inviteStatus=REJECTED`

## Start Job

API: `POST /worker/bookings/:bookingId/start-with-otp`

Payload:

```json
{
  "otp": "1234"
}
```

Start is OTP-only. Do not send `STARTED` to assignment-status endpoint. After success, refresh job detail/list.

## Cancel Before Start

API: `PATCH /booking/:bookingId/assignment-status?assignmentStatus=CANCELLED`

Allowed only before OTP start:

- invite is `ACCEPTED`
- booking is `CONFIRMED`

After OTP start, cancellation is blocked/manual support flow.

## Progress Updates

APIs:

- `PATCH /booking/:bookingId/assignment-status?assignmentStatus=EN_ROUTE`
- `PATCH /booking/:bookingId/assignment-status?assignmentStatus=ARRIVED`
- `PATCH /booking/:bookingId/assignment-status?assignmentStatus=COMPLETED`

`COMPLETED` means work completed, not payment finalized. Backend controls allowed transitions. After every progress action, refresh job detail/list.

## Payment Review

Visible after customer submits a payment claim.

APIs:

- Received: `POST /booking/:bookingId/payment-review?paymentReviewStatus=RECEIVED`
- Not received: `POST /booking/:bookingId/payment-review?paymentReviewStatus=NOT_RECEIVED`

Payment review states:

- `WAITING_CUSTOMER_PAYMENT`: show waiting for customer.
- `WAITING_WORKER_CONFIRMATION`: show Received / Not Received actions.
- `WORKER_NOT_RECEIVED`: show issue state.
- `PAID`: show confirmed state.
- `NONE`: payment review is not ready.

After `RECEIVED`, backend finalizes payment, earning, commission due, wallet ledger, and booking completion. Refresh job detail and finance screens.
