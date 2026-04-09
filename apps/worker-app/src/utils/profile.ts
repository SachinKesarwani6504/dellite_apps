import { APP_TEXT } from '@/utils/appText';
import { Ionicons } from '@expo/vector-icons';
import type { PayoutMethodType, UserBankInfo } from '@/types/auth';
import { theme } from '@/utils/theme';

export function getUserCreatedAt(value: unknown): string | number | Date | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const source = value as Record<string, unknown>;
  const direct = source.createdAt;
  if (typeof direct === 'string' || typeof direct === 'number' || direct instanceof Date) {
    return direct;
  }

  const snakeCase = source.created_at;
  if (typeof snakeCase === 'string' || typeof snakeCase === 'number' || snakeCase instanceof Date) {
    return snakeCase;
  }

  return null;
}

export function toDisplayGender(value?: unknown, fallback?: string): string {
  const fallbackText = fallback ?? 'Not set';
  if (typeof value !== 'string' || !value.trim()) return fallbackText;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'male') return 'Male';
  if (normalized === 'female') return 'Female';
  if (normalized === 'other') return 'Other';
  return value;
}

export function mapBankInfoToForm(
  bankInfo: UserBankInfo | null,
): {
  methodType: PayoutMethodType;
  accountHolderName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  upiId: string;
} {
  return {
    methodType: bankInfo?.methodType === 'BANK_ACCOUNT' ? 'BANK_ACCOUNT' : 'UPI',
    accountHolderName: String(bankInfo?.accountHolderName ?? ''),
    bankAccountNumber: String(bankInfo?.bankAccountNumber ?? ''),
    bankIfscCode: String(bankInfo?.bankIfscCode ?? ''),
    upiId: String(bankInfo?.upiId ?? ''),
  };
}

export function normalizeWorkerSkillStatus(value?: string): { label: string; color: string; icon: keyof typeof Ionicons.glyphMap } {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (normalized === 'APPROVED') {
    return { label: 'Approved', color: theme.colors.positive, icon: 'checkmark-circle-outline' };
  }
  if (normalized === 'PENDING') {
    return { label: 'Pending', color: theme.colors.caution, icon: 'time-outline' };
  }
  if (normalized === 'REJECTED') {
    return { label: 'Rejected', color: theme.colors.negative, icon: 'close-circle-outline' };
  }
  return { label: 'In Review', color: theme.colors.accent, icon: 'information-circle-outline' };
}
