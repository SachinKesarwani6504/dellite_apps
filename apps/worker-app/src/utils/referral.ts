import type { ReferralReward, ReferralRole } from '@/types/auth';
import { APP_TEXT } from '@/utils/appText';

export function toNumber(value?: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function trimTrailingZeros(value: number) {
  return value % 1 === 0 ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export function rewardLabel(reward?: ReferralReward) {
  if (!reward?.value) return APP_TEXT.profile.referral.rewardUnavailable;
  if (reward.rewardType === 'ZERO_COMMISSION_JOB') {
    return `${reward.value} Zero Commission Jobs`;
  }
  return `${reward.value} Coins`;
}

export function formatTriggerEventLabel(event?: string) {
  if (!event) return APP_TEXT.profile.referral.signupLabel;
  const normalized = event.trim().toUpperCase();
  if (!normalized) return APP_TEXT.profile.referral.signupLabel;
  const words = normalized
    .split('_')
    .filter(Boolean)
    .map((part) => `${part.charAt(0)}${part.slice(1).toLowerCase()}`);
  return `${APP_TEXT.profile.referral.triggerPillPrefix} ${words.join(' ')}`;
}

export function worthLabel(reward: ReferralReward | undefined, oneCoinEqualsRupees: number | null) {
  if (!reward?.value || reward.rewardType !== 'COIN' || !oneCoinEqualsRupees) return null;
  const value = toNumber(reward.value);
  if (!value) return null;
  return `${APP_TEXT.profile.referral.worthPrefix} Rs. ${trimTrailingZeros(value * oneCoinEqualsRupees)}`;
}

export function roleBadgeLabel(role: ReferralRole) {
  void role;
  return APP_TEXT.profile.referral.youLabelPrefix;
}
