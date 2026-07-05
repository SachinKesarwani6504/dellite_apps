# Customer Booking + Payment Flow

Backend is the source of truth for booking, payment, and finance state. The customer app should call transition APIs, then refresh booking detail/list state from backend.

## Detail States

- `SEARCHING`: show finding-worker state. Customer can edit allowed fields or cancel before work starts.
- `CONFIRMED`: show assigned worker and start OTP. Customer can edit allowed fields or cancel before work starts.
- `IN_PROGRESS`: hide OTP/edit/cancel. Show live status, worker contact, and history.
- `COMPLETED`: show paid/completed summary.
- `CANCELLED` or `EXPIRED`: show terminal state and hide mutation actions.

## Edit Booking

Route: `BookingDetailsNavigator -> BookingEdit`

API: `PATCH /booking/:bookingId`

Allowed customer edits:

- Increase service quantity.
- Increase service duration.
- Update schedule/notes if backend allows.

Not allowed in app UI:

- Decrease quantity/duration.
- Remove services.
- Add worker extra charges.
- Manually calculate final amount.

After save, refresh booking detail from backend.

## Cancel Booking

API: `PATCH /booking/:bookingId/booking-status?bookingStatus=CANCELLED`

Allowed only before work starts:

- `SEARCHING`
- `CONFIRMED`

After cancellation, refresh booking detail/list state. If a worker already accepted, backend sends worker notification.

## Payment Claim

API: `POST /booking/:bookingId/payment-claim`

Payload:

```json
{
  "mode": "CASH_TO_WORKER",
  "amount": "499",
  "tipAmount": "50",
  "reference": "optional"
}
```

Payment review states:

- `WAITING_CUSTOMER_PAYMENT`: show payment claim form.
- `WAITING_WORKER_CONFIRMATION`: show waiting state.
- `WORKER_NOT_RECEIVED`: show issue state and allow retry.
- `PAID`: show paid state.
- `NONE`: payment action is not ready.

After claim, refresh booking detail.
