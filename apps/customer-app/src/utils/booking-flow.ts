import type {
  CreateCustomerBookingPayload,
  CustomerBookableService,
  CustomerBookingAddressInput,
  CustomerBookingType,
  CustomerServicePriceOption,
  CustomerServiceTask,
} from '@/types/customer';
import type {
  BookingFlowAddressDraft,
  BookingFlowAddressMode,
  BookingFlowSelectedServiceLine,
} from '@/types/booking-flow-context';

function toTrimmedString(value?: string | null) {
  return typeof value === 'string' ? value.trim() : '';
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

export function getDefaultSelectedPriceOptionId(priceOptions?: CustomerServicePriceOption[]) {
  if (!Array.isArray(priceOptions) || priceOptions.length === 0) {
    return null;
  }

  return priceOptions[0]?.id ?? null;
}

export function createBookingFlowService(service: CustomerBookableService): CustomerBookableService {
  return {
    ...service,
    priceOptions: Array.isArray(service.priceOptions) ? service.priceOptions : [],
    includedTasks: Array.isArray(service.includedTasks) ? service.includedTasks : [],
    excludedTasks: Array.isArray(service.excludedTasks) ? service.excludedTasks : [],
  };
}

export function createSelectedServiceLine(service: CustomerBookableService): BookingFlowSelectedServiceLine {
  return {
    service: createBookingFlowService(service),
    quantity: 1,
    selectedPriceOptionId: getDefaultSelectedPriceOptionId(service.priceOptions),
  };
}

export function formatPriceOptionAmount(option: CustomerServicePriceOption) {
  const amountValue = typeof option.price === 'number' && Number.isFinite(option.price)
    ? option.price
    : (typeof option.amount === 'number' && Number.isFinite(option.amount) ? option.amount : null);
  if (amountValue == null) {
    return option.unitLabel ? option.unitLabel : 'Custom price';
  }

  const optionUnit = option.unitLabel || option.unit;
  const unitSuffix = optionUnit ? ` / ${optionUnit}` : '';
  return `\u20B9${amountValue.toLocaleString('en-IN')}${unitSuffix}`;
}

export function getSelectedPriceOption(
  service: CustomerBookableService,
  selectedPriceOptionId?: string | null,
) {
  if (!Array.isArray(service.priceOptions) || service.priceOptions.length === 0) {
    return null;
  }

  return service.priceOptions.find(option => option.id === selectedPriceOptionId) ?? null;
}

export function getServiceLineTotalAmount(service: CustomerBookableService, selectedPriceOptionId: string | null, quantity: number) {
  const option = getSelectedPriceOption(service, selectedPriceOptionId);
  const amountValue = option
    ? (typeof option.price === 'number' && Number.isFinite(option.price)
      ? option.price
      : (typeof option.amount === 'number' && Number.isFinite(option.amount) ? option.amount : null))
    : null;
  if (!option || amountValue == null) {
    return null;
  }

  return amountValue * quantity;
}

export function formatCurrencyAmount(amount?: number | null) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return null;
  }

  return `\u20B9${amount.toLocaleString('en-IN')}`;
}

export function formatPriceOptionMeta(option: CustomerServicePriceOption) {
  const parts: string[] = [];
  if (option.description?.trim()) {
    parts.push(option.description.trim());
  }
  if (option.priceType?.trim()) {
    parts.push(option.priceType.trim().replace(/_/g, ' '));
  }
  if (option.duration?.trim()) {
    parts.push(option.duration.trim().replace(/_/g, ' '));
  }
  if (typeof option.durationMinutes === 'number' && Number.isFinite(option.durationMinutes)) {
    parts.push(`${option.durationMinutes} min`);
  }
  if (
    option.priceComputationMode === 'PER_BLOCK'
    && typeof option.billingUnitMinutes === 'number'
    && Number.isFinite(option.billingUnitMinutes)
  ) {
    parts.push(`${option.billingUnitMinutes} min block`);
  }
  return parts.join('  -  ');
}

export function formatTaskList(tasks?: CustomerServiceTask[]) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return [];
  }

  return tasks
    .map(task => toTrimmedString(task.title))
    .filter(Boolean);
}

export function formatSelectedServiceLabel(line: BookingFlowSelectedServiceLine) {
  const option = line.service.priceOptions?.find(item => item.id === line.selectedPriceOptionId);
  const quantityLabel = `Qty ${line.quantity}`;
  if (!option) {
    return quantityLabel;
  }

  return `${option.title} - ${quantityLabel}`;
}

export function formatAddressModeLabel(mode: BookingFlowAddressMode) {
  return mode === 'google' ? 'Google Detected' : 'Pinned Manually';
}

export function formatBookingTypeLabel(type: CustomerBookingType) {
  return type === 'INSTANT' ? 'Instant Booking' : 'Scheduled Booking';
}

export function buildAddressSummary(address: BookingFlowAddressDraft) {
  const parts = [
    address.addressLine1,
    address.addressLine2,
    address.area,
    address.district,
    address.state,
    address.pincode,
  ]
    .map(part => toTrimmedString(part))
    .filter(Boolean);

  return parts.join(', ');
}

export function buildLocationPrimaryLine(address: BookingFlowAddressDraft) {
  return [
    address.area,
    address.district,
  ]
    .map(part => toTrimmedString(part))
    .filter(Boolean)
    .join(', ');
}

export function buildDetectedAddressDraft(input: {
  city?: string | null;
  locality?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  formattedAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): BookingFlowAddressDraft {
  const district = toTrimmedString(input.city) || 'Prayagraj';
  const area = toTrimmedString(input.locality) || district;

  return {
    mode: 'google',
    country: toTrimmedString(input.country) || 'India',
    state: toTrimmedString(input.state) || 'Uttar Pradesh',
    district,
    area,
    addressLine1: toTrimmedString(input.formattedAddress),
    addressLine2: '',
    pincode: toTrimmedString(input.postalCode),
    latitude: typeof input.latitude === 'number' && Number.isFinite(input.latitude) ? input.latitude : null,
    longitude: typeof input.longitude === 'number' && Number.isFinite(input.longitude) ? input.longitude : null,
  };
}

export function createEmptyAddressDraft(): BookingFlowAddressDraft {
  return {
    mode: 'google',
    country: 'India',
    state: 'Uttar Pradesh',
    district: '',
    area: '',
    addressLine1: '',
    addressLine2: '',
    pincode: '',
    latitude: null,
    longitude: null,
  };
}

export function toBookingAddressInput(address: BookingFlowAddressDraft): CustomerBookingAddressInput {
  return {
    country: toTrimmedString(address.country) || 'India',
    state: toTrimmedString(address.state),
    district: toTrimmedString(address.district),
    area: toTrimmedString(address.area),
    addressLine1: toTrimmedString(address.addressLine1),
    addressLine2: toTrimmedString(address.addressLine2) || undefined,
    pincode: toTrimmedString(address.pincode),
    latitude: address.latitude ?? 0,
    longitude: address.longitude ?? 0,
  };
}

export function hasValidCoordinates(address: BookingFlowAddressDraft) {
  return typeof address.latitude === 'number'
    && Number.isFinite(address.latitude)
    && typeof address.longitude === 'number'
    && Number.isFinite(address.longitude);
}

export function isBookingAddressComplete(address: BookingFlowAddressDraft) {
  return Boolean(
    toTrimmedString(address.state)
    && toTrimmedString(address.district)
    && toTrimmedString(address.area)
    && toTrimmedString(address.addressLine1)
    && toTrimmedString(address.pincode)
    && hasValidCoordinates(address),
  );
}

export function formatServiceBadge(service: CustomerBookableService) {
  const category = toTrimmedString(service.category?.name);
  const subCategory = toTrimmedString(service.subCategory?.name);
  return [category, subCategory].filter(Boolean).map(toTitleCase).join(' - ');
}

export function buildScheduledStartAt(date: string, time: string) {
  const normalizedDate = toTrimmedString(date);
  const normalizedTime = toTrimmedString(time);
  if (!normalizedDate || !normalizedTime) {
    return null;
  }

  const isoValue = new Date(`${normalizedDate}T${normalizedTime}:00+05:30`);
  if (Number.isNaN(isoValue.getTime())) {
    return null;
  }

  return isoValue.toISOString();
}

export function getInstantScheduleLabel() {
  const formatter = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return `As soon as possible - ${formatter.format(new Date())}`;
}

export function buildCreateBookingPayload(input: {
  city: string;
  bookingType: CustomerBookingType;
  scheduledDate: string;
  scheduledTime: string;
  notes: string;
  address: BookingFlowAddressDraft;
  selectedServices: BookingFlowSelectedServiceLine[];
}): CreateCustomerBookingPayload {
  const scheduledStartAt = input.bookingType === 'SCHEDULED'
    ? buildScheduledStartAt(input.scheduledDate, input.scheduledTime) ?? undefined
    : undefined;

  return {
    city: toTrimmedString(input.city).toUpperCase(),
    bookingType: input.bookingType,
    scheduledStartAt,
    notes: toTrimmedString(input.notes) || undefined,
    address: toBookingAddressInput(input.address),
    serviceLines: input.selectedServices.map((line) => ({
      serviceId: line.service.id,
      serviceName: line.service.name,
      selectedPriceOptionId: line.selectedPriceOptionId ?? undefined,
      quantity: line.quantity,
    })),
  };
}

