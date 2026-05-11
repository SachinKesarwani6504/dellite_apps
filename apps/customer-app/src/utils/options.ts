import type { Gender } from '@/types/auth';

export type OptionItem<T extends string = string> = {
  label: string;
  value: T;
};

export type GenderOption = {
  label: string;
  value: Gender;
  icon: string;
};

export const accountTypeOptions: OptionItem<'personal' | 'family'>[] = [
  { label: 'Personal', value: 'personal' },
  { label: 'Family', value: 'family' },
];

export const contactPreferenceOptions: OptionItem<'sms' | 'whatsapp' | 'call'>[] = [
  { label: 'SMS', value: 'sms' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Call', value: 'call' },
];

export const GENDER_OPTIONS: GenderOption[] = [
  { label: 'Male', value: 'MALE', icon: 'M' },
  { label: 'Female', value: 'FEMALE', icon: 'F' },
  { label: 'Other', value: 'OTHER', icon: 'O' },
];

export type BookingSlotValue = 'morning' | 'afternoon' | 'evening';

export const bookingSlotOptions: OptionItem<BookingSlotValue>[] = [
  { label: 'Today Morning (9:00 AM - 12:00 PM)', value: 'morning' },
  { label: 'Today Afternoon (12:00 PM - 4:00 PM)', value: 'afternoon' },
  { label: 'Today Evening (4:00 PM - 8:00 PM)', value: 'evening' },
];

export const DEFAULT_HOME_CITY = 'PRAYAGRAJ';
