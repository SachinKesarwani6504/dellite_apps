# Type System

## Principles

1. **Single Source of Truth**: Types live in `src/types/*`, never in screens/components/hooks
2. **Backend Alignment**: Types represent the current backend contract exactly
3. **No Dead Code**: Remove unused fields when backend changes
4. **Strict Unions**: Use explicit union types for enums, not `string` fallbacks
5. **Parity**: API/auth/request types must be identical in both apps

## Type File Organization

```
src/types/
├── index.ts                 # Re-exports all types
├── api.ts                   # API request/response types
├── http.ts                  # HTTP client types (errors, options)
├── auth.ts                  # Auth-related types
├── screen-names.ts          # Navigation screen names
├── booking.ts               # Booking-related types (customer)
├── order.ts                 # Order-related types (worker)
└── [feature].ts             # Feature-specific types
```

## File Locations (STRICT)

❌ **Never declare types in:**
- `src/screens/*`
- `src/components/*`
- `src/hooks/*`
- `src/contexts/*`
- `src/navigation/*`

✅ **Always declare types in:**
- `src/types/*`

## Type Examples

### API Types (`src/types/api.ts`)

```typescript
// Request types
export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

// Entity types
export interface User {
  id: string;
  phone: string;
  name: string;
  role: 'WORKER' | 'CUSTOMER';
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

// Enums (explicit unions, not strings)
export const BOOKING_TYPE = {
  INSTANT: 'INSTANT',
  SCHEDULED: 'SCHEDULED',
} as const;

export type BookingType = typeof BOOKING_TYPE[keyof typeof BOOKING_TYPE];

export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type BookingStatus = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS];
```

### HTTP Types (`src/types/http.ts`)

```typescript
export interface HttpRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  body?: Record<string, any>;
  timeout?: number;
}

export interface HttpErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number,
    public details?: Record<string, any>
  ) {
    super(message);
  }
}
```

### Auth Types (`src/types/auth.ts`)

```typescript
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface OnboardingData {
  phone: string;
  password: string;
  name: string;
  email?: string;
  // app-specific fields only
}
```

### Screen Names (`src/types/screen-names.ts`)

```typescript
// Worker app
export const WORKER_SCREENS = {
  AUTH: 'WorkerAuth',
  LOGIN: 'WorkerLogin',
  HOME: 'WorkerHome',
  JOBS: 'WorkerJobs',
  JOB_DETAIL: 'WorkerJobDetail',
  PROFILE: 'WorkerProfile',
} as const;

// Customer app
export const CUSTOMER_SCREENS = {
  AUTH: 'CustomerAuth',
  LOGIN: 'CustomerLogin',
  HOME: 'CustomerHome',
  BOOKING: 'CustomerBooking',
  ORDERS: 'CustomerOrders',
  ORDER_DETAIL: 'CustomerOrderDetail',
  PROFILE: 'CustomerProfile',
} as const;
```

## Parity Requirements

These type files must stay identical in both apps:

- `src/types/api.ts` - API contracts
- `src/types/http.ts` - HTTP client types

## Type Hygiene Rules

### Rule 1: No Dead Fields

When backend removes a field, remove it from types AND all code that uses it:

```typescript
// ❌ Before (old backend)
export interface Order {
  id: string;
  status: string;
  legacyField: string; // Backend removed this
}

// ✅ After (update types first)
export interface Order {
  id: string;
  status: OrderStatus;
}

// ✅ Then remove all usages
// - Remove from mappers
// - Remove from UI logic
// - Remove from components
```

### Rule 2: Explicit Union Types

```typescript
// ❌ No
export type BookingType = string; // Too broad

// ✅ Yes
export const BOOKING_TYPE = {
  INSTANT: 'INSTANT',
  SCHEDULED: 'SCHEDULED',
} as const;

export type BookingType = typeof BOOKING_TYPE[keyof typeof BOOKING_TYPE];
```

### Rule 3: Backend Alignment

```typescript
// If backend sends: { "priceType": "FIXED" | "HOURLY" }

// ✅ Frontend type matches exactly
export type PriceType = 'FIXED' | 'HOURLY';

// ❌ NOT: type PriceType = string | 'FIXED' | 'HOURLY';
```

## Import Pattern

```typescript
// src/screens/BookingScreen.tsx
import {
  Booking,
  BookingType,
  BOOKING_TYPE,
  BOOKING_STATUS,
  createBookingRequest,
} from '../types';

export function BookingScreen() {
  // Use typed constants instead of literals
  if (booking.type === BOOKING_TYPE.INSTANT) {
    // ...
  }
}
```

## Backend Contract Changes (Process)

1. **Update types first** in `src/types/*`
2. **Update mappers/normalizers** that transform API responses
3. **Update hooks/actions** that call APIs
4. **Update UI logic** that consumes the data
5. **Remove unused fields** from types
6. **Pass typecheck**: `npm run typecheck:worker` + `npm run typecheck:customer`

See [API Type Hygiene Rules](/AGENTS.md#15-api-type-hygiene-rules-strict) in AGENTS.md.
