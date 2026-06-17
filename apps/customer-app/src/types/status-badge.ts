export type StatusBadgeType = 'booking' | 'payment' | 'invite';

export type StatusBadgeConfig = {
  label: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
};

export type StatusBadgeProps = {
  status: string;
  type?: StatusBadgeType;
  label?: string;
  dotColor?: string;
  iconName?: string;
  showDot?: boolean;
  forceBlue?: boolean;
  forceBlueText?: boolean;
};
