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
  { label: 'Male', value: 'MALE', icon: '👨' },
  { label: 'Female', value: 'FEMALE', icon: '👩' },
  { label: 'Other', value: 'OTHER', icon: '🧑' },
];
