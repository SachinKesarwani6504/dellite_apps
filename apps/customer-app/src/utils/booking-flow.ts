import type {
  CreateCustomerBookingPayload,
  CustomerBookableService,
  CustomerBookingAddressInput,
  CustomerBookingType,
  CustomerServicePriceOption,
  CustomerServiceTask,
} from '@/types/customer';
import { CUSTOMER_BOOKING_TYPE, PRICE_COMPUTATION_MODE, PRICE_TYPE } from '@/types/customer';
import { HOURLY_DURATION_CHIP_STEP_MINUTES } from '@/utils/pricing/pricing.constants';
import { calculateLineSubtotal } from '@/utils/pricing/calculateLineSubtotal';
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
    : null;
  if (amountValue == null) {
    return 'Custom price';
  }
  return `\u20B9${amountValue.toLocaleString('en-IN')}`;
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
      : null)
    : null;
  if (!option || amountValue == null) {
    return null;
  }
  const resolvedRoundingMode = option.roundingMode === 'NEAREST'
    ? 'ROUND'
    : option.roundingMode;

  return calculateLineSubtotal({
    price: amountValue,
    priceType: option.priceType ?? PRICE_TYPE.VISIT,
    priceComputationMode: option.priceComputationMode ?? PRICE_COMPUTATION_MODE.FLAT,
    quantity,
    estimatedMinutes: option.estimatedMinutes ?? null,
    minMinutes: option.minMinutes ?? null,
    maxMinutes: option.maxMinutes ?? null,
    billingUnitMinutes: option.billingUnitMinutes ?? null,
    roundingMode: resolvedRoundingMode ?? null,
  }).subtotal;
}

export function formatCurrencyAmount(amount?: number | null) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return null;
  }

  return `\u20B9${amount.toLocaleString('en-IN')}`;
}

export function formatSubtotalMultiplierLabel(input: {
  unitPriceAmount: number | null;
  quantity: number;
  priceType?: string;
  selectedDurationMinutes?: number | null;
}) {
  if (input.unitPriceAmount == null) return null;
  const unitPriceLabel = Number.isFinite(input.unitPriceAmount)
    ? input.unitPriceAmount.toLocaleString('en-IN')
    : null;
  if (!unitPriceLabel) return null;

  if (input.priceType === PRICE_TYPE.HOURLY && typeof input.selectedDurationMinutes === 'number' && input.selectedDurationMinutes > 0) {
    return `${input.selectedDurationMinutes}min X ${unitPriceLabel}`;
  }
  if (input.priceType === PRICE_TYPE.PER_UNIT) return `${input.quantity}unit X ${unitPriceLabel}`;
  if (input.priceType === PRICE_TYPE.VISIT) return `${input.quantity}visit X ${unitPriceLabel}`;
  if (input.priceType === PRICE_TYPE.DAILY) return `${input.quantity}days X ${unitPriceLabel}`;

  return `${input.quantity} X ${unitPriceLabel}`;
}

export function formatPriceOptionMeta(option: CustomerServicePriceOption) {
  const amountLabel = formatPriceOptionAmount(option);
  const description = option.description?.trim() ?? '';
  const withDescription = (pricingLabel: string) => (description ? `${description} • ${pricingLabel}` : pricingLabel);

  if (option.priceType === PRICE_TYPE.HOURLY) {
    if (option.priceComputationMode === PRICE_COMPUTATION_MODE.PER_MINUTE) {
      return withDescription(`${amountLabel} Per Minute`);
    }
    if (
      option.priceComputationMode === PRICE_COMPUTATION_MODE.PER_BLOCK
      && typeof option.billingUnitMinutes === 'number'
      && Number.isFinite(option.billingUnitMinutes)
      && option.billingUnitMinutes > 0
    ) {
      return withDescription(`${amountLabel} Per ${option.billingUnitMinutes} Min Block`);
    }
    return withDescription(`${amountLabel} Per Hour`);
  }

  if (option.priceType === PRICE_TYPE.PER_UNIT) {
    return withDescription(`${amountLabel} Per Unit`);
  }
  if (option.priceType === PRICE_TYPE.DAILY) {
    return withDescription(`${amountLabel} Per Day`);
  }
  if (option.priceType === PRICE_TYPE.VISIT) {
    return withDescription(`${amountLabel} Per Visit`);
  }

  return withDescription(amountLabel);
}

export function shouldAllowQuantityControl(option: CustomerServicePriceOption | null) {
  if (!option?.priceType) return false;
  return option.priceType === PRICE_TYPE.DAILY || option.priceType === PRICE_TYPE.PER_UNIT;
}

export function shouldAllowDurationControl(option: CustomerServicePriceOption | null) {
  if (!option) return false;
  if (option.priceType === PRICE_TYPE.HOURLY) return true;
  return option.priceComputationMode === PRICE_COMPUTATION_MODE.PER_BLOCK
    || option.priceComputationMode === PRICE_COMPUTATION_MODE.PER_MINUTE;
}

export function getSelectableDurations(option: CustomerServicePriceOption | null): number[] {
  if (!option) return [];
  if (!shouldAllowDurationControl(option)) return [];

  const durationStepMinutes = option.priceType === PRICE_TYPE.HOURLY
    ? HOURLY_DURATION_CHIP_STEP_MINUTES
    : (typeof option.billingUnitMinutes === 'number' && option.billingUnitMinutes > 0
      ? option.billingUnitMinutes
      : 30);
  if (!durationStepMinutes) return [];

  const minDuration = typeof option.minMinutes === 'number' && option.minMinutes > 0
    ? option.minMinutes
    : durationStepMinutes;
  const fallbackMax = typeof option.estimatedMinutes === 'number' && option.estimatedMinutes > 0
    ? Math.max(minDuration, option.estimatedMinutes)
    : minDuration;
  const maxDuration = typeof option.maxMinutes === 'number' && option.maxMinutes > 0
    ? Math.max(minDuration, option.maxMinutes)
    : fallbackMax;

  const durations: number[] = [];
  for (let next = minDuration; next <= maxDuration; next += durationStepMinutes) {
    durations.push(next);
    if (durations.length >= 24) break;
  }
  return durations;
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
  return type === CUSTOMER_BOOKING_TYPE.INSTANT ? 'Instant Booking' : 'Scheduled Booking';
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

export type BookingDateChoice = {
  value: string;
  topLabel: string;
  dayOfMonth: string;
  monthLabel: string;
};

export function buildNextBookingDateChoices(): BookingDateChoice[] {
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const value = date.toISOString().slice(0, 10);
    return {
      value,
      topLabel: index === 0
        ? 'TODAY'
        : new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(date).toUpperCase(),
      dayOfMonth: new Intl.DateTimeFormat('en-IN', { day: 'numeric' }).format(date),
      monthLabel: new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(date),
    };
  });
}

export function buildBookingTimeOptions() {
  const options: string[] = [];
  for (let hour = 6; hour <= 23; hour += 1) {
    for (let minute = 0; minute <= 30; minute += 30) {
      if (hour === 23 && minute > 30) continue;
      const hourLabel = String(hour).padStart(2, '0');
      const minuteLabel = String(minute).padStart(2, '0');
      options.push(`${hourLabel}:${minuteLabel}`);
    }
  }
  return options;
}

export function formatBookingTimeChipLabel(value: string) {
  const [hours = '09', minutes = '00'] = value.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return new Intl.DateTimeFormat('en-IN', { timeStyle: 'short' }).format(date);
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
  const scheduledStartAt = input.bookingType === CUSTOMER_BOOKING_TYPE.SCHEDULED
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

