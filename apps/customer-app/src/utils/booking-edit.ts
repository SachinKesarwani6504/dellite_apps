import type { BookingDetailsSelectedPriceOption, BookingDetailsServiceLine } from '@/types/booking-details';
import type { BookingEditLineDraft } from '@/types/booking-edit';
import type { CustomerBookableService, CustomerServicePriceOption } from '@/types/customer';
import { getBookingLineDurationMinutes, getBookingLineQuantity } from '@/utils/booking-details';
import { getFixedDurationMinutes, getSelectedPriceOption } from '@/utils/booking-flow';

export function getBookingEditSelectedPriceOptionId(line: BookingDetailsServiceLine) {
  return line.selectedPriceOption?.id ?? null;
}

export function getInitialBookingEditLineDraft(line: BookingDetailsServiceLine): BookingEditLineDraft {
  return {
    quantity: getBookingLineQuantity(line),
    durationMinutes: getBookingLineDurationMinutes(line),
    selectedPriceOptionId: getBookingEditSelectedPriceOptionId(line),
  };
}

export function toCustomerServicePriceOption(option?: BookingDetailsSelectedPriceOption | null): CustomerServicePriceOption | null {
  if (!option?.id || !option.title) return null;
  return {
    id: option.id,
    title: option.title,
    price: typeof option.price === 'number' ? option.price : Number(option.price ?? 0),
    priceType: option.priceType as CustomerServicePriceOption['priceType'],
    priceComputationMode: option.priceComputationMode as CustomerServicePriceOption['priceComputationMode'],
    estimatedMinutes: option.estimatedMinutes ?? null,
    isOptional: Boolean(option.isOptional),
  };
}

export function buildFallbackEditableService(line: BookingDetailsServiceLine): CustomerBookableService {
  const selectedPriceOption = toCustomerServicePriceOption(line.selectedPriceOption);
  return {
    id: line.serviceId ?? line.id ?? line.serviceName,
    name: line.serviceName,
    priceOptions: selectedPriceOption ? [selectedPriceOption] : [],
    includedTasks: [],
    excludedTasks: [],
  };
}

export function ensureEditableServiceIncludesSelectedPriceOption(
  service: CustomerBookableService,
  line: BookingDetailsServiceLine,
) {
  const selectedPriceOption = toCustomerServicePriceOption(line.selectedPriceOption);
  if (!selectedPriceOption) return service;
  const priceOptions = Array.isArray(service.priceOptions) ? service.priceOptions : [];
  if (priceOptions.some(option => option.id === selectedPriceOption.id)) return service;
  return {
    ...service,
    priceOptions: [selectedPriceOption, ...priceOptions],
  };
}

export function getEditableSelectedPriceOption(
  service: CustomerBookableService,
  line: BookingDetailsServiceLine,
  draft: BookingEditLineDraft,
) {
  return getSelectedPriceOption(service, draft.selectedPriceOptionId)
    ?? toCustomerServicePriceOption(line.selectedPriceOption);
}

export function getEditableDurationMinutes(
  selectedPriceOption: CustomerServicePriceOption | null,
  draft: BookingEditLineDraft,
) {
  return getFixedDurationMinutes(selectedPriceOption) ?? draft.durationMinutes;
}
