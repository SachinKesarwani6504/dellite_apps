# Screen Purity

## Principle

Screens must be **presentational and orchestration-focused only**.

- No business logic, calculations, or repeated helpers in screens
- All helpers go to `src/utils/*`
- All state/effects go to `src/hooks/*`
- All data fetching goes to `src/actions/*`

## Anti-Pattern Examples

### ❌ Helpers Inside Screens

```typescript
// src/screens/BookingScreen.tsx - BAD
export function BookingScreen() {
  // ❌ Helpers embedded in screen
  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const calculateTotalPrice = (booking) => {
    return booking.basePrice + booking.tax - booking.discount;
  };

  const getSlotLabel = (slot) => {
    return `${slot.date} ${slot.time}`;
  };

  return (
    <View>
      <Text>{formatCurrency(booking.price)}</Text>
      <Text>{calculateTotalPrice(booking)}</Text>
      <Text>{getSlotLabel(selectedSlot)}</Text>
    </View>
  );
}
```

### ✅ Helpers in Utils

```typescript
// src/utils/currency.ts
export const formatCurrency = (amount: number): string => {
  return `$${(amount / 100).toFixed(2)}`;
};

// src/utils/booking-helpers.ts
export const calculateTotalPrice = (booking: Booking): number => {
  return booking.basePrice + booking.tax - booking.discount;
};

export const getSlotLabel = (slot: TimeSlot): string => {
  return `${slot.date} ${slot.time}`;
};

// src/utils/index.ts (re-export)
export { formatCurrency } from './currency';
export { calculateTotalPrice, getSlotLabel } from './booking-helpers';
```

```typescript
// src/screens/BookingScreen.tsx - GOOD
import { formatCurrency, calculateTotalPrice, getSlotLabel } from '../utils';

export function BookingScreen() {
  return (
    <View>
      <Text>{formatCurrency(booking.price)}</Text>
      <Text>{calculateTotalPrice(booking)}</Text>
      <Text>{getSlotLabel(selectedSlot)}</Text>
    </View>
  );
}
```

### ❌ State/Effects in Screens

```typescript
// src/screens/JobsScreen.tsx - BAD
export function JobsScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ category: '', sortBy: 'recent' });

  useEffect(() => {
    // ❌ API orchestration in screen
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await apiGet('/jobs', {
          params: { category: filters.category, sort: filters.sortBy },
        });
        setJobs(response.data);
      } catch (err) {
        showApiErrorToast(err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [filters]);

  return (
    // JSX
  );
}
```

### ✅ State/Effects in Hooks

```typescript
// src/hooks/useJobsScreenController.ts
export function useJobsScreenController() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ category: '', sortBy: 'recent' });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await workerActions.getJobs({
          category: filters.category,
          sort: filters.sortBy,
        });
        setJobs(response.jobs);
      } catch (err) {
        showApiErrorToast(err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [filters]);

  return {
    jobs,
    loading,
    error,
    filters,
    setFilters,
  };
}
```

```typescript
// src/screens/JobsScreen.tsx - GOOD
export function JobsScreen() {
  const { jobs, loading, error, filters, setFilters } = useJobsScreenController();

  return (
    <View>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      <FlatList
        data={jobs}
        renderItem={({ item }) => <JobCard job={item} />}
      />
    </View>
  );
}
```

### ❌ Data Transformation in Screens

```typescript
// src/screens/OrderDetailsScreen.tsx - BAD
export function OrderDetailsScreen({ orderId }: Props) {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      const response = await apiGet(`/orders/${orderId}`);
      
      // ❌ Transformation in screen
      const transformed = {
        ...response.data,
        displayPrice: `$${(response.data.price / 100).toFixed(2)}`,
        displayStatus: response.data.status === 'PENDING' ? 'Waiting' : response.data.status,
        displayDate: formatDistanceToNow(new Date(response.data.createdAt)),
      };
      
      setOrder(transformed);
    };
    loadOrder();
  }, []);

  return (
    // JSX using transformed data
  );
}
```

### ✅ Mappers in Utils

```typescript
// src/utils/order-mappers.ts
export interface OrderDisplay {
  id: string;
  displayPrice: string;
  displayStatus: string;
  displayDate: string;
}

export const mapOrderToDisplay = (order: Order): OrderDisplay => {
  return {
    id: order.id,
    displayPrice: formatCurrency(order.price),
    displayStatus: getOrderStatusLabel(order.status),
    displayDate: formatDistanceToNow(new Date(order.createdAt)),
  };
};

// src/utils/index.ts
export { mapOrderToDisplay } from './order-mappers';
```

```typescript
// src/hooks/useOrderDetailsController.ts
export function useOrderDetailsController(orderId: string) {
  const [order, setOrder] = useState<OrderDisplay | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      const response = await customerActions.getOrder(orderId);
      setOrder(mapOrderToDisplay(response.order));
    };
    loadOrder();
  }, [orderId]);

  return { order };
}
```

```typescript
// src/screens/OrderDetailsScreen.tsx - GOOD
export function OrderDetailsScreen({ orderId }: Props) {
  const { order } = useOrderDetailsController(orderId);

  return (
    <View>
      <Text>{order?.displayPrice}</Text>
      <Text>{order?.displayStatus}</Text>
      <Text>{order?.displayDate}</Text>
    </View>
  );
}
```

## Booking Flow Purity

### Booking-Specific Rules

- Booking calculations → `src/hooks/useBookingFlowController.ts`
- Booking helpers → `src/utils/booking-flow.ts`
- Booking validity checks → controller + utils, not screens
- Booking type literals → Use typed constants from `src/types/`, never hardcode

```typescript
// ❌ Bad
if (type === 'INSTANT') { /* ... */ }

// ✅ Good
import { BOOKING_TYPE } from '../types';
if (type === BOOKING_TYPE.INSTANT) { /* ... */ }
```

## Screen Structure Template

```typescript
import { useXxxScreenController } from '../hooks/useXxxScreenController';

interface Props {
  // Navigation params
}

export function XxxScreen({ ...params }: Props) {
  // Only controller hook (state + effects)
  const { data, loading, error, actions } = useXxxScreenController(params);

  // Optional: Local UI state only (form focus, modal open, etc.)
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {data && (
        <>
          {/* Presentational JSX only */}
        </>
      )}
    </View>
  );
}
```

## Validation Checklist

Before submitting a screen:

- [ ] No functions defined inside screen (except local UI handlers)
- [ ] No state machine logic in screen
- [ ] No API calls in screen (all in hooks)
- [ ] No data transformation in screen (all in utils)
- [ ] All reusable helpers in `src/utils/`
- [ ] All re-exported via `src/utils/index.ts`
- [ ] Screen is under 100-150 lines (indicator of too much logic)

See [AGENTS.md](/AGENTS.md#14-screen-purity--booking-flow-rules) for complete rules.
