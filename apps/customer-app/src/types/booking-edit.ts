import type { BookingDetailsResponse, BookingDetailsServiceLine } from '@/types/booking-details';
import type { CustomerBookableService } from '@/types/customer';

export type BookingEditLineDraft = {
  quantity: number;
  durationMinutes: number | null;
  selectedPriceOptionId: string | null;
};

export type BookingEditControllerValue = {
  details: BookingDetailsResponse | null;
  serviceByLineKey: Record<string, CustomerBookableService>;
  loading: boolean;
  saving: boolean;
  error: string | null;
  notes: string;
  canSave: boolean;
  setNotes: (next: string) => void;
  getLineDraft: (line: BookingDetailsServiceLine) => BookingEditLineDraft;
  increaseQuantity: (line: BookingDetailsServiceLine) => void;
  selectLineDuration: (line: BookingDetailsServiceLine, minutes: number) => void;
  selectLinePriceOption: (line: BookingDetailsServiceLine, priceOptionId: string) => void;
  saveChanges: () => Promise<boolean>;
  refresh: () => Promise<void>;
};
