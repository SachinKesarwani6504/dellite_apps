import { Gender } from '@/types/auth';

export const GENDER_OPTIONS: Array<{ label: string; value: Gender; icon: string }> = [
  { label: 'Male', value: 'MALE', icon: '👨' },
  { label: 'Female', value: 'FEMALE', icon: '👩' },
  { label: 'Other', value: 'OTHER', icon: '🧑' },
];

