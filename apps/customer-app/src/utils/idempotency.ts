function createRandomSegment() {
  return Math.random().toString(36).slice(2, 10);
}

export function createBookingIdempotencyKey() {
  const cryptoApi = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (typeof cryptoApi?.randomUUID === 'function') {
    return `booking-${cryptoApi.randomUUID()}`;
  }

  return `booking-${Date.now().toString(36)}-${createRandomSegment()}-${createRandomSegment()}`;
}
