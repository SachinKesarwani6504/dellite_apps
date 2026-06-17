import type {
  CreateCustomerBookingPayload,
  CustomerBookableService,
  CustomerBookingAddressInput,
  CustomerBookingType,
  CustomerCatalogSubcategory,
  CustomerHomeCategory,
  CustomerServicePriceOption,
  CustomerServiceTask,
} from '@/types/customer';
import { CUSTOMER_BOOKING_TYPE, PRICE_COMPUTATION_MODE, PRICE_TYPE } from '@/types/customer';
import { HOURLY_DURATION_CHIP_STEP_MINUTES } from '@/utils/pricing/pricing.constants';
import { calculateLineSubtotal } from '@/utils/pricing/calculateLineSubtotal';
import { normalizeCityName } from '@/utils/location';
import type {
  BookingFlowDraft,
  BookingFlowAddressDraft,
  BookingFlowAddressMode,
  BookingFlowQuoteDraft,
  BookingFlowSelectedServiceLine,
} from '@/types/booking-flow-context';
import type { LocationCoordinates } from '@/modules/location/types/location.types';
import { formatDisplayDateTime } from '@/utils/date-display';

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

function requireSelectedPriceOptionId(line: BookingFlowSelectedServiceLine) {
  const selectedPriceOptionId = toTrimmedString(line.selectedPriceOptionId);
  if (!selectedPriceOptionId) {
    throw new Error('Selected price option is required.');
  }
  return selectedPriceOptionId;
}

export function getDefaultSelectedPriceOptionId(priceOptions?: CustomerServicePriceOption[]) {
  const defaultOption = getRequiredPriceOptions(priceOptions)[0];
  return defaultOption?.id ?? null;
}

export function isFixedDurationPriceOption(option: CustomerServicePriceOption | null | undefined) {
  if (!option) return false;
  return typeof option.minMinutes === 'number'
    && typeof option.maxMinutes === 'number'
    && option.minMinutes === option.maxMinutes
    && option.priceComputationMode === PRICE_COMPUTATION_MODE.FLAT
    && option.isOptional === false;
}

export function getFixedDurationMinutes(option: CustomerServicePriceOption | null | undefined) {
  if (!option || !isFixedDurationPriceOption(option)) return null;
  return option.minMinutes;
}

export function areAllPrimaryPriceOptionsFixedDuration(priceOptions?: CustomerServicePriceOption[]) {
  const primaryOptions = getRequiredPriceOptions(priceOptions);
  return primaryOptions.length > 0 && primaryOptions.every(isFixedDurationPriceOption);
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
    selectedDurationMinutes: null,
  };
}

export function refreshSelectedServiceLinesFromSubcategory(
  currentLines: BookingFlowSelectedServiceLine[],
  subcategory: CustomerCatalogSubcategory,
  category?: CustomerHomeCategory | null,
) {
  const refreshedServicesById = new Map(
    (Array.isArray(subcategory.services) ? subcategory.services : [])
      .map(service => [service.id, service]),
  );

  return currentLines.reduce<Record<string, BookingFlowSelectedServiceLine>>((accumulator, line) => {
    const refreshedService = refreshedServicesById.get(line.service.id);
    if (!refreshedService) {
      return accumulator;
    }

    accumulator[line.service.id] = createSelectedServiceLine({
      ...refreshedService,
      category: category ?? line.service.category,
      subCategory: subcategory,
    });
    return accumulator;
  }, {});
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

export function getRequiredPriceOptions(priceOptions?: CustomerServicePriceOption[]) {
  if (!Array.isArray(priceOptions)) return [];
  return priceOptions.filter(option => !option.isOptional);
}

export function getOptionalPriceOptions(priceOptions?: CustomerServicePriceOption[]) {
  if (!Array.isArray(priceOptions)) return [];
  return priceOptions.filter(option => option.isOptional);
}

export function getServiceLineTotalAmount(
  service: CustomerBookableService,
  selectedPriceOptionId: string | null,
  quantity: number,
  selectedDurationMinutes?: number | null,
) {
  const option = getSelectedPriceOption(service, selectedPriceOptionId);
  const amountValue = option
    ? (typeof option.price === 'number' && Number.isFinite(option.price)
      ? option.price
      : null)
    : null;
  if (!option || amountValue == null) {
    return null;
  }

  return calculateLineSubtotal({
    price: amountValue,
    priceType: option.priceType ?? PRICE_TYPE.VISIT,
    priceComputationMode: option.priceComputationMode ?? PRICE_COMPUTATION_MODE.FLAT,
    quantity,
    durationMinutes: selectedDurationMinutes ?? null,
    estimatedMinutes: option.estimatedMinutes ?? null,
    minMinutes: option.minMinutes ?? null,
    maxMinutes: option.maxMinutes ?? null,
    billingUnitMinutes: option.billingUnitMinutes ?? null,
    roundingMode: option.roundingMode ?? null,
  }).subtotal;
}

export function getServiceLineBillableQuantity(line: BookingFlowSelectedServiceLine) {
  const selectedPriceOption = getSelectedPriceOption(line.service, line.selectedPriceOptionId);
  if (!selectedPriceOption) return line.quantity;

  if (
    selectedPriceOption.priceComputationMode === PRICE_COMPUTATION_MODE.PER_MINUTE
    && typeof line.selectedDurationMinutes === 'number'
    && Number.isFinite(line.selectedDurationMinutes)
    && line.selectedDurationMinutes > 0
  ) {
    return line.selectedDurationMinutes;
  }

  if (
    selectedPriceOption.priceComputationMode === PRICE_COMPUTATION_MODE.PER_BLOCK
    && typeof line.selectedDurationMinutes === 'number'
    && Number.isFinite(line.selectedDurationMinutes)
    && line.selectedDurationMinutes > 0
  ) {
    const billingUnit = selectedPriceOption.billingUnitMinutes && selectedPriceOption.billingUnitMinutes > 0
      ? selectedPriceOption.billingUnitMinutes
      : 30;
    return Math.max(1, Math.ceil(line.selectedDurationMinutes / billingUnit));
  }

  return line.quantity;
}

export function getServiceLineDisplayDurationMinutes(line: BookingFlowSelectedServiceLine) {
  const selectedPriceOption = getSelectedPriceOption(line.service, line.selectedPriceOptionId);
  return getFixedDurationMinutes(selectedPriceOption) ?? line.selectedDurationMinutes;
}

export function getServiceLinePayloadDurationMinutes(line: BookingFlowSelectedServiceLine) {
  const selectedPriceOption = getSelectedPriceOption(line.service, line.selectedPriceOptionId);
  if (!shouldAllowDurationControl(selectedPriceOption)) {
    return undefined;
  }

  return line.selectedDurationMinutes ?? undefined;
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
}): string | null {
  if (input.unitPriceAmount == null) return null;
  const unitPriceLabel = Number.isFinite(input.unitPriceAmount)
    ? input.unitPriceAmount.toLocaleString('en-IN')
    : null;
  if (!unitPriceLabel) return null;

  if (input.priceType === PRICE_TYPE.HOURLY && typeof input.selectedDurationMinutes === 'number' && input.selectedDurationMinutes > 0) {
    return `${input.selectedDurationMinutes} min x ${unitPriceLabel}`;
  }
  if (input.priceType === PRICE_TYPE.PER_UNIT) {
    const unitLabel = input.quantity === 1 ? 'unit' : 'units';
    return `${input.quantity} ${unitLabel} x ${unitPriceLabel}`;
  }
  if (input.priceType === PRICE_TYPE.VISIT) return null;
  if (input.priceType === PRICE_TYPE.DAILY) {
    const dayLabel = input.quantity === 1 ? 'day' : 'days';
    return `${input.quantity} ${dayLabel} x ${unitPriceLabel}`;
  }

  return `${input.quantity} x ${unitPriceLabel}`;
}

export function formatPriceOptionMeta(option: CustomerServicePriceOption) {
  const pricingLabel = formatPriceOptionPricingLabel(option);
  const description = formatPriceOptionDescription(option);
  if (description) return `${pricingLabel} • ${description}`;
  return pricingLabel;
}

export function formatPriceOptionDescription(option: CustomerServicePriceOption) {
  return option.description?.trim() ?? '';
}

export function formatPriceOptionPricingLabel(option: CustomerServicePriceOption) {
  const amountLabel = formatPriceOptionAmount(option);

  if (isFixedDurationPriceOption(option)) {
    return `${amountLabel} Fixed`;
  }

  if (option.priceType === PRICE_TYPE.HOURLY) {
    if (option.priceComputationMode === PRICE_COMPUTATION_MODE.PER_MINUTE) {
      return `${amountLabel} Per Minute`;
    }
    if (
      option.priceComputationMode === PRICE_COMPUTATION_MODE.PER_BLOCK
      && typeof option.billingUnitMinutes === 'number'
      && Number.isFinite(option.billingUnitMinutes)
      && option.billingUnitMinutes > 0
    ) {
      return `${amountLabel} Per ${option.billingUnitMinutes} Min Block`;
    }
    return `${amountLabel} Per Hour`;
  }

  if (option.priceType === PRICE_TYPE.PER_UNIT) {
    return `${amountLabel} Per Unit`;
  }
  if (option.priceType === PRICE_TYPE.DAILY) {
    return `${amountLabel} Per Day`;
  }
  if (option.priceType === PRICE_TYPE.VISIT) {
    return `${amountLabel} Per Visit`;
  }

  return amountLabel;
}

export function shouldAllowQuantityControl(option: CustomerServicePriceOption | null) {
  if (!option?.priceType) return false;
  return option.priceType === PRICE_TYPE.DAILY || option.priceType === PRICE_TYPE.PER_UNIT;
}

export function shouldAllowDurationControl(option: CustomerServicePriceOption | null) {
  if (!option) return false;
  if (isFixedDurationPriceOption(option)) return false;
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
  const district = normalizeCityName(input.city) || 'Prayagraj';
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
  const latitude = address.latitude;
  const longitude = address.longitude;
  if (
    typeof latitude !== 'number'
    || !Number.isFinite(latitude)
    || typeof longitude !== 'number'
    || !Number.isFinite(longitude)
  ) {
    throw new Error('Booking address coordinates are required.');
  }

  return {
    country: toTrimmedString(address.country) || 'India',
    state: toTrimmedString(address.state),
    district: normalizeCityName(address.district),
    area: toTrimmedString(address.area),
    addressLine1: toTrimmedString(address.addressLine1),
    addressLine2: toTrimmedString(address.addressLine2) || undefined,
    pincode: toTrimmedString(address.pincode),
    latitude,
    longitude,
  };
}

export function hasValidCoordinates(address: BookingFlowAddressDraft) {
  return typeof address.latitude === 'number'
    && Number.isFinite(address.latitude)
    && typeof address.longitude === 'number'
    && Number.isFinite(address.longitude);
}

export function getAddressDraftCoordinates(address: BookingFlowAddressDraft): LocationCoordinates | null {
  if (!hasValidCoordinates(address)) {
    return null;
  }

  return {
    latitude: address.latitude as number,
    longitude: address.longitude as number,
  };
}

export function createFallbackLocationCoordinates(): LocationCoordinates {
  return {
    latitude: 25.4358,
    longitude: 81.8463,
  };
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

export function getBookingDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildNextBookingDateChoices(): BookingDateChoice[] {
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const value = getBookingDateValue(date);
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

function getBookingTimeValue(date: Date) {
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
}

function roundUpToNextHalfHour(date: Date) {
  const next = new Date(date);
  const minutes = next.getMinutes();
  const hasElapsedCurrentSlot = minutes > 0 || next.getSeconds() > 0 || next.getMilliseconds() > 0;
  const roundedMinutes = !hasElapsedCurrentSlot
    ? 30
    : (minutes < 30 ? 30 : 60);
  next.setMinutes(roundedMinutes, 0, 0);
  return next;
}

export function buildBookingTimeOptions(selectedDate?: string, now = new Date()) {
  const options: string[] = [];
  for (let hour = 6; hour <= 23; hour += 1) {
    for (let minute = 0; minute <= 30; minute += 30) {
      if (hour === 23 && minute > 30) continue;
      const hourLabel = String(hour).padStart(2, '0');
      const minuteLabel = String(minute).padStart(2, '0');
      options.push(`${hourLabel}:${minuteLabel}`);
    }
  }

  if (selectedDate !== getBookingDateValue(now)) {
    return options;
  }

  const nextAvailableTime = getBookingTimeValue(roundUpToNextHalfHour(now));
  return options.filter(option => option >= nextAvailableTime);
}

export function getDefaultBookingTimeValue(selectedDate?: string) {
  return buildBookingTimeOptions(selectedDate)[0] ?? '';
}

export function getDefaultBookingDateValue() {
  return getBookingDateValue();
}

export function isBookingTimeOptionAvailable(date: string, time: string) {
  return buildBookingTimeOptions(date).includes(time);
}

export function getNextBookingTimeValue() {
  return getDefaultBookingTimeValue(getDefaultBookingDateValue());
}

export function formatBookingTimeChipLabel(value: string) {
  const [hours = '09', minutes = '00'] = value.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return new Intl.DateTimeFormat('en-IN', { timeStyle: 'short' }).format(date);
}

export function getInstantScheduleLabel() {
  return `As soon as possible - ${formatDisplayDateTime(new Date())}`;
}

export function buildCreateBookingPayload(input: {
  city: string;
  bookingDraft: BookingFlowDraft;
}): CreateCustomerBookingPayload {
  const details = input.bookingDraft.details;
  const selectedServices = Object.values(input.bookingDraft.selectedServicesById);
  const scheduledStartAt = details.bookingType === CUSTOMER_BOOKING_TYPE.SCHEDULED
    ? buildScheduledStartAt(details.scheduledDate, details.scheduledTime) ?? undefined
    : undefined;

  const serviceLines = selectedServices.map((line) => ({
    serviceId: line.service.id,
    serviceName: line.service.name,
    selectedPriceOptionId: requireSelectedPriceOptionId(line),
    quantity: line.quantity,
    selectedDurationMinutes: getServiceLinePayloadDurationMinutes(line),
    billableQuantity: getServiceLineBillableQuantity(line),
  }));

  return {
    city: normalizeCityName(input.city).toUpperCase(),
    bookingType: details.bookingType,
    scheduledStartAt,
    notes: toTrimmedString(details.notes) || undefined,
    address: toBookingAddressInput(details.address),
    serviceLines,
  };
}

export function buildBookingQuoteRequestDraft(bookingDraft: BookingFlowDraft): BookingFlowQuoteDraft {
  const selectedServicesById = Object.entries(bookingDraft.selectedServicesById).reduce<BookingFlowQuoteDraft['selectedServicesById']>(
    (accumulator, [serviceId, line]) => {
      accumulator[serviceId] = {
        service: {
          id: line.service.id,
          name: line.service.name,
        },
        quantity: line.quantity,
        selectedPriceOptionId: requireSelectedPriceOptionId(line),
        selectedDurationMinutes: getServiceLinePayloadDurationMinutes(line) ?? null,
      };
      return accumulator;
    },
    {},
  );

  return {
    sourceType: bookingDraft.sourceType,
    categoryId: bookingDraft.categoryId,
    categoryName: bookingDraft.categoryName,
    subcategoryId: bookingDraft.subcategoryId,
    subcategoryName: bookingDraft.subcategoryName,
    selectedServicesById,
    details: bookingDraft.details,
  };
}


